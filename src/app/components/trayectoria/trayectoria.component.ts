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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-trayectoria',
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

  private storageHandler = this.onStorageChange.bind(this);

  private destroy$ = new Subject<void>();
  usuario:any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchTrayectorias();
    this.fetchCombos();

    window.addEventListener("storage", this.storageHandler);
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
  }

  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
  }

  ngOnDestroy() {
    window.removeEventListener("storage", this.storageHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchCombos() {
    this.fetchEstrategias();
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

  fetchComponentesPorPlan(programaId: string, planEstudioId: number): Observable<any[]> {
  if (!planEstudioId) {
    this.componentes = [];
    this.showWarning(this.translate.instant('TRAYECTORIAS.ADVERTENCIA_PLAN'));
    return of([]);
  }

  return this.api.getExterno<any>(`orisiga/planestutrayectorias/?programa=${programaId}&planestudio=${planEstudioId}`)
    .pipe(
      takeUntil(this.destroy$),
      map((resp) => {
        let items: any[] = [];
        if (Array.isArray(resp)) {
          items = resp;
        } else if (resp && typeof resp === 'object') {
          if (Array.isArray(resp.data)) items = resp.data;
          else if (Array.isArray(resp.items)) items = resp.items;
          else {
            const arr = Object.values(resp).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
        }

        return items.map(item => ({
          codigo: item.componente_codigo,
          nombre: item.componente_nombre,
          semestre: item.semestre ?? item.semestre_ucm ?? null,
          creditos: item.creditos ?? item.creditos_ucm ?? null,
          facultad: item.facultad ?? item.plaFacultad ?? null,
          area_formacion: item.area_formacion ?? item.act_interdetalle ?? item.act_internacional ?? item.areaformacion ?? ''
        }));
      }),
      tap((list) => {
        this.componentes = list;
        if (this.componentes.length === 0) {
          this.showWarning(this.translate.instant('TRAYECTORIAS.NO_COMPONENTES'));
        }
      })
    );
}

  fetchComponentesPorPlanFiltro(programaId: string, planEstudioId: number) {
    if (!planEstudioId) {
      this.componentes = [];
      this.showWarning(this.translate.instant('TRAYECTORIAS.ADVERTENCIA_PLAN'));
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
            this.showWarning(this.translate.instant('TRAYECTORIAS.NO_COMPONENTES'));
          }
        },
        error: (err) => {
          console.error('Error al cargar componentes por plan', err);
          this.componentesFiltro = [];
          this.showError(this.translate.instant('TRAYECTORIAS.ERROR_COMPONENTES'));
        }
      });
  }

  onPlanEstudioChange() {
  if (this.model.planestudioid) {
    this.fetchComponentesPorPlan(this.model.programa, Number(this.model.planestudioid))
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    this.model.componenteCodigo = '';
  } else {
    this.componentes = [];
    this.model.componenteCodigo = '';
  }
}

  onPlanEstudioFiltroChange() {
    if (this.selectedPlanEstudioId) {
      this.fetchComponentesPorPlanFiltro(this.selectedProgramaCodigo!, this.selectedPlanEstudioId);
      this.selectedComponenteCodigo = '';
    } else {
      this.componentesFiltro = [];
      this.selectedComponenteCodigo = '';
    }
  }

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
          this.error = this.translate.instant('TRAYECTORIAS.ERROR_CARGAR');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('TRAYECTORIAS.ERROR_CARGAR'));
          this.loadingTable = false;
        }
      });
  }

  filterTrayectorias() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('TRAYECTORIAS.ADVERTENCIA_BUSQUEDA'));
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
          this.error = this.translate.instant('TRAYECTORIAS.ERROR_CARGAR');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('TRAYECTORIAS.ERROR_CARGAR'));
          this.loadingTable = false;
        }
      });
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      usuarioid: this.usuario.idUsuario,
      componenteCodigo: this.model.componenteCodigo,
      estrategiaid: Number(this.model.estrategiaid),
      periodo: Number(this.model.periodo),
      fecha: this.model.fecha,
      area_formacion: this.model.area_formacion,
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
          this.showError(this.translate.instant('TRAYECTORIAS.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar trayectoria' : 'Error al crear trayectoria', err);
        this.error = this.translate.instant('TRAYECTORIAS.ERROR_PROCESAR');
        this.loading = false;
        this.showError(this.translate.instant('TRAYECTORIAS.ERROR_PROCESAR'));
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
      area_formacion: '',
      totalcreditosprograma: 0,
      componenteNombre: '',
      programa: '',
      planestudioid: 0,
      plaFacultad: '',
      semestre: null
    });
  }

  startEdit(item: TrayectoriaModel) {
  this.model = Object.assign(new TrayectoriaModel(), item);
  this.isEditing = true;

  // Normaliza posibles claves legacy
  if ((this.model as any).areaformacion && !this.model.area_formacion) {
    this.model.area_formacion = (this.model as any).areaformacion;
  }

  // Si ya hay componentes cargados, poblar directamente
  const found = this.componentes?.find(c => c.codigo === this.model.componenteCodigo);
  if (found) {
    this.populateFromComponente(found);
  } else {
    // Si no hay componentes, intenta cargarlos y luego poblar cuando lleguen
    if (this.model.programa && this.model.planestudioid) {
      this.fetchComponentesPorPlan(this.model.programa, Number(this.model.planestudioid))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (list) => {
            const f = list.find(c => c.codigo === this.model.componenteCodigo);
            if (f) {
              this.populateFromComponente(f);
            }
            // Si no se encontró, quizás el item trae su propia area_formacion (ya la normalizamos arriba)
          },
          error: (err) => {
            console.error('Error cargando componentes en startEdit', err);
          }
        });
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('TRAYECTORIAS.CONFIRMAR_ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`Trayectoria/Eliminar_Trayectoria/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchTrayectorias();
          this.showSuccess(this.translate.instant('TRAYECTORIAS.ELIMINADO_EXITO'));
        },
        error: (err) => {
          console.error('Error al eliminar trayectoria, el registro se encuentra asociado', err);
          this.showError(this.translate.instant('TRAYECTORIAS.ERROR_ELIMINAR'));
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
    toast.success(this.translate.instant('TRAYECTORIAS.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('TRAYECTORIAS.ERROR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('TRAYECTORIAS.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('TRAYECTORIAS.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('TRAYECTORIAS.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('TRAYECTORIAS.CANCELAR'),
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


  onComponenteChange() {
    if (!this.model.componenteCodigo) {
      this.model.componenteNombre = '';
      this.model.totalcreditosprograma = 0;
      this.model.plaFacultad = '';
      this.model.area_formacion = '';
      this.model.semestre = null as any;
      return;
    }

    const found = this.componentes.find(c => c.codigo === this.model.componenteCodigo);
    if (found) {
      this.model.componenteNombre = found.nombre ?? this.model.componenteNombre;
      this.model.totalcreditosprograma = (found.creditos !== undefined) ? Number(found.creditos) : this.model.totalcreditosprograma;
      this.model.semestre = (found.semestre !== undefined) ? Number(found.semestre) : this.model.semestre;
      this.model.plaFacultad = found.facultad ?? this.model.plaFacultad;
      this.model.area_formacion = found.area_formacion ?? found.act_interdetalle ?? found.act_internacional ?? this.model.area_formacion;
    } else {
      this.model.componenteNombre = '';
      this.model.totalcreditosprograma = 0;
      this.model.plaFacultad = '';
      this.model.area_formacion = '';
      this.model.semestre = null as any;
    }
  }



private isEmptyValue(v: any): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

private populateFromComponente(found: any) {
  if (!found) return;

  if (this.isEmptyValue(this.model.componenteNombre)) {
    this.model.componenteNombre = found.nombre ?? '';
  }

  if (this.isEmptyValue(this.model.totalcreditosprograma) || this.model.totalcreditosprograma === 0) {
    this.model.totalcreditosprograma = (found.creditos !== undefined && found.creditos !== null) ? Number(found.creditos) : this.model.totalcreditosprograma ?? 0;
  }

  if (this.isEmptyValue(this.model.semestre) || this.model.semestre === 0) {
    this.model.semestre = (found.semestre !== undefined && found.semestre !== null) ? Number(found.semestre) : this.model.semestre ?? null;
  }

  // facultad
  if (this.isEmptyValue(this.model.plaFacultad)) {
    this.model.plaFacultad = found.facultad ?? found.plaFacultad ?? '';
  }

  const areaFromFound = found.area_formacion ?? found.areaFormacion ?? found.areaformacion ?? found.act_interdetalle ?? found.act_internacional ?? '';
  if (this.isEmptyValue(this.model.area_formacion)) {
    if (Array.isArray(areaFromFound)) {
      this.model.area_formacion = areaFromFound.map(a => (typeof a === 'object' ? (a.nombre ?? a.name ?? JSON.stringify(a)) : String(a))).join(', ');
    } else {
      this.model.area_formacion = String(areaFromFound ?? '').trim();
    }
  }
}

fetchPlanesPorPrograma(programaCodigo: string): Observable<any[]> {
  if (!programaCodigo) {
    this.planesEstudio = [];
    return of([]);
  }

  return this.api.getExterno<any>(`orisiga/planesxprograma/?programacodigo=${programaCodigo}`)
    .pipe(
      takeUntil(this.destroy$),
      map((resp) => {
        let items: any[] = [];
        if (Array.isArray(resp)) {
          items = resp;
        } else if (resp && typeof resp === 'object') {
          if (Array.isArray(resp.data)) items = resp.data;
          else if (Array.isArray(resp.items)) items = resp.items;
          else {
            const arr = Object.values(resp).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }
        }

        return items.map(item => ({
          // mapea con tolerancia a distintas formas que pueda devolver la API
          id: item.plan_codigo ?? item.id ?? item.plan_id ?? null,
          nombre: item.programa_nombre ?? item.nombre ?? item.descripcion ?? String(item.planestudioid ?? item.id ?? '')
        }));
      }),
      tap((list) => {
        this.planesEstudio = list;
        if (this.planesEstudio.length === 0) {
          this.showWarning(this.translate.instant('TRAYECTORIAS.NO_PLANES'));
        }
      })
    );
}

onProgramaChange() {
  // cuando cambie el programa, cargamos planes asociados y reseteamos plan y componente
  if (this.model.programa) {
    this.fetchPlanesPorPrograma(this.model.programa)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // deja plan vacio para que el usuario seleccione
          this.model.planestudioid = 0 as any;
          this.componentes = [];
        },
        error: (err) => {
          console.error('Error cargando planes por programa', err);
          this.planesEstudio = [];
        }
      });
  } else {
    this.planesEstudio = [];
    this.model.planestudioid = 0 as any;
    this.componentes = [];
  }
}

onPlanEstudioSelect() {
  if (this.model.planestudioid) {
    // cargar componentes para el plan seleccionado
    this.fetchComponentesPorPlan(this.model.programa, Number(this.model.planestudioid))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.model.componenteCodigo = '';
        },
        error: (err) => {
          console.error('Error cargando componentes al seleccionar plan', err);
        }
      });
  } else {
    this.componentes = [];
    this.model.componenteCodigo = '';
  }
}
}
