import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { FinanciacionModel } from '../../models/FinanciacionModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-financiacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    TranslateModule
  ],
  templateUrl: './financiacion.component.html',
  styleUrls: ['./financiacion.component.css'],
  providers: [ConfirmationService]
})
export class FinanciacionComponent implements OnInit, OnDestroy {
  data: FinanciacionModel[] = [];
  filteredData: FinanciacionModel[] = [];
  pagedData: FinanciacionModel[] = [];

  tiposFinanciacionExterna: any[] = [];
  tiposFinanciacion: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: FinanciacionModel = new FinanciacionModel();
  isEditing = false;

  private destroy$ = new Subject<void>();
  @Input() postulacionId!: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.translate.setDefaultLang('es');
    const lang = localStorage.getItem('lang') || 'es';
    this.translate.use(lang);

    this.fetchTiposFinanciacionExterna();
    this.fetchTiposFinanciacion();
    this.fetchFinanciaciones();
    this.model.postulacionId = this.postulacionId
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- loaders para selects ----------
  fetchTiposFinanciacionExterna() {
    this.api.get<any>('TipoFinanciacionExterna/Consultar_TipoFinanciacionExterna')
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
          this.tiposFinanciacionExterna = items.map(i => ({
            id: Number(i.id),
            descripcion: i.nombre
          }));
        },
        error: (err) => {
          console.error('Error cargando tipos financiacion externa', err);
          this.tiposFinanciacionExterna = [];
        }
      });
  }

  fetchTiposFinanciacion() {
    this.api.get<any>('TipoFinanciacion/Consultar_TipoFinanciacion')
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
          this.tiposFinanciacion = items.map(i => ({
            id: Number(i.id),
            descripcion: i.nombre
          }));
        },
        error: (err) => {
          console.error('Error cargando tipos financiacion', err);
          this.tiposFinanciacion = [];
        }
      });
  }

  // ---------- CRUD / listado ----------
  fetchFinanciaciones() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>(`FinanciacionUCM/Consultar_FinanciacionesPostulacion?PostulacionId=${this.postulacionId}`)
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

          this.data = items.map(item => FinanciacionModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar financiaciones', err);
          const msg = this.translate.instant('FINANCIACION.MENSAJES.ERROR_CARGA');
          this.error = msg;
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(msg);
          this.loadingTable = false;
        }
      });
  }

  filterFinanciaciones() {
    this.error = null;
    if (!this.filtro || this.filtro.trim() === '') {
      const msg = this.translate.instant('FINANCIACION.MENSAJES.FILTRO_VACIO');
      this.showWarning(msg);
      return;
    }
    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Financiacion/Consultar_FinanciacionGeneral?nombrePostulacion=${q}`)
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

          this.data = items.map(item => FinanciacionModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar financiaciones', err);
          const msg = this.translate.instant('FINANCIACION.MENSAJES.ERROR_FILTRO');
          this.error = msg;
          this.showError(msg);
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

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload = this.model.toJSON();

    const endpoint = isUpdate
      ? 'FinanciacionUCM/actualiza_Financiacion'
      : 'FinanciacionUCM/crear_Financiacion';
    const obs = isUpdate
      ? this.api.put<any>(endpoint, payload)
      : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchFinanciaciones();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('FINANCIACION.MENSAJES.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar financiacion' : 'Error al crear financiacion', err);
        const msg = this.translate.instant('FINANCIACION.MENSAJES.ERROR_PROCESAR');
        this.error = msg;
        this.loading = false;
        this.showError(msg);
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new FinanciacionModel();
    this.isEditing = false;
    if (form) form.resetForm({
      arl: 0,
      comisionServicios: 0,
      descuentoMatricula: 0,
      valorApoyoAlojamiento: 0,
      valorApoyoEconomico: 0,
      valorOtros: 0,
      valorCompraTiquetes: 0,
      tipoFinanciacionExternaId: null,
      tipoFinanciacionId: null
    });
  }

  startEdit(item: any) {
    this.model = FinanciacionModel.fromJSON(item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const msg = this.translate.instant('FINANCIACION.MENSAJES.CONFIRMAR_ELIMINAR');
    const confirmado = await this.showConfirm(msg);
    if (!confirmado) return;

    this.api.delete(`Financiacion/Eliminar_Financiacion/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchFinanciaciones();
          this.showSuccess(this.translate.instant('FINANCIACION.MENSAJES.ELIMINAR_OK'));
        },
        error: (err) => {
          console.error('Error al eliminar financiacion', err);
          this.showError(this.translate.instant('FINANCIACION.MENSAJES.ELIMINAR_ERROR'));
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
    if (!Array.isArray(this.filteredData)) {
      this.pagedData = [];
      return;
    }
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

  trackByIndex(_: number, item: FinanciacionModel) {
    return item?.id ?? _;
  }

  // ---------- Toasters / Confirm ----------
  showSuccess(mensaje: any) {
    const title = this.translate.instant('FINANCIACION.TOASTS.EXITO_TITULO');
    toast.success(title, {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    const title = this.translate.instant('FINANCIACION.TOASTS.ERROR_TITULO');
    toast.error(title, {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    const title = this.translate.instant('FINANCIACION.TOASTS.WARNING_TITULO');
    toast.warning(title, {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('FINANCIACION.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('FINANCIACION.CONFIRM.ACEPTAR'),
        rejectLabel: this.translate.instant('FINANCIACION.CONFIRM.CANCELAR'),
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonStyleClass: 'custom-accept-btn',
        rejectButtonStyleClass: 'custom-reject-btn',
        defaultFocus: 'reject',
        accept: () => resolve(true),
        reject: () => resolve(false)
      });
    });
  }
}
