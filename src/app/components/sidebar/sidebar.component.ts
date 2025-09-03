import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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

  constructor(private elementRef: ElementRef) {}

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
}
