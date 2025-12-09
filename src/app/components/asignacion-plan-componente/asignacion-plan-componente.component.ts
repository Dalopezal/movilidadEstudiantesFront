import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  SimpleChanges
} from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { AsignacionPlanComponenteModel } from '../../models/AsignacionPlanComponentModel';

@Component({
  selector: 'app-asignacion-plan-componente',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster
  ],
  templateUrl: './asignacion-plan-componente.component.html',
  styleUrls: ['./asignacion-plan-componente.component.css'],
  providers: [ConfirmationService]
})
export class AsignacionPlanComponenteComponent
  implements OnInit, OnDestroy
{
  data: AsignacionPlanComponenteModel[] = [];
  filteredData: AsignacionPlanComponenteModel[] = [];
  pagedData: AsignacionPlanComponenteModel[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  // listas de combos
  planeaciones: any[] = [];
  estrategias: any[] = [];
  estados: any[] = [];
  instituciones: any[] = [];

  facultadesUCM: any[] = [];
  programasUCM: any[] = [];
  planesEstudioUCM: any[] = [];
  gruposUCM: any[] = [];
  componentesUCM: any[] = [];

  docentesTitulares: any[] = [];   // asignaciondocente
  docentesAuxiliares: any[] = [];  // API futuro

  loading = false;
  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: AsignacionPlanComponenteModel = new AsignacionPlanComponenteModel();
  isEditing = false;
  @Input() idConvocatoria!: any;

  private destroy$ = new Subject<void>();
facultadUCM: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.fetchCombosIniciales();
    this.fetchAsignaciones();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idConvocatoria'] && this.idConvocatoria) {
      this.fetchAsignaciones();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------- Combos iniciales ----------
  private fetchCombosIniciales() {
    // Planeaciones (usa 'id')
    this.api
      .get<any>('Planeacion/Consultar_Planeacion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.planeaciones = this.uniqueByKey(this.mapArray(resp), 'id');
        },
        error: (err) => {
          console.error('Error al cargar planeaciones', err);
          this.planeaciones = [];
        }
      });

    // Estrategias (usa 'id')
    this.api
      .get<any>('Estrategia/Consultar_Estrategias')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.estrategias = this.uniqueByKey(this.mapArray(resp), 'id');
        },
        error: (err) => {
          console.error('Error al cargar estrategias', err);
          this.estrategias = [];
        }
      });

    // Estados (usa 'id')
    this.api
      .get<any>('Estado/Consultar_Estados')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.estados = this.uniqueByKey(this.mapArray(resp), 'id');
        },
        error: (err) => {
          console.error('Error al cargar estados', err);
          this.estados = [];
        }
      });

    // Instituciones (usa 'id')
    this.api
      .get<any>('Institucion/Consultar_Institucion')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.instituciones = this.uniqueByKey(this.mapArray(resp), 'id');
        },
        error: (err) => {
          console.error('Error al cargar instituciones', err);
          this.instituciones = [];
        }
      });

    // Facultades UCM (usa 'facultad_codigo')
    this.api
      .getExterno<any[]>('orisiga/facultades/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.facultadesUCM = this.uniqueByKey(this.mapArray(resp), 'facultad_codigo');
        },
        error: (err) => {
          console.error('Error al cargar facultades', err);
          this.facultadesUCM = [];
        }
      });

    // Programas UCM (usa 'programa.codigo' - anidado)
    this.api
      .getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.programasUCM = this.uniqueByNestedKey(this.mapArray(resp), 'programa.codigo');
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.programasUCM = [];
        }
      });

    // Grupos UCM (usa 'grupo')
    this.api
      .getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.gruposUCM = this.uniqueByKey(this.mapArray(resp), 'grupo');
        },
        error: (err) => {
          console.error('Error al cargar grupos', err);
          this.gruposUCM = [];
        }
      });

    // Planes de Estudio UCM (usa 'plan_id')
    this.api
      .getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.planesEstudioUCM = this.uniqueByKey(this.mapArray(resp), 'plan_id');
        },
        error: (err) => {
          console.error('Error al cargar planes de estudio', err);
          this.planesEstudioUCM = [];
        }
      });

    this.api
      .getExterno<any[]>('orisiga/asignaciondocente/?identificacion=24341126')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.componentesUCM = this.uniqueByKey(this.mapArray(resp), 'componente_codigo');
        },
        error: (err) => {
          console.error('Error al cargar componentes', err);
          this.componentesUCM = [];
        }
      });

    this.api
      .get<any>('Docentes/Consultar_DocentesAuxiliares') // cuando exista
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => (this.docentesAuxiliares = this.mapArray(resp)),
        error: () => (this.docentesAuxiliares = [])
      });
  }

  /**
   * Filtra duplicados por una propiedad específica
   * @param arr Array a filtrar
   * @param key Nombre de la propiedad que actúa como identificador único
   */
  private uniqueByKey(arr: any[], key: string): any[] {
    const seen = new Set<any>();
    return arr.filter((item) => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Para objetos anidados (ej: item.programa.codigo)
   * @param arr Array a filtrar
   * @param keyPath Ruta de la propiedad, ej: 'programa.codigo'
   */
  private uniqueByNestedKey(arr: any[], keyPath: string): any[] {
    const seen = new Set<any>();
    return arr.filter((item) => {
      const value = keyPath.split('.').reduce((obj, prop) => obj?.[prop], item);
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  private mapArray(resp: any): any[] {
    let items: any[] = [];
    if (Array.isArray(resp)) items = resp;
    else if (resp && typeof resp === 'object') {
      if (Array.isArray(resp.data)) items = resp.data;
      else if (Array.isArray(resp.items)) items = resp.items;
      else {
        const arr = Object.values(resp).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) items = arr;
      }
    }
    return items;
  }

  // -------- Consultar asignaciones --------
  fetchAsignaciones() {
    this.error = null;
    this.loadingTable = true;

    const url =  `AsignacionPlanComponente/Consultar_AsignacionPlanComponente`;

    this.api
      .get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const items = this.mapArray(response);

          this.data = items.map((i) =>
            AsignacionPlanComponenteModel.fromJSON(i)
          );
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar asignaciones', err);
          this.error =
            'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError(
            'No se pudo cargar la información. Intenta de nuevo'
          );
          this.loadingTable = false;
        }
      });
  }

  // -------- Form --------
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // Validación fechas
    if (
      this.model.fechainicioSemestreUCM &&
      this.model.fechafinSemestreUCM &&
      new Date(this.model.fechafinSemestreUCM) <
        new Date(this.model.fechainicioSemestreUCM)
    ) {
      this.showWarning(
        'La fecha final no puede ser menor a la fecha inicial.'
      );
      return;
    }

    this.loading = true;
    this.error = null;

    const isUpdate = this.isEditing && this.model.id && this.model.id > 0;
    const payload = this.model.toJSON();

    const endpoint = isUpdate
      ? 'AsignacionPlanComponente/actualiza_AsignacionPlanComponente'
      : 'AsignacionPlanComponente/crear_AsignacionPlanComponente';

    const obs = isUpdate
      ? this.api.put<any>(endpoint, payload)
      : this.api.post<any>(endpoint, payload);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.fetchAsignaciones();
        this.resetForm(form);
        this.loading = false;

        if (response.exito && response.datos) {
          this.showSuccess(response.exito);
        } else if (response.error && response.datos === false) {
          this.showError(response.error);
        } else {
          this.showError('Respuesta desconocida del servidor.');
        }
      },
      error: (err) => {
        console.error(
          isUpdate
            ? 'Error al actualizar asignación'
            : 'Error al crear asignación',
          err
        );
        this.error = 'No se pudo procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.showError('No se pudo procesar la solicitud. Intenta de nuevo');
      }
    });
  }

  resetForm(form?: NgForm) {
    this.model = new AsignacionPlanComponenteModel();
    this.isEditing = false;
    if (form) form.resetForm({});
  }

  startEdit(item: AsignacionPlanComponenteModel) {
    this.model = Object.assign(new AsignacionPlanComponenteModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(
      '¿Estás seguro de eliminar este registro?'
    );
    if (!confirmado) return;

    this.api
      .delete(`AsignacionPlanComponente/Eliminar/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchAsignaciones();
          this.showSuccess('Se eliminó el registro satisfactoriamente');
        },
        error: (err) => {
          console.error(
            'Error al eliminar asignación, el registro se encuentra asociado',
            err
          );
          this.showError(
            'Error al eliminar asignación, el registro se encuentra asociado'
          );
        }
      });
  }

  // -------- Paginación --------
  calculateTotalPages() {
    const totalItems = Array.isArray(this.filteredData)
      ? this.filteredData.length
      : 0;
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

  trackByIndex(_: number, item: AsignacionPlanComponenteModel) {
    return item?.id ?? _;
  }

  // -------- Toasters / Confirm --------
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
        reject: () => resolve(false)
      });
    });
  }

  // ------- Helpers de lógica de UCM -------
  get esInstitucionUCM(): boolean {
    const instId = Number(this.model.institucionId);
    return instId === 3;
  }

  onInstitucionChange() {
    // cuando cambia institución y NO es UCM, limpiamos combos UCM
    if (!this.esInstitucionUCM) {
      this.model.facultadoUCM = '';
      this.model.programaUCM = '';
      this.model.planestudioId = null;
      this.model.numerogrupo = null;
      this.model.componenteCodigoUCM = '';
      this.model.nombreComponenteUCM = '';
    } else {
      // si es UCM, limpiamos campos externos
      this.model.facultaExterno = null;
      this.model.programaExterno = null;
      this.model.componenteExterno = null;
    }
  }
}
