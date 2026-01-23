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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface EstudianteCertificado {
  cedula: string;
  nombre: string;
  seleccionado: boolean;
  idEstudiante?: number | string;
  programaNombre?: string;
  estrategiaNombre?: string;

  rolParticipacion?: string;
  tipoEstrategia?: string;
  institucionOrigen?: string;
  paisOrigen?: string;
  ciudadOrigen?: string;
  institucionExterna?: string;
  paisDestino?: string | null;
  ciudadDestino?: string;
  anio?: number;
  periodo?: string;
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

interface ConsultarEstudiantesGenerarCertificadoItem {
  id: number;
  estudianteId: number;
  planeacionId: number;
  aprobo: boolean;
  estrategiaId: number;
  planId: number;
  programaUCM: string;
  creditosUCM: number;
  grupoUCM: number;
  nombreComponenteUCM: string;
  docentetitularId: number;
  componenteCodigoUCM: string;
  estrategiaNombre: string;
  institucionExterna: string;
  institucionOrigen: string;
  tipoEstrategia: string;
  paisOrigen: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  paisDestino: string | null;
  periodo: string;
  anio: number;
  docenteaux_nombre: string;
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
    SidebarComponent,
    TranslateModule
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

  private destroy$ = new Subject<void>();
  private _componentesRaw: ComponenteDocente[] = [];

  estudianteSeleccionado: EstudianteCertificado | null = null;

  today: Date = new Date();

  // ========== CANVAS ==========
  private certCanvas?: HTMLCanvasElement;
  private certCtx?: CanvasRenderingContext2D;

  private mostrarDocumentoEnCertificado = false;
  private usarTextoRequerimientoNuevo = true;
  private readonly NA = 'N/A';

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.fetchEstrategias();
    this.fetchPlaneaciones();
    this.fetchProgramas();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCanvasIfNeeded(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----------------- catálogos -----------------
  fetchEstrategias() {
    this.api.get<any>('AsignacionPlanComponente/Consultar_AsignacionComponenteEstrategia')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listaEstrategias = this.extractArray(response);
        },
        error: (err) => {
          console.error('Error al cargar estrategias', err);
          this.showError(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_CARGAR_ESTRATEGIAS'));
        }
      });
  }

  fetchPlaneaciones() {
    this.api.get<any>('Planeacion/Consultar_Planeacion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listaPlaneaciones = this.extractArray(response);
        },
        error: (err) => {
          console.error('Error al cargar planeaciones', err);
          this.showError(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_CARGAR_PLANEACIONES'));
        }
      });
  }

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
          this.showError(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_CARGAR_PROGRAMAS'));
        }
      });
  }

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

  onComponenteChange() {
    this.grupoId = null;
    if (!this.componenteCodigo || !this.programaCodigo) return;

    const comp = this._componentesRaw.find(c =>
      c.codigo === this.componenteCodigo &&
      c.programaCodigo === this.programaCodigo
    );
    if (comp && comp.grupo != null) this.grupoId = comp.grupo;
  }

  buscarEstudiantes() {
    this.filtroCedula = '';
    if (!this.estrategiaId || !this.planeacionId || !this.programaCodigo || !this.componenteCodigo || !this.grupoId) {
      this.showWarning(this.translate.instant('CERTIFICADO_ESTUDIANTES.DEBE_SELECCIONAR_FILTROS'));
      return;
    }

    this.loading = true;
    this.error = null;

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
            this.showWarning(this.translate.instant('CERTIFICADO_ESTUDIANTES.NO_HAY_APROBADOS'));
            return;
          }

          const requests = aprobaciones.map((ap: any) =>
            this.api.getExterno<any>(`orisiga/nombrestudiante/?idestudiante=${ap.estudianteId}`)
          );

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
                    nombre: infoEst.nombre || infoEst.nombre_estudiante || this.translate.instant('CERTIFICADO_ESTUDIANTES.SIN_NOMBRE'),
                    seleccionado: false,
                    idEstudiante: ap.estudianteId,
                    programaNombre,
                    estrategiaNombre,
                    rolParticipacion: 'Estudiante'
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
                this.showError(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_CARGAR_NOMBRES'));
              }
            });
        },
        error: (err) => {
          console.error('Error al consultar aprobaciones', err);
          this.loading = false;
          this.showError(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_CONSULTAR_APROBACIONES'));
        }
      });
  }

  buscarPorCedula() {
    if (!this.filtroCedula || this.filtroCedula.trim() === '') {
      this.showWarning(this.translate.instant('CERTIFICADO_ESTUDIANTES.DEBE_INGRESAR_CEDULA'));
      return;
    }

    const filtro = this.filtroCedula.trim().toLowerCase();

    this.filteredData = this.data.filter(est =>
      (est.cedula ? est.cedula.toString().toLowerCase() : '').includes(filtro)
    );

    this.currentPage = 1;
    this.calculateTotalPages();
    this.updatePagedData();
  }

  onSeleccionarEstudiante(item: EstudianteCertificado) {
    this.data.forEach(e => {
      if (e.cedula !== item.cedula) {
        e.seleccionado = false;
      }
    });

    this.filteredData = this.filteredData.map(e => {
      if (e.cedula !== item.cedula) {
        e.seleccionado = false;
      }
      return e;
    });

    if (item.seleccionado) {
      this.estudianteSeleccionado = item;
    } else {
      this.estudianteSeleccionado = null;
    }

    this.updatePagedData();
  }

  onAbrirModalVista() {
    if (this.estudianteSeleccionado) {
      setTimeout(async () => {
        this.certCanvas = undefined;
        this.certCtx = undefined;

        this.initCanvasIfNeeded();

        const estEnriquecido = await this.consultarYEnriquecerDatosCertificado(this.estudianteSeleccionado!);

        this.estudianteSeleccionado = estEnriquecido;

        await this.renderCertificadoCanvas(this.estudianteSeleccionado!);
      }, 150);
    }
  }

  async generarCertificados() {
    const seleccionados = this.data.filter(e => e.seleccionado);

    if (seleccionados.length === 0) {
      this.showWarning(this.translate.instant('CERTIFICADO_ESTUDIANTES.DEBE_SELECCIONAR_UN_ESTUDIANTE'));
      return;
    }

    if (seleccionados.length > 1) {
      this.showWarning(this.translate.instant('CERTIFICADO_ESTUDIANTES.SOLO_UN_CERTIFICADO'));
      return;
    }

    const confirmado = await this.showConfirm(
      this.translate.instant('CERTIFICADO_ESTUDIANTES.CONFIRMAR_GENERAR', { nombre: seleccionados[0].nombre })
    );
    if (!confirmado) return;

    const est = await this.consultarYEnriquecerDatosCertificado(seleccionados[0]);

    await this.renderCertificadoCanvas(est);
    if (this.certCanvas) {
      const dataUrl = this.certCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `certificado-${est.cedula}.png`;
      a.click();
    }

    this.showSuccess(this.translate.instant('CERTIFICADO_ESTUDIANTES.CERTIFICADO_GENERADO', { nombre: est.nombre }));
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
      if (Array.isArray((response as any).data)) return (response as any).data;
      if (Array.isArray((response as any).items)) return (response as any).items;
      if (Array.isArray((response as any).datos)) return (response as any).datos;
      const arr = Object.values(response).find(v => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
    return [];
  }

  private getProgramaNombreSeleccionado(): string {
    const nombre = this.listaProgramas.find(p => p.codigo === this.programaCodigo)?.nombre;
    return nombre ?? '';
  }

  private getComponenteNombreSeleccionado(): string {
    const nombre = this.listaComponentes.find(c => c.codigo === this.componenteCodigo)?.nombre;
    return nombre ?? '';
  }

  private buildConsultarEstudiandosGenerarCertificadoUrl(): string | null {
    if (!this.estrategiaId || !this.planeacionId || !this.grupoId) return null;

    const idEstrategia = this.estrategiaId;
    const idPlan = this.planeacionId;

    const programaNombre = this.getProgramaNombreSeleccionado();
    const componenteNombre = this.getComponenteNombreSeleccionado();

    const qs =
      `idEstrategia=${encodeURIComponent(String(idEstrategia))}` +
      `&idPlan=${encodeURIComponent(String(idPlan))}` +
      `&ProgramaUCM=${encodeURIComponent(programaNombre)}` +
      `&ComponenteUCm=${encodeURIComponent(componenteNombre)}` +
      `&GrupoUCM=${encodeURIComponent(String(this.grupoId))}`;

    return `GenerarCertificado/Consultar_EstudiandosGenerarCertificado?${qs}`;
  }

  private consultarYEnriquecerDatosCertificado(est: EstudianteCertificado): Promise<EstudianteCertificado> {
    return new Promise<EstudianteCertificado>((resolve) => {
      const url = this.buildConsultarEstudiandosGenerarCertificadoUrl();
      if (!url) {
        resolve(est);
        return;
      }

      this.api.get<any>(url)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp) => {
            const items = this.extractArray(resp) as ConsultarEstudiantesGenerarCertificadoItem[];

            const estudianteId = typeof est.idEstudiante === 'string' ? Number(est.idEstudiante) : (est.idEstudiante as number);
            const match = items.find(x => x.estudianteId === estudianteId);

            if (!match) {
              resolve(est);
              return;
            }

            const enriquecido: EstudianteCertificado = {
              ...est,
              estrategiaNombre: match.estrategiaNombre ?? est.estrategiaNombre,

              tipoEstrategia: match.tipoEstrategia ?? this.NA,
              institucionOrigen: match.institucionOrigen ?? this.NA,
              paisOrigen: match.paisOrigen ?? this.NA,
              ciudadOrigen: match.ciudadOrigen ?? this.NA,
              institucionExterna: match.institucionExterna ?? this.NA,
              paisDestino: (match.paisDestino ?? this.NA) as any,
              ciudadDestino: match.ciudadDestino ?? this.NA,
              anio: match.anio ?? (this.NA as any),
              periodo: match.periodo ?? this.NA,

              rolParticipacion: est.rolParticipacion ?? 'Estudiante'
            };

            resolve(enriquecido);
          },
          error: (err) => {
            console.error('Error al consultar Consultar_EstudiandosGenerarCertificado', err);
            resolve(est);
          }
        });
    });
  }

  private initCanvasIfNeeded() {
    if (this.certCanvas && this.certCtx) return;

    const canvas = document.getElementById('certCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      console.warn('Canvas #certCanvas no encontrado en el DOM');
      return;
    }

    this.certCanvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('No se pudo obtener contexto 2D del canvas');
      return;
    }
    this.certCtx = ctx;
  }

  private na(v: any): string {
    if (v === null || v === undefined) return this.NA;
    const s = String(v).trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return this.NA;
    return s;
  }

  private buildTextoNarrativo(est: EstudianteCertificado): string {
    const rol = this.na(est.rolParticipacion ?? 'Estudiante');
    const estrategia = this.na(est.estrategiaNombre);
    const tipo = this.na(est.tipoEstrategia);

    const origenU = this.na(est.institucionOrigen);
    const origenCiudad = this.na(est.ciudadOrigen);
    const origenPais = this.na(est.paisOrigen);

    const externaU = this.na(est.institucionExterna);
    const externaCiudad = this.na(est.ciudadDestino);
    const externaPais = this.na(est.paisDestino);

    const anio = this.na(est.anio);
    const periodo = this.na(est.periodo);

    const partes: string[] = [
      `Participó como: ${rol}`,
      `En el desarrollo de: ${estrategia}`,
      `Estrategia de: ${tipo}`,
      `Universidad de origen: ${origenU} (Ciudad: ${origenCiudad}, País: ${origenPais})`,
      `Universidad externa: ${externaU} (Ciudad: ${externaCiudad}, País: ${externaPais})`,
      `Año: ${anio}`,
      `Periodo de desarrollo: ${periodo}`
    ];

    return partes.join('\n');
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const paragraphs = (text || '').split(/\r?\n/);
    let cursorY = y;

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        cursorY += lineHeight;
        continue;
      }

      let line = '';
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && line) {
          ctx.fillText(line, x, cursorY);
          cursorY += lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      }

      if (line) {
        ctx.fillText(line, x, cursorY);
        cursorY += lineHeight;
      }
    }

    return cursorY;
  }

  private async renderCertificadoCanvas(est: EstudianteCertificado) {
    this.initCanvasIfNeeded();
    if (!this.certCanvas || !this.certCtx) {
      console.error('Canvas o contexto no disponible para renderizar');
      return;
    }

    const ctx = this.certCtx;

    const backgroundUrl = 'assets/plantilla-certificado.jpeg';
    let img: HTMLImageElement;
    try {
      img = await this.loadImage(backgroundUrl);
    } catch (err) {
      console.error('Error al cargar imagen base', err);
      this.showError(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_CARGAR_PLANTILLA'));
      return;
    }

    this.certCanvas.width = img.width;
    this.certCanvas.height = img.height;

    ctx.clearRect(0, 0, this.certCanvas.width, this.certCanvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const W = this.certCanvas.width;
    const H = this.certCanvas.height;

    ctx.fillStyle = '#18206E';
    ctx.textBaseline = 'top';

    const baseX = W * 0.47;

    ctx.font = `${H * 0.035}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
    const nombre = this.na(est.nombre || '');
    let y = H * 0.36;
    ctx.fillText(nombre, baseX, y);

    ctx.font = `${H * 0.026}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
    y = H * 0.45;
    const cc = `C.C. ${this.na(est.cedula)}`;
    if (this.mostrarDocumentoEnCertificado) {
      ctx.fillText(cc, baseX, y);
    }

    if (this.usarTextoRequerimientoNuevo) {
      ctx.font = `${H * 0.018}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
      const textoReq = this.buildTextoNarrativo(est);

      const textoY = this.mostrarDocumentoEnCertificado ? H * 0.48 : H * 0.42;
      const maxWidth = W * 0.46;
      const lineHeight = H * 0.028;

      y = this.drawWrappedText(ctx, textoReq, baseX, textoY, maxWidth, lineHeight);
    } else {
      ctx.font = `italic ${H * 0.035}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
      y = H * 0.51;
      const estrategia = this.na(est.estrategiaNombre || 'Nombre del evento / estrategia');
      ctx.fillText(estrategia, baseX, y);

      ctx.font = `${H * 0.018}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;
      y = H * 0.555;
      const programa = `Estudiante del programa ${this.na(est.programaNombre || '')}`;
      ctx.fillText(programa, baseX, y);
    }

    ctx.font = `${H * 0.023}px "Book Antiqua", "Palatino Linotype", Georgia, serif`;

    const fechaX = baseX + W * 0.09;
    const fechaY = H * 0.646;

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
    toast.success(this.translate.instant('CERTIFICADO_ESTUDIANTES.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: string) {
    toast.error(this.translate.instant('CERTIFICADO_ESTUDIANTES.ERROR_PROCESAR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('CERTIFICADO_ESTUDIANTES.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('CERTIFICADO_ESTUDIANTES.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('CERTIFICADO_ESTUDIANTES.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('CERTIFICADO_ESTUDIANTES.CANCELAR'),
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
