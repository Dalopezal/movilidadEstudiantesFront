import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { GenericApiService } from '../../services/generic-api.service';
import { Subject, takeUntil, Observable, throwError} from 'rxjs';
import { map, switchMap, concatMap, toArray, catchError, finalize } from 'rxjs/operators';
//import { NgxSonnerToaster } from 'ngx-sonner';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {ListsolConvenioComponent} from '../listsol-convenio/listsol-convenio.component'

//import { ConvenioModel } from '../../models/ConvenioModel';
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
    ListsolConvenioComponent,
    TranslateModule
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
  private storageHandler = this.onStorageChange.bind(this);

  // ID QUEMADO temporalmente (cambiar cuando tengamos el id del usuario logueado)
  //readonly SOLICITANTE_ID = 1053825186;  // ← ID quemado del solicitante
  readonly ESTADO_INICIAL_ID = 4;
  //readonly ADMIN_INTERNO_ID = 1053825186;  // ← ID quemado del admin interno (usuario UCM)


  // MODIFICADO
  private get usuarioId(): number {
    // soporta varios posibles nombres por si cambia el storage
    const raw =
      this.usuario?.idUsuario ??
      this.usuario?.id ??
      this.usuario?.identificacion;
  
    return Number(raw) || 0;
  }


 //MODIFICADO
  // Array para almacenar múltiples acciones
  acciones: Accion[] = [
    {
     
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      responsableId: this.usuarioId, //asignado temporalmente
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
   
//MODIFICADO
  formData = {
    institucion: '',
    antecedentes:'',
    objetivos:'',
    nombrecol:'',
    nombreext:'',
    cargo:'',
    correo:'',
    codigoRenovacion: '',
    tipoConvenio:null as number | null,
    fechaInicioRenovacion: '',
    fechaFinRenovacion: '',
    antecedentesRenovacion: '',
    ClasConvenio:null as number | null,
    tipoactividad:null as number | null,
    CategoriaSnies:null as number | null,
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
  
  constructor(private api: GenericApiService, private confirmationService: ConfirmationService,private translate: TranslateService) {}

  ngOnInit() {

    //MODIFICADO
    // para el usuario 
    window.addEventListener("storage", this.storageHandler);
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
    // MODIFICADO
    this.acciones = [{
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      responsableId: this.usuarioId
    }];

    
   
  }

  //MODIFICADO
  /// para el onstorage cargar variables del navegador 
  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }

  ngOnDestroy() {
    //MODIFICADO
    window.removeEventListener("storage", this.storageHandler);
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
    }else {
      this.actualizarDescripcionInstitucionNueva();
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
          this.actualizarDescripcionInstitucionNueva();
          
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
      responsableId: this.usuarioId
    };
    this.acciones.push(nuevaAccion);
  }

  eliminarAccion(index: number): void {
    if (this.acciones.length > 1) {
      this.acciones.splice(index, 1);
    } else {
      this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.MIN_ACCION'));
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
      this.formData.tipoConvenio = null;
      this.formData.fechaInicioRenovacion = '';
      this.formData.fechaFinRenovacion = '';
      this.formData.antecedentesRenovacion = '';
    }
  }


  onCiudadChange() {
    console.log('cambio ciudad');
    this.actualizarDescripcionInstitucionNueva();
  }

  // MODIFICADO
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
              this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.WARN_ID_INSTITUCION'));
            }
          } else {
            console.warn(' No se encontró la institución del convenio');
            this.institucionIdConvenio = 0;
            this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.WARN_NO_INSTITUCION'));
          }
        },
        error: (error) => {
          console.error(' Error al consultar institución:', error);
          this.institucionIdConvenio = 0;
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_CONSULTAR_INSTITUCION'));
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

  //MODIFICADO
  
  // vaidar los pasos del formulario 
  validarPasoActual(): boolean {
    switch (this.pasoActual) {
      case 0: // Institución
        if (!this.selectedInstitucion) {
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.SELECCIONE_INSTITUCION'));
          return false;
        }
        break;
      
      case 1: // Antecedentes y Objetivos
        if (!this.formData.antecedentes || !this.formData.objetivos) {
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.COMPLETE_ANTECEDENTES'));
          return false;
        }
        break;
      
      case 2: // Acciones
        const accionesValidas = this.acciones.filter(
          a => a.descripcion.trim() !== '' && a.fechaInicio && a.fechaFin
        );
        if (accionesValidas.length === 0) {
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.MIN_ACCION'));
          return false;
        }
        break;
      
      case 3: // Administradores
        
        // Validar admin externo solo si está marcado el checkbox
        if (this.tieneAdminExterno) {
          if (!this.administradorExterno.nombre || 
              !this.administradorExterno.cargo || 
              !this.administradorExterno.correo) {
            this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.COMPLETE_ADMIN_EXTERNO'));
            return false;
          }
          
          // Validar email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(this.administradorExterno.correo)) {
            this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.EMAIL_INVALIDO'));
            return false;
          }
        }
        break;
    }
    return true;
  }


