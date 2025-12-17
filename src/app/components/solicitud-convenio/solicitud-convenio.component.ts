import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil } from 'rxjs';
//import { NgxSonnerToaster } from 'ngx-sonner';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {ListsolConvenioComponent} from '../listsol-convenio/listsol-convenio.component'

//import { ConvenioModel } from '../../models/ConvenioModel';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';


interface Accion {
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  responsableId: number;
}

/*
interface AdministradorInterno {
  id?: number;  // ID del usuario UCM existente
  nombre: string;  // Solo para mostrar
}
*/

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
    ListsolConvenioComponent
  ],
  templateUrl: './solicitud-convenio.component.html',
  styleUrl: './solicitud-convenio.component.css',
  providers: [ConfirmationService]
})
export class SolicitudConvenioComponent {
  pasoActual = 0;
  tipoSolicitud: 'Apertura' | 'Renovacion' |'MisSolicitudes'= 'Apertura'; // valor por defecto
  pasos = [
    { titulo: 'Descripción e Institución de Convenio' },
    { titulo: 'Antecedentes y Objetivos' },
    { titulo: 'Acciones' },
    { titulo: 'Administradores Convenio' }
  ];


  // ID QUEMADO temporalmente (cambiar cuando tengamos el id del usuario logueado)
  readonly SOLICITANTE_ID = 1053825186;  // ← ID quemado del solicitante
  readonly ESTADO_INICIAL_ID = 4;
  readonly ADMIN_INTERNO_ID = 1053825186;  // ← ID quemado del admin interno (usuario UCM)

  // Array para almacenar múltiples acciones
  acciones: Accion[] = [
    {

      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      responsableId: 1053825186, //asignado temporalmente
    }
  ];

  /*
  // Administrador interno (UCM) - ÚNICO
  administradorInterno: AdministradorInterno = {
    id: undefined,
    nombre: ''
  };
  */

  // Administrador externo - OPCIONAL
  administradorExterno: AdministradorExterno = {
    nombre: '',
    cargo: '',
    correo: ''
  };

  // Checkbox para indicar si hay admin externo
  tieneAdminExterno: boolean = false;
  usuario: any; // variable para el usuario



  instituciones: any[] = [];
  institucionesFiltradas: any[] = [];
  selectedInstitucion: string = '';

  paises: any[] = [];
  ciudades: any[] = [];
  selectedPais: number | null = null;
  selectedCiudad: number | null = null;
  selectedsnies: number | null = null;
  // para convenios
  tiposConvenio: any[] = [];
  clasificaciones: any[] = [];
  tiposActividad: any[] = [];
  categoriasnies: any[] = [];
  institucionIdConvenio: number = 0;  // ← Para guardar el ID de la institución
  guardandoRenovacion: boolean = false;


  formData = {
    institucion: '',
    antecedentes:'',
    objetivos:'',
    nombrecol:'',
    nombreext:'',
    cargo:'',
    correo:'',
    codigoRenovacion: '',
    tipoConvenio: '',
    fechaInicioRenovacion: '',
    fechaFinRenovacion: '',
    antecedentesRenovacion: '',
    ClasConvenio:'',
    tipoactividad:'',
    CategoriaSnies:'',
    descripcionRenovacion:'',
    descripcion:'',
    tipoSolicitud: 'Apertura'

  }

  guardando: boolean = false;

  private destroy$ = new Subject<void>();

  // simulacion de convenios existente
  // Lista simulada de convenios existentes
  convenios: any[] = [];

  selectedConvenio: number | null = null;
  selectedtipo: number | null = null;
  selectclasificacion: number | null = null;
  selecttipoActividad: number | null = null;
  selectcategoriasnies: number | null = null;


  convenioSeleccionado: any = null; // que hace esto

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {

    // para el usuario
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    this.formData.nombrecol=this.usuario.nombre;
    //////////////

    this.fetchInstituciones();
    this.fetchPaises();
    this.fetchConvenios();
    this.fetchTipos(); //tipo convenio
    this.fetchClasificaciones(); //clasificacion convenio
    this.fetchTiposActividad(); // tipo actividades
    this.fetchCategoriaSnies();



  }

