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
import { EstrategiaPlanModel } from '../../models/EstrategiaPlanModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-asignacion-estrategia',
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
  templateUrl: './asignacion-estrategia.component.html',
  styleUrls: ['./asignacion-estrategia.component.css'],
  providers: [ConfirmationService]
})
export class EstrategiaComponent implements OnInit, OnDestroy {
  data: EstrategiaPlanModel[] = [];
  filteredData: EstrategiaPlanModel[] = [];
  pagedData: EstrategiaPlanModel[] = [];

  // Listas para los combos
  listaInsignias: any[] = [];
  listaTiposEstrategia: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: EstrategiaPlanModel = new EstrategiaPlanModel();
  isEditing = false;
  @Input() idConvocatoria!: any;

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchCatalogos();
    this.fetchEstrategias();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchEstrategias();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Cargar catálogos (insignias y tipos de estrategia)
  // -----------------------
  fetchCatalogos() {
    forkJoin({
      insignias: this.api.get<any>('InsigniaDigital/Consultar_InsigniaDigital'),
      tiposEstrategia: this.api.get<any>('TipoEstrategia/Consultar_TipoEstrategia')
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        // Procesar insignias
        if (Array.isArray(result.insignias)) {
          this.listaInsignias = result.insignias;
        } else if (result.insignias && typeof result.insignias === 'object') {
          const arr = Object.values(result.insignias).find(v => Array.isArray(v));
          this.listaInsignias = Array.isArray(arr) ? arr : [];
        }

        // Procesar tipos de estrategia
        if (Array.isArray(result.tiposEstrategia)) {
          this.listaTiposEstrategia = result.tiposEstrategia;
        } else if (result.tiposEstrategia && typeof result.tiposEstrategia === 'object') {
          const arr = Object.values(result.tiposEstrategia).find(v => Array.isArray(v));
          this.listaTiposEstrategia = Array.isArray(arr) ? arr : [];
        }
      },
      error: (err) => {
        console.error('Error al cargar catálogos', err);
        this.showError(this.translate.instant('ESTRATEGIA_PLAN.ERROR_CARGAR_CATALOGOS'));
      }
    });
  }

  // -----------------------
  // Consultar estrategias
  // -----------------------
  fetchEstrategias() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('Estrategia/Consultar_Estrategias')
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
            EstrategiaPlanModel.fromJSON
              ? EstrategiaPlanModel.fromJSON(item)
              : Object.assign(new EstrategiaPlanModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar estrategias', err);
          this.error = this.translate.instant('ESTRATEGIA_PLAN.ERROR_CARGAR_INFORMACION');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('ESTRATEGIA_PLAN.ERROR_CARGAR_INFORMACION'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Buscar/filtrar por nombre
  // -----------------------
  filterEstrategias() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('ESTRATEGIA_PLAN.DEBE_DIGITAR_VALOR_BUSQUEDA'));
      return;
    }
    this.loadingTable = true;

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Estrategia/Consultar_EstrategiaGeneral?nombreEstrategia=${q}&TipoEstrategiaNombre=${q}`)
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
            EstrategiaPlanModel.fromJSON ? EstrategiaPlanModel.fromJSON(item) : Object.assign(new EstrategiaPlanModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar estrategias', err);
          this.error = this.translate.instant('ESTRATEGIA_PLAN.ERROR_CARGAR_INFORMACION');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('ESTRATEGIA_PLAN.ERROR_CARGAR_INFORMACION'));
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Form handlers
  // -----------------------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // validaciones adicionales
    if (!this.model.nombre?.trim()) {
      this.error = this.translate.instant('ESTRATEGIA_PLAN.NOMBRE_OBLIGATORIO');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      nombre: this.model.nombre,
      reqDocenteAdicional: !!this.model.reqDocenteAdicional,
      reqValidaSegIdioma: !!this.model.reqValidaSegIdioma,
      tieneinsignea: !!this.model.tieneinsignea,
      insigniaId: this.model.insigniaId,
      reqValEstudiante: !!this.model.reqValEstudiante,
      tipoestrategiaId: this.model.tipoestrategiaId,
      reqGeneraCertificado: !!this.model.reqGeneraCertificado
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Estrategia/actualiza_Estrategia' : 'Estrategia/crear_Estrategia';

    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchEstrategias();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('ESTRATEGIA_PLAN.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar estrategia' : 'Error al crear estrategia', err);
        this.error = this.translate.instant('ESTRATEGIA_PLAN.ERROR_PROCESAR_SOLICITUD');
        this.loading = false;
        this.showError(this.translate.instant('ESTRATEGIA_PLAN.ERROR_PROCESAR_SOLICITUD'));
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new EstrategiaPlanModel();
    this.isEditing = false;
    if (form) form.resetForm({
      nombre: '',
      reqDocenteAdicional: false,
      reqValidaSegIdioma: false,
      tieneinsignea: false,
      insigniaId: null,
      reqValEstudiante: false,
      tipoestrategiaId: null,
      reqGeneraCertificado: false
    });
  }

  startEdit(item: EstrategiaPlanModel) {
    this.model = Object.assign(new EstrategiaPlanModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('ESTRATEGIA_PLAN.CONFIRMAR_ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`EstrategiaPlan/Eliminar_EstrategiaPlan/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchEstrategias();
          this.showSuccess(this.translate.instant('ESTRATEGIA_PLAN.REGISTRO_ELIMINADO'));
        },
        error: (err) => {
          console.error('Error al eliminar estrategia, el registro se encuentra asociado', err);
          this.showError(this.translate.instant('ESTRATEGIA_PLAN.ERROR_ELIMINAR_ASOCIADO'));
        }
      });
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

  trackByIndex(_: number, item: EstrategiaPlanModel) {
    return item?.id ?? _;
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('ESTRATEGIA_PLAN.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('ESTRATEGIA_PLAN.ERROR_PROCESAR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('ESTRATEGIA_PLAN.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('ESTRATEGIA_PLAN.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('ESTRATEGIA_PLAN.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('ESTRATEGIA_PLAN.CANCELAR'),
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
