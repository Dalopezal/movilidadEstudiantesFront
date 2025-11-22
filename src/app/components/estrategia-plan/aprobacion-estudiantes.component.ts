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

interface EstudianteAprobacion {
  cedula: string;
  nombre: string;
  aprobo: boolean;
  idEstudiante?: number;
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
    SidebarComponent
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

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService
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
          this.showError('No se pudieron cargar las planeaciones');
        }
      });
  }

  fetchProgramas() {
    this.api.getExterno<any>('orisiga/asignaciondocente/?identificacion=24341126')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('Respuesta programas RAW:', response);
        this.listaProgramas = this.extractArray(response);
      },
      error: (err) => {
        console.error('Error al cargar programas', err);
        this.showError('No se pudieron cargar los programas');
      }
    });
  }

  onProgramaChange() {
    this.componenteId = null;
    this.grupoId = null;
    this.listaComponentes = [];
    this.listaGrupos = [];

    if (!this.programaId || !this.docenteId) return;

    this.api.get<any>(`asignaciondocente/consultar_componentes?docenteId=${this.docenteId}&programaId=${this.programaId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listaComponentes = this.extractArray(response);
        },
        error: (err) => {
          console.error('Error al cargar componentes', err);
          this.showError('No se pudieron cargar los componentes');
        }
      });
  }

  onComponenteChange() {
    this.grupoId = null;
    this.listaGrupos = [];

    if (!this.componenteId || !this.docenteId) return;

    this.api.get<any>(`asignaciondocente/consultar_grupos?docenteId=${this.docenteId}&componenteId=${this.componenteId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listaGrupos = this.extractArray(response);
        },
        error: (err) => {
          console.error('Error al cargar grupos', err);
          this.showError('No se pudieron cargar los grupos');
        }
      });
  }

  // -----------------------
  // Buscar estudiantes
  // -----------------------
  buscarEstudiantes() {
    if (!this.planeacionId || !this.programaId || !this.componenteId || !this.grupoId) {
      this.showWarning('Debe seleccionar todos los filtros antes de buscar');
      return;
    }

    this.loading = true;
    this.error = null;

    // Paso 1: Consultar si ya existen aprobaciones
    this.api.get<any>(`Aprobacion/Consultar_Aprobacionestudiante_Planeacion?planeacionId=${this.planeacionId}`)
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
          this.showError('Error al consultar aprobaciones');
        }
      });
  }

  cargarListadoEstudiantes(habilitarGuardar: boolean, aprobaciones: any[] = []) {
    this.api.get<any>(`Estudiante/listadoestudiantexgrupoxcomponente?grupoId=${this.grupoId}&componenteId=${this.componenteId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseEstudiantes) => {
          const estudiantes = this.extractArray(responseEstudiantes);

          if (aprobaciones.length > 0) {
            // Cruzar datos
            this.data = estudiantes.map((est: any) => {
              const aprobacion = aprobaciones.find((ap: any) =>
                ap.estudianteId === est.id || ap.cedula === est.cedula
              );
              return {
                cedula: est.cedula || est.documento || '',
                nombre: est.nombre || est.nombreCompleto || '',
                aprobo: aprobacion ? aprobacion.aprobo : false,
                idEstudiante: est.id
              };
            });
            this.botonGuardarHabilitado = false; // Ya se guardó antes
          } else {
            // Mapear estudiantes sin aprobaciones previas
            this.data = estudiantes.map((est: any) => ({
              cedula: est.cedula || est.documento || '',
              nombre: est.nombre || est.nombreCompleto || '',
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
          this.showError('Error al cargar estudiantes');
        }
      });
  }

  // -----------------------
  // Búsqueda por cédula
  // -----------------------
  buscarPorCedula() {
    if (!this.filtroCedula || this.filtroCedula.trim() === '') {
      this.showWarning('Debe digitar una cédula para buscar');
      return;
    }

    this.loading = true;

    this.api.get<any>(`Estudiante/listadoestudiantexgrupoxcomponente?grupoId=${this.grupoId}&componenteId=${this.componenteId}&cedula=${this.filtroCedula}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const estudiantes = this.extractArray(response);

          this.data = estudiantes.map((est: any) => ({
            cedula: est.cedula || est.documento || '',
            nombre: est.nombre || est.nombreCompleto || '',
            aprobo: false,
            idEstudiante: est.id
          }));

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al buscar por cédula', err);
          this.loading = false;
          this.showError('Error al buscar estudiante');
        }
      });
  }

  // -----------------------
  // Guardar estudiantes
  // -----------------------
  async guardarEstudiantes() {
    const estudiantesAprobados = this.data.filter(e => e.aprobo);

    if (estudiantesAprobados.length === 0) {
      this.showWarning('Debe seleccionar al menos un estudiante para guardar');
      return;
    }

    const confirmado = await this.showConfirm(`¿Está seguro de guardar ${estudiantesAprobados.length} estudiante(s) aprobado(s)?`);
    if (!confirmado) return;

    this.loading = true;

    const payload = estudiantesAprobados.map(e => ({
      planeacionId: this.planeacionId,
      estudianteId: e.idEstudiante,
      cedula: e.cedula,
      aprobo: true
    }));

    this.api.post<any>('Aprobacion/Crear_aprobacion_estudiantes', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.botonGuardarHabilitado = false;
          this.showSuccess('Estudiantes guardados exitosamente');
        },
        error: (err) => {
          console.error('Error al guardar estudiantes', err);
          this.loading = false;
          this.showError('Error al guardar estudiantes');
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
    this.filtroCedula = '';
    if (this.planeacionId && this.programaId && this.componenteId && this.grupoId) {
      this.buscarEstudiantes();
    }
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
    toast.success('¡Operación exitosa!', {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: string) {
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
