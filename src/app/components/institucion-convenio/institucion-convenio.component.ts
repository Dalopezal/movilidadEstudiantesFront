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
import { InstitucionConvenioModel } from '../../models/InstitucionConvenioModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-institucion-convenio',
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
  templateUrl: './institucion-convenio.component.html',
  styleUrls: ['./institucion-convenio.component.css'],
  providers: [ConfirmationService]
})
export class InstitucionConvenioComponent implements OnInit, OnDestroy {
  data: InstitucionConvenioModel[] = [];
  filteredData: InstitucionConvenioModel[] = [];
  pagedData: InstitucionConvenioModel[] = [];

  instituciones: any[] = [];
  convenios: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: InstitucionConvenioModel = new InstitucionConvenioModel();
  isEditing = false;

  private destroy$ = new Subject<void>();
  loadingTable: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchInstituciones();
    this.fetchConvenios();
    this.fetchRelaciones();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- loaders para selects ----------
  fetchInstituciones() {
    this.api.get<any>('Institucion/Consultar_Institucion')
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
          this.instituciones = items.map(i => ({ id: Number(i.id), nombre: i.nombre }));
        },
        error: (err) => { console.error('Error cargando instituciones', err); this.instituciones = []; }
      });
  }

  fetchConvenios() {
    this.api.get<any>('Convenios/Consultar_Convenio')
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
          this.convenios = items.map(i => ({ id: Number(i.id), nombre: i.codigoUcm }));
        },
        error: (err) => { console.error('Error cargando convenios', err); this.convenios = []; }
      });
  }

  // ---------- CRUD / listado ----------
  fetchRelaciones() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('InstitucionConvenio/Consultar_ConsultarInstitucionConvenio')
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
            InstitucionConvenioModel.fromJSON ? InstitucionConvenioModel.fromJSON(item) : Object.assign(new InstitucionConvenioModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar relaciones', err);
          this.error = this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_CARGA');
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_CARGA'));
          this.loadingTable = false;
        }
      });
  }

  filterRelaciones() {
    this.error = null;
    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.FILTRO_VACIO'));
      return;
    }
    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`InstitucionConvenio/Consultar_InstitucionConvenioGeneral?nombreInstitucion=${q}&nombreConvenio=${q}`)
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

          this.data = items.map(item => InstitucionConvenioModel.fromJSON ? InstitucionConvenioModel.fromJSON(item) : Object.assign(new InstitucionConvenioModel(), item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar relaciones', err);
          this.showError(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_FILTRO'));
          this.loadingTable = false;
        }
      });
  }

  // ---------- Form handlers ----------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.institucionId || !this.model.convenioId) {
      this.error = this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_SELECCION');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      institucionId: Number(this.model.institucionId),
      convenioId: Number(this.model.convenioId)
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'InstitucionConvenio/actualiza_Beneficio' : 'InstitucionConvenio/crear_InstitucionConvenio';
    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchRelaciones();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar relación' : 'Error al crear relación', err);
        this.error = this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_PROCESAR');
        this.loading = false;
        this.showError(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_PROCESAR'));
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new InstitucionConvenioModel();
    this.isEditing = false;
    if (form) form.resetForm({
      institucionId: null,
      convenioId: null
    });
  }

  startEdit(item: InstitucionConvenioModel | any) {
    this.model = InstitucionConvenioModel.fromJSON(item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('INSTITUCION_CONVENIO.CONFIRM.ELIMINAR'));
    if (!confirmado) return;

    this.api.delete(`CondicionConvocatoria/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchRelaciones();
          this.showSuccess(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ELIMINADO_EXITO'));
        },
        error: (err) => {
          console.error('Error al eliminar relación', err);
          this.showError(this.translate.instant('INSTITUCION_CONVENIO.MENSAJES.ERROR_ELIMINAR'));
        }
      });
  }

  // ---------- Paginación ----------
  calculateTotalPages() {
    const totalItems = Array.isArray(this.filteredData) ? this.filteredData.length : 0;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updatePagedData() {
    if (!Array.isArray(this.filteredData)) { this.pagedData = []; return; }
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

  trackByIndex(_: number, item: InstitucionConvenioModel) {
    return item?.id ?? _;
  }

  // ---------- Toasters / Confirm ----------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('INSTITUCION_CONVENIO.TOASTS.EXITO_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('INSTITUCION_CONVENIO.TOASTS.ERROR_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('INSTITUCION_CONVENIO.TOASTS.WARNING_TITULO'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: `¿${mensaje}?`,
        header: this.translate.instant('INSTITUCION_CONVENIO.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('INSTITUCION_CONVENIO.CONFIRM.ACEPTAR'),
        rejectLabel: this.translate.instant('INSTITUCION_CONVENIO.CONFIRM.CANCELAR'),
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
