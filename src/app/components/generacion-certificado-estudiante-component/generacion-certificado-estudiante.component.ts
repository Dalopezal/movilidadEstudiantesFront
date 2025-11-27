import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { GenericApiService } from '../../services/generic-api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface EstudianteCertificado {
  cedula: string;
  nombre: string;
  seleccionado: boolean;
  idEstudiante?: number | string;
  programaNombre?: string;
  estrategiaNombre?: string;
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
  selector: 'app-generacion-certificado-estudiante',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    SidebarComponent
  ],
  templateUrl: './generacion-certificado-estudiante.component.html',
  styleUrls: ['./generacion-certificado-estudiante.component.css'],
  providers: [ConfirmationService]
})
export class GeneracionCertificadoEstudianteComponent implements OnInit, OnDestroy, AfterViewInit {
  data: EstudianteCertificado[] = [];
  filteredData: EstudianteCertificado[] = [];
  pagedData: EstudianteCertificado[] = [];

  // combos
  listaEstrategias: any[] = [];
  listaPlaneaciones: any[] = [];
  listaProgramas: ProgramaDocente[] = [];
  listaComponentes: ComponenteDocente[] = [];
  listaGrupos: number[] = [];

  // valores seleccionados
  estrategiaId: number | null = null;
  planeacionId: number | null = null;
  programaCodigo: string | null = null;
  componenteCodigo: string | null = null;
  grupoId: number | null = null;
  docenteId: number | null = null;

  // paginación
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  // estados
  loading = false;
  error: string | null = null;
  filtroCedula = '';
  seleccionarTodos = false;

  // para combos dependientes
  private destroy$ = new Subject<void>();
  private _componentesRaw: ComponenteDocente[] = [];

  // estudiante seleccionado para visor derecho
  estudianteSeleccionado: EstudianteCertificado | null = null;

  today: Date = new Date();

