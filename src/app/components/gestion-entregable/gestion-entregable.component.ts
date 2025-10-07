import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { EntregableModel } from '../../models/EntregableModel';
import { MatDialog } from '@angular/material/dialog';
import { SharePointDriveComponent } from '../drive/drive.component';

@Component({
  selector: 'app-gestion-entregable',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster, SharePointDriveComponent],
  templateUrl: './gestion-entregable.component.html',
  styleUrls: ['./gestion-entregable.component.css'],
  providers: [ConfirmationService]
})
export class GestionEntregableComponent implements OnInit, OnDestroy {
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
  @Input() idConvocatoria!: any;
  @Input() convocatoria!: any;
  @Input() documento!: any;
  loadingTable: any;
  estados: any[] = [];
  entregable: any;
  usuario: any;

  selectedItemCard: EntregableModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService, public dialog: MatDialog) {}

  ngOnInit() {
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    this.fetchEntregables();
  }

  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchEntregables();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Consultar entregables
  fetchEntregables() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>(`Entregable/Consultar_EntregableConvocataria?idConvocatoria=${this.idConvocatoria}`)
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
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar entregables', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError('No se pudo cargar la información. Intenta de nuevo');
          this.loadingTable = false;
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
    this.loadingTable = true;

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
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar entregables', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError('No se pudo cargar la información. Intenta de nuevo');
          this.loadingTable = false;
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
      convocatoriaId: Number(this.model.convocatoriaId),
      estadoId: this.model.estadoId
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Entregable/actualiza_Entregable' : 'Entregable/crear_Entregable';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchEntregables();
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
        console.error(isUpdate ? 'Error al actualizar entregable' : 'Error al crear entregable', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo');
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

    this.api.delete(`Entregable/Eliminar_Entregable/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchEntregables();
          this.showSuccess('Se elimino el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar entregable, el resgistro se encuentra asociado', err);
          this.showError('Error al eliminar entregable, el resgistro se encuentra asociado');
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

  abrirModalDrive() {
    this.dialog.open(SharePointDriveComponent, {
      width: '600px',
      height: '480px',
      disableClose: false,
      data: {
      documento: this.documento,
      convocatoria: this.convocatoria
    }
    });
  }

  cardPosition = { top: 100, left: 100 };
  isClosing = false;

  toggleDetalleConvocatoria(item: EntregableModel) {
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
