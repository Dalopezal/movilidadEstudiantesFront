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
import { CondicionConvocatoriaModel } from '../../models/CondicionConvocatoriaModel';

@Component({
  selector: 'app-condicion-convocatoria',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './condicion-convocatoria.component.html',
  styleUrls: ['./condicion-convocatoria.component.css'],
  providers: [ConfirmationService]
})
export class CondicionConvocatoriaComponent implements OnInit, OnDestroy {
  data: CondicionConvocatoriaModel[] = [];
  filteredData: CondicionConvocatoriaModel[] = [];
  pagedData: CondicionConvocatoriaModel[] = [];

  condiciones: any[] = [];
  convocatorias: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: CondicionConvocatoriaModel = new CondicionConvocatoriaModel();
  isEditing = false;

  private destroy$ = new Subject<void>();
  loadingTable: any;

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.fetchCondiciones();
    this.fetchConvocatorias();
    this.fetchRelaciones();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- loaders para selects ----------
  fetchCondiciones() {
    this.api.get<any>('Condicion/Consultar_Condicion')
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
          this.condiciones = items.map(i => ({ id: Number(i.id), nombre: i.nombreCondicion }));
        },
        error: (err) => { console.error('Error cargando condiciones', err); this.condiciones = []; }
      });
  }

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
          this.convocatorias = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
        },
        error: (err) => { console.error('Error cargando convocatorias', err); this.convocatorias = []; }
      });
  }

  // ---------- CRUD / listado ----------
  fetchRelaciones() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('CondicionConvocatoria/Consultar_CondicionesConvocatoria')
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
            CondicionConvocatoriaModel.fromJSON ? CondicionConvocatoriaModel.fromJSON(item) : Object.assign(new CondicionConvocatoriaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar relaciones', err);
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

  filterRelaciones() {
    this.error = null;
    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }
    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`CondicionConvocatoria/Consultar_CondicionesConvocatoriaGeneral?nombreCondicion=${q}&nombreConvocatoria=${q}`)
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

          this.data = items.map(item => CondicionConvocatoriaModel.fromJSON ? CondicionConvocatoriaModel.fromJSON(item) : Object.assign(new CondicionConvocatoriaModel(), item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar relaciones', err);
          this.showError('Error al filtrar relaciones');
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

    if (!this.model.condicionesId || !this.model.convocatoriaId) {
      this.error = 'Debe seleccionar una condición y una convocatoria.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      condicionesId: Number(this.model.condicionesId),
      convocatoriaId: Number(this.model.convocatoriaId)
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'CondicionConvocatoria/actualiza_CondicionesConvocatoria' : 'CondicionConvocatoria/crear_CondicionesConvocatoria';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchRelaciones();
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
        console.error(isUpdate ? 'Error al actualizar relación' : 'Error al crear relación', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo');
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new CondicionConvocatoriaModel();
    this.isEditing = false;
    if (form) form.resetForm({
      condicionesId: null,
      convocatoriaId: null
    });
  }

  startEdit(item: CondicionConvocatoriaModel | any) {
    this.model = CondicionConvocatoriaModel.fromJSON(item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(condicioId: string, convocatoriaId: string) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`CondicionConvocatoria/Eliminar_CondicionesConvocatoria/${condicioId},${convocatoriaId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchRelaciones();
          this.showSuccess('Se elimino el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar relación, el resgistro se encuentra asociado', err);
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

  trackByIndex(_: number, item: CondicionConvocatoriaModel) {
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
}
