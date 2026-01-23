import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { GenericApiService } from '../../services/generic-api.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { HorariosUniversidadModel } from '../../models/HorariosUniversidadModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-horarios-universidad',
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
  templateUrl: './horarios-universidad.component.html',
  styleUrls: ['./horarios-universidad.component.css'],
  providers: [ConfirmationService]
})
export class HorariosUniversidadComponent implements OnInit, OnDestroy {
  data: HorariosUniversidadModel[] = [];
  filteredData: HorariosUniversidadModel[] = [];
  pagedData: HorariosUniversidadModel[] = [];

  model: HorariosUniversidadModel = new HorariosUniversidadModel();
  isEditing = false;
  loading = false;
  loadingTable = false;
  filtro = '';

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.fetchHorarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // CONSULTA PRINCIPAL
  // -----------------------
  fetchHorarios() {
    this.loadingTable = true;
    this.api.get<any>('HorarioNoLaborales/Consultar_HorariosNoLaborales')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let items: any[] = [];
          if (Array.isArray(response)) items = response;
          else if (response?.data) items = response.data;
          else if (response?.items) items = response.items;
          else {
            const arr = Object.values(response).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }

          this.data = items.map(item => HorariosUniversidadModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar horarios', err);
          this.showError(this.translate.instant('HORARIOS_UNIVERSIDAD.ERROR_CARGAR'));
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // BÚSQUEDA
  // -----------------------
  filterHorarios() {
    if (!this.filtro.trim()) {
      this.showWarning(this.translate.instant('HORARIOS_UNIVERSIDAD.ADVERTENCIA_BUSQUEDA'));
      return;
    }

    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());

    this.api.get<any>(`HorariosUniversidad/Consultar_HorariosUniversidadPorNombre?nombreComponente=${q}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let items: any[] = [];
          if (Array.isArray(response)) items = response;
          else if (response?.data) items = response.data;
          else if (response?.items) items = response.items;
          else {
            const arr = Object.values(response).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }

          this.data = items.map(item => HorariosUniversidadModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error en búsqueda de horarios', err);
          this.showError(this.translate.instant('HORARIOS_UNIVERSIDAD.ERROR_BUSQUEDA'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // CRUD
  // -----------------------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;
    const isUpdate = this.isEditing && this.model.id > 0;
    const payload = this.model.toJSON();
    const endpoint = isUpdate
      ? 'HorarioNoLaborales/actualiza_HorariosNoLaborales'
      : 'HorarioNoLaborales/crear_HorariosNoLaborales';

    const obs = isUpdate
      ? this.api.put<any>(endpoint, payload)
      : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchHorarios();
        this.resetForm(form);
        this.loading = false;

        if (response.exito) {
          this.showSuccess(response.exito);
        } else if (response.error) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('HORARIOS_UNIVERSIDAD.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error('Error al guardar horario', err);
        this.showError(this.translate.instant('HORARIOS_UNIVERSIDAD.ERROR_PROCESAR'));
        this.loading = false;
      }
    });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('HORARIOS_UNIVERSIDAD.CONFIRMAR_ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`HorarioNoLaborales/Eliminar_Horario/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchHorarios();
          this.showSuccess(this.translate.instant('HORARIOS_UNIVERSIDAD.ELIMINADO_EXITO'));
        },
        error: (err) => {
          console.error('Error al eliminar horario', err);
          this.showError(this.translate.instant('HORARIOS_UNIVERSIDAD.ERROR_ELIMINAR'));
        }
      });
  }

  startEdit(item: HorariosUniversidadModel) {
    this.model = Object.assign(new HorariosUniversidadModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(form?: NgForm) {
    this.model = new HorariosUniversidadModel();
    this.isEditing = false;
    form?.resetForm({
      fechaNoLaboral: '',
      componenteId: 0,
      nombreComponente: ''
    });
  }

  // -----------------------
  // PAGINACIÓN
  // -----------------------
  calculateTotalPages() {
    const totalItems = this.filteredData.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updatePagedData() {
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

  // -----------------------
  // TOASTS / CONFIRMS
  // -----------------------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('HORARIOS_UNIVERSIDAD.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('HORARIOS_UNIVERSIDAD.ERROR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('HORARIOS_UNIVERSIDAD.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('HORARIOS_UNIVERSIDAD.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('HORARIOS_UNIVERSIDAD.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('HORARIOS_UNIVERSIDAD.CANCELAR'),
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
