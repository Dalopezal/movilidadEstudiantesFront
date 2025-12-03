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

  // -----------------------
  // Tabla de trayectorias (parte inferior / lista histórica)
  // -----------------------
  data: TrayectoriaModel[] = [];
  filteredData: TrayectoriaModel[] = [];
  pagedData: TrayectoriaModel[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;          // loading del botón Ingresar/Actualizar
  loadingTable = false;     // loading de tabla
  loadingConsulta = false;  // loading del botón Consultar
  error: string | null = null;
  filtro: string = '';

  // -----------------------
  // Modelo de ejecución (lado derecho)
  // -----------------------
  model: TrayectoriaModel = new TrayectoriaModel();
  isEditing = false;           // controla si el botón es Ingresar o Actualizar
  ejecucionTieneDatos = false; // true si consultar_TrayectoriaEjecucion trajo data

  // -----------------------
  // Filtros de cabecera (lado izquierdo, planeación)
  // -----------------------
  selectedProgramaCodigo: string | null = null;
  selectedPlanEstudioId: number | null = null;
  selectedComponenteCodigo: string | null = null;

  // combos
  programas: any[] = [];
  planesEstudio: any[] = [];
  componentes: any[] = [];
  estrategias: any[] = [];
  facultades: any[] = [];

  planeacionFields = [
    { key: 'nombreEstrategia', label: 'Nombre de estrategia' },
    { key: 'nombreEstado', label: 'Nombre de estado' },
    { key: 'nombreInstitucion', label: 'Nombre de institución' },
    { key: 'nombreFacultad', label: 'Nombre de facultad' },
    { key: 'nombrePrograma', label: 'Nombre de programa' },
    { key: 'nombreComponente', label: 'Nombre de componente' },
    { key: 'grupo', label: 'Grupo' },
    { key: 'planEstudio', label: 'Plan de estudio' },
    { key: 'fechainicio', label: 'Fecha de inicio' },
    { key: 'fechafinal', label: 'Fecha final' },
    { key: 'creditos', label: 'Créditos' },
    { key: 'semestre', label: 'Semestre' }
  ];

  // datos de planeación consultada (Nombre programa, componente, etc.)
  planeacionData: any = null;

  @Input() idConvocatoria!: any;

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService
  ) {}

  // ===================== CICLO DE VIDA =====================
  ngOnInit() {
    this.fetchTrayectorias();  // tabla
    this.loadProgramas();      // combo programas cabecera
    this.loadEstrategias();    // combo estrategias (lado derecho)
    this.loadFacultades();     // combo facultades (lado derecho)
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchTrayectorias();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================== CARGA DE COMBOS CABECERA =====================

  // Programas (combo "Selección Programa")
  loadProgramas() {
    this.api.getExterno<any>('orisiga/programacademico/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (Array.isArray(resp)) {
            this.programas = resp;
          } else if (resp?.data && Array.isArray(resp.data)) {
            this.programas = resp.data;
          } else if (resp?.items && Array.isArray(resp.items)) {
            this.programas = resp.items;
          } else {
            this.programas = [];
          }
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.programas = [];
        }
      });
  }

  // Cuando cambia programa → limpiamos plan y componente
  onProgramaChange() {
    this.selectedPlanEstudioId = null;
    this.selectedComponenteCodigo = null;
    this.planesEstudio = [];
    this.componentes = [];
    if (this.selectedProgramaCodigo) {
      this.loadPlanesYComponentes();
    }
  }

  // Plan de estudio es numérico, pero lo cargamos desde el API
  loadPlanesYComponentes() {
    if (!this.selectedProgramaCodigo || !this.selectedPlanEstudioId) {
      return;
    }

    this.api.getExterno<any>(`orisiga/planestutrayectorias/?programa=${this.selectedProgramaCodigo}&planestudio=${this.selectedPlanEstudioId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];

          if (Array.isArray(resp)) {
            items = resp;
          } else if (resp?.data && Array.isArray(resp.data)) {
            items = resp.data;
          } else if (resp?.items && Array.isArray(resp.items)) {
            items = resp.items;
          } else {
            const arr = Object.values(resp || {}).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }

          // Mapear los campos a los nombres esperados por distinctBy
          const mappedItems = items.map(item => ({
            planEstudioId: item.plan_id,
            componenteCodigo: item.componente_codigo,
            componenteNombre: item.componente_nombre,
            programa: item.programa_nombre,
            facultad: item.facultad,
            // Otros campos si son necesarios...
          }));

          this.planesEstudio = this.distinctBy(mappedItems, 'planEstudioId');
          this.componentes = this.distinctBy(mappedItems, 'componenteCodigo');
        },
        error: (err) => {
          console.error('Error al cargar planestudio_trayectorias', err);
          this.planesEstudio = [];
          this.componentes = [];
        }
      });
  }

  // Cuando cambia plan de estudio manualmente (campo numérico) → recargar componentes
  onPlanEstudioChange() {
    this.selectedComponenteCodigo = null;
    this.componentes = [];
    if (this.selectedProgramaCodigo && this.selectedPlanEstudioId) {
      this.loadPlanesYComponentes();
    }
  }

  // ===================== COMBOS EJECUCIÓN (DERECHA) =====================

  loadEstrategias() {
    this.api.get<any>('Estrategias/Consultar_Estrategias')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (Array.isArray(resp)) {
            this.estrategias = resp;
          } else if (resp?.data && Array.isArray(resp.data)) {
            this.estrategias = resp.data;
          } else if (resp?.items && Array.isArray(resp.items)) {
            this.estrategias = resp.items;
          } else {
            this.estrategias = [];
          }
        },
        error: (err) => {
          console.error('Error al cargar estrategias', err);
          this.estrategias = [];
        }
      });
  }

  loadFacultades() {
    this.api.get<any>('Facultad/Consultar_Facultades')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (Array.isArray(resp)) {
            this.facultades = resp;
          } else if (resp?.data && Array.isArray(resp.data)) {
            this.facultades = resp.data;
          } else if (resp?.items && Array.isArray(resp.items)) {
            this.facultades = resp.items;
          } else {
            this.facultades = [];
          }
        },
        error: (err) => {
          console.error('Error al cargar facultades', err);
          this.facultades = [];
        }
      });
  }

  // ===================== BOTÓN CONSULTAR (CABECERA) =====================

  onConsultar() {
    if (!this.selectedProgramaCodigo || !this.selectedPlanEstudioId || !this.selectedComponenteCodigo) {
      this.showWarning('Debe seleccionar programa, plan de estudio y componente.');
      return;
    }

    this.loadingConsulta = true;
    this.planeacionData = null;
    this.ejecucionTieneDatos = false;
    this.isEditing = false;
    this.model = new TrayectoriaModel();

    const params = {
      programaCodigo: this.selectedProgramaCodigo,
      planEstudioId: this.selectedPlanEstudioId,
      componenteCodigo: this.selectedComponenteCodigo
    };

    // 1) Consultar planeación / asignación componente
    this.api.post<any>('Trayectoria/Consutar_AsignacionComponenteTrayectoria', params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          // guardamos datos de planeación para mostrar en el panel izquierdo
          this.planeacionData = Array.isArray(resp)
            ? (resp[0] || null)
            : (resp?.data && Array.isArray(resp.data) ? resp.data[0] : resp);

          // 2) Consultar ejecución
          this.loadEjecucion(params);
        },
        error: (err) => {
          console.error('Error en Consultar_AsignacionComponenteTrayectoria', err);
          this.loadingConsulta = false;
          this.showError('No se pudo consultar la planeación de trayectoria.');
        }
      });
  }

  private loadEjecucion(paramsBase: any) {
    this.api.post<any>('Trayectoria/consultar_TrayectoriaEjecucion', paramsBase)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let item: any = null;
          if (Array.isArray(resp)) item = resp[0] || null;
          else if (resp?.data && Array.isArray(resp.data)) item = resp.data[0] || null;
          else item = resp;

          if (item) {
            // Existe ejecución → llenar form con esos datos, modo Actualizar
            this.ejecucionTieneDatos = true;
            this.isEditing = true;
            this.model = TrayectoriaModel.fromJSON
              ? TrayectoriaModel.fromJSON(item)
              : Object.assign(new TrayectoriaModel(), item);
          } else {
            // No hay ejecución → tomar datos base de planestudio_trayectorias
            this.ejecucionTieneDatos = false;
            this.isEditing = false;
            this.loadBaseFromPlanEstudio(paramsBase);
          }

          this.loadingConsulta = false;
        },
        error: (err) => {
          console.error('Error en consultar_TrayectoriaEjecucion', err);
          this.loadingConsulta = false;
          this.showError('No se pudo consultar la ejecución de trayectoria.');
        }
      });
  }

  // Si no hay ejecución, tomamos la info base de planestudio_trayectorias
  private loadBaseFromPlanEstudio(paramsBase: any) {
    this.api.post<any>('Trayectoria/planestudio_trayectorias', paramsBase)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let item: any = null;
          if (Array.isArray(resp)) item = resp[0] || null;
          else if (resp?.data && Array.isArray(resp.data)) item = resp.data[0] || null;
          else item = resp;

          if (!item) {
            this.showWarning('No se encontraron datos base de plan de estudio para la trayectoria.');
            return;
          }

          // Mapear campos base al modelo de ejecución
          const m = new TrayectoriaModel();
          m.usuarioid = item.usuarioid ?? 0;
          m.componenteCodigo = item.componenteCodigo ?? paramsBase.componenteCodigo;
          m.estrategiaid = item.estrategiaid ?? 0;
          m.periodo = item.periodo ?? 0;
          m.fecha = item.fecha ?? '';
          m.areaformacion = item.areaformacion ?? '';
          m.totalcreditosprograma = item.totalcreditosprograma ?? item.creditos ?? 0;
          m.componenteNombre = item.componenteNombre ?? item.nombreComponente ?? '';
          m.programa = item.programa ?? '';
          m.planestudioid = item.planestudioid ?? paramsBase.planEstudioId;
          m.plaFacultad = item.plaFacultad ?? '';

          this.model = m;
        },
        error: (err) => {
          console.error('Error al cargar base desde planestudio_trayectorias', err);
          this.showError('No se pudo cargar la información base del plan de estudio.');
        }
      });
  }

  // ===================== CRUD EJECUCIÓN (INGRESAR / ACTUALIZAR) =====================

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.selectedProgramaCodigo || !this.selectedPlanEstudioId || !this.selectedComponenteCodigo) {
      this.showWarning('Debe consultar primero una trayectoria (programa, plan y componente).');
      return;
    }

    if (!this.model.componenteCodigo?.trim() || !this.model.estrategiaid || !this.model.planestudioid) {
      this.error = 'Componente, estrategia y plan de estudio son obligatorios.';
      this.showWarning(this.error);
      return;
    }

    this.loading = true;
    this.error = null;

    const payload: any = {
      id: this.isEditing && this.model.id ? this.model.id : undefined,
      usuarioid: this.model.usuarioid,
      componenteCodigo: this.model.componenteCodigo,
      estrategiaid: this.model.estrategiaid,
      periodo: this.model.periodo,
      fecha: this.model.fecha,
      areaformacion: this.model.areaformacion,
      totalcreditosprograma: this.model.totalcreditosprograma,
      componenteNombre: this.model.componenteNombre,
      programa: this.model.programa,
      planestudioid: this.model.planestudioid,
      plaFacultad: this.model.plaFacultad
    };

    const endpoint = this.isEditing ? 'Trayectoria/actualizar_trayectoria' : 'Trayectoria/Ingresar_trayectoria';
    const obs = this.isEditing
      ? this.api.put<any>(endpoint, payload)
      : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchTrayectorias(); // refrescar tabla histórica
        this.loading = false;

        if (response?.exito && response?.datos) {
          this.showSuccess(response.exito);
        } else if (response?.error && response?.datos === false) {
          this.showError(response.error);
        } else {
          this.showSuccess(this.isEditing ? 'Trayectoria actualizada correctamente' : 'Trayectoria ingresada correctamente');
        }
      },
      error: (err) => {
        console.error(this.isEditing ? 'Error al actualizar trayectoria' : 'Error al ingresar trayectoria', err);
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo');
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new TrayectoriaModel();
    this.isEditing = false;
    this.ejecucionTieneDatos = false;
    if (form) {
      form.resetForm({
        componenteCodigo: '',
        estrategiaid: 0,
        periodo: 0,
        fecha: '',
        areaformacion: '',
        totalcreditosprograma: 0,
        planestudioid: 0,
        plaFacultad: ''
      });
    }
  }

  // ===================== TABLA HISTÓRICA (ABAJO / DERECHA) =====================

  fetchTrayectorias() {
    this.error = null;
    this.loadingTable = true;

    this.api.get<any>('Trayectoria/Consultar_Trayectoria')
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

    const q = this.filtro.toLowerCase().trim();
    this.filteredData = this.data.filter(item =>
      item.componenteNombre?.toLowerCase().includes(q) ||
      item.programa?.toLowerCase().includes(q) ||
      item.areaformacion?.toLowerCase().includes(q)
    );

    this.currentPage = 1;
    this.calculateTotalPages();
    this.updatePagedData();
  }

  async deleteItem(id: number | undefined) {
    if (!id) {
      this.showError('No se encontró el identificador del registro.');
      return;
    }

    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro de trayectoria?');
    if (!confirmado) return;

    this.api.delete(`Trayectoria/Eliminar_Trayectoria/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchTrayectorias();
          this.showSuccess('Se eliminó el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar trayectoria', err);
          this.showError('Error al eliminar trayectoria, el registro se encuentra asociado');
        }
      });
  }

  startEdit(item: TrayectoriaModel) {
    this.model = Object.assign(new TrayectoriaModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // dentro de la clase TrayectoriaComponent
  labelFor(key: string): string {
    const labels: any = {
      nombreEstrategia: 'Nombre de estrategia',
      nombreEstado: 'Nombre de estado',
      nombreInstitucion: 'Nombre de institución',
      nombreFacultad: 'Nombre de facultad',
      nombrePrograma: 'Nombre de programa',
      nombreComponente: 'Nombre de componente',
      grupo: 'Grupo',
      planEstudio: 'Plan de estudio',
      fechainicio: 'Fecha de inicio',
      fechafinal: 'Fecha final',
      creditos: 'Créditos',
      semestre: 'Semestre',
      creditos2: 'Créditos'
    };
    return labels[key] || key;
  }

  getPlaneacionValue(key: string): any {
    if (!this.planeacionData) return '—';
    // posibles mapeos según tu API
    const map: any = {
      nombreEstrategia: this.planeacionData.nombreEstrategia || this.planeacionData.estrategiaNombre,
      nombreEstado: this.planeacionData.nombreEstado || this.planeacionData.estadoNombre,
      nombreInstitucion: this.planeacionData.nombreInstitucion || this.planeacionData.institucionNombre,
      nombreFacultad: this.planeacionData.nombreFacultad || this.planeacionData.plaFacultad,
      nombrePrograma: this.planeacionData.nombrePrograma || this.planeacionData.programa,
      nombreComponente: this.planeacionData.nombreComponente || this.planeacionData.componenteNombre,
      grupo: this.planeacionData.grupo,
      planEstudio: this.planeacionData.planEstudio || this.planeacionData.planestudioid,
      fechainicio: this.planeacionData.fechainicio ? (this.planeacionData.fechainicio | 0, this.planeacionData.fechainicio) : '—',
      fechafinal: this.planeacionData.fechafinal || '—',
      creditos: this.planeacionData.creditos || this.planeacionData.totalcreditosprograma || '—',
      semestre: this.planeacionData.semestre || '—',
      creditos2: this.planeacionData.creditos2 || this.planeacionData.creditos || '—',
      observacion: this.planeacionData?.observacion || '—'
    };
    return map[key] ?? '—';
  }

  // ===================== Paginación =====================

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

  // ===================== Utilidades =====================

  private distinctBy(arr: any[], field: string): any[] {
    const map = new Map<any, any>();
    for (const it of arr) {
      const key = (it as any)[field];
      if (key !== undefined && !map.has(key)) {
        map.set(key, it);
      }
    }
    return Array.from(map.values());
  }

  // ===================== Toasters / Confirm =====================

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