// MODIFICADO
  // funcion para crear usuarios
   crearUsuarioExterno$(): Observable<number> {
    const payload = {
      nombre: this.administradorExterno.nombre,
      cargo: this.administradorExterno.cargo,
      correo: this.administradorExterno.correo,
      procod:"RELII",
      rolmovilidadid:4
      
    };
    return this.api.post<any>('oriusaurios/crearexterno/', payload).pipe(
      map((resp) => {
        const idNum = Number(resp?.id);
        if (!idNum) throw new Error('No se pudo obtener el ID del usuario externo');
        return idNum;
      })
    );
  }


  // MODIFICADO AGREAGAR institucion nueva
   actualizarDescripcionInstitucionNueva(): void {
    if (this.selectedInstitucion !== 'nueva') return;
  
    const paisId = Number(this.selectedPais);
    const paisNombre =this.paises.find(p => p.id === paisId)?.nombre || '—';
    const ciudadId = Number(this.selectedCiudad);
    const ciudadNombre =this.ciudades.find(c => c.id === ciudadId)?.nombre || '—';
    
    //const ciudadNombre = this.ciudades.find(c => c.id === this.selectedCiudad)?.nombre || '';
  
    const infoInstitucion = `Institución no registrada:
    Nombre: ${this.formData.institucion || '—'}
    País: ${paisNombre || '—'}
    Ciudad: ${ciudadNombre || '—'}
    `.trim();
  
    // Parte base de la descripción (lo que el usuario escribió antes)
    let baseDescripcion = this.formData.descripcion
      ?.split('Institución no registrada:')[0]
      ?.trim();
    
    // 2. LIMPIEZA: Si termina en guion, lo quitamos
    if (baseDescripcion?.endsWith('-')){
        baseDescripcion = baseDescripcion.slice(0, -1).trim(); 
      // .slice(0, -1) borra el último caracter. 
      // .trim() asegura que no queden espacios extra.
    }

    this.formData.descripcion = baseDescripcion
      ? `${baseDescripcion}-${infoInstitucion}\n`
      : infoInstitucion;
  }
  


  

  // guardar el formulario de solicitud de apertura  
  guardar(form: NgForm): void {
    console.log("guardar");
    if (!form.valid) {
      this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.COMPLETE_CAMPOS'));
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
    // cambio
    const solicitudData = {
      solicitanteId: this.usuarioId,
      descripcion: this.formData.descripcion,
      tiposolicitudId: tipoSolicitudId,
      antecedentes: this.formData.antecedentes,
      objetivos: this.formData.objetivos,
      institucionId: this.selectedInstitucion === 'nueva'? null: parseInt(this.selectedInstitucion),
      fechacreacion: this.formatearFecha(new Date()),
      estadoId: this.ESTADO_INICIAL_ID
    };

    console.log('📝 1. Creando solicitud:', solicitudData);

    this.api.post<any>('SolicitudConvenios/crear_SolicitudConvenios', solicitudData)
      .pipe(takeUntil(this.destroy$))
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
            this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_CREAR'));
          }
        },
        error: (error) => {
          console.error('❌ Error al crear solicitud:', error);
          this.guardando = false;
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_CREAR')); // cambio 
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
      this.api.post<any>('Accion/crear_AccionSolicitud', accion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  // MODIFICADO

  // ============================================
  // PASO 3: GUARDAR ADMINISTRADORES
  // ============================================
  private guardarAdministradores(solicitudId: number): void {

    // 1) Payload admin interno (SIEMPRE)
    const adminInterno = {
      solicitudId: solicitudId,
      usuarioId: this.usuarioId
    };
  
    // 2) Guardar admin interno
    this.api.post<any>('Administrador/crear_AdministradoresConvenios', adminInterno)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respInterno) => {
          console.log('✅ Administrador interno guardado:', respInterno);
  
          // 3) Si NO hay admin externo → terminar
          if (!this.tieneAdminExterno) {
            this.finalizarGuardado(solicitudId);
            return;
          }
  
          // 4) Si SÍ hay admin externo → crear usuario externo y luego guardar admin externo
          this.crearUsuarioExterno$() // 👈 tu función existente que retorna el ID
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (usuarioExternoId: number) => {
                if (!usuarioExternoId) {
                  this.guardando = false;
                  this.showError('No se pudo obtener el ID del usuario externo');
                  return;
                }
  
                const adminExterno = {
                  solicitudId: solicitudId,
                  usuarioId: usuarioExternoId,
                  desripcionSolicitud: 'SIN DESCRIPCION'
                };
  
                this.api.post<any>('Administrador/crear_AdministradoresConvenios', adminExterno)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: (respExterno) => {
                      console.log('✅ Administrador externo guardado:', respExterno);
                      this.finalizarGuardado(solicitudId);
                    },
                    error: (errorExterno) => {
                      console.error('❌ Error al guardar administrador externo:', errorExterno);
                      this.guardando = false;
                      this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ADMINS'));
                    }
                  });
              },
              error: (errorCrearUsuario) => {
                console.error('❌ Error al crear usuario externo:', errorCrearUsuario);
                this.guardando = false;
                this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ADMINS'));
              }
            });
        },
        error: (errorInterno) => {
          console.error('❌ Error al guardar administrador interno:', errorInterno);
          this.guardando = false;
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ADMINS'));
        }
      });
  }

  private finalizarGuardado(solicitudId: number): void { //cambio
    this.guardando = false;
    console.log('🎉 Proceso completado exitosamente');
    this.showSuccess(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.EXITO_CREAR', { id: solicitudId }));
    
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
      tipoConvenio: null,
      fechaInicioRenovacion: '',
      fechaFinRenovacion: '',
      antecedentesRenovacion: '',
      ClasConvenio:null,
      tipoactividad:null,
      CategoriaSnies:null,
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
      this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.SELECCIONE_CONVENIO_RENOVAR'));
      return;
    }
    if (!this.formData.antecedentesRenovacion || this.formData.antecedentesRenovacion.trim() === '') {
      this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.MOTIVOS_RENOVACION'));
      return;
    }
  
    if (this.institucionIdConvenio === 0) {
      this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_ID_INSTITUCION'));
      return;
    }

    this.guardandoRenovacion = true;

    // data para insertar las solicitud de renovacion 
    const solicitudRenovacion = {
      solicitanteId: this.usuarioId,  // 
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
          
          this.showSuccess(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.EXITO_RENOVACION', {
            id: solicitudId,
            codigo: this.convenioSeleccionado.codigoUcm
          }));
          
          // Limpiar formulario
          this.limpiarFormularioRenovacion();
          
        } else {
          console.error('❌ Respuesta inesperada:', response);
          this.showError(this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_RENOVACION'));
        }
      },
      error: (error) => {
        this.guardandoRenovacion = false;
        console.error('❌ Error al crear solicitud de renovación:', error);
        
        let mensajeError = this.translate.instant('SOLICITUD_CONVENIO.MENSAJES.ERROR_RENOVACION');
        if (error.error && error.error.mensaje) {
          mensajeError += `\n${error.error.mensaje}`;
        }
        
        this.showError(mensajeError);
      }
    });
    
  }

  limpiarFormularioRenovacion(): void {
    this.selectedConvenio = null;
    this.convenioSeleccionado = null;
    this.institucionIdConvenio = 0;
    
    this.formData.codigoRenovacion = '';
    this.formData.tipoConvenio = null;
    this.formData.fechaInicioRenovacion = '';
    this.formData.fechaFinRenovacion = '';
    this.formData.antecedentesRenovacion = '';
    this.formData.ClasConvenio = null;
    this.formData.tipoactividad = null;
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
