import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConvenioModel } from '../../models/ConvenioModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-convenios',
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
  templateUrl: './convenios.component.html',
  styleUrls: ['./convenios.component.css'],
  providers: [ConfirmationService]
})
export class ConveniosComponent implements OnInit, OnDestroy {
  data: ConvenioModel[] = [];
  filteredData: ConvenioModel[] = [];
  pagedData: ConvenioModel[] = [];

  tiposConvenio: any[] = [];
  clasificaciones: any[] = [];
  tiposActividad: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: ConvenioModel = new ConvenioModel();
  isEditing = false;

  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();
  loadingTable: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchTipos();
    this.fetchClasificaciones();
    this.fetchTiposActividad();
    this.fetchConvenios();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- loaders para selects ----------
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

  // ---------- CRUD / listado ----------
  fetchConvenios() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('Convenios/Consultar_Convenio')
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

          this.data = items.map(item => ConvenioModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar convenios', err);
          this.error = this.translate.instant('CONVENIOS.MENSAJES.ERROR_CARGA');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('CONVENIOS.MENSAJES.ERROR_CARGA'));
          this.loadingTable = false;
        }
      });
  }

  filterConvenios() {
    this.error = null;
    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('CONVENIOS.MENSAJES.FILTRO_VACIO'));
      return;
    }
    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Convenios/Consultar_ConvenioGeneral?nombreConvenio=${q}`)
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

          this.data = items.map(item => ConvenioModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar convenios', err);
          this.showError(this.translate.instant('CONVENIOS.MENSAJES.ERROR_FILTRO'));
          this.loadingTable = false;
        }
      });
  }

  // ---------- Form handlers ----------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.dateRangeInvalid) return;

    if (!this.model.descripcion?.trim()) {
      this.error = this.translate.instant('CONVENIOS.MENSAJES.DESCRIPCION_OBLIGATORIA');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload = this.model.toJSON();

    const endpoint = isUpdate ? 'Convenios/Actualiza_Convenio' : 'Convenios/crear_Convenio';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchConvenios();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('CONVENIOS.MENSAJES.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar convenio' : 'Error al crear convenio', err);
        this.error = this.translate.instant('CONVENIOS.MENSAJES.ERROR_PROCESAR');
        this.loading = false;
        this.showError(this.translate.instant('CONVENIOS.MENSAJES.ERROR_PROCESAR'));
      }
    });
  }

  validateDateRange() {
    this.dateRangeInvalid = false;
    if (!this.model.fechaInicio || !this.model.fechaVencimiento) return;
    const inicio = new Date(this.model.fechaInicio);
    const fin = new Date(this.model.fechaVencimiento);
    if (fin < inicio) this.dateRangeInvalid = true;
  }

  resetForm(form?: NgForm) {
    this.model = new ConvenioModel();
    this.isEditing = false;
    this.dateRangeInvalid = false;
    if (form) form.resetForm({
      codigoUcm: '',
      descripcion: '',
      fechaInicio: '',
      fechaVencimiento: '',
      tipoConvenioId: null,
      clasificacionConvenioId: null,
      tipoActividadid: null,
      diasVigencia: 0,
      estado: false
    });
  }

  startEdit(item: any) {
    this.model = ConvenioModel.fromJSON(item);
    this.isEditing = true;
    this.validateDateRange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('CONVENIOS.CONFIRM.ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`Convenios/Eliminar_Entregable/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchConvenios();
          this.showSuccess(this.translate.instant('CONVENIOS.MENSAJES.ELIMINADO_EXITO'));
        },
        error: (err) => {
          console.error('Error al eliminar convenio', err);
          this.showError(this.translate.instant('CONVENIOS.MENSAJES.ERROR_ELIMINAR'));
        }
      });
  }

  // ---------- Paginación ----------
  calculateTotalPages() {
    const totalItems = Array.isArray(this.filteredData) ? this.filteredData.length : 0;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updatePagedData() {
    if (!Array.isArray(this.filteredData)) { this.pagedData = []; return; }
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
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
    this.calculateTotalPages();
    this.updatePagedData();
  }

  trackByIndex(_: number, item: ConvenioModel) {
    return item?.id ?? _;
  }

  // ---------- Toasters / Confirm ----------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('CONVENIOS.TOASTS.EXITO_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('CONVENIOS.TOASTS.ERROR_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('CONVENIOS.TOASTS.WARNING_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('CONVENIOS.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('CONVENIOS.CONFIRM.ACEPTAR'),
        rejectLabel: this.translate.instant('CONVENIOS.CONFIRM.CANCELAR'),
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

  fechaInicioInvalida = false;

  validateFechaInicio() {
    if (!this.model.fechaInicio) {
      this.fechaInicioInvalida = false;
      return;
    }
    const hoy = new Date();
    const fechaInicio = new Date(this.model.fechaInicio);
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);

    this.fechaInicioInvalida = fechaInicio < hoy;
  }

  get formInvalidCustom(): boolean {
    if (!this.model.fechaInicio) return false;
    const hoy = new Date();
    const fechaInicio = new Date(this.model.fechaInicio);
    hoy.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    if (fechaInicio > hoy) return true;
    if (this.model.diasVigencia === null || this.model.diasVigencia <= 1) return true;
    return false;
  }

  calculateDiasVigencia() {
    if (!this.model.fechaInicio || !this.model.fechaVencimiento) {
      this.model.diasVigencia = 0;
      return;
    }
    const inicio = new Date(this.model.fechaInicio);
    const fin = new Date(this.model.fechaVencimiento);
    const diffTime = fin.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.model.diasVigencia = diffDays > 0 ? diffDays : 0;
  }

  diasVigenciaInvalida = false;

  validateDiasVigencia() {
    this.diasVigenciaInvalida = this.model.diasVigencia !== null && this.model.diasVigencia < 1;
  }
}
