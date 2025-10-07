import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConvocatoriasGeneralComponent } from '../convocatorias-general/convocatorias-general.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-tipos-convocatoria',
  imports: [SidebarComponent, ConvocatoriasGeneralComponent, CommonModule],
  templateUrl: './tipos-convocatoria.component.html',
  styleUrls: ['./tipos-convocatoria.component.css']  // corregido
})
export class TiposConvocatoriaComponent implements OnInit, OnDestroy {

  usuario: any = {};
  isInternal = false;
  isExternal = false;
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
    this.isInternal = tipo === 1;
    this.isExternal = tipo === 2;

    // Selecciona automáticamente el primer tab visible
    if (this.isInternal) this.activeTab = 'general';
    else if (this.isExternal) this.activeTab = 'condiciones';
    else this.activeTab = null;
  }

  private onStorageChange(): void {
    // Cuando localStorage cambie (login, logout, cambio de rol...) recargamos
    this.loadUsuarioFromStorage();
  }

  setActiveTab(tab: 'general' | 'condiciones'): void {
    this.activeTab = tab;
  }
}
