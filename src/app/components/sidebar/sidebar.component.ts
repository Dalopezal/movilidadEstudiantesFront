import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

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

  constructor(private elementRef: ElementRef, private router: Router, private msalService: MsalService) {}

  ngOnInit(): void {
    // Recuperar usuario guardado en login
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
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

}
