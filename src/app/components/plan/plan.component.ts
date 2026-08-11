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
import { PlanModel } from '../../models/PlanModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-plan',
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
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css'],
  providers: [ConfirmationService]
})
export class PlanComponent implements OnInit, OnDestroy {
  data: PlanModel[] = [];
  filteredData: PlanModel[] = [];
  pagedData: PlanModel[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: PlanModel = new PlanModel();
  isEditing = false;
  @Input() idConvocatoria!: any;

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchPlanes();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchPlanes();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Consultar planes
  // -----------------------
  fetchPlanes() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('Planeacion/Consultar_Planeacion')
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
            PlanModel.fromJSON
              ? PlanModel.fromJSON(item)
              : Object.assign(new PlanModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar planes', err);
          this.error = this.translate.instant('PLAN.ERROR_CARGAR_INFORMACION');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('PLAN.ERROR_CARGAR_INFORMACION'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Buscar/filtrar por título
  // -----------------------
  filterPlanes() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('PLAN.DEBE_DIGITAR_VALOR_BUSQUEDA'));
      return;
    }
    this.loadingTable = true;

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Planeacion/Consultar_PlaneacionGeneral?titulo=${q}`)
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
            PlanModel.fromJSON ? PlanModel.fromJSON(item) : Object.assign(new PlanModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar planes', err);
          this.error = this.translate.instant('PLAN.ERROR_CARGAR_INFORMACION');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('PLAN.ERROR_CARGAR_INFORMACION'));
          this.loadingTable = false;
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
    if (!this.model.titulo?.trim() || !this.model.objetivosDesarrollo?.trim()) {
      this.error = this.translate.instant('PLAN.TITULO_OBJETIVOS_OBLIGATORIOS');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      titulo: this.model.titulo,
      esActiva: !!this.model.esActiva,
      objetivosDesarrollo: this.model.objetivosDesarrollo,
      idioma: this.model.idioma,
      resultadosAprendizaje: this.model.resultadosAprendizaje,
      desempeno: this.model.desempeno,
      comentarios: this.model.comentarios,
      aproboPlan: !!this.model.aproboPlan
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Planeacion/actualiza_Planeacion' : 'Planeacion/crear_Planeacion';

    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchPlanes();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('PLAN.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar plan' : 'Error al crear plan', err);
        this.error = this.translate.instant('PLAN.ERROR_PROCESAR_SOLICITUD');
        this.loading = false;
        this.showError(this.translate.instant('PLAN.ERROR_PROCESAR_SOLICITUD'));
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new PlanModel();
    this.isEditing = false;
    if (form) form.resetForm({
      titulo: '',
      esActiva: false,
      objetivosDesarrollo: '',
      idioma: '',
      resultadosAprendizaje: '',
      desempeno: '',
      comentarios: '',
      aproboPlan: false
    });
  }

  startEdit(item: PlanModel) {
    this.model = Object.assign(new PlanModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('PLAN.CONFIRMAR_ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`Plan/Eliminar_Plan/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchPlanes();
          this.showSuccess(this.translate.instant('PLAN.REGISTRO_ELIMINADO'));
        },
        error: (err) => {
          console.error('Error al eliminar plan, el resgistro se encuentra asociado', err);
          this.showError(this.translate.instant('PLAN.ERROR_ELIMINAR_ASOCIADO'));
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

  trackByIndex(_: number, item: PlanModel) {
    return item?.id ?? _;
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('PLAN.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('PLAN.ERROR_PROCESAR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('PLAN.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('PLAN.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('PLAN.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('PLAN.CANCELAR'),
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
