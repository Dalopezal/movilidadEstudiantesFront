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
import { EntregableModel } from '../../models/EntregableModel';

@Component({
  selector: 'app-entregable',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './entregable.component.html',
  styleUrls: ['./entregable.component.css'],
  providers: [ConfirmationService]
})
export class EntregableComponent implements OnInit, OnDestroy {
  data: EntregableModel[] = [];
  filteredData: EntregableModel[] = [];
  pagedData: EntregableModel[] = [];
  convocatorias: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: EntregableModel = new EntregableModel();
  isEditing = false;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.fetchConvocatorias();
    this.fetchEntregables();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Convocatorias para select
  fetchConvocatorias() {
    this.api.get<any>('Convocatoria/Consultar_Convocatoria')
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
          this.convocatorias = items.map(i => ({ id: i.id, nombre: i.nombre }));
        },
        error: (err) => {
          console.error('Error cargando convocatorias', err);
          this.convocatorias = [];
        }
      });
  }

  // Consultar entregables
  fetchEntregables() {
    this.error = null;
    this.api.get<any>('Entregable/Consultar_Entregable')
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
            EntregableModel.fromJSON ? EntregableModel.fromJSON(item) : Object.assign(new EntregableModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
        },
        error: (err) => {
          console.error('Error al consultar entregables', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
        }
      });
  }

  // Filtrar por nombre / convocatoria (usa endpoint similar)
  filterEntregables() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Entregable/Consultar_EntregableGeneral?nombre=${q}&nombreConvocatoria=${q}`)
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
            EntregableModel.fromJSON ? EntregableModel.fromJSON(item) : Object.assign(new EntregableModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
        },
        error: (err) => {
          console.error('Error al filtrar entregables', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
        }
      });
  }

  // Form handlers
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.nombre?.trim() || !this.model.descripcion?.trim() || !this.model.convocatoriaId || Number(this.model.convocatoriaId) <= 0) {
      this.error = 'Todos los campos obligatorios deben ser completados.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      nombre: this.model.nombre,
      descripcion: this.model.descripcion,
      convocatoriaId: Number(this.model.convocatoriaId)
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Entregable/actualiza_Entregable' : 'Entregable/crear_Entregable';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.fetchEntregables();
        this.resetForm(form);
        this.loading = false;
        this.showSuccess();
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar entregable' : 'Error al crear entregable', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError();
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new EntregableModel();
    this.isEditing = false;
    if (form) form.resetForm({
      nombre: '',
      descripcion: '',
      convocatoriaId: ''
    });
  }

  startEdit(item: EntregableModel) {
    this.model = Object.assign(new EntregableModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`Entregable/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchEntregables();
          this.showSuccess();
        },
        error: (err) => {
          console.error('Error al eliminar entregable', err);
          this.showError();
        }
      });
  }

  // Paginación
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

  trackByIndex(_: number, item: EntregableModel) {
    return item?.id ?? _;
  }

  // Toasters / Confirm
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
