import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil, forkJoin, of} from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { GenericApiService } from '../../services/generic-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PostulacionTipoConsultaModel } from '../../models/PostulacionTipoModel';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { catchError, map } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-listsol-convenio',
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    SidebarComponent,
    MatIconModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './listsol-convenio.component.html',
  styleUrl: './listsol-convenio.component.css',
  providers: [ConfirmationService]
})
export class ListsolConvenioComponent implements OnInit, OnDestroy{

  // MODIFICADO 
   usuarioCache = new Map<number, { nombre: string; email: string }>(); // para traer los usuarios administradores
  


    ///// DATA DE ALEJANDRA ///////

  @Input() embebido: boolean = false;
    ///// VARIABLES DE LOS MODALES DE  //////// 
  isClosing = false;
  cardPosition = { top: 100, left: 100 };

  // Nuevas variables para Acciones
  selectedItemAcciones: any = null;
  isClosingAcciones = false;
  cardPositionAcciones = { top: 120, left: 200 };
  accionesConvenio: any[] = [];

  // Nuevas variables para Administradores
  selectedItemAdministradores: any = null;
  isClosingAdministradores = false;
  cardPositionAdministradores = { top: 120, left: 200 };
  administradoresConvenio: any[] = [];

   // MODIFICADO
   usuarioRol!: number;
   //usuarioRol: this.usuario.rolId;  // cambio

    // === FILTROS NUEVOS ===
  tipoSolicitudId: number = 0;
  estadoConvenioId: number = 0;
  institucionId: number = 0;

  // === LISTAS PARA LOS SELECTS ===
  tiposSolicitud: any[] = [];
  estadosConvenio: any[] = [];
  instituciones: any[] = [];
  solicitudesConvenio: any[] = [];
  



