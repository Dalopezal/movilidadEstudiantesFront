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
import { InstitucionModel } from '../../models/InstitucionModel';

@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './instituciones.component.html',
  styleUrls: ['./instituciones.component.css'],
  providers: [ConfirmationService]
})
export class InstitucionesComponent implements OnInit, OnDestroy {
  data: InstitucionModel[] = [];
  filteredData: InstitucionModel[] = [];
  pagedData: InstitucionModel[] = [];

  paises: any[] = [];
  ciudades: any[] = [];
  selectedPaisId: number | '' = '';

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: InstitucionModel = new InstitucionModel();
  isEditing = false;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.fetchPaises();
    this.fetchInstituciones();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Cargar paises
  // -----------------------
  fetchPaises() {
    this.api.get<any>('Pais/Consultar_Paises')
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

  // -----------------------
  // Cargar ciudades por país
  // -----------------------
  onPaisChange() {
    this.model.ciudadId = 0;
    this.ciudades = [];

    if (!this.selectedPaisId) return;

    this.api.get<any>(`Ciudad/Consultar_CiudadesPorPais?paisId=${this.selectedPaisId}`)
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
          this.ciudades = items.map(item => ({ id: item.id, nombre: item.nombre }));
        },
        error: (err) => {
          console.error('Error al cargar ciudades', err);
          this.ciudades = [];
        }
      });
  }

  // -----------------------
  // Consultar instituciones
  // -----------------------
  fetchInstituciones() {
    this.error = null;
    this.api.get<any>('Institucion/Consultar_Institucion')
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
            InstitucionModel.fromJSON
              ? InstitucionModel.fromJSON(item)
              : Object.assign(new InstitucionModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
        },
        error: (err) => {
          console.error('Error al consultar instituciones', err);
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
  // Buscar/filtrar por nombre
  // -----------------------
  filterInstituciones() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Institucion/Consultar_InstitucionGeneral?nombreInstitucion=${q}`)
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
            InstitucionModel.fromJSON ? InstitucionModel.fromJSON(item) : Object.assign(new InstitucionModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
        },
        error: (err) => {
          console.error('Error al filtrar instituciones', err);
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
  // Form handlers
  // -----------------------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // validaciones adicionales
    if (!this.model.nombre?.trim() || !this.model.contactoDescripcion?.trim()) {
      this.error = 'Nombre y descripción son obligatorios.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      nombre: this.model.nombre,
      contactoDescripcion: this.model.contactoDescripcion,
      ciudadId: Number(this.model.ciudadId)
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Institucion/actualiza_Institucion' : 'Institucion/crear_Institucion';

    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.fetchInstituciones();
        this.resetForm(form);
        this.loading = false;
        this.showSuccess();
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar institución' : 'Error al crear institución', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError();
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new InstitucionModel();
    this.isEditing = false;
    this.selectedPaisId = '';
    this.ciudades = [];
    if (form) form.resetForm({
      nombre: '',
      contactoDescripcion: '',
      pais: '',
      ciudadId: ''
    });
  }

  startEdit(item: InstitucionModel) {
    this.model = Object.assign(new InstitucionModel(), item);
    this.selectedPaisId = item.paisId ?? '';
    this.isEditing = true;
    // cargar ciudades del país
    this.onPaisChange();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`Institucion/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchInstituciones();
          this.showSuccess();
        },
        error: (err) => {
          console.error('Error al eliminar institución', err);
          this.showError();
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

  trackByIndex(_: number, item: InstitucionModel) {
    return item?.id ?? _;
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
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
