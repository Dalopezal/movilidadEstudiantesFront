import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { GenericApiService } from '../../services/generic-api.service';
import { Router } from '@angular/router';
import { PostulacionTipoConsultaModel } from '../../models/PostulacionTipoModel';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-postulaciones-tipo',
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    SidebarComponent
  ],
  templateUrl: './postulaciones-tipo.component.html',
  styleUrl: './postulaciones-tipo.component.css',
  providers: [ConfirmationService]
})
export class PostulcionesEntrantesComponent implements OnInit, OnDestroy {
  data: PostulacionTipoConsultaModel[] = [];
  filteredData: PostulacionTipoConsultaModel[] = [];
  pagedData: PostulacionTipoConsultaModel[] = [];

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
  estadoId: number = 0;
  tipoMovilidadIdId: number = 0;

  model: PostulacionTipoConsultaModel = new PostulacionTipoConsultaModel();
  isEditing = false;

  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();
  estados: any[] = [];
  tipoMovilidad: any[] = [];
  convocatoriaId: any;

  selectedItem: any = null;
  cardPosition = { top: 100, left: 50 };
  isClosing = false;

  @Input() tipoPostulacion: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchPostulacionesEntrantes();
    this.fetchListaEstados();
    this.fetchListaTipoMovilidad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- CRUD / listado ----------
  fetchPostulacionesEntrantes() {
    this.error = null;
    this.loading = true;
    this.api.get<any>('ConsulltaPostuladosTipo/Consultar_PostuladosTipoEntrante?idEstado=1')
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

          this.data = items.map(item => PostulacionTipoConsultaModel.fromJSON(item));
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

  filterPostulaciones() {
    this.error = null;
    if ((!this.tipoMovilidadIdId || this.tipoMovilidadIdId == 0) && (!this.filtro || this.filtro.trim() === '') && (!this.fechaInicial || this.fechaInicial.trim() === '') && (!this.fechaFinal || this.fechaFinal.trim() === '') && (!this.estadoId || this.estadoId == 0)) {
      this.showWarning('Debe digitar o seleccionar un valor para ejecutar la búsqueda');
      return;
    }
    this.loading = true;

    const tipoMovilidad = encodeURIComponent(this.tipoMovilidadIdId);
    const nombre = encodeURIComponent(this.filtro.trim());
    const fInicial = encodeURIComponent(this.fechaInicial.trim());
    const fFinal = encodeURIComponent(this.fechaFinal.trim());
    const estadoId = encodeURIComponent(this.estadoId);
    this.api.get<any>(this.tipoPostulacion == 'entrante' ? `ConsulltaPostuladosTipo/Consultar_PostuladosTipoEntrante?idEstado=${estadoId}&IdTipo=${tipoMovilidad}&DocumentoPostulado=${nombre}l&FechaInicioConvocatoria=${fInicial}&FechaFinConvocatoria=${fFinal}`
                                                         : `ConsulltaPostuladosTipo/Consultar_PostuladosTipoSaliente?idEstado=${estadoId}&IdTipo=${tipoMovilidad}&DocumentoPostulado=${nombre}l&FechaInicioConvocatoria=${fInicial}&FechaFinConvocatoria=${fFinal}`)
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

          this.data = items.map(item => PostulacionTipoConsultaModel.fromJSON(item));
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

  resetForm(form?: NgForm) {
    this.model = new PostulacionTipoConsultaModel();
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

    private fetchListaTipoMovilidad() {
      this.api.get<any>('TipoMovilidad/Consultar_TipoMovilida')
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
            this.tipoMovilidad = items.map(item => ({ id: item.id, nombre: item.nombre }));

          },
          error: (err) => {
            console.error('Error al cargar tipo movilidad para select', err);
            this.tipoMovilidad = [];
          }
        });
    }

  abrirPostulacionDetalle(item: PostulacionTipoConsultaModel) {
    this.router.navigate(['/postulacion-detalle'], {
  });
  }

  trackByIndex(_: number, item: PostulacionTipoConsultaModel) {
      return item?.idPostulacion ?? _;
  }

  toggleDetalle(item: any) {
    if (this.selectedItem && this.selectedItem.idPostulacion === item.idPostulacion) {
      this.closeCard();
    } else {
      this.selectedItem = item;
      this.isClosing = false;
    }
  }

  closeCard() {
    this.isClosing = true;

    setTimeout(() => {
      this.selectedItem = null;
      this.isClosing = false;
    }, 400);
  }
}