  //// tipo solicitud ///////
  fetchTiposSolicitud() {
    this.api.get<any>('TipoSolicitud/Consultar_TipoSolicitud')
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
        this.tiposSolicitud = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
      },
      error: (err) => { console.error('Error cargando tipos Categorias Snies', err); this.tiposSolicitud = []; }
    });
  }

  /// estados //// 
 fetchEstadosConvenio() {
  this.api.get<any>('EstadoConvenio/Consultar_EstadoConvenio')
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
      this.estadosConvenio = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
    },
    error: (err) => { console.error('Error cargando tipos Categorias Snies', err); this.estadosConvenio = []; }
  });
  }


  /// instituciones ////

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
        this.instituciones = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
      },
      error: (err) => { console.error('Error cargando tipos Categorias Snies', err); this.instituciones = []; }
    });
  }



  // solicitud completa //
  fetchSolicitudesConvenio() {
    console.log(' Iniciando fetchSolicitudesConvenio');
    this.loading = true;
    this.api.get<any>('SolicitudConvenios/Consultar_SolicitudConvenios')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (resp) => {
        console.log('Respuesta recibida:', resp);
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
        console.log('📋 Items procesados:', items);
        console.log('📊 Cantidad de items:', items.length);
        
        // Asignar directamente a solicitudesConvenio
        this.solicitudesConvenio = items;
        console.log('✅ solicitudesConvenio asignado:', this.solicitudesConvenio);
        
        // Actualizar paginación
        this.updatePagination();
        console.log('📄 pagedData después de paginación:', this.pagedData);
        console.log('🔢 Página actual:', this.currentPage, 'Total páginas:', this.totalPages);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando solicitudes convenio', err);
        this.solicitudesConvenio = [];
        this.pagedData = [];
        this.loading = false;
      }
    });
    
  }


   procesarRespuesta(resp: any) {
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
  
    return items;
  }


  // fitros ///   ///// apis para los filtros nuevos /////// 
  filterSolicitudesConvenio() {
    this.loading = true;
    console.log('🔍 Aplicando filtros...');
    console.log('  Tipo:', this.tipoSolicitudId);
    console.log('  Estado:', this.estadoConvenioId);
    console.log('  Institución:', this.institucionId);
    
    // Contar cuántos filtros están activos
    const filtrosActivos = [
      this.tipoSolicitudId && this.tipoSolicitudId !== 0,
      this.estadoConvenioId && this.estadoConvenioId !== 0,
      this.institucionId && this.institucionId !== 0
    ].filter(Boolean).length;
    
    console.log('📊 Filtros activos:', filtrosActivos);
    
    // Sin filtros → cargar todo
    if (filtrosActivos === 0) {
      console.log('⚠️ Sin filtros, cargando todo...');
      this.fetchSolicitudesConvenio();
      return;
    }
    
    // UN SOLO FILTRO → usar endpoint específico
    if (filtrosActivos === 1) {
      console.log('✅ Un filtro, usando endpoint específico');
      this.aplicarFiltroSimple();
      return;
    }
    
    // MÚLTIPLES FILTROS → cargar todo y filtrar localmente
    console.log('✅ Múltiples filtros, filtrando localmente');
    this.aplicarFiltrosMultiples();
  }
  
  // Aplicar un solo filtro (usa el endpoint específico)
  private aplicarFiltroSimple() {
    let url = '';
    
    if (this.tipoSolicitudId && this.tipoSolicitudId !== 0) {
      url = `SolicitudConvenios/Consultar_SolicitudConveniosTipo?TipoSolicitudId=${this.tipoSolicitudId}`;
      console.log('📌 Filtrando por TIPO');
    } else if (this.estadoConvenioId && this.estadoConvenioId !== 0) {
      url = `SolicitudConvenios/Consultar_SolicitudConveniosEstado?IdEstado=${this.estadoConvenioId}`;
      console.log('📌 Filtrando por ESTADO');
    } else if (this.institucionId && this.institucionId !== 0) {
      url = `SolicitudConvenios/Consultar_SolicitudConveniosInstitucion?IdInstitucion=${this.institucionId}`;
      console.log('📌 Filtrando por INSTITUCIÓN');
    }
    
    console.log('🌐 URL:', url);
    
    this.api.get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const items = this.procesarRespuesta(resp);
          console.log('✅ Items recibidos:', items.length);
          
          this.solicitudesConvenio = items;
          this.currentPage = 1;
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error aplicando filtro simple', err);
          this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_FILTRO'));
          this.solicitudesConvenio = [];
          this.pagedData = [];
          this.loading = false;
        }
      });
  }
  
  // Aplicar múltiples filtros (carga todo y filtra en frontend)
  private aplicarFiltrosMultiples() {
    console.log('📥 Cargando todos los datos para filtrar localmente...');
    
    this.api.get<any>('SolicitudConvenios/Consultar_SolicitudConvenios')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items = this.procesarRespuesta(resp);
          console.log('📦 Items totales antes de filtrar:', items.length);
          
          // DEBUG: Ver estructura de un item
          if (items.length > 0) {
            console.log('🔍 Ejemplo de item:', items[0]);
          }
          
          // Aplicar filtros locales
          items = this.aplicarFiltrosLocales(items);
          console.log('✅ Items después de filtrar:', items.length);
          
          this.solicitudesConvenio = items;
          this.currentPage = 1;
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error aplicando filtros múltiples', err);
          this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_FILTROS'));
          this.solicitudesConvenio = [];
          this.pagedData = [];
          this.loading = false;
        }
      });
  }
  
  // Filtrar en el frontend
  aplicarFiltrosLocales(items: any[]): any[] {
    let resultado = [...items];
    
    // Filtrar por tipo
    if (this.tipoSolicitudId && this.tipoSolicitudId !== 0) {
      console.log('  🔸 Aplicando filtro TIPO:', this.tipoSolicitudId);
      resultado = resultado.filter(item => {
        // IMPORTANTE: Verifica el nombre correcto de la propiedad
        // Puede ser: tipoSolicitudId, tipoId, tipo_id, etc.
        return item.tipoSolicitudId === this.tipoSolicitudId;
      });
      console.log('Quedan:', resultado.length);
    }
    
    // Filtrar por estado
    if (this.estadoConvenioId && this.estadoConvenioId !== 0) {
      console.log('  🔸 Aplicando filtro ESTADO:', this.estadoConvenioId);
      resultado = resultado.filter(item => {
        // IMPORTANTE: Verifica el nombre correcto de la propiedad
        // Puede ser: estadoId, estadoConvenioId, estado_id, etc.
        return item.estadoId === this.estadoConvenioId;
      });
      console.log('    → Quedan:', resultado.length);
    }
    
    // Filtrar por institución
    if (this.institucionId && this.institucionId !== 0) {
      console.log('  🔸 Aplicando filtro INSTITUCIÓN:', this.institucionId);
      resultado = resultado.filter(item => {
        // IMPORTANTE: Verifica el nombre correcto de la propiedad
        // Puede ser: institucionId, institucion_id, etc.
        return item.institucionId === this.institucionId;
      });
      console.log('Quedan:', resultado.length);
    }
    
    return resultado;
  }

 /// abrir modal de acciones de convenio 
  abrirModalAccionesConvenio(item: any) {
    this.selectedItemAcciones = item;
    this.isClosingAcciones = false;
    
    // Cargar acciones desde el backend
    this.api.get<any>(`Accion/Consultar_AccionSolicitudEspecifico?Id=${item.id}`)
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
        this.accionesConvenio = items.map(a => ({
          id: Number(a.id),
          idsolicitud:Number(a.solicitudconId),
          descripcion: a.descripcion,
          responsable:a.responsableId,
          fecha_ini:a.fechainicio,
          fecha_fin:a.fechafin,
          aprobado: Boolean(a.estadoaccionId)
        }));
      },
      error: (err) => {
        console.error('Error cargando acciones convenio', err);
        this.accionesConvenio = [];
        this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_ACCIONES'));
      }
    });
   
  }
  
  // cerrar tarjeta de acciones
  closeCardAcciones() {
    this.isClosingAcciones = true;
    setTimeout(() => {
      this.selectedItemAcciones = null;
      this.isClosingAcciones = false;
    }, 300);
  }

  puedeEditarAcciones(): boolean {
    return this.usuarioRol === 7;
  }

