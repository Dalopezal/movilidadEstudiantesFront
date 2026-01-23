import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import * as XLSX from 'xlsx';
import { CursoModel, CursoPersonaModel, DesarrolloProfesionalRow } from '../../models/CursoPersonaModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; // ✅

@Component({
  selector: 'app-desarrollo-profesional',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    TranslateModule // ✅
  ],
  templateUrl: './desarrollo-profesional.component.html',
  styleUrls: ['./desarrollo-profesional.component.css'],
  providers: [ConfirmationService]
})
export class DesarrolloProfesionalComponent implements OnInit, OnDestroy {
  data: DesarrolloProfesionalRow[] = [];
  filteredData: DesarrolloProfesionalRow[] = [];
  pagedData: DesarrolloProfesionalRow[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  selectedFile: File | null = null;
  fileName: string = '';

  @Input() idConvocatoria!: any;

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService // ✅
  ) {}

  ngOnInit() {
    this.fetchDesarrolloProfesional();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchDesarrolloProfesional();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Manejo de archivo Excel
  // -----------------------
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea Excel
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!validTypes.includes(file.type)) {
        this.showError(this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_ARCHIVO_INVALIDO'));
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  async processExcelFile() {
    if (!this.selectedFile) {
      this.showWarning(this.translate.instant('DESARROLLO_PROFESIONAL.DEBE_SELECCIONAR_ARCHIVO'));
      return;
    }

    const confirmado = await this.showConfirm(
      this.translate.instant('DESARROLLO_PROFESIONAL.CONFIRMAR_PROCESAR_ARCHIVO')
    );
    if (!confirmado) return;

    this.loading = true;
    this.error = null;

    try {
      const data = await this.readExcelFile(this.selectedFile);
      await this.saveDataToAPI(data);
    } catch (error) {
      console.error('Error procesando archivo:', error);
      this.showError(this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_PROCESAR_ARCHIVO'));
      this.loading = false;
    }
  }

  private readExcelFile(file: File): Promise<DesarrolloProfesionalRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Procesar datos (asumiendo que la primera fila son headers)
          const rows: DesarrolloProfesionalRow[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row: any = jsonData[i];

            if (!row || row.length === 0) continue;

            const rowData: DesarrolloProfesionalRow = {
              programaCodigo: row[0] || 0,
              planEstudio: row[1] || 0,
              codigoCurso: row[2] || 0,
              nombre: row[3] || '',
              descripcion: row[4] || '',
              institucionId: row[5] || 0,
              usuarioId: row[6] || 0,
              fechainicio: this.formatExcelDate(row[7]),
              fechafinal: this.formatExcelDate(row[8]),
              costoCurso: row[9] || 0,
              id: row[10]
            } as any;

            rows.push(rowData);
          }

          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  private formatExcelDate(excelDate: any): string {
    if (!excelDate) return '';

    // Si ya es una fecha en formato string
    if (typeof excelDate === 'string') {
      return excelDate.split(' ')[0]; // Tomar solo la parte de fecha
    }

    // Si es un número serial de Excel
    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    return '';
  }

  private async saveDataToAPI(rows: DesarrolloProfesionalRow[]) {
    if (rows.length === 0) {
      this.showWarning(this.translate.instant('DESARROLLO_PROFESIONAL.NO_DATOS_VALIDOS'));
      this.loading = false;
      return;
    }

    // Agrupar por curso único
    const cursosMap = new Map<string, CursoModel>();
    const cursoPersonas: CursoPersonaModel[] = [];

    rows.forEach(row => {
      const cursoKey = `${row.programaCodigo}-${row.planEstudio}-${row.codigoCurso}`;

      // Crear o actualizar curso
      if (!cursosMap.has(cursoKey)) {
        const curso = new CursoModel();
        curso.programaCodigo = String(row.programaCodigo);
        curso.planestuId = row.planEstudio;
        curso.codigo = String(row.codigoCurso);
        curso.nombreCurso = row.nombreCurso;
        curso.descripcion = row.descripcion;
        curso.instuducionid = row.institucionId;
        cursosMap.set(cursoKey, curso);
      }

      // Crear CursoPersona
      const cursoPersona = new CursoPersonaModel();
      cursoPersona.usuarioId = row.usuarioId;
      cursoPersona.cursoId = row.codigoCurso;
      cursoPersona.periodo = 1; // Valor por defecto
      cursoPersona.fechainicio = row.fechainicio;
      cursoPersona.fechafinal = row.fechafinal;
      cursoPersona.costocurso = row.costocurso;
      cursoPersonas.push(cursoPersona);
    });

    const cursos = Array.from(cursosMap.values());

    // Guardar primero los cursos
    const cursoRequests = cursos.map(curso =>
      this.api.post<any>('Curso/crear_Curso', curso)
    );

    try {
      await forkJoin(cursoRequests).toPromise();

      // Luego guardar las relaciones CursoPersona (DesarrolloProfesional)
      const cursoPersonaRequests = cursoPersonas.map(cp =>
        this.api.post<any>('DesarrolloProfesional/crear_DesarrolloProfesinales', cp)
      );

      await forkJoin(cursoPersonaRequests).toPromise();

      this.showSuccess(
        this.translate.instant('DESARROLLO_PROFESIONAL.PROCESADO_EXITOSO', {
          cursos: cursos.length,
          asignaciones: cursoPersonas.length
        })
      );
      this.fetchDesarrolloProfesional();
      this.clearFileSelection();
      this.loading = false;
    } catch (error) {
      console.error('Error guardando datos:', error);
      this.showError(this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_GUARDAR_DATOS'));
      this.loading = false;
    }
  }

  clearFileSelection() {
    this.selectedFile = null;
    this.fileName = '';
    const fileInput = document.getElementById('excelFileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // -----------------------
  // Consultar desarrollo profesional
  // -----------------------
  fetchDesarrolloProfesional() {
    this.error = null;
    this.loadingTable = true;

    this.api.get<any>('DesarrolloProfesional/Consultar_DesarrolloProfesional')
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

          this.data = items;
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar desarrollo profesional', err);
          this.error = this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_CARGAR_INFO');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_CARGAR_INFO'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Eliminar registro
  // -----------------------
  async deleteItem(id: any) {
    const confirmado = await this.showConfirm(
      this.translate.instant('DESARROLLO_PROFESIONAL.CONFIRMAR_ELIMINAR')
    );
    if (!confirmado) return;

    this.api.delete(`DesarrolloProfesional/Eliminar_DesarrolloProfesional/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchDesarrolloProfesional();
          this.showSuccess(this.translate.instant('DESARROLLO_PROFESIONAL.ELIMINADO_EXITOSO'));
        },
        error: (err) => {
          console.error('Error al eliminar desarrollo profesional', err);
          this.showError(this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_ELIMINAR_ASOCIADO'));
        }
      });
  }

  // -----------------------
  // Buscar/filtrar
  // -----------------------
  filterDesarrolloProfesional() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('DESARROLLO_PROFESIONAL.DEBE_DIGITAR_VALOR'));
      return;
    }

    const filtroLower = this.filtro.toLowerCase().trim();
    this.filteredData = this.data.filter(item =>
      item.nombreCurso?.toLowerCase().includes(filtroLower) ||
      item.descripcion?.toLowerCase().includes(filtroLower)
    );

    this.currentPage = 1;
    this.calculateTotalPages();
    this.updatePagedData();
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

  trackByIndex(_: number, item: DesarrolloProfesionalRow) {
    return item.id ?? item?.usuarioId ?? _;
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('DESARROLLO_PROFESIONAL.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('DESARROLLO_PROFESIONAL.ERROR_PROCESAR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('DESARROLLO_PROFESIONAL.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('DESARROLLO_PROFESIONAL.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('DESARROLLO_PROFESIONAL.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('DESARROLLO_PROFESIONAL.CANCELAR'),
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
