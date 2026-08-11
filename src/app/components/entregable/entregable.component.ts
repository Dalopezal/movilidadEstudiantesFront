import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-entregable',
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
  @Input() idConvocatoria!: any;
  loadingTable: any;
  estados: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchConvocatorias();
    this.fetchEntregables();
    this.fetchListaEstados();
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

  private fetchListaEstados() {
      this.api.get<any>('EstadosPostulacion/Consultar_Estado')
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
            this.estados = items.map(item => ({ id: item.id, nombre: item.nombre }));

          },
          error: (err) => {
            console.error('Error al cargar estado para select', err);
            this.estados = [];
          }
        });
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
    this.loadingTable = true;
    this.api.get<any>(this.idConvocatoria == 'undefined' || this.idConvocatoria == null ? 'Entregable/Consultar_Entregable' : `Entregable/Consultar_EntregableConvocataria?idConvocatoria=${this.idConvocatoria}`)
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
          this.error = this.translate.instant('ENTREGABLES.MENSAJES.ERROR_CARGA');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('ENTREGABLES.MENSAJES.ERROR_CARGA'));
          this.loadingTable = false;
        }
      });
  }

  // Filtrar por nombre / convocatoria
  filterEntregables() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('ENTREGABLES.MENSAJES.FILTRO_VACIO'));
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
          this.error = this.translate.instant('ENTREGABLES.MENSAJES.ERROR_CARGA');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('ENTREGABLES.MENSAJES.ERROR_CARGA'));
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
      this.error = this.translate.instant('ENTREGABLES.MENSAJES.CAMPOS_OBLIGATORIOS');
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
          this.showError(this.translate.instant('ENTREGABLES.TOASTS.ERROR_DESC'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar entregable' : 'Error al crear entregable', err);
        this.error = this.translate.instant('ENTREGABLES.MENSAJES.ERROR_CARGA');
        this.loading = false;
        this.showError(this.translate.instant('ENTREGABLES.MENSAJES.ERROR_CARGA'));
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
    const confirmado = await this.showConfirm(this.translate.instant('ENTREGABLES.CONFIRM.ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`Entregable/Eliminar_Entregable/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchEntregables();
          this.showSuccess(this.translate.instant('ENTREGABLES.TOASTS.EXITO_DESC'));
        },
        error: (err) => {
          console.error('Error al eliminar entregable', err);
          this.showError(this.translate.instant('ENTREGABLES.TOASTS.ERROR_DESC'));
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
    toast.success(this.translate.instant('ENTREGABLES.TOASTS.EXITO_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('ENTREGABLES.TOASTS.ERROR_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('ENTREGABLES.TOASTS.WARNING_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: `¿${mensaje}?`,
        header: this.translate.instant('ENTREGABLES.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('ENTREGABLES.CONFIRM.ACEPTAR'),
        rejectLabel: this.translate.instant('ENTREGABLES.CONFIRM.CANCELAR'),
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
