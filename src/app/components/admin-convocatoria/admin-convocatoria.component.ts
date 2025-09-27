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
import { ConvocatoriaGeneralModel } from '../../models/ConvocatoriaGeneralModel';
import { CondicionComponent } from '../condicion/condicion.component';
import { BeneficioConvocatoriaComponent } from '../beneficio-convocatoria/beneficio-convocatoria.component';
import { EntregableComponent } from '../entregable/entregable.component';

@Component({
  selector: 'app-admin-convocatoria',
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster, CondicionComponent,
      BeneficioConvocatoriaComponent,
      EntregableComponent],
  templateUrl: './admin-convocatoria.component.html',
  styleUrl: './admin-convocatoria.component.css',
  providers: [ConfirmationService]
})
export class AdminConvocatoriaComponent implements OnInit, OnDestroy {
  data: ConvocatoriaGeneralModel[] = [];
  filteredData: ConvocatoriaGeneralModel[] = [];
  pagedData: ConvocatoriaGeneralModel[] = [];

  categoriasMovilidad: any[] = [];
  modalidades: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: ConvocatoriaGeneralModel = new ConvocatoriaGeneralModel();
  isEditing = false;
  dateRangeInvalid = false;
  convocatoriaId: any;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.fetchCategoriasMovilidad();
    this.fetchModalidades();
    this.fetchConvocatorias();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- Loaders para selects ----------
  fetchCategoriasMovilidad() {
    this.api.get<any>('CategoriaMovilidad/Consultar_CategoriaMovilidad')
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
          this.categoriasMovilidad = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
        },
        error: (err) => {
          console.error('Error cargando categorías movilidad', err);
          this.categoriasMovilidad = [];
        }
      });
  }

  fetchModalidades() {
    this.api.get<any>('Modalidad/Consultar_Modalidad')
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
          this.modalidades = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
        },
        error: (err) => {
          console.error('Error cargando modalidades', err);
          this.modalidades = [];
        }
      });
  }

  // ---------- CRUD / listado ----------
  fetchConvocatorias() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('Convocatoria/Consultar_Convocatoria')
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

          this.data = items.map(item => ConvocatoriaGeneralModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar convocatorias', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError('No se pudo cargar la información. Intenta de nuevo.');
          this.loadingTable = false;
        }
      });
  }

  filterConvocatorias() {
    this.error = null;
    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }
    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Convocatoria/Consultar_ConvocatoriaGeneral?NombreConvocatoria=${q}&FechaInicio&FechaFinal&IdModalidad=1&NombreTipo=Saliente`)
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

          this.data = items.map(item => ConvocatoriaGeneralModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar convocatorias', err);
          this.showError('Error al filtrar convocatorias');
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

    this.validateDateRange();
    if (this.dateRangeInvalid) return;

    if (!this.model.nombre?.trim()) {
      this.error = 'El nombre es obligatorio.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload = this.model.toJSON();

    const endpoint = isUpdate ? 'Convocatoria/actualiza_Convocatoria' : 'Convocatoria/crear_Convocatoria';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchConvocatorias();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          // fallback por si llega algo inesperado
          this.showError('Respuesta desconocida del servidor.');
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar convocatoria' : 'Error al crear convocatoria', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo.');
      }
    });
  }

  validateDateRange() {
    this.dateRangeInvalid = false;
    if (!this.model.fechaInicio || !this.model.fechaCierre) return;
    const inicio = new Date(this.model.fechaInicio);
    const cierre = new Date(this.model.fechaCierre);
    if (cierre < inicio) this.dateRangeInvalid = true;
  }

  resetForm(form?: NgForm) {
    this.model = new ConvocatoriaGeneralModel();
    this.isEditing = false;
    this.dateRangeInvalid = false;
    if (form) {
      form.resetForm({
        nombre: '',
        descripcion: '',
        fechaInicio: '',
        fechaCierre: '',
        requisitos: '',
        categoriaMovilidadId: null,
        modalidadId: null,
        esActiva: false
      });
    }
  }

  startEdit(item: any) {
    this.model = ConvocatoriaGeneralModel.fromJSON(item);
    this.isEditing = true;
    this.validateDateRange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`Convocatoria/Eliminar_Convocatoria/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchConvocatorias();
          this.showSuccess('Se elimino el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar convocatoria, el resgistro se encuentra asociado', err);
          this.showError('Error al eliminar relación, el resgistro se encuentra asociado');
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

  trackByIndex(_: number, item: ConvocatoriaGeneralModel) {
    return item?.id ?? _;
  }

  // ---------- Toasters / Confirm ----------
  showSuccess(mensaje: any) {
    toast.success('¡Operación exitosa!', {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error('Error al procesar', {
      description: mensaje,
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

  selectedItemCard: ConvocatoriaGeneralModel | null = null;
  selectedItem: ConvocatoriaGeneralModel | null = null;

  openModalCondicion(item: ConvocatoriaGeneralModel) {
      this.selectedItem = item;
      this.convocatoriaId = item.id;
      const modalElement = document.getElementById('CondicionModal');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }

    openModalBeneficio(item: ConvocatoriaGeneralModel) {
      this.selectedItem = item;
      this.convocatoriaId = item.id;
      const modalElement = document.getElementById('BeneficioModal');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }

    openModalEntregable(item: ConvocatoriaGeneralModel) {
      this.selectedItem = item;
      this.convocatoriaId = item.id;
      const modalElement = document.getElementById('EntregableModal');
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }

    cardPosition = { top: 100, left: 100 };
    isClosing = false;

    toggleDetalleConvocatoria(item: ConvocatoriaGeneralModel) {
      if (this.selectedItemCard && this.selectedItemCard.id === item.id) {
        this.closeCard();
      } else {
        this.selectedItemCard = item;
        this.isClosing = false;
      }
    }

    closeCard() {
      this.isClosing = true;
      setTimeout(() => {
        this.selectedItemCard = null;
        this.isClosing = false;
      }, 400);
    }
}