  /// para el onstorage cargar variables del navegador
  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



  // 🔹 Método que llama al API
  fetchInstituciones() {
    this.api.get<any>('Institucion/Consultar_Institucion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];

          // Normalizar respuesta
          if (Array.isArray(resp)) items = resp;
          else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp.data)) items = resp.data;
            else if (Array.isArray(resp.items)) items = resp.items;
            else {
              const arr = Object.values(resp).find(v => Array.isArray(v));
              if (Array.isArray(arr)) items = arr;
            }
          }

          // Mapear resultado
          this.instituciones = items.map(i => ({
            id: Number(i.id),
            nombre: i.nombre
          }));

          // Si quieres aplicar filtro o manipulación, lo haces aquí
          this.institucionesFiltradas = [...this.instituciones];
        },
        error: (err) => {
          console.error('Error cargando instituciones', err);
          this.instituciones = [];
          this.institucionesFiltradas = [];
        }
      });
  }

  // paises
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

 // convenios
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
        this.convenios = items.map(i => ({ id: Number(i.id),
          nombre:  `${i.codigoUcm} - ${i.descripcion}`,
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

  // tipos convenio
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

  // clasificacion del convenio
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

  // tipo de actividad del convenio
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




  nombreNuevaInstitucion: string = '';

  ciudadesFiltradas: any[] = [];


  onInstitucionChange() {
    if (this.selectedInstitucion !== 'nueva') {
      // Si selecciona una institución existente, limpia los campos de nueva institución
      this.selectedPais = null;
      this.formData.institucion = '';
      this.ciudadesFiltradas = [];
    }
  }
  onPaisChange() {
    const paisId = Number(this.selectedPais?? 0);
    this.selectedCiudad = null; // <-- limpiar ciudad al cambiar país
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








  /// metodos para manejar acciones
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
      alert('Debe haber al menos una acción');
    }
  }

  // Usa index en lugar de id
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
      this.formData.ClasConvenio=convenio.clasificacionConvenioId;
      this.formData.tipoactividad=convenio.tipoActividadid;
      this.formData.descripcionRenovacion=convenio.descripcion;
      //this.formData.CategoriaSnies=
      this.consultarInstitucionConvenio(convenio.codigoUcm);

    } else {
      this.convenioSeleccionado = null;
      // limpia los campos si se deselecciona
      this.formData.codigoRenovacion = '';
      this.formData.tipoConvenio = '';
      this.formData.fechaInicioRenovacion = '';
      this.formData.fechaFinRenovacion = '';
      this.formData.antecedentesRenovacion = '';
    }
  }


  onCiudadChange() {
    console.log('cambio ciudad')
  }

  // consultar la institucion del convenio
  consultarInstitucionConvenio(codigoUcm: string): void {
    const endpoint = `InstitucionConvenio/Consultar_InstitucionConvenioGeneral?nombreInstitucion=&nombreConvenio=${codigoUcm}`;

    console.log('🔍 Consultando institución para convenio:', codigoUcm);

    this.api.get<any>(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Manejar diferentes estructuras de respuesta
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

            // Intenta obtener el ID de diferentes posibles nombres de propiedad
            this.institucionIdConvenio =
              institucionConvenio.institucionId ||
              institucionConvenio.InstitucionId ||
              institucionConvenio.institucion_id ||
              institucionConvenio.id ||
              0;

            console.log(' Institución del convenio obtenida:', this.institucionIdConvenio);

            if (this.institucionIdConvenio === 0) {
              console.warn(' No se pudo extraer el ID de la institución del response:', institucionConvenio);
              alert('Advertencia: No se pudo obtener el ID de la institución del convenio');
            }
          } else {
            console.warn(' No se encontró la institución del convenio');
            this.institucionIdConvenio = 0;
            alert('Advertencia: No se encontró información de la institución para este convenio');
          }
        },
        error: (error) => {
          console.error(' Error al consultar institución:', error);
          this.institucionIdConvenio = 0;
          alert('Error al consultar la institución del convenio. Verifique que el convenio tenga una institución asignada.');
        }
      });
  }





  /// pasos del formulario /////


  cambiarTipo(tipo: 'Apertura' | 'Renovacion' |'MisSolicitudes') {
    this.tipoSolicitud = tipo;
  }
  onTipoSolicitudChange() {
    this.pasoActual = 0;
   // this.formData = {}; // limpia el formulario
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
  ///////////////////////////////////////////////////////////////

  // vaidar los pasos del formulario
  validarPasoActual(): boolean {
    switch (this.pasoActual) {
      case 0: // Institución
        if (!this.selectedInstitucion) {
          alert('Debe seleccionar una institución');
          return false;
        }
        break;

      case 1: // Antecedentes y Objetivos
        if (!this.formData.antecedentes || !this.formData.objetivos) {
          alert('Debe completar antecedentes y objetivos');
          return false;
        }
        break;

      case 2: // Acciones
        const accionesValidas = this.acciones.filter(
          a => a.descripcion.trim() !== '' && a.fechaInicio && a.fechaFin
        );
        if (accionesValidas.length === 0) {
          alert('Debe completar al menos una acción');
          return false;
        }
        break;

      case 3: // Administradores

        // Validar admin externo solo si está marcado el checkbox
        if (this.tieneAdminExterno) {
          if (!this.administradorExterno.nombre ||
              !this.administradorExterno.cargo ||
              !this.administradorExterno.correo) {
            alert('Debe completar todos los datos del administrador externo');
            return false;
          }

          // Validar email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(this.administradorExterno.correo)) {
            alert('El correo electrónico no es válido');
            return false;
          }
        }
        break;
    }
    return true;
  }


  // guardar el formulario de solicitud de apertura
  guardar(form: NgForm): void {
    console.log("guardar");
    if (!form.valid) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (!this.validarPasoActual()) {
      return;
    }
    this.guardando = true;
        // ============================================
    // PASO 1: CREAR SOLICITUD
    // ============================================
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

            // Continuar con acciones
            this.guardarAcciones(solicitudId);
          } else {
            console.error('❌ Respuesta inesperada:', response);
            this.guardando = false;
            this.showError('Error al crear la solicitud. Intente nuevamente.');
          }
        },
        error: (error) => {
          console.error('❌ Error al crear solicitud:', error);
          this.guardando = false;
          this.showError('Error al crear la solicitud. Intente nuevamente.');
        }
      });


  }

    // ============================================
  // PASO 2: GUARDAR ACCIONES
  // ============================================
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

    // Si tu API NO acepta array (una petición por acción):

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
            alert('Error al guardar algunas acciones. Revise los datos.');
          }
        }
      });
    });

  }

  // ============================================
  // PASO 3: GUARDAR ADMINISTRADORES
  // ============================================
  private guardarAdministradores(solicitudId: number): void {
    const administradores = [];

    // Administrador interno (SIEMPRE)
    administradores.push({
      solicitudId: solicitudId,
      usuarioId: this.ADMIN_INTERNO_ID
    });

    // Administrador externo (OPCIONAL)
    if (this.tieneAdminExterno && this.administradorExterno.nombre) {
      // TODO: Si necesitas crear primero el usuario externo, hazlo aquí
      // Por ahora, asumimos que envías los datos directos o tienes un usuarioId
      administradores.push({
        solicitudId: solicitudId,
        usuarioId: 10266377,// O el ID si ya lo creaste
        desripcionSolicitud :'SIN DESCRIPCION'
        //nombre: this.administradorExterno.nombre,
        //cargo: this.administradorExterno.cargo,
        //correo: this.administradorExterno.correo,
        //tipo: 'externo'
      });
    }

    console.log('👥 3. Guardando administradores:', administradores);



    // Si tu API NO acepta array (una petición por administrador):

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
            alert('Error al guardar algunos administradores.');
          }
        }
      });
    });

  }

  private finalizarGuardado(solicitudId: number): void {
    this.guardando = false;
    console.log('🎉 Proceso completado exitosamente');
    this.showSuccess(` Solicitud de convenio creada exitosamente\n\nID de Solicitud: ${solicitudId}`);

    this.limpiarFormulario();

    // Opcional: Redireccionar
    // this.router.navigate(['/convenios', solicitudId]);
  }


  private formatearFechaAccion(fechaString: string): string {
    // Si tu backend necesita formato YYYY/MM/DD
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
      nombrecol:'',
      nombreext:'',
      cargo:'',
      correo:'',
      codigoRenovacion: '',
      tipoConvenio: '',
      fechaInicioRenovacion: '',
      fechaFinRenovacion: '',
      antecedentesRenovacion: '',
      ClasConvenio:'',
      tipoactividad:'',
      CategoriaSnies:'',
      descripcionRenovacion:'',
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

  // guardar las acciones del formulario de apertura








  // guardar una renovacion
  guardarRenovacion() {
    if (!this.selectedConvenio || !this.convenioSeleccionado) {
      alert('Debe seleccionar un convenio para renovar');
      return;
    }
    if (!this.formData.antecedentesRenovacion || this.formData.antecedentesRenovacion.trim() === '') {
      alert('Debe indicar los motivos de la renovación en antecedentes');
      return;
    }

    if (this.institucionIdConvenio === 0) {
      alert('No se pudo obtener la institución del convenio. Por favor, seleccione el convenio nuevamente.');
      return;
    }

    this.guardandoRenovacion = true;

    // data para insertar las olicitud de renovacion
    const solicitudRenovacion = {
      solicitanteId: this.SOLICITANTE_ID,  // ← Tu ID quemado
      descripcion: this.formData.descripcionRenovacion || this.convenioSeleccionado.descripcion,
      tiposolicitudId: 3,  // ← RENOVACIÓN
      antecedentes: this.formData.antecedentesRenovacion.trim(),
      objetivos: '',  // ← Vacío según indicaste
      institucionId: this.institucionIdConvenio,  // ← Obtenido de la consulta
      fechacreacion: this.formatearFecha(new Date()),
      estadoId: this.ESTADO_INICIAL_ID  // ← Tu estado inicial (4 - Solicitado)
    };
    console.log('Creando solicitud renovación:', solicitudRenovacion);

    // crer solicitud

    this.api.post<any>('SolicitudConvenios/crear_SolicitudConvenios', solicitudRenovacion)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.guardandoRenovacion = false;

        if (response.exito && response.datos) {
          const solicitudId = response.datos;
          console.log('✅ Solicitud de renovación creada con ID:', solicitudId);

          this.showSuccess(` Solicitud de renovación creada exitosamente\n\nID: ${solicitudId}\nConvenio: ${this.convenioSeleccionado.codigoUcm}\n\nNota: Cuando la ORI apruebe esta solicitud, el convenio se renovará automáticamente.`);

          // Limpiar formulario
          this.limpiarFormularioRenovacion();

        } else {
          console.error('❌ Respuesta inesperada:', response);
          alert('Error: No se pudo crear la solicitud de renovación. Respuesta inesperada del servidor.');
        }
      },
      error: (error) => {
        this.guardandoRenovacion = false;
        console.error('❌ Error al crear solicitud de renovación:', error);

        let mensajeError = 'Error al crear la solicitud de renovación.';
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

    toast.success('¡Operación exitosa!', {

      description: description,

      unstyled: true,

      class: 'my-success-toast'

    });

  }

  showError(description: string = 'Ocurrió un error al procesar la solicitud') {

    toast.error('Error al procesar', {

      description: description,

      unstyled: true,

      class: 'my-error-toast'

    });

  }

}
