import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ListsolConvenioComponent } from '../listsol-convenio/listsol-convenio.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Accion {
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  responsableId: number;
}

interface AdministradorExterno {
  nombre: string;
  cargo: string;
  correo: string;
}

@Component({
  selector: 'app-solicitud-convenio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    NgxSonnerToaster,
    ConfirmDialogModule,
    ListsolConvenioComponent,
    TranslateModule
  ],
  templateUrl: './solicitud-convenio.component.html',
  styleUrl: './solicitud-convenio.component.css',
  providers: [ConfirmationService]
})
export class SolicitudConvenioComponent implements OnInit, OnDestroy {
  pasoActual = 0;
  tipoSolicitud: 'Apertura' | 'Renovacion' | 'MisSolicitudes' = 'Apertura';
  pasos = [
    { titulo: 'Descripción e Institución de Convenio' },
    { titulo: 'Antecedentes y Objetivos' },
    { titulo: 'Acciones' },
    { titulo: 'Administradores Convenio' }
  ];

  readonly SOLICITANTE_ID = 1053825186;
  readonly ESTADO_INICIAL_ID = 4;
  readonly ADMIN_INTERNO_ID = 1053825186;

  acciones: Accion[] = [
    {
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      responsableId: 1053825186,
    }
  ];

  administradorExterno: AdministradorExterno = {
    nombre: '',
    cargo: '',
    correo: ''
  };

  tieneAdminExterno: boolean = false;
  usuario: any;

  instituciones: any[] = [];
  institucionesFiltradas: any[] = [];
  selectedInstitucion: string = '';

  paises: any[] = [];
  ciudades: any[] = [];
  selectedPais: number | null = null;
  selectedCiudad: number | null = null;
  selectedsnies: number | null = null;

  tiposConvenio: any[] = [];
  clasificaciones: any[] = [];
  tiposActividad: any[] = [];
  categoriasnies: any[] = [];
  institucionIdConvenio: number = 0;
  guardandoRenovacion: boolean = false;

  formData = {
    institucion: '',
    antecedentes: '',
    objetivos: '',
    nombrecol: '',
    nombreext: '',
    cargo: '',
    correo: '',
    codigoRenovacion: '',
    tipoConvenio: '',
    fechaInicioRenovacion: '',
    fechaFinRenovacion: '',
    antecedentesRenovacion: '',
    ClasConvenio: '',
    tipoactividad: '',
    CategoriaSnies: '',
    descripcionRenovacion: '',
    descripcion: '',
    tipoSolicitud: 'Apertura'
  };

  guardando: boolean = false;
  private destroy$ = new Subject<void>();

  convenios: any[] = [];
  selectedConvenio: number | null = null;
  selectedtipo: number | null = null;
  selectclasificacion: number | null = null;
  selecttipoActividad: number | null = null;
  selectcategoriasnies: number | null = null;
  convenioSeleccionado: any = null;
  nombreNuevaInstitucion: string = '';
  ciudadesFiltradas: any[] = [];

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    this.formData.nombrecol = this.usuario.nombre;

