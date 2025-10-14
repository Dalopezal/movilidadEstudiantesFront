import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { MatDialog } from '@angular/material/dialog';
import { SharePointDriveComponent } from '../drive/drive.component';
import { CondicionModel } from '../../models/CondicionModel';

@Component({
  selector: 'app-gestion-condicion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster, SharePointDriveComponent],
  templateUrl: './gestion-condicion.component.html',
  styleUrls: ['./gestion-condicion.component.css'],
  providers: [ConfirmationService]
})
export class GestionCondicionComponent implements OnInit, OnDestroy {
  data: CondicionModel[] = [];
  filteredData: CondicionModel[] = [];
  pagedData: CondicionModel[] = [];
  convocatorias: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: CondicionModel = new CondicionModel();
  isEditing = false;
  @Input() idConvocatoria!: any;
  @Input() idPostulacion!: any;
  @Input() convocatoria!: any;
  @Input() documento!: any;
  loadingTable: any;
  estados: any[] = [];
  entregable: any;
  usuario: any;
  EntregablesConvocatoria: number = 0;
  lstEntregablesConvocatoria: any[] = [];

  selectedItemCard: CondicionModel | null = null;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService, public dialog: MatDialog) {}

  ngOnInit() {
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    this.fetchEntregables();
    this.fetchListaEntregablesConvocatoria();
  }

  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }

  async registrarEntregable(idEntregable: any) {
    const confirmado = await this.showConfirm('¿Estás seguro de agregar el entregable?');
    if (!confirmado) return;

    const payload = {
      entregableId: idEntregable,
      postulacionId: this.idPostulacion,
      url: "NA",
      estadoEntregable: false,
      fechaRevision: this.getFechaActual()
    };

    this.api.post('Postulaciones/crear_Postulacion', payload).subscribe({
      next: (resp) => {
        this.showSuccess('Entregable registrado exitosamente');
        this.fetchEntregables();
        this.EntregablesConvocatoria = 0;
      },
      error: (err) => {
        // Asegúrate de extraer el mensaje correcto del error
        const mensaje = err?.error?.message || err?.message || 'Error al registrar el entregable';
        this.showError(mensaje);
        this.EntregablesConvocatoria = 0;
      }
    });
  }

  private fetchListaEntregablesConvocatoria() {
    this.api.get<any>(`Entregable/Consultar_EntregableConvocataria?idConvocatoria=${this.idConvocatoria}`)
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
          this.lstEntregablesConvocatoria = items.map(item => ({ id: item.id, nombre: `${item.nombre} - ${item.descripcion} ${item.nombreConvocatoria}` }));

        },
        error: (err) => {
          console.error('Error al cargar entregables convocatoria para select', err);
          this.lstEntregablesConvocatoria = [];
        }
      });
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
    this.api.get<any>(`EntregablePostulacion/Consultar_EntregablePostulacion?idPostulacion=${this.idPostulacion}`)
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
            CondicionModel.fromJSON ? CondicionModel.fromJSON(item) : Object.assign(new CondicionModel(), item)
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
            CondicionModel.fromJSON ? CondicionModel.fromJSON(item) : Object.assign(new CondicionModel(), item)
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

  resetForm(form?: NgForm) {
    this.model = new CondicionModel();
    this.isEditing = false;
    if (form) form.resetForm({
      nombre: '',
      descripcion: '',
      convocatoriaId: ''
    });
  }

  startEdit(item: CondicionModel) {
    this.model = Object.assign(new CondicionModel(), item);
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

  trackByIndex(_: number, item: CondicionModel) {
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

  toggleDetalleConvocatoria(item: CondicionModel) {
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

  getFechaActual(){
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const customFormat = `${year}-${month}-${day}`;

    return customFormat;
  }
}