/*
  // acciones del modal
  guardarAcciones() { // revisar este guardar acciones 
    // acciones actualziadas 
    const body = {
      solicitudId: this.selectedItemAcciones.id,
      acciones: this.accionesConvenio
    };
  
    this.api.post<any>('Accion/actualiza_AccionSolicitud', body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.showSuccess(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ACCIONES_GUARDADAS'));
          this.closeCardAcciones();
        },
        error: (err) => {
          console.error('Error guardando acciones', err);
          this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_GUARDAR_ACCIONES'));
        }
      });
  }
*/

  actualizarAccionEstado(accion: any) {
    const body = {
      id: Number(accion.id),
      solicitudconId: Number(accion.idsolicitud),      // viene de tu mapeo: idsolicitud
      descripcion: accion.descripcion,
      responsableId: Number(accion.responsable),       // viene de tu mapeo: responsable
      fechainicio: accion.fecha_ini,                   // viene de tu mapeo: fecha_ini
      fechafin: accion.fecha_fin,                      // viene de tu mapeo: fecha_fin
      estadoaccionId: Boolean(accion.aprobado)          // lo que cambió el switch
    };
  
    this.api.put<any>('Accion/actualiza_AccionSolicitud', body)  // ✅ cambia a tu ruta real
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ACCIONES_GUARDADAS'));
        },
        error: (err) => {
          console.error('Error actualizando acción', err);
          this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_GUARDAR_ACCIONES'));
          // Revertir el switch si falla
          accion.aprobado = !accion.aprobado;
        }
      });
  }
  


  // MODIFICADO
  
  /// funcion para tarer el nombre del usuario 
  fetchNombreUsuario(usuarioId: number){
    
    const url = `orisiga/nombrestudiante/?idestudiante=${usuarioId}`;

    // Cache
    const cached = this.usuarioCache.get(usuarioId);
    if (cached) return of(cached);
  
    return this.api.getExterno<any>(url).pipe(
      map((resp) => {
        // Resp viene como arreglo: [ { identificacion, nombre, correo } ]
        const arr = Array.isArray(resp) ? resp : (Array.isArray(resp?.data) ? resp.data : []);
        const first = arr?.[0];
  
        const detalle = {
          nombre: first?.nombre ?? 'No disponible',
          email: first?.correo ?? 'No disponible'
        };
  
        this.usuarioCache.set(usuarioId, detalle);
        return detalle;
      }),
      catchError((err) => {
        console.error('Error consultando nombre/correo en ORISIGA:', usuarioId, err);
        const fallback = { nombre: 'No disponible', email: 'No disponible' };
        this.usuarioCache.set(usuarioId, fallback);
        return of(fallback);
      })
    );
  }

  
