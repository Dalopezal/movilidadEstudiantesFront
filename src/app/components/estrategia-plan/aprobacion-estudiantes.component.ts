import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { GenericApiService } from '../../services/generic-api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { concatMap, from, toArray, catchError, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // ✅ Agregado

interface EstudianteAprobacion {
  cedula: string;
  nombre: string;
  aprobo: boolean;
  idEstudiante?: number;
}

interface ProgramaDocente {
  codigo: string;
  nombre: string;
}

interface ComponenteDocente {
  codigo: string;
  nombre: string;
  programaCodigo: string;
  grupo: number;
}

@Component({
  selector: 'app-aprobacion-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    SidebarComponent,
    TranslateModule // ✅ Agregado
  ],
  templateUrl: './aprobacion-estudiantes.component.html',
  styleUrls: ['./aprobacion-estudiantes.component.css'],
  providers: [ConfirmationService]
})
export class AprobacionEstudiantesComponent implements OnInit, OnDestroy {
  data: EstudianteAprobacion[] = [];
  filteredData: EstudianteAprobacion[] = [];
  pagedData: EstudianteAprobacion[] = [];

  // Listas para combos
  listaPlaneaciones: any[] = [];
  listaProgramas: any[] = [];
  listaComponentes: any[] = [];
  listaGrupos: any[] = [];

  // Valores seleccionados
  planeacionId: number | null = null;
  programaId: number | null = null;
  componenteId: number | null = null;
  grupoId: number | null = null;
  docenteId: number | null = null; // Se obtiene del parámetro por defecto

  // Paginación
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  // Estados
  loading = false;
  error: string | null = null;
  filtroCedula: string = '';
  seleccionarTodos: boolean = false;
  botonGuardarHabilitado: boolean = false;

