import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

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

  constructor(private elementRef: ElementRef, private router: Router) {}

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

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
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
}
