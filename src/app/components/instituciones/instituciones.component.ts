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
import { InstitucionModel } from '../../models/InstitucionModel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-instituciones',
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
  templateUrl: './instituciones.component.html',
  styleUrls: ['./instituciones.component.css'],
  providers: [ConfirmationService]
})
export class InstitucionesComponent implements OnInit, OnDestroy {
  data: InstitucionModel[] = [];
  filteredData: InstitucionModel[] = [];
  pagedData: InstitucionModel[] = [];

  paises: any[] = [];
  ciudades: any[] = [];
  selectedPaisId: number | null = null;

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';

  model: InstitucionModel = new InstitucionModel();
  isEditing = false;
  loadingTable: any;

  private destroy$ = new Subject<void>();

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.fetchPaises();
    this.fetchInstituciones();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // Cargar paises
  // -----------------------
  fetchPaises() {
    this.api.get<any>('Pais/Consultar_Pais')
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
          this.paises = items.map(item => ({ id: item.id, nombre: item.nombre }));
        },
        error: (err) => {
          console.error('Error al cargar países', err);
          this.paises = [];
        }
      });
  }

  // -----------------------
  // Cargar ciudades por país
  // -----------------------
  onPaisChange() {
    const paisId = Number(this.selectedPaisId ?? 0);
    this.model.ciudadId = null;
    this.ciudades = [];

    if (!paisId) return;

    this.api.get<any>(`Ciudad/Consultar_CiudadEspecificoPais?idPais=${paisId}`)
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
          this.ciudades = items.map(item => ({ id: Number(item.id), nombre: item.nombreCiudad }));
        },
        error: (err) => {
          console.error('Error al cargar ciudades', err);
          this.ciudades = [];
        }
      });
  }

  // -----------------------
  // Consultar instituciones
  // -----------------------
  fetchInstituciones() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>('Institucion/Consultar_Institucion')
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
            InstitucionModel.fromJSON
              ? InstitucionModel.fromJSON(item)
              : Object.assign(new InstitucionModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar instituciones', err);
          const msg = this.translate.instant('INSTITUCIONES.MENSAJES.ERROR_CARGA');
          this.error = msg;
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(msg);
          this.loadingTable = false;
        }
      });
  }

  // -----------------------
  // Buscar/filtrar por nombre
  // -----------------------
  filterInstituciones() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      const msg = this.translate.instant('INSTITUCIONES.MENSAJES.FILTRO_VACIO');
      this.showWarning(msg);
      return;
    }
    this.loadingTable = true;

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Institucion/Consultar_InstitucionGeneral?nombreInstitucion=${q}`)
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
            InstitucionModel.fromJSON ? InstitucionModel.fromJSON(item) : Object.assign(new InstitucionModel(), item)
          );

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar instituciones', err);
          const msg = this.translate.instant('INSTITUCIONES.MENSAJES.ERROR_CARGA');
          this.error = msg;
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(msg);
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

    if (!this.model.nombre?.trim() || !this.model.contactoDescripcion?.trim()) {
      this.error = this.translate.instant('INSTITUCIONES.MENSAJES.NOMBRE_DESC_REQUERIDOS');
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload: any = {
      nombre: this.model.nombre,
      contactoDescripcion: this.model.contactoDescripcion,
      ciudadId: this.model.ciudadId != null ? Number(this.model.ciudadId) : null
    };

    if (isUpdate) payload.id = this.model.id;

    const endpoint = isUpdate ? 'Institucion/actualiza_Institucion' : 'Institucion/crear_Institucion';

    const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchInstituciones();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError(this.translate.instant('INSTITUCIONES.MENSAJES.RESPUESTA_DESCONOCIDA'));
        }
      },
      error: (err) => {
        console.error(isUpdate ? 'Error al actualizar institución' : 'Error al crear institución', err);
        const msg = this.translate.instant('INSTITUCIONES.MENSAJES.ERROR_PROCESAR');
        this.error = msg;
        this.loading = false;
        this.showError(msg);
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new InstitucionModel();
    this.isEditing = false;
    this.selectedPaisId = null;
    this.ciudades = [];
    if (form) form.resetForm();
  }

  startEdit(item: InstitucionModel) {
    const paisId = item.paisId != null ? Number(item.paisId) : null;
    const ciudadId = item.ciudadId != null ? Number(item.ciudadId) : null;

    this.selectedPaisId = paisId;
    this.isEditing = true;

    if (!paisId) {
      this.ciudades = [];
      this.model = Object.assign(new InstitucionModel(), item);
      this.model.ciudadId = null;
      return;
    }

    this.api.get<any>(`Ciudad/Consultar_CiudadEspecificoPais?idPais=${paisId}`)
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
          this.ciudades = items.map(i => ({ id: Number(i.id), nombre: i.nombreCiudad }));

          this.model = Object.assign(new InstitucionModel(), item);
          this.model.ciudadId = ciudadId;
        },
        error: () => {
          this.ciudades = [];
          this.model = Object.assign(new InstitucionModel(), item);
          this.model.ciudadId = null;
        }
      });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const question = this.translate.instant('INSTITUCIONES.MENSAJES.CONFIRMAR_ELIMINAR');
    const confirmado = await this.showConfirm(question);
    if (!confirmado) return;

    this.api.delete(`Institucion/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchInstituciones();
          this.showSuccess(this.translate.instant('INSTITUCIONES.MENSAJES.ELIMINAR_OK'));
        },
        error: (err) => {
          console.error('Error al eliminar institución, el resgistro se encuentra asociado', err);
          this.showError(this.translate.instant('INSTITUCIONES.MENSAJES.ELIMINAR_ERROR_ASOCIADO'));
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

  trackByIndex(_: number, item: InstitucionModel) {
    return item?.id ?? _;
  }

  // -----------------------
  // Toasters / Confirm
  // -----------------------
  showSuccess(mensaje: any) {
    const title = this.translate.instant('INSTITUCIONES.TOASTS.EXITO_TITULO');
    toast.success(title, {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    const title = this.translate.instant('INSTITUCIONES.TOASTS.ERROR_TITULO');
    toast.error(title, {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    const title = this.translate.instant('INSTITUCIONES.TOASTS.WARNING_TITULO');
    toast.warning(title, {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('INSTITUCIONES.CONFIRM.HEADER'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('INSTITUCIONES.CONFIRM.ACEPTAR'),
        rejectLabel: this.translate.instant('INSTITUCIONES.CONFIRM.CANCELAR'),
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