  private destroy$ = new Subject<void>();
  // Valores seleccionados
  programaCodigo: string | null = null;      // en vez de programaId numérico
  componenteCodigo: string | null = null;    // en vez de componenteId numérico
  private _componentesRaw: ComponenteDocente[] = [];
  private _backupData: EstudianteAprobacion[] = [];
  isFilteredByCedula = false;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService // ✅ Agregado
  ) {}

  ngOnInit(): void {
    this.fetchPlaneaciones();
    this.fetchProgramas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Cargar catálogos
  // -----------------------
  fetchPlaneaciones() {
    this.api.get<any>('Planeacion/Consultar_Planeacion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listaPlaneaciones = this.extractArray(response);
        },
        error: (err) => {
          console.error('Error al cargar planeaciones', err);
          this.showError(this.translate.instant('APROBACION_ESTUDIANTES.ERROR_CARGAR_PLANEACIONES'));
        }
      });
  }

  fetchProgramas() {
    this.api.getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Respuesta programas RAW:', response);

          const asignaciones = this.extractArray(response);

          if (asignaciones.length > 0) {
            // Documento del docente (por si luego lo necesitas)
            this.docenteId = asignaciones[0].documento ?? null;
          }

          const programasMap = new Map<string, ProgramaDocente>();
          const componentes: ComponenteDocente[] = [];

          for (const item of asignaciones) {
            const prog = item.programa;

            // Programas únicos
            if (prog?.codigo) {
              if (!programasMap.has(prog.codigo)) {
                programasMap.set(prog.codigo, {
                  codigo: prog.codigo,
                  nombre: prog.nombre
                });
              }
            }

            // Cada fila tiene un componente y grupo asociado
            if (item.componente_codigo) {
              componentes.push({
                codigo: item.componente_codigo,
                nombre: item.componente_nombre,
                programaCodigo: prog?.codigo,
                grupo: item.grupo
              });
            }
          }

          this.listaProgramas = Array.from(programasMap.values());
          this._componentesRaw = componentes;
          this.listaComponentes = [];
          this.listaGrupos = [];

          console.log('Programas:', this.listaProgramas);
          console.log('Componentes RAW:', this._componentesRaw);
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.showError(this.translate.instant('APROBACION_ESTUDIANTES.ERROR_CARGAR_PROGRAMAS'));
        }
      });
  }

  onProgramaChange() {
    this.componenteCodigo = null;
    this.grupoId = null;
    this.listaComponentes = [];
    this.listaGrupos = [];

    if (!this.programaCodigo) {
      return;
    }

    // Componentes solo del programa seleccionado
    this.listaComponentes = this._componentesRaw
      .filter(c => c.programaCodigo === this.programaCodigo);

    // Grupos que existen para ese programa (evita duplicados)
    const gruposSet = new Set<number>();
    this.listaComponentes.forEach(c => {
      if (c.grupo != null) {
        gruposSet.add(c.grupo);
      }
    });
    this.listaGrupos = Array.from(gruposSet.values()).sort();
  }

  onComponenteChange() {
    this.grupoId = null;

    if (!this.componenteCodigo || !this.programaCodigo) {
      return;
    }

    const comp = this._componentesRaw.find(c =>
      c.codigo === this.componenteCodigo &&
      c.programaCodigo === this.programaCodigo
    );

    if (comp && comp.grupo != null) {
      this.grupoId = comp.grupo;
    }
  }

  // -----------------------
  // Buscar estudiantes
  // -----------------------
  buscarEstudiantes() {
    if (!this.planeacionId || !this.programaCodigo || !this.componenteCodigo || !this.grupoId) {
      this.showWarning(this.translate.instant('APROBACION_ESTUDIANTES.DEBE_SELECCIONAR_FILTROS'));
      return;
    }

    this.loading = true;
    this.error = null;

    // Paso 1: Consultar si ya existen aprobaciones
    this.api.get<any>(`AprobacionEstudiantes/Consultar_Aprobacionestudiante_Planeacion?IdPlaneacion=${this.planeacionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseAprobacion) => {
          const aprobaciones = this.extractArray(responseAprobacion);

          if (aprobaciones.length === 0) {
            // No hay aprobaciones previas, cargar listado de estudiantes
            this.cargarListadoEstudiantes(true);
          } else {
            // Ya existen aprobaciones, cargar y cruzar con listado
            this.cargarListadoEstudiantes(false, aprobaciones);
          }
        },
        error: (err) => {
          console.error('Error al consultar aprobaciones', err);
          this.loading = false;
          this.showError(this.translate.instant('APROBACION_ESTUDIANTES.ERROR_CONSULTAR_APROBACIONES'));
        }
      });
  }

  cargarListadoEstudiantes(habilitarGuardar: boolean, aprobaciones: any[] = []) {
    this.api.getExterno<any>(`orisiga/listestgrucom/?identificacion=24341126&componente=${this.componenteCodigo}&grupo=${this.grupoId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseEstudiantes) => {
          const estudiantes = this.extractArray(responseEstudiantes);

          if (aprobaciones.length > 0) {
            // Cruzar datos
            this.data = estudiantes.map((est: any) => {
              const aprobacion = aprobaciones.find((ap: any) => {
                const match = ap.estudianteId == est.documento_estudiante;
                return match;
              });
              return {
                cedula: est.documento_estudiante || '',
                nombre: est.nombre_estudiante || '',
                aprobo: aprobacion ? aprobacion.aprobo : false,
                idEstudiante: est.documento_estudiante
              };
            });
            this.botonGuardarHabilitado = false;
          } else {
            // Mapear estudiantes sin aprobaciones previas
            this.data = estudiantes.map((est: any) => ({
              cedula: est.cedula || est.documento_estudiante || '',
              nombre: est.nombre || est.nombre_estudiante || '',
              aprobo: false,
              idEstudiante: est.id
            }));
            this.botonGuardarHabilitado = habilitarGuardar;
          }

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar listado de estudiantes', err);
          this.loading = false;
          this.showError(this.translate.instant('APROBACION_ESTUDIANTES.ERROR_CARGAR_ESTUDIANTES'));
        }
      });
  }

  // -----------------------
  // Búsqueda por cédula (filtrado local)
  // -----------------------
  buscarPorCedula() {
    if (!this.filtroCedula || this.filtroCedula.trim() === '') {
      this.showWarning(this.translate.instant('APROBACION_ESTUDIANTES.DEBE_INGRESAR_CEDULA'));
      return;
    }

    // Filtrar localmente en this.data
    const filtro = this.filtroCedula.trim();

    this.filteredData = this.data.filter(est =>
      est.cedula.toLowerCase().includes(filtro.toLowerCase())
    );

    this.currentPage = 1;
    this.calculateTotalPages();
    this.updatePagedData();
  }

  // -----------------------
  // Guardar estudiantes
  // -----------------------
  async guardarEstudiantes() {
    const estudiantesAprobados = this.data.filter(e => e.aprobo);

    if (estudiantesAprobados.length === 0) {
      this.showWarning(this.translate.instant('APROBACION_ESTUDIANTES.DEBE_SELECCIONAR_ESTUDIANTE'));
      return;
    }

    const confirmado = await this.showConfirm(
      this.translate.instant('APROBACION_ESTUDIANTES.CONFIRMAR_GUARDAR', { count: estudiantesAprobados.length })
    );
    if (!confirmado) return;

    this.loading = true;

    // Crear un array de observables, uno por cada estudiante
    const requests$ = estudiantesAprobados.map(est => {
      const payload = {
        planeacionId: this.planeacionId,
        estudianteId: est.cedula,
        aprobo: true
      };

      return this.api.post<any>('AprobacionEstudiantes/crear_AprobacionEstudiantes', payload).pipe(
        catchError(error => {
          console.error(`Error al guardar estudiante ${est.cedula}`, error);
          return of(null); // Continúa aunque falle uno
        })
      );
    });

    // Ejecutar uno tras otro
    from(requests$).pipe(
      concatMap(request => request),
      toArray()
    ).subscribe({
      next: (responses) => {
        this.loading = false;
        this.botonGuardarHabilitado = false;
        const errores = responses.filter(r => r === null).length;
        if (errores > 0) {
          this.showWarning(this.translate.instant('APROBACION_ESTUDIANTES.GUARDADO_CON_ERRORES', { count: errores }));
        } else {
          this.showSuccess(this.translate.instant('APROBACION_ESTUDIANTES.ESTUDIANTES_GUARDADOS'));
        }
      },
      error: (err) => {
        console.error('Error general en guardado', err);
        this.loading = false;
        this.showError(this.translate.instant('APROBACION_ESTUDIANTES.ERROR_GUARDAR_ESTUDIANTES'));
      }
    });
  }

  // -----------------------
  // Seleccionar todos
  // -----------------------
  toggleSeleccionarTodos() {
    this.data.forEach(e => e.aprobo = this.seleccionarTodos);
    this.updatePagedData();
  }

  // -----------------------
  // Refrescar tabla
  // -----------------------
  refrescarTabla() {
    // Limpiar filtro y mostrar todos los datos
    this.filtroCedula = '';
    this.filteredData = [...this.data];
    this.currentPage = 1;
    this.calculateTotalPages();
    this.updatePagedData();
  }

  // -----------------------
  // Paginación
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

  trackByIndex(_: number, item: EstudianteAprobacion) {
    return item?.cedula ?? _;
  }

  // -----------------------
  // Utilidades
  // -----------------------
  extractArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.items)) return response.items;
      const arr = Object.values(response).find(v => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
    return [];
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
  showSuccess(mensaje: string) {
    toast.success(this.translate.instant('APROBACION_ESTUDIANTES.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: string) {
    toast.error(this.translate.instant('APROBACION_ESTUDIANTES.ERROR_PROCESAR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('APROBACION_ESTUDIANTES.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('APROBACION_ESTUDIANTES.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('APROBACION_ESTUDIANTES.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('APROBACION_ESTUDIANTES.CANCELAR'),
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
