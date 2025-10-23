import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { GenericApiService } from '../../services/generic-api.service';
import { AsignacionEstrategiaModel } from '../../models/AsignacionEstrategiaModel';

@Component({
  selector: 'app-asignacion-estrategia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './asignacion-estrategia.component.html',
  styleUrls: ['./asignacion-estrategia.component.css'],
  providers: [ConfirmationService]
})
export class AsignacionEstrategiaComponent implements OnInit, OnDestroy {
  @Input() idConvocatoria!: any;

  data: AsignacionEstrategiaModel[] = [];
  filteredData: AsignacionEstrategiaModel[] = [];
  pagedData: AsignacionEstrategiaModel[] = [];

  // catálogos
  procesos: any[] = [];
  estrategias: any[] = [];
  docentes: any[] = [];
  componentes: any[] = [];

  // estado UI
  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: AsignacionEstrategiaModel = new AsignacionEstrategiaModel();
  isEditing = false;

  // paginación
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];
  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    // catálogos
    this.fetchProcesos();
    this.fetchEstrategias();
    this.fetchDocentes();
    this.fetchComponentes();

    // tabla
    this.fetchAsignaciones();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchAsignaciones();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- catálogos ----------
  private fetchProcesos() {
    this.api.get<any>('Proceso/Consultar_Procesos')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = Array.isArray(resp) ? resp : (resp?.data || resp?.items || []);
          if (!Array.isArray(items)) {
            const arr = Object.values(resp || {}).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
          this.procesos = items.map(x => ({ id: x.id, nombre: x.nombre ?? x.descripcion ?? `Proceso ${x.id}` }));
        },
        error: () => { this.procesos = []; }
      });
  }

  private fetchEstrategias() {
    this.api.get<any>('Estrategia/Consultar_Estrategias')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = Array.isArray(resp) ? resp : (resp?.data || resp?.items || []);
          if (!Array.isArray(items)) {
            const arr = Object.values(resp || {}).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
          this.estrategias = items.map(x => ({ id: x.id, nombre: x.nombre ?? `Estrategia ${x.id}` }));
        },
        error: () => { this.estrategias = []; }
      });
  }

  private fetchDocentes() {
    this.api.get<any>('Docentes/Consultar_Docentes')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = Array.isArray(resp) ? resp : (resp?.data || resp?.items || []);
          if (!Array.isArray(items)) {
            const arr = Object.values(resp || {}).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
          this.docentes = items.map(x => ({ id: x.id, nombre: x.nombre ?? x.nombreCompleto ?? `Docente ${x.id}` }));
        },
        error: () => { this.docentes = []; }
      });
  }

  private fetchComponentes() {
    this.api.get<any>('Componentes/Consultar_Componentes')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = Array.isArray(resp) ? resp : (resp?.data || resp?.items || []);
          if (!Array.isArray(items)) {
            const arr = Object.values(resp || {}).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
          this.componentes = items.map(x => ({ id: x.id, nombre: x.nombre ?? `Componente ${x.id}` }));
        },
        error: () => { this.componentes = []; }
      });
  }

  // ---------- CRUD / listado ----------
  fetchAsignaciones() {
    this.error = null;
    this.loadingTable = true;

    const base = 'AsignacionEstrategia/Consultar_Asignaciones';
    const url = (this.idConvocatoria == 'undefined' || this.idConvocatoria == null)
      ? base
      : `${base}?idConvocatoria=${this.idConvocatoria}`;

    this.api.get<any>(url)
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
            AsignacionEstrategiaModel.fromJSON ? AsignacionEstrategiaModel.fromJSON(item) : Object.assign(new AsignacionEstrategiaModel(), item)
          );
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar asignaciones', err);
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

  filterAsignaciones() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }

    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());

    this.api.get<any>(`AsignacionEstrategia/Consultar_AsignacionPorNombre?nombre=${q}`)
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
            AsignacionEstrategiaModel.fromJSON ? AsignacionEstrategiaModel.fromJSON(item) : Object.assign(new AsignacionEstrategiaModel(), item)
          );
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar asignaciones', err);
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

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.procesoId || !this.model.estrategiaId || !this.model.docenteId || !this.model.componenteId) {
      this.showWarning('Debe seleccionar Proceso, Estrategia, Docente y Componente.');
      return;
    }
    if (!this.model.fechaTrabajo?.trim() || !this.model.fechaEvaluacion?.trim()) {
      this.showWarning('Debe seleccionar ambas fechas: Trabajo y Evaluación.');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id > 0;
    const payload = this.model.toJSON();

    const endpoint = isUpdate ? 'AsignacionEstrategia/Actualizar_Asignacion' : 'AsignacionEstrategia/Crear_Asignacion';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchAsignaciones();
        this.resetForm(form);
        this.loading = false;

        if (response?.exito && (response?.datos !== false)) {
          this.showSuccess(response.exito);
        } else if (response?.error && response?.datos === false) {
          this.showError(response.error);
        } else {
          this.showSuccess('¡Operación exitosa!');
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar asignación' : 'Error al crear asignación', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo');
      }
    });
  }

  startEdit(item: AsignacionEstrategiaModel) {
    this.model = new AsignacionEstrategiaModel(
      item.id, item.procesoId, item.estrategiaId, item.docenteId, item.componenteId,
      item.generaCertificado, item.obtuvoInsignia, item.fechaTrabajo, item.fechaEvaluacion,
      item.estado, item.nombreProceso, item.nombreEstrategia, item.nombreDocente
    );
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`AsignacionEstrategia/Eliminar_Asignacion/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchAsignaciones();
          this.showSuccess('Se eliminó el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar asignación', err);
          this.showError('Error al eliminar asignación, el registro se encuentra asociado');
        }
      });
  }

  resetForm(form?: NgForm) {
    this.model = new AsignacionEstrategiaModel();
    this.isEditing = false;
    if (form) {
      form.resetForm({
        procesoId: 0,
        estrategiaId: 0,
        docenteId: 0,
        componenteId: 0,
        generaCertificado: false,
        obtuvoInsignia: false,
        fechaTrabajo: '',
        fechaEvaluacion: ''
      });
    }
  }

  // ---------- paginación ----------
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

  trackByIndex(_: number, item: AsignacionEstrategiaModel) {
    return item?.id ?? _;
  }

  // ---------- toasters / confirm ----------
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

  validarRangoFechas() {
    const ft = this.model.fechaTrabajo ? new Date(this.model.fechaTrabajo) : null;
    const fe = this.model.fechaEvaluacion ? new Date(this.model.fechaEvaluacion) : null;
    this.dateRangeInvalid = !!(ft && fe && fe < ft);
  }
}
