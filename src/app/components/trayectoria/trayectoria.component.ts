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
import { TrayectoriaModel } from '../../models/TrayectoriaModel';

@Component({
  selector: 'app-trayectoria',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster],
  templateUrl: './trayectoria.component.html',
  styleUrls: ['./trayectoria.component.css'],
  providers: [ConfirmationService]
})
export class TrayectoriaComponent implements OnInit, OnDestroy {
  data: TrayectoriaModel[] = [];
  filteredData: TrayectoriaModel[] = [];
  pagedData: TrayectoriaModel[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: TrayectoriaModel = new TrayectoriaModel();
  isEditing = false;

  estrategias: any[] = [];
  periodos: any[] = [];
  planesEstudio: any[] = [];
  programas: any[] = [];
  componentes: any[] = [];
  componentesFiltro: any[] = [];

  selectedProgramaCodigo: string | null = '';
  selectedPlanEstudioId: number | null = null;
  selectedComponenteCodigo: string | null = '';
  loadingConsulta = false;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    //this.fetchTrayectorias();
    this.fetchCombos();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchCombos() {
    this.fetchEstrategias();
    this.fetchPeriodos();
    this.fetchPlanesEstudio();
    this.fetchProgramas();
  }

  private fetchEstrategias() {
    this.api.get<any>('Estrategia/Consultar_Estrategias')
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
          this.estrategias = items.map(item => ({ id: item.id, nombre: item.nombre }));
        },
        error: (err) => {
          console.error('Error al cargar estrategias', err);
          this.estrategias = [];
        }
      });
  }

  private fetchPeriodos() {
    this.api.get<any>('Periodos/Consultar_Periodos')
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
          this.periodos = items.map(item => ({ id: item.id, nombre: item.nombre }));
        },
        error: (err) => {
          console.error('Error al cargar periodos', err);
          this.periodos = [];
        }
      });
  }

  private fetchPlanesEstudio() {
    this.api.get<any>('PlanesEstudio/Consultar_Planes')
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
          this.planesEstudio = items.map(item => ({ id: item.id, nombre: item.nombre }));
        },
        error: (err) => {
          console.error('Error al cargar planes de estudio', err);
          this.planesEstudio = [];
        }
      });
  }

  private fetchProgramas() {
    this.api.getExterno<any>('orisiga/programacademico/')
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
          this.programas = items.map(item => ({ id: item.programa_codigo, nombre: item.programa_nombre }));
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.programas = [];
        }
      });
  }

  fetchComponentesPorPlan(programaId: string, planEstudioId: number) {
    if (!planEstudioId) {
      this.componentes = [];
      this.showWarning('Debe seleccionar un plan de estudio válido.');
      return;
    }

    this.api.getExterno<any>(`orisiga/planestutrayectorias/?programa=${programaId}&planestudio=${planEstudioId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];
          if (Array.isArray(resp)) {
            items = resp;
          } else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp.data)) {
              items = resp.data;
            } else if (Array.isArray(resp.items)) {
              items = resp.items;
            } else {
              const arr = Object.values(resp).find(v => Array.isArray(v));
              if (Array.isArray(arr)) {
                items = arr;
              }
            }
          }

          this.componentes = items.map(item => ({
            codigo: item.componente_codigo,
            nombre: item.componente_nombre
          }));

          if (this.componentes.length === 0) {
            this.showWarning('No se encontraron componentes para el plan seleccionado.');
          }
        },
        error: (err) => {
          console.error('Error al cargar componentes por plan', err);
          this.componentes = [];
          this.showError('Error al cargar componentes. Intente nuevamente.');
        }
      });
  }

  fetchComponentesPorPlanFiltro(programaId: string, planEstudioId: number) {
    if (!planEstudioId) {
      this.componentes = [];
      this.showWarning('Debe seleccionar un plan de estudio válido.');
      return;
    }

    this.api.getExterno<any>(`orisiga/planestutrayectorias/?programa=${programaId}&planestudio=${planEstudioId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];
          if (Array.isArray(resp)) {
            items = resp;
          } else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp.data)) {
              items = resp.data;
            } else if (Array.isArray(resp.items)) {
              items = resp.items;
            } else {
              const arr = Object.values(resp).find(v => Array.isArray(v));
              if (Array.isArray(arr)) {
                items = arr;
              }
            }
          }

          this.componentesFiltro = items.map(item => ({
            codigo: item.componente_codigo,
            nombre: item.componente_nombre
          }));

          if (this.componentesFiltro.length === 0) {
            this.showWarning('No se encontraron componentes para el plan seleccionado.');
          }
        },
        error: (err) => {
          console.error('Error al cargar componentes por plan', err);
          this.componentesFiltro = [];
          this.showError('Error al cargar componentes. Intente nuevamente.');
        }
      });
  }

  onPlanEstudioChange() {
    if (this.model.planestudioid) {
      this.fetchComponentesPorPlan(this.model.programa,this.model.planestudioid);
      this.model.componenteCodigo = '';
    } else {
      this.componentes = [];
      this.model.componenteCodigo = '';
    }
  }

  onPlanEstudioFiltroChange() {
    if (this.selectedPlanEstudioId) {
      this.fetchComponentesPorPlanFiltro(this.selectedProgramaCodigo!,this.selectedPlanEstudioId);
      this.selectedComponenteCodigo = '';
    } else {
      this.componentesFiltro = [];
      this.selectedComponenteCodigo = '';
    }
  }

  fetchTrayectorias() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('Trayectoria/Consultar_Trayectorias')
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
            TrayectoriaModel.fromJSON
              ? TrayectoriaModel.fromJSON(item)
              : Object.assign(new TrayectoriaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar trayectorias', err);
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

  filterTrayectorias() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }
    this.loadingTable = true;

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Trayectoria/Consultar_TrayectoriaGeneral?componenteNombre=${q}`)
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
            TrayectoriaModel.fromJSON ? TrayectoriaModel.fromJSON(item) : Object.assign(new TrayectoriaModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar trayectorias', err);
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

    if (!this.model.componenteCodigo?.trim() || !this.model.componenteNombre?.trim()) {
      this.error = 'Código y nombre del componente son obligatorios.';
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      usuarioid: this.model.usuarioid,
      componenteCodigo: this.model.componenteCodigo,
      estrategiaid: Number(this.model.estrategiaid),
      periodo: Number(this.model.periodo),
      fecha: this.model.fecha,
      areaformacion: this.model.areaformacion,
      totalcreditosprograma: Number(this.model.totalcreditosprograma),
      componenteNombre: this.model.componenteNombre,
      programa: this.model.programa,
      planestudioid: Number(this.model.planestudioid),
      plaFacultad: this.model.plaFacultad
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Trayectoria/actualiza_Trayectoria' : 'Trayectoria/crear_Trayectoria';

    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchTrayectorias();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError('Respuesta desconocida del servidor.');
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar trayectoria' : 'Error al crear trayectoria', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo');
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new TrayectoriaModel();
    this.isEditing = false;
    if (form) form.resetForm({
      usuarioid: 1,
      componenteCodigo: '',
      estrategiaid: 0,
      periodo: 0,
      fecha: '',
      areaformacion: '',
      totalcreditosprograma: 0,
      componenteNombre: '',
      programa: '',
      planestudioid: 0,
      plaFacultad: ''
    });
  }

  startEdit(item: TrayectoriaModel) {
    this.model = Object.assign(new TrayectoriaModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`Trayectoria/Eliminar_Trayectoria/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchTrayectorias();
          this.showSuccess('Se eliminó el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar trayectoria, el registro se encuentra asociado', err);
          this.showError('Error al eliminar trayectoria, el registro se encuentra asociado');
        }
      });
  }

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

  trackByIndex(_: number, item: TrayectoriaModel) {
    return item?.id ?? _;
  }

  getNombreEstrategia(id: number): string {
    const estrategia = this.estrategias.find(e => e.id === id);
    return estrategia ? estrategia.nombre : '';
  }

  getNombrePeriodo(id: number): string {
    const periodo = this.periodos.find(p => p.id === id);
    return periodo ? periodo.nombre : '';
  }

  getNombrePlanEstudio(id: number): string {
    const plan = this.planesEstudio.find(p => p.id === id);
    return plan ? plan.nombre : '';
  }

  getNombrePrograma(nombre: string): string {
    const prog = this.programas.find(p => p.nombre === nombre);
    return prog ? prog.nombre : '';
  }

  getNombreComponente(codigo: string): string {
    const comp = this.componentes.find(c => c.codigo === codigo);
    return comp ? comp.nombre : '';
  }

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
