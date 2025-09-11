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

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
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

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

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
        },
        error: (err) => {
          console.error('Error al consultar convenios', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
        }
      });
  }

  filterConvenios() {
    this.error = null;
    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }
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
        },
        error: (err) => {
          console.error('Error al filtrar convenios', err);
          this.showError();
        }
      });
  }

  // ---------- Form handlers ----------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.validateDateRange();
    if (this.dateRangeInvalid) return;

    if (!this.model.descripcion?.trim()) {
      this.error = 'La descripción es obligatoria.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    this.model.fechaVencimiento = '1900-01-01';
    const payload = this.model.toJSON();

    const endpoint = isUpdate ? 'Convenios/Actualiza_Convenio' : 'Convenios/crear_Convenio';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.fetchConvenios();
        this.resetForm(form);
        this.loading = false;
        this.showSuccess();
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar convenio' : 'Error al crear convenio', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError();
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
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`Convenio/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchConvenios();
          this.showSuccess();
        },
        error: (err) => {
          console.error('Error al eliminar convenio', err);
          this.showError();
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
  showSuccess() {
    toast.success('¡Operación exitosa!', {
      description: 'Tus datos se procesaron correctamente',
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError() {
    toast.error('Error al procesar', {
      description: 'Inténtalo nuevamente más tarde',
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning('Atención', {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: 'Confirmar acción',
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: 'Sí, Confirmo',
        rejectLabel: 'Cancelar',
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