// MODIFICADO 
  // ========== MODAL ADMINISTRADORES ==========
  abrirModalAdministradores(item: any) {
    this.usuarioCache.clear();
    console.log('🔑 Propiedades disponibles:', Object.keys(item));
    this.selectedItemAdministradores = item;
    this.isClosingAdministradores = false;
    
    this.api.get<any>(`Administrador/Consultar_AdministradoresConveniosGeneral?SolicitudDescripcion=${item.descripcion}`)
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
      
        // Base con documento (usuarioId)
        const baseAdmins = items.map(a => ({
          id: Number(a.id),
          documento: Number(a.usuarioId)
        }));
      
        if (baseAdmins.length === 0) {
          this.administradoresConvenio = [];
          return;
        }
      
        // Consultar ORISIGA por cada documento 
        const requests = baseAdmins.map(admin =>
          this.fetchNombreUsuario(admin.documento).pipe(
            map(det => ({
              id: admin.id,
              documento: admin.documento,
              nombre: det.nombre,
              email: det.email
            }))
          )
        );
      
        forkJoin(requests)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (adminsEnriquecidos) => {
              this.administradoresConvenio = adminsEnriquecidos;
            },
            error: (err) => {
              console.error('Error enriqueciendo administradores (forkJoin)', err);
              this.administradoresConvenio = baseAdmins.map(a => ({
                ...a,
                nombre: 'No disponible',
                email: 'No disponible'
              }));
            }
          });
      },      
      error: (err) => {
        console.error('Error cargando administradores', err);
        this.administradoresConvenio = [];
        this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_ADMINISTRADORES'));
      }
    });
  }

  // cerrar modal de administradores
  closeCardAdministradores() {
    this.isClosingAdministradores = true;
    setTimeout(() => {
      this.selectedItemAdministradores = null;
      this.isClosingAdministradores = false;
    }, 300);
  }

  agregarAdministrador() {
    // Aquí puedes implementar un formulario o abrir otra tarjeta
    console.log('Agregar administrador');
    // Ejemplo: podrías usar un SweetAlert2 o un dialog de PrimeNG
  }


  // elimianr administradores no se si esto sea necesario
  eliminarAdministrador(admin: any) {
    /*
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar a ${admin.nombre} como administrador?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.convenioService.eliminarAdministrador(
          this.selectedItemAdministradores.id,
          admin.id
        ).subscribe({
          next: () => {
            this.toast('Administrador eliminado', 'success');
            // Recargar la lista
            this.abrirModalAdministradores(this.selectedItemAdministradores);
          },
          error: (err) => {
            this.toast('Error al eliminar administrador', 'error');
            console.error(err);
          }
        });
      }
    });
    */
  }

  // ========== APROBAR/RECHAZAR ==========  debo modificar el body  // cambio
  aprobarSolicitud(solicitud: any) {
    const nuevoEstado = 6;
    
    this.confirmationService.confirm({
      message: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.APROBAR'),
      header: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.HEADER_APROBAR'),
      icon: 'pi pi-check-circle custom-confirm-icon',
      acceptLabel: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.BTN_APROBAR'),
      rejectLabel: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.BTN_CANCELAR'),
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'custom-accept-btn',
      rejectButtonStyleClass: 'custom-reject-btn',
      defaultFocus: 'reject',
      accept: () => {
        const body = {
          id:solicitud.id,
          solicitanteId:solicitud.solicitanteId,
          descripcion: solicitud.descripcion,
          tiposolicitudId: solicitud.tiposolicitudId,
          antecedentes: solicitud.antecedentes,
          objetivos: solicitud.objetivos,
          institucionId: solicitud.institucionId,
          fechacreacion: solicitud.fechacreacion,
          estadoId:nuevoEstado
        };
  
        this.api.put<any>('SolicitudConvenios/actualiza_SolicitudConvenios', body)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp) => {
              this.showSuccess(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.APROBADO'));
              this.fetchSolicitudesConvenio();
            },
            error: (err) => {
              console.error('Error aprobando solicitud', err);
              this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_APROBAR'));
            }
          });
      }
    });
  }

  rechazarSolicitud(solicitud: any) {  // cambio
    const nuevoEstado = 10;
    
    this.confirmationService.confirm({
      message: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.RECHAZAR'),
      header: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.HEADER_RECHAZAR'),
      icon: 'pi pi-times-circle custom-confirm-icon',
      acceptLabel:  this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.BTN_RECHAZAR'),
      rejectLabel: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.BTN_CANCELAR'),
      acceptIcon: 'pi pi-times',
      rejectIcon: 'pi pi-ban',
      acceptButtonStyleClass: 'custom-reject-btn', // Botón rojo para rechazar
      rejectButtonStyleClass: 'custom-accept-btn',
      defaultFocus: 'reject',
      accept: () => {
        const body = {
          id:solicitud.id,
          solicitanteId:solicitud.solicitanteId,
          descripcion: solicitud.descripcion,
          tiposolicitudId: solicitud.tiposolicitudId,
          antecedentes: solicitud.antecedentes,
          objetivos: solicitud.objetivos,
          institucionId: solicitud.institucionId,
          fechacreacion: solicitud.fechacreacion,
          estadoId:nuevoEstado
        };
  
        this.api.put<any>('SolicitudConvenios/actualiza_SolicitudConvenios', body)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp) => {
              this.showWarning(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.RECHAZADO'));
              this.fetchSolicitudesConvenio();
            },
            error: (err) => {
              console.error('Error rechazando solicitud', err);
              this.showError(this.translate.instant('SOLICITUDES_CONVENIO.MENSAJES.ERROR_RECHAZAR'));
            }
          });
      }
    });
  }

  



  //////////////////////////////// DATA DE ALEJANDRA ///////////////////////////////////////////////
  //data: PostulacionTipoConsultaModel[] = [];
  //filteredData: PostulacionTipoConsultaModel[] = [];
  pagedData: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';
  fechaInicial: string = '';
  fechaFinal: string = '';
  estadoId: number = 0;
  tipoMovilidadIdId: number = 0;

  model: PostulacionTipoConsultaModel = new PostulacionTipoConsultaModel();
  isEditing = false;

  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();
  estados: any[] = [];
  tipoMovilidad: any[] = [];
  convocatoriaId: any;

  selectedItem: any = null; // esta se usaba para el anterior modal 


  nombreCombocatoria: any;
  idConvocatoria: any;

  @Input() tipoPostulacion: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private translate: TranslateService
  ) {}

 

  ngOnInit(): void {
    // MODIFICADO
    
    const usuarioLS = localStorage.getItem('usuario');

    if (usuarioLS) {
      const usuario = JSON.parse(usuarioLS);
      this.usuarioRol = usuario.rolId;
    }

    //this.fetchPostulaciones();
    //this.fetchListaEstados();
    //this.fetchListaTipoMovilidad();


    //// los fetch para convenios 
    this.fetchTiposSolicitud();
    this.fetchEstadosConvenio();
    this.fetchInstituciones();
    this.fetchSolicitudesConvenio()
  }


  // MODIFICADO
  esOriInterno(): boolean {
    return this.usuarioRol === 7; // ajusta al ID real
  }
  ngOnDestroy(): void {
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  //MODIFICADO tarer los nombres de todo el listado 
  private cargarNombresSolicitantesDePagina() {
    if (!Array.isArray(this.pagedData) || this.pagedData.length === 0) return;
  
    // ids únicos de la página actual
    const ids = Array.from(
      new Set(
        this.pagedData
          .map(x => Number(x?.solicitanteId))
          .filter(id => Number.isFinite(id) && id > 0)
      )
    );
  
    // solo los que NO estén en cache
    const pendientes = ids.filter(id => !this.usuarioCache.has(id));
  
    if (pendientes.length === 0) return;
  
    const requests = pendientes.map(id =>
      this.fetchNombreUsuario(id).pipe(
        map(det => ({ id, nombre: det.nombre }))
      )
    );
  
    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultados) => {
          // Ya se guardaron en cache dentro de fetchNombreUsuario
          // Esto solo fuerza el refresh visual
          resultados.forEach(r => {
            if (!r.nombre) {
              this.usuarioCache.set(r.id, { nombre: String(r.id), email: '' });
            }
          });
        },
        error: (err) => {
          console.error('Error batch cargando nombres de solicitantes', err);
        }
      });
  }
  



 /// borre fetchpostulaciones
 //borre filter postulaciones
