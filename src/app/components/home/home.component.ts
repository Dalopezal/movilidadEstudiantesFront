import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil } from 'rxjs';

import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, FormsModule, CommonModule,  ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [ConfirmationService]
})
export class HomeComponent implements OnInit {

  usuario: any = {};
  showModalRol: boolean = false;   // modal 1
  showModalDatos: boolean = false; // modal 2
  estados: any[] = [];
  paises: any[] = [];
  ciudades: any[] = [];
  selectedPaisId: number | null = null;
  tiposDocumento: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService,  private confirmationService: ConfirmationService) {}

  roles: any[] = [];
  tipoUsuario: any;
  selectedRole: string = '';

  datosPerfil: any = {
    tipoDocumentoId: null,
    documento: '',
    nombreCompleto: '',
    correo: '',
    telefono: '',
    pasaporte: '',
    fechaNacimiento: '',
    direccion: '',
    paisId: null,
    ciudadId: null,
    cargo: '',
    contrato: '',
    semestre: '',
    avance: '',
    programa: '',
    facultad: '',
    dependencia: '',
    nivelFormacion: '',
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
        this.showModalRol = true;
      }
    }

    if (!this.usuario.rol) {
      this.showModalRol = true;
    }

    // Inicializamos paises
    this.fetchPaises().pipe(takeUntil(this.destroy$)).subscribe({
      next: (p) => this.paises = p,
      error: (err) => {
        console.error('Error al cargar países', err);
        this.paises = [];
      }
    });

    // Inicializamos tipos de documento
    this.fetchTipoDocumentos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (t) => this.tiposDocumento = t,
      error: (err) => {
        console.error('Error al cargar tipos de documento', err);
        this.tiposDocumento = [];
      }
    });
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
    this.usuario = { ...this.usuario, ...this.datosPerfil };
    localStorage.setItem('usuario', JSON.stringify(this.usuario));

    this.guardarDatosSerivio();
  }

  cancelarDatos() {
    this.showModalDatos = false;
  }

  get textoBotonDatos(): string {
    if (this.usuario && this.usuario.tipoUsuario === 1) {
      return 'Actualizar datos';
    }

    if (this.usuario && this.usuario.tipoUsuario === 2) {
      if (this.datosPerfil.documento == '') {
        return 'Ingresar datos';
      } else {
        return 'Actualizar datos';
      }
    }

    // default
    return 'Ingresar';
  }

  fetchTipoDocumentos(): Observable<any[]> {
    return this.api.get<any>('TipoDocumento/Consultar_TipoDocumento').pipe(
      map((response) => {
        let items: any[] = [];
        if (Array.isArray(response)) items = response;
        else if (response && typeof response === 'object') {
          if (Array.isArray(response.datos)) items = response.datos;
          else if (Array.isArray(response.data)) items = response.data;
          else if (Array.isArray(response.items)) items = response.items;
          else {
            const arr = Object.values(response).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
        }
        // normalizamos estructura: { id, nombre }
        return items.map(item => ({ id: item.id, nombre: item.nombre }));
      })
    );
  }

  private fetchInfoUsuario(correo: any, rolId: any) {
    this.api.get<any>(`Usuarios/Consultar_Usuario_Rol?Correo=${correo}&RolId=${rolId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const u = this.extractUserObject(resp);
          this.tipoUsuario = u?.tipoEstudianteId ?? 2;
          this.usuario.rol = this.getNombreRol(Number(this.selectedRole));
          this.usuario.tipoUsuario = this.tipoUsuario;
          this.usuario.idUsuario = u?.id ?? null;
          localStorage.setItem('usuario', JSON.stringify(this.usuario));
          // preparar datosPerfil con datos previos
          this.datosPerfil = { ...this.usuario };

          this.populateDatosPerfilFromResp(resp);

          this.showModalRol = false;
          this.showModalDatos = true;

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

  // Helpers (pegarlos en el componente)
  private formatDateForInput(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private mapTipoDocumento(tipoDocumentoId: number | null | undefined): string {
    // Ajusta el mapping según tu backend
    switch (tipoDocumentoId) {
      case 1: return 'CC';  // Cédula de ciudadanía
      case 2: return 'TI';  // Tarjeta de identidad
      case 3: return 'CE';  // Cédula de extranjería
      case 4: return 'PAS'; // Pasaporte
      default: return '';   // sin datos / desconocido
    }
  }

  private extractUserObject(resp: any): any {
    if (!resp) return null;
    if (Array.isArray(resp)) return resp[0] ?? null;
    if (resp.datos) {
      if (Array.isArray(resp.datos)) return resp.datos[0] ?? null;
      return resp.datos;
    }
    return resp;
  }

  private populateDatosPerfilFromResp(resp: any) {
    const u = this.extractUserObject(resp);
    if (!u) {
      this.datosPerfil = {
        tipoDocumento: '',
        documento: '',
        nombreCompleto: '',
        correo: '',
        telefono: '',
        pasaporte: '',
        fechaNacimiento: null,
        direccion: '',
        paisId: null,
        ciudadId: null,
        cargo: '',
        contrato: '',
        semestre: null,
        avance: null,
        programa: '',
        facultad: '',
        dependencia: '',
        nivelFormacion: '',
        promedio: null,
        grupo: ''
      };
      return;
    }

    this.datosPerfil = {
      tipoDocumentoId: u.tipoDocumentoId != null ? Number(u.tipoDocumentoId) : null,
      documento: u.documento ?? u.documentoIdentificacion ?? '',
      nombreCompleto: u.nombreCompleto ?? u.nombre ?? '',
      correo: u.correo ?? '',
      telefono: u.telefono ?? '',
      pasaporte: u.pasaporte ?? '',
      fechaNacimiento: this.formatDateForInput(u.fechaNacimiento ?? u.fechaNacimientoStr ?? null),
      direccion: u.direccion ?? '',
      paisId: u.paisId != null ? Number(u.paisId) : null,
      ciudadId: u.ciudadId != null ? Number(u.ciudadId) : null,
      cargo: u.cargo ?? '',
      contrato: u.tipoContrato ?? '',
      semestre: u.semestreAcademico ?? u.semestre ?? null,
      avance: u.porcentAvanceCreditos ?? u.avance ?? null,
      programa: u.programaAcademico ?? u.programa ?? '',
      facultad: u.facultadNombre ?? u.facultad ?? '',
      dependencia: u.dependenciaNombre ?? u.dependencia ?? '',
      nivelFormacion: u.nivelFormacion ?? '',
      promedio: u.promedioAcademico ?? u.promedio ?? null,
      grupo: u.grupoInvestigacionNombre ?? u.grupo ?? ''
    };

    this.usuario.idUsuario = u.id ?? this.usuario.idUsuario;
    this.usuario.tipoUsuario = u.tipoEstudianteId ?? this.usuario.tipoUsuario;
    this.usuario.nombre = this.datosPerfil.nombreCompleto ?? this.usuario.nombre;
    this.usuario.correo = this.datosPerfil.correo ?? this.usuario.correo;

    if (this.datosPerfil.paisId) {
      if (this.paises && this.paises.length > 0) {
        const exists = this.paises.find((p: any) => Number(p.id) === Number(this.datosPerfil.paisId));
        if (!exists) {
        }
        this.onPaisChange(this.datosPerfil.ciudadId);
      } else {
        this.fetchPaises().pipe(takeUntil(this.destroy$)).subscribe({
          next: (p) => {
            this.paises = p;
            this.onPaisChange(this.datosPerfil.ciudadId);
          },
          error: (err) => {
            console.error('Error al cargar países', err);
          }
        });
      }
    }
  }

  fetchPaises(): Observable<any[]> {
    return this.api.get<any>('Pais/Consultar_Pais').pipe(
      map((response) => {
        let items: any[] = [];
        if (Array.isArray(response)) items = response;
        else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) items = response.data;
          else if (Array.isArray(response.items)) items = response.items;
          else {
            const arr = Object.values(response).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
        }
        const mapped = items.map(item => ({ id: item.id, nombre: item.nombre }));
        return mapped;
      })
    );
  }

  onPaisChange(selectedCityId?: number | null) {
    const paisId = Number(this.datosPerfil.paisId ?? 0);
    this.datosPerfil.ciudadId = null;
    this.ciudades = [];

    if (!paisId) return;

    this.api.get<any>(`Ciudad/Consultar_CiudadEspecificoPais?idPais=${paisId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let items: any[] = [];
          if (Array.isArray(response)) items = response;
          else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) items = response.data;
            else if (Array.isArray(response.items)) items = response.items;
            else {
              const arr = Object.values(response).find(v => Array.isArray(v));
              if (Array.isArray(arr)) items = arr;
            }
          }
          this.ciudades = items.map(item => ({ id: Number(item.id), nombre: item.nombreCiudad }));

          if (selectedCityId != null) {
            const exist = this.ciudades.find(c => Number(c.id) === Number(selectedCityId));
            if (exist) {
              this.datosPerfil.ciudadId = Number(selectedCityId);
            }
          }
        },
        error: (err) => {
          console.error('Error al cargar ciudades', err);
          this.ciudades = [];
        }
      });
  }

  actualizarUsuario(datos: any): Observable<any> {
    const payload: any = {
      documento: datos.documento,
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      tipoDocumentoId: Number(datos.tipoDocumentoId) || null,
      telefono: datos.telefono,
      pasaporte: datos.pasaporte || '',
      fechaNacimiento: this.formatDateToISO(datos.fechaNacimiento),
      direccion: datos.direccion,
      ciudadId: Number(datos.ciudadId) || null,
      cargo: datos.cargo || '',
      tipoContrato: datos.contrato || '',
      semestreAcademico: datos.semestre ? Number(datos.semestre) : null,
      porcentAvanceCreditos: datos.avance ? Number(datos.avance) : null,
      programaAcademico: datos.programa || '',
      facultadNombre: datos.facultad || '',
      dependenciaNombre: datos.dependencia || '',
      nivelFormacion: datos.nivelFormacion || '',
      promedioAcademico: datos.promedio ? Number(datos.promedio) : null,
      grupoInvestigacionNombre: datos.grupo || '',
      activo: true,
      fechaActualizacion: new Date().toISOString().split('T')[0],
      tipoEstudianteId: this.usuario.tipoUsuario ?? 1,
      paisId: Number(datos.paisId) || null,
      rolId: Number(this.usuario.rolId) || null
    };

    if (datos.id != null) {
      payload.id = Number(datos.id);
    }

    const url = 'Usuarios/Actualiza_Usuarios';
    return this.api.put<any>(url, payload);
  }

  private formatDateToISO(dateStr: string | Date | null): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  guardarDatosSerivio() {
  const datosAEnviar = {
    ...this.datosPerfil,
    id: this.usuario.idUsuario // opcional: si ya existe
  };

  this.loading = true;

  this.actualizarUsuario(datosAEnviar).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp) => {
        this.loading = false;
        console.log('Usuario actualizado con éxito', resp);

        // Actualizar localStorage con los nuevos datos
        this.usuario = { ...this.usuario, ...this.datosPerfil };
        localStorage.setItem('usuario', JSON.stringify(this.usuario));

        // Cerrar modal
        this.showModalDatos = false;

        // Opcional: mostrar mensaje de éxito
        this.showSuccess('Datos guardados correctamente');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al actualizar usuario', err);

        // Opcional: mostrar mensaje de error
        this.showError('Error al guardar los datos');
      }
    });
  }

  showSuccess(mensaje: any) {
    toast.success('¡Operación exitosa!', {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error('Error al procesar', {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }
}
