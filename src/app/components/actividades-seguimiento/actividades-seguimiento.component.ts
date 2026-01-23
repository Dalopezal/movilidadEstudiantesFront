import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConfirmationService } from 'primeng/api';
import { ActividadSeguimientoModel } from '../../models/ActividadSeguimientoModel';
import { GenericApiService } from '../../services/generic-api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-actividades-seguimiento',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    TranslateModule
  ],
  templateUrl: './actividades-seguimiento.component.html',
  styleUrls: ['./actividades-seguimiento.component.css'],
  providers: [ConfirmationService]
})
export class ActividadesSeguimientoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ====== Flags ======
  loading = false;
  loadingTable = false;
  loadingModal = false;

  // ====== Filtros del bloque superior ======
  filtro = {
    planId: null as number | null,
    estrategiaId: null as number | null,
    institucionId: null as number | null,
    programaUCM: null as string | null,
    componenteCodigoUCM: null as string | null
  };

  filtroTexto = '';

  // ====== Listas para selects ======
  planeaciones: any[] = [];
  estrategias: any[] = [];
  instituciones: any[] = [];
  programasUCM: any[] = [];
  componentesUCM: any[] = [];

  // ====== Datos tabla ======
  data: ActividadSeguimientoModel[] = [];
  pagedData: ActividadSeguimientoModel[] = [];

  // ====== Paginador ======
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];
  totalPages = 0;
  pages: number[] = [];

  // ====== Modal ======
  modalVisible = false;
  isEditing = false;
  actividad: ActividadSeguimientoModel = new ActividadSeguimientoModel();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.cargarCombos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================== CARGA DE COMBOS ==================

  cargarCombos(): void {
    // Planeación - Consultar Planeaciones
    this.api
      .get<any>('Planeacion/Consultar_Planeacion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.planeaciones = this.extraerLista(resp);
        },
        error: (err) => {
          console.error('Error al cargar planeaciones', err);
          this.planeaciones = [];
          this.showError(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CARGAR_PLANEACIONES'));
        }
      });

    // Estrategia
    this.api
      .get<any>('Estrategia/Consultar_Estrategias')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.estrategias = this.extraerLista(resp);
        },
        error: (err) => {
          console.error('Error al cargar estrategias', err);
          this.estrategias = [];
          this.showError(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CARGAR_ESTRATEGIAS'));
        }
      });

    // Institución
    this.api
      .get<any>('Institucion/Consultar_Institucion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.instituciones = this.extraerLista(resp);
        },
        error: (err) => {
          console.error('Error al cargar instituciones', err);
          this.instituciones = [];
          this.showError(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CARGAR_INSTITUCIONES'));
        }
      });

    // Programas - ConsultaAsignacionPrograma
    this.api
      .getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const lista = this.extraerLista(resp);
          const seen = new Set<string>();
          this.programasUCM = lista.filter((x: any) => {
            const cod = x.programa?.codigo;
            if (!cod || seen.has(cod)) return false;
            seen.add(cod);
            return true;
          });
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.programasUCM = [];
          this.showError(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CARGAR_PROGRAMAS'));
        }
      });

    // Componentes (del mismo endpoint, filtrando códigos únicos)
    this.api
      .getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const lista = this.extraerLista(resp);
          const seen = new Set<string>();
          this.componentesUCM = lista.filter((x: any) => {
            const cod = x.componenteCodigoUCM ?? x.componente_codigo;
            if (!cod || seen.has(cod)) return false;
            seen.add(cod);
            return true;
          });
        },
        error: (err) => {
          console.error('Error al cargar componentes', err);
          this.componentesUCM = [];
          this.showError(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CARGAR_COMPONENTES'));
        }
      });
  }

  private extraerLista(resp: any): any[] {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (resp.datos && Array.isArray(resp.datos)) return resp.datos;
    if (resp.data && Array.isArray(resp.data)) return resp.data;
    if (resp.items && Array.isArray(resp.items)) return resp.items;
    const arr = Object.values(resp ?? {}).find((v) => Array.isArray(v));
    return Array.isArray(arr) ? arr : [];
  }

  // ================== BUSCAR ACTIVIDADES ==================

  onBuscarActividades(form: NgForm): void {
    if (form.invalid) {
      this.showWarning(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.COMPLETE_FILTROS'));
      return;
    }

    const params: any = {
      PlaneacionId: this.filtro.planId,
      EstrategiaId: this.filtro.estrategiaId,
      InstitucionId: this.filtro.institucionId,
      Programa: this.filtro.programaUCM,
      ComponenteNombre: this.filtro.componenteCodigoUCM
    };

    this.loadingTable = true;

    this.api
      .get<any>('Actividad/Consulta_ActividadesSeguimiento', params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const lista = this.extraerLista(resp);
          this.data = lista.map((x: any) =>
            ActividadSeguimientoModel.fromJSON
              ? ActividadSeguimientoModel.fromJSON(x)
              : Object.assign(new ActividadSeguimientoModel(), x)
          );

          this.loadingTable = false;
          this.currentPage = 1;
          this.actualizarPaginacion();

          if (!this.data.length) {
            this.showWarning(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.NO_ACTIVIDADES_FILTROS'));
          } else {
            this.showSuccess(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ACTIVIDADES_CARGADAS'));
          }
        },
        error: (err) => {
          console.error('Error al consultar las actividades', err);
          this.loadingTable = false;
          this.data = [];
          this.pagedData = [];
          this.actualizarPaginacion();
          this.showError(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CONSULTAR_ACTIVIDADES'));
        }
      });
  }

  recargarTabla(): void {
    if (
      !this.filtro.planId &&
      !this.filtro.estrategiaId &&
      !this.filtro.institucionId &&
      !this.filtro.programaUCM &&
      !this.filtro.componenteCodigoUCM
    ) {
      this.showWarning(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.SELECCIONE_FILTRO_RECARGAR'));
      return;
    }
    const dummyForm = { invalid: false } as NgForm;
    this.onBuscarActividades(dummyForm);
  }

  aplicarFiltroTexto(): void {
    this.currentPage = 1;
    this.actualizarPaginacion();
  }

  // ================== MODAL ==================

  openModalCrear(): void {
    this.isEditing = false;
    this.actividad = new ActividadSeguimientoModel(
      0,
      null,
      null,
      null,
      null,
      '',
      '',
      this.filtro.planId,
      this.filtro.estrategiaId,
      this.filtro.institucionId,
      this.filtro.programaUCM,
      this.filtro.componenteCodigoUCM,
      null,
      null,
      null
    );
    this.modalVisible = true;
  }

  openModalEditar(item: ActividadSeguimientoModel): void {
    this.isEditing = true;
    this.actividad = new ActividadSeguimientoModel(
      item.id,
      item.fechainicio,
      item.fechafin,
      item.asignacionComponenteId,
      item.evaluacion,
      item.descripcion,
      item.herramientas,
      item.planId,
      item.estrategiaId,
      item.institucionId,
      item.programaUCM,
      item.componenteCodigoUCM,
      item.nombreComponenteUCM,
      item.institucionNombre,
      item.planTitulo
    );
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.actividad = new ActividadSeguimientoModel();
  }

  onSubmitActividad(form: NgForm): void {
    if (form.invalid) {
      this.showWarning(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.COMPLETE_CAMPOS_ACTIVIDAD'));
      form.control.markAllAsTouched();
      return;
    }

    this.loadingModal = true;
    const payload = this.actividad.toJSON();

    const esUpdate = this.isEditing && this.actividad.id && this.actividad.id > 0;
    const endpoint = esUpdate
      ? 'Actividad/actualiza_Actividades'
      : 'Actividad/crear_Actividades';

    const obs = esUpdate
      ? this.api.put<any>(endpoint, payload)
      : this.api.post<any>(endpoint, payload);

    obs
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingModal = false;
          this.closeModal();
          this.recargarTabla();

          if (response?.exito && response?.datos) {
            this.showSuccess(response.exito);
          } else if (response?.error && response?.datos === false) {
            this.showError(response.error);
          } else {
            this.showSuccess(
              esUpdate
                ? this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ACTIVIDAD_ACTUALIZADA')
                : this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ACTIVIDAD_CREADA')
            );
          }
        },
        error: (err) => {
          console.error(esUpdate ? 'Error al actualizar actividad' : 'Error al crear actividad', err);
          this.loadingModal = false;
          this.showError(
            esUpdate
              ? this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_ACTUALIZAR_ACTIVIDAD')
              : this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_CREAR_ACTIVIDAD')
          );
        }
      });
  }

  // ================== PAGINADOR ==================

  private actualizarPaginacion(): void {
    const listaFiltrada = this.filtrarPorTexto(this.data);
    this.totalPages = Math.max(1, Math.ceil(listaFiltrada.length / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const inicio = (this.currentPage - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    this.pagedData = listaFiltrada.slice(inicio, fin);
  }

  private filtrarPorTexto(lista: ActividadSeguimientoModel[]): ActividadSeguimientoModel[] {
    const term = this.filtroTexto.trim().toLowerCase();
    if (!term) return lista;

    return lista.filter((x) =>
      (x.nombreComponenteUCM ?? '').toLowerCase().includes(term) ||
      (x.componenteCodigoUCM ?? '').toLowerCase().includes(term) ||
      (x.descripcion ?? '').toLowerCase().includes(term)
    );
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.actualizarPaginacion();
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = +select.value;
    this.currentPage = 1;
    this.actualizarPaginacion();
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ================== TOASTERS / CONFIRM ==================
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ERROR_PROCESAR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('ACTIVIDADES_SEGUIMIENTO.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('ACTIVIDADES_SEGUIMIENTO.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('ACTIVIDADES_SEGUIMIENTO.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('ACTIVIDADES_SEGUIMIENTO.CANCELAR'),
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
}
