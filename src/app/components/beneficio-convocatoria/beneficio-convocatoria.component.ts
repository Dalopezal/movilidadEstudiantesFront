import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { BeneficioConvocatoriaModel } from '../../models/BeneficioConvocatoriaModel';
import { ConvocatoriaModel } from '../../models/ConvocatoriaModel';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

@Component({
  selector: 'app-beneficio-convocatoria',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './beneficio-convocatoria.component.html',
  styleUrls: ['./beneficio-convocatoria.component.css'],
  providers: [
    ConfirmationService
  ],
})
export class BeneficioConvocatoriaComponent implements OnInit, OnDestroy {
  data: BeneficioConvocatoriaModel[] = [];
  filteredData: BeneficioConvocatoriaModel[] = [];
  pagedData: BeneficioConvocatoriaModel[] = [];
  convocatorias: ConvocatoriaModel[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  // selectedConvocatoria es number (id) o '' para "Todas"
  selectedConvocatoria: number | '' = '';
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  model: BeneficioConvocatoriaModel = new BeneficioConvocatoriaModel();
  isEditing = false;
  filtro: String = "";

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.fetchConvocatorias();
    this.fetchListaConvocatorias();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Consultar convocatorias para el SELECT
  // -----------------------
  private fetchListaConvocatorias() {
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
          this.convocatorias = items.map(item => ConvocatoriaModel.fromJSON(item));
        },
        error: (err) => {
          console.error('Error al cargar convocatorias para select', err);
          this.convocatorias = [];
        }
      });
  }

  // -----------------------
  // Consultar beneficios (tabla principal)
  // -----------------------
  fetchConvocatorias() {
    this.error = null;

    this.api.get<any>('BeneficioConvocatoria/Consultar_BeneficiosConvocatoria')
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
            BeneficioConvocatoriaModel.fromJSON
              ? BeneficioConvocatoriaModel.fromJSON(item)
              : Object.assign(new BeneficioConvocatoriaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
        },
        error: (err) => {
          console.error('Error al consultar beneficios', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
        }
      });
  }

  filterConvocatorias() {
    this.error = null;

    if(this.filtro == ""){
      this.showWarning("Debe digitar un valor para ejecutar la busqueda");
      return;
    }

    this.api.get<any>('BeneficioConvocatoria/Consultar_BeneficiosGeneral?nombreBeneficio='+ this.filtro +'&nombreConvocatoria=' + this.filtro)
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
            BeneficioConvocatoriaModel.fromJSON
              ? BeneficioConvocatoriaModel.fromJSON(item)
              : Object.assign(new BeneficioConvocatoriaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
        },
        error: (err) => {
          console.error('Error al consultar beneficios', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
        }
      });
  }

  // -----------------------
  // Manejo de filtros
  // -----------------------
  onConvocatoriaChange(value: number | '') {
    this.selectedConvocatoria = value;
  }

  applyFilters() {
    if (!Array.isArray(this.data)) {
      console.warn('applyFilters: this.data no es array', this.data);
      this.filteredData = [];
      this.pagedData = [];
      this.calculateTotalPages();
      return;
    }

    if (this.selectedConvocatoria === '') {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(d =>
        Number(d.convocatoriaId) === Number(this.selectedConvocatoria)
      );
    }

    this.currentPage = 1;
    this.calculateTotalPages();
    this.updatePagedData();
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

  trackByIndex(_: number, item: BeneficioConvocatoriaModel) {
    return item?.id ?? _;
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
    if (this.model.convocatoriaId == null || Number(this.model.convocatoriaId) <= 0) {
      this.error = 'Debe seleccionar una convocatoria válida.';
      return;
    }
    if (!this.model.nombreBeneficio?.trim() || !this.model.descripcion?.trim()) {
      this.error = 'Nombre y descripción son obligatorios.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      descripcion: this.model.descripcion,
      convocatoriaId: Number(this.model.convocatoriaId),
      nombreBeneficio: this.model.nombreBeneficio
    };

    // si es actualización, incluye el id según la API lo requiera
    if (isUpdate) {
      payload.id = this.model.id;
    }

    const endpoint = isUpdate
      ? 'BeneficioConvocatoria/actualiza_Beneficio'
      : 'BeneficioConvocatoria/crear_Beneficio';

    if (isUpdate) {
      this.api.put<any>(endpoint, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchConvocatorias();
          this.resetForm(form);
          this.loading = false;
          this.showSuccess();
        },
        error: (err) => {
          console.error('Error al actualizar', err);
          this.error = 'No se pudo actualizar. Intenta de nuevo.';
          this.loading = false;
          this.showError();
        }
      });
    }else{
      this.api.post<any>(endpoint, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchConvocatorias();
          this.resetForm(form);
          this.loading = false;
          this.showSuccess();
        },
        error: (err) => {
          console.error('Error al guardar', err);
          this.error = 'No se pudo guardar. Intenta de nuevo.';
          this.loading = false;
          this.showError();
        }
      });
    }


  }

  resetForm(form?: NgForm) {
    this.model = new BeneficioConvocatoriaModel();
    this.isEditing = false;
    this.selectedConvocatoria = '';
    if (form) form.resetForm({
      nombreBeneficio: '',
      descripcion: '',
      convocatoria: ''
    });
  }

  startEdit(item: BeneficioConvocatoriaModel) {
    this.model = Object.assign(new BeneficioConvocatoriaModel(), item);
    // sincronizar select por id
    this.selectedConvocatoria = Number(item.convocatoriaId) || '';
    this.isEditing = true;
  }

  async deleteItem(id: number) {
  const confirmado = await this.showConfirm('Estas seguro de eliminar este registro');
  if (!confirmado) return;

  this.api.delete(`BeneficioConvocatoria/Eliminar/${id}`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => this.fetchConvocatorias(),
      error: (err) => {
        console.error('Error al eliminar', err);
        this.showError()
      }
    });
}

  showSuccess() {
    toast.success('¡Operación exitosa!', {
      description: 'Tus datos se guardaron correctamente',
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

  showWarning(mensaje: String) {
    toast.warning('Atención', {
      description: mensaje.toString(),
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
    this.confirmationService.confirm({
      message: `¿${mensaje}?`,
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
