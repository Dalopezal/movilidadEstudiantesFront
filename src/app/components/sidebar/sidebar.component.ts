import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed = true;
  ismovilidadOpen = false; // Controla submenú
  usuario: any = {};
  isUserMenuOpen = false;
  menu: any[] = [];
  maestros: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(private elementRef: ElementRef, private router: Router, private msalService: MsalService, private api: GenericApiService) {}

  ngOnInit() {
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};

    // Validar antes de llamar API
    if (this.usuario?.rolId && this.usuario.rolId > 0) {
      this.fetchMenu(this.usuario.rolId);
    } else {
      console.warn('RolId no definido, aún no se carga menú');
    }
  }

  ngOnDestroy() {
    window.removeEventListener("storage", this.onStorageChange.bind(this));
  }

  private onStorageChange() {
  const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  if (user?.rolId) {
    this.fetchMenu(user.rolId);
  }
}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  togglemovilidadMenu() {
    this.ismovilidadOpen = !this.ismovilidadOpen;
  }

  closemovilidadMenu() {
    this.ismovilidadOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      // Cierra sidebar y submenú si se hace click fuera
      if (!this.isCollapsed) this.isCollapsed = true;
      if (this.ismovilidadOpen) this.ismovilidadOpen = false;
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  // logout() {
  //   localStorage.clear();
  //   this.router.navigate(['/login']);
  // }

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
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const { tipo } = JSON.parse(usuario);

      if (tipo === 'microsoft') {
        this.logoutMicrosoft();
      } else if (tipo === 'externo') { // Google
        this.logoutGoogle();
      } else {
        // otro caso o custom logout
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }
  }

  logoutMicrosoft() {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:4200/login' // o la ruta de tu login
    });
  }

  logoutGoogle() {
    const win: any = window;
    if (win.google && win.google.accounts && win.google.accounts.id) {
      win.google.accounts.id.disableAutoSelect();
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
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

          // 👌 Mapear permisos → url + nombre
          this.menu = items.map(item => ({
            url: item.paginaUrl,
            nombre: item.nombre
          }));

          // Filtrar: dashboard siempre fijo, tipos-convocatorias fijo
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

}
