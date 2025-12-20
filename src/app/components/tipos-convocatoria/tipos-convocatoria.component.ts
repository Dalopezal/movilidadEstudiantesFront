import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConvocatoriasGeneralComponent } from '../convocatorias-general/convocatorias-general.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-tipos-convocatoria',
  imports: [SidebarComponent, ConvocatoriasGeneralComponent, CommonModule],
  templateUrl: './tipos-convocatoria.component.html',
  styleUrls: ['./tipos-convocatoria.component.css']
})
export class TiposConvocatoriaComponent implements OnInit, OnDestroy {

  usuario: any = {};
  isInternal = false;  // Para mostrar tab "Saliente"
  isExternal = false;  // Para mostrar tab "Entrante"
  activeTab: 'general' | 'condiciones' | null = null;

  private storageHandler = this.onStorageChange.bind(this);

  ngOnInit(): void {
    window.addEventListener('storage', this.storageHandler);
    this.loadUsuarioFromStorage();
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageHandler);
  }

  private loadUsuarioFromStorage(): void {
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};

    const tipo = this.usuario?.tipoUsuario != null ? Number(this.usuario.tipoUsuario) : null;
    const rol = this.usuario?.rolId != null ? Number(this.usuario.rolId) : null;

    if (rol === 7) {
      // ORI: mostrar ambos tabs
      this.isInternal = true;  // Saliente
      this.isExternal = true;  // Entrante
    } else if (tipo === 2) {
      // Usuario tipo 2: solo Entrante
      this.isInternal = false;
      this.isExternal = true;
    } else if (tipo === 1) {
      // Usuario tipo 1: solo Saliente
      this.isInternal = true;
      this.isExternal = false;
    } else {
      // Otros casos: no mostrar tabs
      this.isInternal = false;
      this.isExternal = false;
    }

    // Selecciona automáticamente el primer tab visible
    if (this.isExternal) {
      this.activeTab = 'general';       // Entrantes
    } else if (this.isInternal) {
      this.activeTab = 'condiciones';   // Salientes
    } else {
      this.activeTab = null;
    }
  }

  private onStorageChange(): void {
    this.loadUsuarioFromStorage();
  }

  setActiveTab(tab: 'general' | 'condiciones'): void {
    this.activeTab = tab;
  }
}