// borre reset form 
  



  // ---------- Paginación ----------
  updatePagination() {
    // Calcular total de páginas
    const totalItems = Array.isArray(this.solicitudesConvenio) 
      ? this.solicitudesConvenio.length 
      : 0;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    
    // Actualizar datos paginados
    this.updatePagedData();
  }

  updatePagedData() {
    if (!Array.isArray(this.solicitudesConvenio)) {
      this.pagedData = [];
      return;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.solicitudesConvenio.slice(start, start + this.pageSize);
    //MODIFICADO AÑADIR FUNCION 
    this.cargarNombresSolicitantesDePagina();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedData();
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = +select.value;
    this.currentPage = 1;
    this.updatePagination();
  }

  // ---------- Toasters / Confirm ----------
  showSuccess(description: string = 'Operación completada correctamente') {
    toast.success(this.translate.instant('SOLICITUDES_CONVENIO.TOASTS.EXITO'), {
      description: description,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(description: string = 'Ocurrió un error al procesar la solicitud') {
    toast.error(this.translate.instant('SOLICITUDES_CONVENIO.TOASTS.ERROR'), {
      description: description,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('SOLICITUDES_CONVENIO.TOASTS.WARNING'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel:  this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.BTN_CONFIRMAR'),
        rejectLabel:  this.translate.instant('SOLICITUDES_CONVENIO.CONFIRM.BTN_CANCELAR'),
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonStyleClass: 'custom-accept-btn',
        rejectButtonStyleClass: 'custom-reject-btn',
        defaultFocus: 'reject',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  
  /// borre lista estados 

    
  

  trackBySolicitudId(index: number, item: any): any {
    return item?.id ?? index;
  }


  closeCard() {
    this.isClosing = true;

    setTimeout(() => {
      this.selectedItem = null;
      this.isClosing = false;
    }, 400);
  }

  goBack() {
    this.location.back();
  }
}