  // ========== CANVAS ==========
  private certCanvas?: HTMLCanvasElement;
  private certCtx?: CanvasRenderingContext2D;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.fetchEstrategias();
    this.fetchPlaneaciones();
    this.fetchProgramas();
  }

  ngAfterViewInit(): void {
    // Intentar inicializar el canvas después de que la vista esté lista
    setTimeout(() => this.initCanvasIfNeeded(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----------------- catálogos -----------------

  // Cargar estrategias (combo independiente)
  fetchEstrategias() {
    this.api.get<any>('AsignacionPlanComponente/Consultar_AsignacionComponenteEstrategia?IdEstrategia=1')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listaEstrategias = this.extractArray(response);
        },
        error: (err) => {
          console.error('Error al cargar estrategias', err);
          this.showError('No se pudieron cargar las estrategias');
        }
      });
  }

  // Cargar planeaciones (combo independiente)
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

  // Cargar programas del docente (desde orisiga)
  fetchProgramas() {
    this.api.getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const asignaciones = this.extractArray(response);

          if (asignaciones.length > 0) {
            this.docenteId = asignaciones[0].documento ?? null;
          }

          const programasMap = new Map<string, ProgramaDocente>();
          const componentes: ComponenteDocente[] = [];

          for (const item of asignaciones) {
            const prog = item.programa;

            if (prog?.codigo && !programasMap.has(prog.codigo)) {
              programasMap.set(prog.codigo, {
                codigo: prog.codigo,
                nombre: prog.nombre
              });
            }

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
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.showError('No se pudieron cargar los programas');
        }
      });
  }

  // Cambio de programa → actualiza componentes y grupos
  onProgramaChange() {
    this.componenteCodigo = null;
    this.grupoId = null;
    this.listaComponentes = [];
    this.listaGrupos = [];

    if (!this.programaCodigo) return;

    this.listaComponentes = this._componentesRaw
      .filter(c => c.programaCodigo === this.programaCodigo);

    const gruposSet = new Set<number>();
    this.listaComponentes.forEach(c => {
      if (c.grupo != null) gruposSet.add(c.grupo);
    });
    this.listaGrupos = Array.from(gruposSet.values()).sort();
  }

  // Cambio de componente → actualiza grupo
  onComponenteChange() {
    this.grupoId = null;
    if (!this.componenteCodigo || !this.programaCodigo) return;

    const comp = this._componentesRaw.find(c =>
      c.codigo === this.componenteCodigo &&
      c.programaCodigo === this.programaCodigo
    );
    if (comp && comp.grupo != null) this.grupoId = comp.grupo;
  }

  // ----------------- buscar estudiantes -----------------

  buscarEstudiantes() {
    if (!this.estrategiaId || !this.planeacionId || !this.programaCodigo || !this.componenteCodigo || !this.grupoId) {
      this.showWarning('Debe seleccionar Estrategia, Planeación, Programa, Componente y Grupo');
      return;
    }

    this.loading = true;
    this.error = null;

    // 1. Consultar aprobaciones por planeación
    this.api.get<any>(`AprobacionEstudiantes/Consultar_Aprobacionestudiante_Planeacion?IdPlaneacion=${this.planeacionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseAprob) => {
          const aprobaciones = this.extractArray(responseAprob);

          if (aprobaciones.length === 0) {
            this.data = [];
            this.filteredData = [];
            this.calculateTotalPages();
            this.updatePagedData();
            this.loading = false;
            this.showWarning('No hay estudiantes aprobados para esta planeación');
            return;
          }

          // 2. Por cada aprobación, consultar nombreestudiante (API Externa)
          const requests = aprobaciones.map((ap: any) =>
            this.api.getExterno<any>(`orisiga/nombrestudiante/?idestudiante=${ap.estudianteId}`)
          );

          // 3. Ejecutar todas las consultas en paralelo
          forkJoin(requests)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (respuestasEst) => {
                const programaNombre = this.listaProgramas.find(p => p.codigo === this.programaCodigo)?.nombre;
                const estrategiaNombre = this.listaEstrategias.find(e => e.estrategiaId === this.estrategiaId)?.estrategiaNombre;

                this.data = respuestasEst.map((resp: any, index: number) => {
                  const infoEst = this.extractArray(resp)[0] || resp;
                  const ap = aprobaciones[index];

                  return {
                    cedula: infoEst.cedula || infoEst.documento_estudiante || ap.estudianteId,
                    nombre: infoEst.nombre || infoEst.nombre_estudiante || 'Sin nombre',
                    seleccionado: false,
                    idEstudiante: ap.estudianteId,
                    programaNombre,
                    estrategiaNombre
                  } as EstudianteCertificado;
                });

                this.filteredData = [...this.data];
                this.currentPage = 1;
                this.calculateTotalPages();
                this.updatePagedData();
                this.estudianteSeleccionado = null;
                this.seleccionarTodos = false;
                this.loading = false;
              },
              error: (err) => {
                console.error('Error al consultar nombreestudiante', err);
                this.loading = false;
                this.showError('Error al cargar nombres de estudiantes');
              }
            });
        },
        error: (err) => {
          console.error('Error al consultar aprobaciones', err);
          this.loading = false;
          this.showError('Error al consultar aprobaciones');
        }
      });
  }

  // búsqueda por cédula (usando orisiga)
  buscarPorCedula() {
    if (!this.filtroCedula || this.filtroCedula.trim() === '' ||
        !this.estrategiaId || !this.planeacionId || !this.programaCodigo || !this.componenteCodigo || !this.grupoId) {
      this.showWarning('Debe seleccionar todos los filtros y digitar la cédula');
      return;
    }

    this.loading = true;

    this.api.getExterno<any>(
      `orisiga/listestgrucom/?identificacion=${this.filtroCedula}&componente=${this.componenteCodigo}&grupo=${this.grupoId}`
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const estudiantes = this.extractArray(response);
          const programaNombre = this.listaProgramas.find(p => p.codigo === this.programaCodigo)?.nombre;
          const estrategiaNombre = this.listaEstrategias.find(e => e.estrategiaId === this.estrategiaId)?.estrategiaNombre;

          this.data = estudiantes.map((est: any) => ({
            cedula: est.cedula || est.documento_estudiante || '',
            nombre: est.nombre || est.nombre_estudiante || '',
            seleccionado: false,
            idEstudiante: est.id ?? est.documento_estudiante,
            programaNombre,
            estrategiaNombre
          }));

          this.filteredData = [...this.data];
          this.currentPage = 1;
          this.calculateTotalPages();
          this.updatePagedData();
          this.estudianteSeleccionado = null;
          this.seleccionarTodos = false;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al buscar estudiante', err);
          this.loading = false;
          this.showError('Error al buscar estudiante');
        }
      });
  }

  // marcar para generar certificado
  toggleSeleccionarTodos() {
    this.data.forEach(e => e.seleccionado = this.seleccionarTodos);
    this.updatePagedData();
  }

  onSeleccionarEstudiante(item: EstudianteCertificado) {
    if (item.seleccionado) {
      this.estudianteSeleccionado = item;
      // Redibujar canvas cuando se selecciona
      setTimeout(() => this.renderCertificadoCanvas(item), 50);
    } else if (this.estudianteSeleccionado?.cedula === item.cedula) {
      this.estudianteSeleccionado = null;
    }
  }

  // Método para llamar cuando se abre el modal
  onAbrirModalVista() {
    if (this.estudianteSeleccionado) {
      setTimeout(() => this.renderCertificadoCanvas(this.estudianteSeleccionado!), 100);
    }
  }

  // ----------------- generar certificado(s) -----------------
  async generarCertificados() {
    const seleccionados = this.data.filter(e => e.seleccionado);

    if (seleccionados.length === 0) {
      this.showWarning('Debe seleccionar al menos un estudiante');
      return;
    }

    const confirmado = await this.showConfirm(
      `¿Desea generar certificado(s) para ${seleccionados.length} estudiante(s)?`
    );
    if (!confirmado) return;

    // Generar PNG para cada estudiante seleccionado
    for (const est of seleccionados) {
      await this.renderCertificadoCanvas(est);
      if (this.certCanvas) {
        const dataUrl = this.certCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `certificado-${est.cedula}.png`;
        a.click();
      }
    }

    this.showSuccess(`Se generaron ${seleccionados.length} certificado(s)`);
  }

  // ----------------- paginación -----------------
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

  trackByIndex(_: number, item: EstudianteCertificado) {
    return item?.cedula ?? _;
  }

  // ----------------- util -----------------
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

  // ========== CANVAS: DIBUJAR CERTIFICADO ==========

  private initCanvasIfNeeded() {
    if (this.certCanvas && this.certCtx) return;

    const canvas = document.getElementById('certCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    // Inicialmente sin tamaño fijo: se ajustará con la imagen
    this.certCanvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.certCtx = ctx;
  }

  private async renderCertificadoCanvas(est: EstudianteCertificado) {
    this.initCanvasIfNeeded();
    if (!this.certCanvas || !this.certCtx) return;

    const ctx = this.certCtx;

    // 1. Cargar imagen base
    const backgroundUrl = 'assets/plantilla-certificado.jpeg'; // tu archivo en assets
    let img: HTMLImageElement;
    try {
      img = await this.loadImage(backgroundUrl);
    } catch (err) {
      console.error('Error al cargar imagen base', err);
      return;
    }

    // 2. Ajustar canvas al tamaño real de la imagen
    this.certCanvas.width = img.width;
    this.certCanvas.height = img.height;

    // 3. Dibujar fondo
    ctx.clearRect(0, 0, this.certCanvas.width, this.certCanvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const W = this.certCanvas.width;
    const H = this.certCanvas.height;

    ctx.fillStyle = '#18206E';
    ctx.textBaseline = 'top';

    // ========== POSICIONES AFINADAS (en proporción) ==========

    // Columna de texto (un poco a la derecha del centro)
    const baseX = W * 0.47; // 47% del ancho

    // 1) NOMBRE (línea grande azul)
    ctx.font = `${H * 0.035}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
    const nombre = est.nombre || '';
    let y = H * 0.39; // algo por debajo de "Certifica que"
    ctx.fillText(nombre, baseX, y);

    // 2) CÉDULA (debajo del nombre)
    ctx.font = `${H * 0.026}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
    y = H * 0.45;
    const cc = `C.C. ${est.cedula}`;
    ctx.fillText(cc, baseX, y);

    // 3) Evento / Estrategia (cursiva, línea "Evento Estratégico")
    ctx.font = `italic ${H * 0.035}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
    y = H * 0.51;
    const estrategia = est.estrategiaNombre || 'Nombre del evento / estrategia';
    ctx.fillText(estrategia, baseX, y);

    // 4) Programa (línea "Estudiante del programa ...")
    ctx.font = `${H * 0.018}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
    y = H * 0.555;
    const programa = `Estudiante del programa ${est.programaNombre || ''}`;
    ctx.fillText(programa, baseX, y);

    // 5) Fecha (centrada sobre "Dado en Manizales (Colombia) el")
    ctx.font = `${H * 0.023}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;

    // MÁS A LA DERECHA y MÁS ABAJO
    const fechaX = baseX + W * 0.09;  // antes 0.03 o parecido
    const fechaY = H * 0.646;         // antes 0.625 aprox

    const fecha = `${this.today.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}`;

    ctx.fillText(fecha, fechaX, fechaY);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // ----------------- toasters / confirm -----------------
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
