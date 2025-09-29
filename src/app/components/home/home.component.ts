import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  usuario: any = {};
  showModalRol: boolean = false;   // modal 1
  showModalDatos: boolean = false; // modal 2
  estados: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService) {}

  roles: any[] = [];
  tipoUsuario: any;
  selectedRole: string = '';

  datosPerfil: any = {
    tipoDocumento: '',
    documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    pasaporte: '',
    fechaNacimiento: '',
    direccion: '',
    pais: '',
    ciudad: '',
    cargo: '',
    contrato: '',
    semestre: '',
    avance: '',
    programa: '',
    facultad: '',
    dependencia: '',
    nivel: '',
    promedio: '',
    grupo: ''
  };

  loading = false;

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) {
      this.usuario = JSON.parse(data);

      if (!this.usuario.rol || this.usuario.rol === '') {
        this.fetchListaRoles(this.usuario.correo);
        this.showModalRol = true;  // mostrar selección rol
      }
    }

    if (!this.usuario.rol) {
      this.showModalRol = true;
    }
  }

  seleccionarRol(rol: string) {
    this.selectedRole = rol;
  }

  guardarRol() {
    if (this.selectedRole) {
      this.usuario.rolId = this.selectedRole;
      this.fetchInfoUsuario(this.usuario.correo, this.usuario.rolId);
    }
  }

  guardarDatos() {
    // fusionar datos nuevos con usuario actual
    this.usuario = { ...this.usuario, ...this.datosPerfil };
    localStorage.setItem('usuario', JSON.stringify(this.usuario));

    this.showModalDatos = false;
  }

  cancelarDatos() {
    this.showModalDatos = false;
  }

  get textoBotonDatos(): string {
    // caso usuario interno
    if (this.usuario && this.usuario.tipo === 'interno') {
      return 'Actualizar datos';
    }

    // caso usuario externo
    if (this.usuario && this.usuario.tipo === 'externo') {
      // no tiene datos en tabla usuarios
      if (!this.usuario.tieneDatos) {
        return 'Ingresar datos';
      } else {
        // ya tenía datos
        return 'Actualizar datos';
      }
    }

    // default
    return 'Ingresar';
  }

  private fetchInfoUsuario(correo: any, rolId: any) {
    this.api.get<any>(`Usuarios/Consultar_Usuario_Rol?Correo=${correo}&RolId=${rolId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.tipoUsuario = resp.datos[0].tipoEstudianteId;
          this.usuario.rol = this.getNombreRol(Number(this.selectedRole));
          this.usuario.tipoUsuario = this.tipoUsuario;
          this.usuario.idUsuario =resp.datos[0].id;
          localStorage.setItem('usuario', JSON.stringify(this.usuario));
          // preparar datosPerfil con datos previos
          this.datosPerfil = { ...this.usuario };

          // cerrar modal 1 y abrir modal 2
          this.showModalRol = false;
          this.showModalDatos = true;

          //forzar refrescar menú en el sidebar
          window.dispatchEvent(new Event("storage"));
        },
        error: (err) => {
          console.error('Error al cargar estado para select', err);
          this.roles = [];
        }
      });
  }

  private fetchListaRoles(correo: any) {
    this.api.get<any>('Roles/Consultar_Rol?correo=' + correo)
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
          this.roles = items.map(item => ({ id: item.idRol, nombre: item.nombreRol }));

        },
        error: (err) => {
          console.error('Error al cargar estado para select', err);
          this.roles = [];
        }
      });
  }

  getNombreRol(id: number): string {
  const rol = this.roles.find(r => r.id === id);
  return rol ? rol.nombre : 'Sin rol';
}
}