    this.fetchInstituciones();
    this.fetchPaises();
    this.fetchConvenios();
    this.fetchTipos();
    this.fetchClasificaciones();
    this.fetchTiposActividad();
    this.fetchCategoriaSnies();
  }

  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchInstituciones() {
    this.api.get<any>('Institucion/Consultar_Institucion')
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
          this.instituciones = items.map(i => ({
            id: Number(i.id),
            nombre: i.nombre
          }));
          this.institucionesFiltradas = [...this.instituciones];
        },
        error: (err) => {
          console.error('Error cargando instituciones', err);
          this.instituciones = [];
          this.institucionesFiltradas = [];
        }
      });
  }

  fetchPaises() {
    this.api.get<any>('Pais/Consultar_Pais')
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
          this.paises = items.map(item => ({ id: item.id, nombre: item.nombre }));
        },
        error: (err) => {
          console.error('Error al cargar países', err);
          this.paises = [];
        }
      });
  }

  fetchConvenios() {
    this.api.get<any>('Convenios/Consultar_Convenio')
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
          this.convenios = items.map(i => ({
            id: Number(i.id),
            nombre: `${i.codigoUcm} - ${i.descripcion}`,
            codigoUcm: i.codigoUcm,
            tipoConvenioId: i.tipoConvenioId,
            clasificacionConvenioId: i.clasificacionConvenioId,
            tipoActividadid: i.tipoActividadid,
            fechaInicio: i.fechaInicio,
            fechaVencimiento: i.fechaVencimiento,
            descripcion: i.descripcion,
            estado: i.estado
          }));
        },
        error: (err) => { console.error('Error cargando convenios', err); this.convenios = []; }
      });
  }

  fetchTipos() {
    this.api.get<any>('TipoConvenio/Consultar_TipoConvenio')
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
          this.tiposConvenio = items.map(i => ({ id: Number(i.id), descripcion: i.descripcion }));
        },
        error: (err) => { console.error('Error cargando tipos convenio', err); this.tiposConvenio = []; }
      });
  }

  fetchClasificaciones() {
    this.api.get<any>('ClasificacionConvenio/Consultar_ClasificacionConvenio')
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
          this.clasificaciones = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
        },
        error: (err) => { console.error('Error cargando clasificaciones', err); this.clasificaciones = []; }
      });
  }

  fetchTiposActividad() {
    this.api.get<any>('TipoActividad/Consultar_TipoActividad')
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
          this.tiposActividad = items.map(i => ({ id: Number(i.id), nombre: i.descripcion }));
        },
        error: (err) => { console.error('Error cargando tipos actividad', err); this.tiposActividad = []; }
      });
  }

  fetchCategoriaSnies() {
    this.api.get<any>('Categoria/Consultar_Categoria')
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
          this.categoriasnies = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
        },
        error: (err) => { console.error('Error cargando tipos Categorias Snies', err); this.categoriasnies = []; }
      });
  }

  onInstitucionChange() {
    if (this.selectedInstitucion !== 'nueva') {
      this.selectedPais = null;
      this.formData.institucion = '';
      this.ciudadesFiltradas = [];
    }
  }

  onPaisChange() {
    const paisId = Number(this.selectedPais ?? 0);
    this.selectedCiudad = null;
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
        },
        error: (err) => {
          console.error('Error al cargar ciudades', err);
          this.ciudades = [];
        }
      });
  }

  agregarAccion(): void {
    const nuevaAccion: Accion = {
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      responsableId: 1053825186
    };
    this.acciones.push(nuevaAccion);
  }

  eliminarAccion(index: number): void {
    if (this.acciones.length > 1) {
      this.acciones.splice(index, 1);
    } else {
      alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.MIN_ACCION'));
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  goBack() {
    window.history.back();
  }

  onConvenioSeleccionado() {
    const convenio = this.convenios.find(c => c.id === this.selectedConvenio);
    if (convenio) {
      this.convenioSeleccionado = convenio;
      this.formData.codigoRenovacion = convenio.codigoUcm;
      this.formData.tipoConvenio = convenio.tipoConvenioId;
      this.formData.fechaInicioRenovacion = convenio.fechaInicio;
      this.formData.fechaFinRenovacion = convenio.fechaVencimiento;
      this.formData.ClasConvenio = convenio.clasificacionConvenioId;
      this.formData.tipoactividad = convenio.tipoActividadid;
      this.formData.descripcionRenovacion = convenio.descripcion;
      this.consultarInstitucionConvenio(convenio.codigoUcm);
    } else {
      this.convenioSeleccionado = null;
      this.formData.codigoRenovacion = '';
      this.formData.tipoConvenio = '';
      this.formData.fechaInicioRenovacion = '';
      this.formData.fechaFinRenovacion = '';
      this.formData.antecedentesRenovacion = '';
    }
  }

  onCiudadChange() {
    console.log('cambio ciudad');
  }

  consultarInstitucionConvenio(codigoUcm: string): void {
    const endpoint = `InstitucionConvenio/Consultar_InstitucionConvenioGeneral?nombreInstitucion=&nombreConvenio=${codigoUcm}`;

    console.log('🔍 Consultando institución para convenio:', codigoUcm);

    this.api.get<any>(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let datos: any[] = [];

          if (Array.isArray(response)) {
            datos = response;
          } else if (response && response.datos) {
            datos = Array.isArray(response.datos) ? response.datos : [response.datos];
          } else if (response && response.data) {
            datos = Array.isArray(response.data) ? response.data : [response.data];
          }

          if (datos.length > 0) {
            const institucionConvenio = datos[0];

            this.institucionIdConvenio =
              institucionConvenio.institucionId ||
              institucionConvenio.InstitucionId ||
              institucionConvenio.institucion_id ||
              institucionConvenio.id ||
              0;

            console.log('✅ Institución del convenio obtenida:', this.institucionIdConvenio);

            if (this.institucionIdConvenio === 0) {
              console.warn('⚠️ No se pudo extraer el ID de la institución del response:', institucionConvenio);
              alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.WARN_ID_INSTITUCION'));
            }
          } else {
            console.warn('⚠️ No se encontró la institución del convenio');
            this.institucionIdConvenio = 0;
            alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.WARN_NO_INSTITUCION'));
          }
        },
        error: (error) => {
          console.error('❌ Error al consultar institución:', error);
          this.institucionIdConvenio = 0;
          alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_CONSULTAR_INSTITUCION'));
        }
      });
  }

  cambiarTipo(tipo: 'Apertura' | 'Renovacion' | 'MisSolicitudes') {
    this.tipoSolicitud = tipo;
  }

  onTipoSolicitudChange() {
    this.pasoActual = 0;
    this.convenioSeleccionado = null;
    this.selectedConvenio = null;
  }

  irAPaso(i: number) {
    this.pasoActual = i;
  }

  siguientePaso() {
    if (this.pasoActual < this.pasos.length - 1) this.pasoActual++;
  }

  anteriorPaso() {
    if (this.pasoActual > 0) this.pasoActual--;
  }

  validarPasoActual(): boolean {
    switch (this.pasoActual) {
      case 0:
        if (!this.selectedInstitucion) {
          alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.SELECCIONE_INSTITUCION'));
          return false;
        }
        break;

      case 1:
        if (!this.formData.antecedentes || !this.formData.objetivos) {
          alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.COMPLETE_ANTECEDENTES'));
          return false;
        }
        break;

      case 2:
        const accionesValidas = this.acciones.filter(
          a => a.descripcion.trim() !== '' && a.fechaInicio && a.fechaFin
        );
        if (accionesValidas.length === 0) {
          alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.MIN_ACCION'));
          return false;
        }
        break;

      case 3:
        if (this.tieneAdminExterno) {
          if (!this.administradorExterno.nombre ||
            !this.administradorExterno.cargo ||
            !this.administradorExterno.correo) {
            alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.COMPLETE_ADMIN_EXTERNO'));
            return false;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(this.administradorExterno.correo)) {
            alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.EMAIL_INVALIDO'));
            return false;
          }
        }
        break;
    }
    return true;
  }

  guardar(form: NgForm): void {
    console.log("guardar");
    if (!form.valid) {
      alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.COMPLETE_CAMPOS'));
      return;
    }

    if (!this.validarPasoActual()) {
      return;
    }
    this.guardando = true;

    const tipoSolicitudId = this.tipoSolicitud === 'Apertura' ? 2 : 3;

    const solicitudData = {
      solicitanteId: this.SOLICITANTE_ID,
      descripcion: this.formData.descripcion,
      tiposolicitudId: tipoSolicitudId,
      antecedentes: this.formData.antecedentes,
      objetivos: this.formData.objetivos,
      institucionId: parseInt(this.selectedInstitucion),
      fechacreacion: this.formatearFecha(new Date()),
      estadoId: this.ESTADO_INICIAL_ID
    };

    console.log('📝 1. Creando solicitud:', solicitudData);

    this.api.post<any>('SolicitudConvenios/crear_SolicitudConvenios', solicitudData)
      .subscribe({
        next: (response) => {
          if (response.exito && response.datos) {
            const solicitudId = response.datos;
            console.log('✅ Solicitud creada con ID:', solicitudId);
            this.guardarAcciones(solicitudId);
          } else {
            console.error('❌ Respuesta inesperada:', response);
            this.guardando = false;
            this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_CREAR'));
          }
        },
        error: (error) => {
          console.error('❌ Error al crear solicitud:', error);
          this.guardando = false;
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_CREAR'));
        }
      });
  }

  private guardarAcciones(solicitudId: number): void {
    const accionesValidas = this.acciones
      .filter(a => a.descripcion.trim() !== '' && a.fechaInicio && a.fechaFin)
      .map(accion => ({
        solicitudconId: solicitudId,
        descripcion: accion.descripcion,
        responsableId: accion.responsableId,
        fechainicio: this.formatearFechaAccion(accion.fechaInicio),
        fechafin: this.formatearFechaAccion(accion.fechaFin),
        estadoaccionId: false
      }));

    if (accionesValidas.length === 0) {
      console.log('⚠️ No hay acciones válidas para guardar');
      this.guardarAdministradores(solicitudId);
      return;
    }

    console.log('📋 2. Guardando acciones:', accionesValidas);

    let accionesGuardadas = 0;
    let errorEncontrado = false;

    accionesValidas.forEach((accion, index) => {
      this.api.post<any>('Accion/crear_AccionSolicitud', accion).subscribe({
        next: (response) => {
          accionesGuardadas++;
          console.log(`✅ Acción ${index + 1} guardada:`, response);

          if (accionesGuardadas === accionesValidas.length && !errorEncontrado) {
            this.guardarAdministradores(solicitudId);
          }
        },
        error: (error) => {
          console.error(`❌ Error al guardar acción ${index + 1}:`, error);
          if (!errorEncontrado) {
            errorEncontrado = true;
            this.guardando = false;
            alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ACCIONES'));
          }
        }
      });
    });
  }

  private guardarAdministradores(solicitudId: number): void {
    const administradores = [];

    administradores.push({
      solicitudId: solicitudId,
      usuarioId: this.ADMIN_INTERNO_ID
    });

    if (this.tieneAdminExterno && this.administradorExterno.nombre) {
      administradores.push({
        solicitudId: solicitudId,
        usuarioId: 10266377,
        desripcionSolicitud: 'SIN DESCRIPCION'
      });
    }

    console.log('👥 3. Guardando administradores:', administradores);

    let adminsGuardados = 0;
    let errorEncontrado = false;

    administradores.forEach((admin, index) => {
      this.api.post<any>('Administrador/crear_AdministradoresConvenios', admin).subscribe({
        next: (response) => {
          adminsGuardados++;
          console.log(`✅ Administrador ${index + 1} guardado:`, response);

          if (adminsGuardados === administradores.length && !errorEncontrado) {
            this.finalizarGuardado(solicitudId);
          }
        },
        error: (error) => {
          console.error(`❌ Error al guardar administrador ${index + 1}:`, error);
          if (!errorEncontrado) {
            errorEncontrado = true;
            this.guardando = false;
            alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ADMINS'));
          }
        }
      });
    });
  }

  private finalizarGuardado(solicitudId: number): void {
    this.guardando = false;
    console.log('🎉 Proceso completado exitosamente');
    this.showSuccess(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.EXITO_CREAR', { id: solicitudId }));
    this.limpiarFormulario();
  }

  private formatearFechaAccion(fechaString: string): string {
    const fecha = new Date(fechaString);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  limpiarFormulario(): void {
    this.pasoActual = 0;
    this.formData = {
      institucion: '',
      descripcion: '',
      antecedentes: '',
      objetivos: '',
      tipoSolicitud: 'Apertura',
      nombrecol: '',
      nombreext: '',
      cargo: '',
      correo: '',
      codigoRenovacion: '',
      tipoConvenio: '',
      fechaInicioRenovacion: '',
      fechaFinRenovacion: '',
      antecedentesRenovacion: '',
      ClasConvenio: '',
      tipoactividad: '',
      CategoriaSnies: '',
      descripcionRenovacion: '',
    };
    this.acciones = [{
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      responsableId: 1
    }];
    this.administradorExterno = {
      nombre: '',
      cargo: '',
      correo: ''
    };
    this.tieneAdminExterno = false;
    this.selectedInstitucion = '';
  }

  guardarRenovacion() {
    if (!this.selectedConvenio || !this.convenioSeleccionado) {
      alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.SELECCIONE_CONVENIO_RENOVAR'));
      return;
    }
    if (!this.formData.antecedentesRenovacion || this.formData.antecedentesRenovacion.trim() === '') {
      alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.MOTIVOS_RENOVACION'));
      return;
    }

    if (this.institucionIdConvenio === 0) {
      alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ID_INSTITUCION'));
      return;
    }

    this.guardandoRenovacion = true;

    const solicitudRenovacion = {
      solicitanteId: this.SOLICITANTE_ID,
      descripcion: this.formData.descripcionRenovacion || this.convenioSeleccionado.descripcion,
      tiposolicitudId: 3,
      antecedentes: this.formData.antecedentesRenovacion.trim(),
      objetivos: '',
      institucionId: this.institucionIdConvenio,
      fechacreacion: this.formatearFecha(new Date()),
      estadoId: this.ESTADO_INICIAL_ID
    };
    console.log('Creando solicitud renovación:', solicitudRenovacion);

    this.api.post<any>('SolicitudConvenios/crear_SolicitudConvenios', solicitudRenovacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.guardandoRenovacion = false;

          if (response.exito && response.datos) {
            const solicitudId = response.datos;
            console.log('✅ Solicitud de renovación creada con ID:', solicitudId);

            this.showSuccess(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.EXITO_RENOVACION', {
              id: solicitudId,
              codigo: this.convenioSeleccionado.codigoUcm
            }));

            this.limpiarFormularioRenovacion();

          } else {
            console.error('❌ Respuesta inesperada:', response);
            alert(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_RENOVACION'));
          }
        },
        error: (error) => {
          this.guardandoRenovacion = false;
          console.error('❌ Error al crear solicitud de renovación:', error);

          let mensajeError = this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_RENOVACION');
          if (error.error && error.error.mensaje) {
            mensajeError += `\n${error.error.mensaje}`;
          }

          alert(mensajeError);
        }
      });
  }

  limpiarFormularioRenovacion(): void {
    this.selectedConvenio = null;
    this.convenioSeleccionado = null;
    this.institucionIdConvenio = 0;

    this.formData.codigoRenovacion = '';
    this.formData.tipoConvenio = '';
    this.formData.fechaInicioRenovacion = '';
    this.formData.fechaFinRenovacion = '';
    this.formData.antecedentesRenovacion = '';
    this.formData.ClasConvenio = '';
    this.formData.tipoactividad = '';
    this.formData.descripcionRenovacion = '';
  }

  showSuccess(description: string = 'Operación completada correctamente') {
    toast.success(this.translate.instant('SOLICITUD_CONVENIO.TOASTS.EXITO'), {
      description: description,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(description: string = 'Ocurrió un error al procesar la solicitud') {
    toast.error(this.translate.instant('SOLICITUD_CONVENIO.TOASTS.ERROR'), {
      description: description,
      unstyled: true,
      class: 'my-error-toast'
    });
  }
}
