import { Component, ElementRef, HostListener, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LanguageSelectorComponent } from '../shared/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LanguageSelectorComponent,
    TranslateModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = true;
  ismovilidadOpen = false;
  isCooperacionOpen = false;
  usuario: any = {};
  isUserMenuOpen = false;
  isInternacionalizacionOpen = false;
  menu: any[] = [];
  maestros: any[] = [];

  private destroy$ = new Subject<void>();
  private storageHandler = this.onStorageChange.bind(this);

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private msalService: MsalService,
    private api: GenericApiService,
    private auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    window.addEventListener('storage', this.storageHandler);

    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};

    if (this.usuario?.rolId && this.usuario.rolId > 0) {
      this.fetchMenu(this.usuario.rolId);
    } else {
    }
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.storageHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private onStorageChange() {
    try {
      const userRaw = localStorage.getItem('usuario');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user?.rolId) {
        this.fetchMenu(user.rolId);
        this.usuario = user;
      } else {
        // limpiar menú si no hay usuario
        this.menu = [];
        this.maestros = [];
        this.usuario = {};
      }
    } catch (err) {
      console.error('Error parsing usuario from storage event', err);
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  togglemovilidadMenu() {
    this.ngZone.run(() => {
      this.ismovilidadOpen = !this.ismovilidadOpen;
      this.cdr.markForCheck();
    });
  }

  closemovilidadMenu() {
    this.ismovilidadOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      if (!this.isCollapsed) this.isCollapsed = true;
      if (this.ismovilidadOpen) this.ismovilidadOpen = false;
      if (this.isUserMenuOpen) this.isUserMenuOpen = false;
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  decodeUtf8(str: string): string {
    try {
      return decodeURIComponent(escape(str));
    } catch {
      return str;
    }
  }

  hasFoto(): boolean {
    return this.usuario?.foto && this.usuario.foto.trim() !== '' && this.usuario.foto !== 'null';
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }

  logout() {
    this.auth.logout();

    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');

    this.router.navigateByUrl('/');
  }

  logoutGoogle() {
    const win: any = window;
    if (win.google && win.google.accounts && win.google.accounts.id) {
      win.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    this.router.navigateByUrl('/');
  }

  private fetchMenu(rol: any) {
    this.api.get<any>('Permisos/Consultar_Permisos?RolId=' + rol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];
          if (Array.isArray(resp)) items = resp;
          else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp.data)) items = resp.data;
            else if (Array.isArray(resp.items)) items = resp.items;
            else {
              const arr = Object.values(resp).find(v => Array.isArray(v));
              if (Array.isArray(arr)) items = arr;
            }
          }

          this.menu = items.map(item => ({
            url: item.paginaUrl,
            nombre: item.nombre
          }));

          this.maestros = this.menu.filter(m =>
            m.url !== '/dashboard' && m.url !== '/tipos-convocatorias'
          );
        },
        error: (err) => {
          console.error('Error al cargar menús dinámicos', err);
          this.menu = [];
          this.maestros = [];
        }
      });
  }

  onToggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.ngZone.run(() => {
      this.isUserMenuOpen = !this.isUserMenuOpen;
      this.cdr.markForCheck();
    });
  }

  onLogoutClick(event: MouseEvent) {
    // evita navegación del <a> antes de limpiar
    event.preventDefault();
    event.stopPropagation();

    this.ngZone.run(() => {
      this.isUserMenuOpen = false; // cerrar el menú visualmente
      this.logout();               // tu método existente
      this.cdr.detectChanges();
    });
  }

  toggleInternacionalizacionMenu() {
    this.ngZone.run(() => {
      this.isInternacionalizacionOpen = !this.isInternacionalizacionOpen;
      this.cdr.markForCheck();
    });
  }

  toggleCooperacionMenu() {
    this.ngZone.run(() => {
      this.isCooperacionOpen = !this.isCooperacionOpen;
      this.cdr.markForCheck();
    });
  }
}
