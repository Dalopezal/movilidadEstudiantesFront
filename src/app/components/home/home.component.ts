import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  roles: string[] = ['Administrador', 'Estudiante', 'Profesor', 'Administrativo'];
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
      this.usuario.rol = this.selectedRole;
      localStorage.setItem('usuario', JSON.stringify(this.usuario));

      // preparar datosPerfil con datos previos
      this.datosPerfil = { ...this.usuario };

      // cerrar modal 1 y abrir modal 2
      this.showModalRol = false;
      this.showModalDatos = true;
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
}
