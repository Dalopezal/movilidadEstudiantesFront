import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { GenericApiService } from '../../services/generic-api.service';
import { ConvocatoriaGeneralModel } from '../../models/ConvocatoriaGeneralModel';
import { CondicionComponent } from '../condicion/condicion.component';
import { BeneficioConvocatoriaComponent } from '../beneficio-convocatoria/beneficio-convocatoria.component';
import { EntregableComponent } from '../entregable/entregable.component';
import { Router } from '@angular/router';
import { PostulacionTipoConsultaModel } from '../../models/PostulacionTipoModel';

@Component({
  selector: 'app-convocatorias-general',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    CondicionComponent,
    BeneficioConvocatoriaComponent,
    EntregableComponent
  ],
  templateUrl: './convocatorias-general.component.html',
  styleUrl: './convocatorias-general.component.css',
  providers: [ConfirmationService]
})
export class ConvocatoriasGeneralComponent implements OnInit, OnDestroy {
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
  error: string | null = null;
  filtro: string = '';
  fechaInicial: string = '';
  fechaFinal: string = '';
  movilidadId: number = 0;

  model: ConvocatoriaGeneralModel = new ConvocatoriaGeneralModel();
  isEditing = false;

  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();
  movilidad: any[] = [];
  convocatoriaId: any;
  @Input() categoria: any;
  usuario: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    this.fetchConvocatorias();
    this.fetchListaMovilidad();
  }

  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- CRUD / listado ----------
  fetchConvocatorias() {
    this.error = null;
    this.loading = true;
    this.api.get<any>('Convocatoria/ConsultarConvocatoria_Tipo?NombreTipo=' + this.categoria)
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
           this.loading = false;
        },
        error: (err) => {
          console.error('Error al consultar convocatorias', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
           this.loading = false;
        }
      });
  }

  filterConvocatorias() {
    this.error = null;
    if ((!this.filtro || this.filtro.trim() === '') && (!this.fechaInicial || this.fechaInicial.trim() === '') && (!this.fechaFinal || this.fechaFinal.trim() === '') && (!this.movilidadId || this.movilidadId == 0)) {
      this.showWarning('Debe digitar o seleccionar un valor para ejecutar la búsqueda');
      return;
    }
    this.loading = true;

    const nombre = encodeURIComponent(this.filtro.trim());
    const fInicial = encodeURIComponent(this.fechaInicial.trim());
    const fFinal = encodeURIComponent(this.fechaFinal.trim());
    const movilidad = encodeURIComponent(this.movilidadId);
    this.api.get<any>(`Convocatoria/Consultar_ConvocatoriaGeneral?NombreConvocatoria=${nombre}&FechaInicio=${fInicial}&FechaFinal=${fFinal}&IdModalidad=${movilidad}&NombreTipo=${this.categoria}`)
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
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al filtrar convocatorias', err);
          this.showError();
           this.loading = false;
        }
      });
  }

  validateDateRange() {
    this.dateRangeInvalid = false;
    if (!this.model.fechaInicio || !this.model.fechaCierre) return;
    const inicio = new Date(this.model.fechaInicio);
    const fin = new Date(this.model.fechaCierre);
    if (fin < inicio) this.dateRangeInvalid = true;
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
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar esta convocatoria?');
    if (!confirmado) return;

    this.api.delete(`Convocatorias/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchConvocatorias();
          this.showSuccess();
        },
        error: (err) => {
          console.error('Error al eliminar convocatoria, el resgistro se encuentra asociado', err);
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
  showSuccess() {
    toast.success('¡Operación exitosa!', {
      description: 'Tus datos se procesaron correctamente',
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError() {
    toast.error('Error al procesar', {
      description: 'El registro se encuentra asociado',
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

  private fetchListaMovilidad() {
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
            this.movilidad = items.map(item => ({ id: item.id, nombre: item.nombre }));

          },
          error: (err) => {
            console.error('Error al cargar movilidad para select', err);
            this.movilidad = [];
          }
        });
    }

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

  abrirPostulaciones(item: ConvocatoriaGeneralModel) {
    this.router.navigate(['/postulacion-convocatoria'], {queryParams: {
      id: item.id,
      nombre: item.nombre
    }
    });
  }

  abrirPostulacionDetalle(item: ConvocatoriaGeneralModel) {
    this.router.navigate(['/postulacion-detalle'], {queryParams: {
      idConvocatoria: item.id,
      nombre: item.nombre
    }
    });
  }
}
