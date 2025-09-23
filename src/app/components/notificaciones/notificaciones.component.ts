import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { GenericApiService } from '../../services/generic-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificacionModel } from '../../models/NotificacionModel';

@Component({
  selector: 'app-notificaciones',
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
  providers: [ConfirmationService]
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  data: NotificacionModel[] = [];
  filteredData: NotificacionModel[] = [];
  pagedData: NotificacionModel[] = [];

  categoriasMovilidad: any[] = [];
  modalidades: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loading = false;
  error: string | null = null;
  filtro: string = '';
  fechaInicial: string = '';
  fechaFinal: string = '';
  estadoId: number = 0;
  tipoMovilidadIdId: number = 0;

  model: NotificacionModel = new NotificacionModel();
  isEditing = false;

  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();
  estados: any[] = [];
  tipoMovilidad: any[] = [];
  convocatoriaId: any;

  selectedItem: any = null;
  cardPosition = { top: 100, left: 50 };
  isClosing = false;
  nombreCombocatoria: any;
  idConvocatoria: any;

  @Input() postulacionId: any;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.postulacionId != undefined ? this.fetchPostulaciones() : '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['postulacionId'] && this.postulacionId) {
      this.fetchPostulaciones();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- CRUD / listado ----------
  fetchPostulaciones() {

    this.error = null;
    this.loading = true;
    this.api.get<any>('Notificaciones/Consultar_Notificaciones?idPostulacion=' + this.postulacionId)
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

          this.data = items.map(item => NotificacionModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
           this.loading = false;
        },
        error: (err) => {
          console.error('Error al consultar convocatorias', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError();
           this.loading = false;
        }
      });
  }

  filterPostulaciones() {

  }

  // ---------- Paginación ----------
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

  // ---------- Toasters / Confirm ----------
  showSuccess() {
    toast.success('¡Operación exitosa!', {
      description: 'Tus datos se procesaron correctamente',
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError() {
    toast.error('Error al procesar', {
      description: 'El registro se encuentra asociado',
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

  abrirPostulacionDetalle(item: NotificacionModel) {
    this.router.navigate(['/postulacion-detalle'], {queryParams: {
      id: item.id
    }
    });
  }

  trackByIndex(_: number, item: NotificacionModel) {
      return item?.id ?? _;
  }

  toggleDetalle(item: any) {
    if (this.selectedItem && this.selectedItem.idPostulacion === item.idPostulacion) {
      this.closeCard();
    } else {
      this.selectedItem = item;
      this.isClosing = false;
    }
  }

  closeCard() {
    this.isClosing = true;

    setTimeout(() => {
      this.selectedItem = null;
      this.isClosing = false;
    }, 400);
  }

  goBack() {
    this.location.back();
  }
}
