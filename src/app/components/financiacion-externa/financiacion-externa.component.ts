import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { FinanciacionExternaModel } from '../../models/FinanciacionExternaModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-financiacion-externa',
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
  templateUrl: './financiacion-externa.component.html',
  styleUrls: ['./financiacion-externa.component.css'],
  providers: [ConfirmationService]
})
export class FinanciacionExternaComponent implements OnInit, OnDestroy {
  data: FinanciacionExternaModel[] = [];
  filteredData: FinanciacionExternaModel[] = [];
  pagedData: FinanciacionExternaModel[] = [];
  tipoOptions = ['Tipo1', 'Tipo2', 'Tipo3'];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: FinanciacionExternaModel = new FinanciacionExternaModel();
  isEditing = false;
  @Input() idConvocatoria!: any;

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchFinanciacionExterna();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Consultar financiación externa
  // -----------------------
  fetchFinanciacionExterna() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('TipoFinanciacionExterna/Consultar_tipoFinanciacionExterna')
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

          this.data = items.map(item =>
            FinanciacionExternaModel.fromJSON
              ? FinanciacionExternaModel.fromJSON(item)
              : Object.assign(new FinanciacionExternaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar financiación externa', err);
          this.error = this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.ERROR_CARGA');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.ERROR_CARGA'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Buscar/filtrar por nombre
  // -----------------------
  filterCondiciones() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.FILTRO_VACIO'));
      return;
    }
    this.loadingTable = true;

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`TipoFinanciacionExterna/Consultar_FinanciacionExternaGeneral?nombre=${q}`)
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

          this.data = items.map(item =>
            FinanciacionExternaModel.fromJSON ? FinanciacionExternaModel.fromJSON(item) : Object.assign(new FinanciacionExternaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar financiación externa', err);
          this.error = this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.ERROR_CARGA');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.ERROR_CARGA'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Form handlers
  // -----------------------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // validaciones adicionales
    if (!this.model.nombre?.trim()) {
      this.error = this.translate.instant('FINANCIACION_EXTERNA.FORM.NOMBRE_REQUERIDO');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      nombre: this.model.nombre,
      estado: this.model.estado,
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'TipoFinanciacionExterna/Actualiza_FinanciacionExterna' : 'TipoFinanciacionExterna/crear_FinanciacionExterna';

    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchFinanciacionExterna();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('FINANCIACION_EXTERNA.TOASTS.ERROR_DESC'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar financiación externa' : 'Error al crear financiación externa', err);
        this.error = this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.ERROR_CARGA');
        this.loading = false;
        this.showError(this.translate.instant('FINANCIACION_EXTERNA.MENSAJES.ERROR_CARGA'));
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new FinanciacionExternaModel();
    this.isEditing = false;
    if (form) form.resetForm({
      nombre: '',
      estado: false
    });
  }

  startEdit(item: FinanciacionExternaModel) {
    this.model = Object.assign(new FinanciacionExternaModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('FINANCIACION_EXTERNA.CONFIRM.ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`TipoFinanciacionExterna/Eliminar_FinanciacionExterna/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchFinanciacionExterna();
          this.showSuccess(this.translate.instant('FINANCIACION_EXTERNA.TOASTS.EXITO_DESC'));
        },
        error: (err) => {
          console.error('Error al eliminar financiación externa', err);
          this.showError(this.translate.instant('FINANCIACION_EXTERNA.TOASTS.ERROR_DESC'));
        }
      });
  }

  // -----------------------
  // Paginación
  // -----------------------
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

  trackByIndex(_: number, item: FinanciacionExternaModel) {
    return item?.id ?? _;
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('FINANCIACION_EXTERNA.TOASTS.EXITO_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('FINANCIACION_EXTERNA.TOASTS.ERROR_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('FINANCIACION_EXTERNA.TOASTS.WARNING_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: `¿${mensaje}?`,
        header: this.translate.instant('FINANCIACION_EXTERNA.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('FINANCIACION_EXTERNA.CONFIRM.ACEPTAR'),
        rejectLabel: this.translate.instant('FINANCIACION_EXTERNA.CONFIRM.CANCELAR'),
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
