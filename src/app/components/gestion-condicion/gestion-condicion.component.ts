import { Component, OnInit, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { MatDialog } from '@angular/material/dialog';
import { SharePointDriveComponent } from '../drive/drive.component';
import { CondicionModel } from '../../models/CondicionModel';

@Component({
  selector: 'app-gestion-condicion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ConfirmDialogModule, NgxSonnerToaster, SharePointDriveComponent],
  templateUrl: './gestion-condicion.component.html',
  styleUrls: ['./gestion-condicion.component.css'],
  providers: [ConfirmationService]
})
export class GestionCondicionComponent implements OnInit, OnDestroy {
  data: any[] = [];
  filteredData: any[] = [];
  pagedData: any[] = [];

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  loadingTable = false;
  error: string | null = null;
  filtro: string = '';

  model: CondicionModel = new CondicionModel();
  isEditing = false;

  @Input() idConvocatoria!: any;
  @Input() idPostulacion!: any;
  @Input() convocatoria!: any;
  @Input() documento!: any;

  usuario: any;
  condicionesConvocatoria: number = 0;
  lstCondicionesConvocatoria: any[] = [];

  selectedItemCard: any | null = null;

  isClosing = false;
  cardPosition = { top: 100, left: 100 };

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService, private confirmationService: ConfirmationService, public dialog: MatDialog) {}

  ngOnInit() {
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    this.fetchCondiciones();
    this.fetchListaCondicionesConvocatoria();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['idConvocatoria'] && this.idConvocatoria) || (changes['idPostulacion'] && this.idPostulacion)) {
      this.fetchCondiciones();
      this.fetchListaCondicionesConvocatoria();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- Fetch lista de condiciones asociadas a la postulacion ----------
  fetchCondiciones() {
    this.error = null;
    this.loadingTable = true;
    this.api.get<any>(`CumplimientoCondicion/Consultar_CumplimientoCondicionesPostulacion?idPostulacion=${this.idPostulacion}`)
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

          // Mapeo para que el template pueda usar item.url, item.estado y item.descripcion
          this.data = items.map((item: any) => {
            const base = CondicionModel.fromJSON ? CondicionModel.fromJSON(item) : Object.assign(new CondicionModel(), item);
            const mapped: any = { ...item };

            // descripcion para mostrar en tabla (usa descripcion o nombreCondicion)
            mapped.descripcion = item.descripcion ?? item.nombreCondicion ?? base.descripcion ?? base.nombreCondicion ?? '';

            // url (si no existe en el backend, dejamos 'NA')
            mapped.url = item.url ?? 'NA';

            // estado booleano para checkbox / badges; backend usa estadoId
            mapped.estado = (item.estado !== undefined) ? Boolean(item.estado) : (Number(item.estadoId ?? base.estadoId) === 1);

            // id
            mapped.id = item.id ?? base.id ?? 0;

            return mapped;
          });

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar condiciones', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError('No se pudo cargar la información. Intenta de nuevo');
          this.loadingTable = false;
        }
      });
  }

  // ---------- Registrar condicion seleccionada desde select ----------
  async registrarCondicion(idCondicion: any) {
    if (!idCondicion || idCondicion === 0) return;

    const confirmado = await this.showConfirm('¿Estás seguro de agregar la condición?');
    if (!confirmado) {
      this.condicionesConvocatoria = 0;
      return;
    }

    const payload = {
      condicionesConvocatoriaId: idCondicion,
      postulacionId: this.idPostulacion,
      url: "NA",
      estado: false,
      fechaRevision: this.getFechaActual(),

    };

    this.api.post('CumplimientoCondicion/crear_CumplimientoCondiciones', payload).subscribe({
      next: () => {
        this.showSuccess('Condición registrada exitosamente');
        this.fetchCondiciones();
        this.condicionesConvocatoria = 0;
      },
      error: (err) => {
        const mensaje = err?.error?.message || err?.message || 'Error al registrar la condición';
        this.showError(mensaje);
        this.condicionesConvocatoria = 0;
      }
    });
  }

  // ---------- Lista de condiciones disponibles en la convocatoria (select) ----------
  private fetchListaCondicionesConvocatoria() {
    if (!this.idConvocatoria) {
      this.lstCondicionesConvocatoria = [];
      return;
    }

    this.api.get<any>(`CondicionConvocatoria/Consultar_CondicionesConvocatoriaConvocatoria?idConvocatoria=${this.idConvocatoria}`)
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

          this.lstCondicionesConvocatoria = items.map(item => ({
            id: item.id,
            nombre: `${item.nombreCondicion ?? item.nombre ?? ''} - ${item.descripcion ?? ''}`
          }));
        },
        error: (err) => {
          console.error('Error al cargar condiciones convocatoria para select', err);
          this.lstCondicionesConvocatoria = [];
        }
      });
  }

  // ---------- Filtrado (usa endpoint genérico similar) ----------
  filterCondiciones() {
    this.error = null;

    if (!this.filtro || this.filtro.trim() === '') {
      this.showWarning('Debe digitar un valor para ejecutar la búsqueda');
      return;
    }
    this.loadingTable = true;

    const q = encodeURIComponent(this.filtro.trim());
    this.api.get<any>(`Condicion/Consultar_CondicionGeneral?nombre=${q}&nombreConvocatoria=${q}`)
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

          this.data = items.map((item: any) => {
            const base = CondicionModel.fromJSON ? CondicionModel.fromJSON(item) : Object.assign(new CondicionModel(), item);
            const mapped: any = { ...item };
            mapped.descripcion = item.descripcion ?? item.nombreCondicion ?? base.descripcion ?? base.nombreCondicion ?? '';
            mapped.url = item.url ?? 'NA';
            mapped.estado = (item.estado !== undefined) ? Boolean(item.estado) : (Number(item.estadoId ?? base.estadoId) === 1);
            mapped.id = item.id ?? base.id ?? 0;
            return mapped;
          });

          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al filtrar condiciones', err);
          this.error = 'No se pudo cargar la información. Intenta de nuevo.';
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.calculateTotalPages();
          this.showError('No se pudo cargar la información. Intenta de nuevo');
          this.loadingTable = false;
        }
      });
  }

  // ---------- CRUD helpers ----------
  resetForm(form?: NgForm) {
    this.model = new CondicionModel();
    this.isEditing = false;
    if (form) form.resetForm({
      nombreCondicion: '',
      descripcion: '',
      tipoCondicion: ''
    });
  }

  startEdit(item: any) {
    this.model = CondicionModel.fromJSON ? CondicionModel.fromJSON(item) : Object.assign(new CondicionModel(), item);
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm('¿Estás seguro de eliminar este registro?');
    if (!confirmado) return;

    this.api.delete(`Condicion/Eliminar_Condicion/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchCondiciones();
          this.showSuccess('Se eliminó el registro satisfactoriamente');
        },
        error: (err) => {
          console.error('Error al eliminar condición, el registro se encuentra asociado', err);
          this.showError('Error al eliminar condición, el resgistro se encuentra asociado');
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

  trackByIndex(_: number, item: any) {
    return item?.id ?? _;
  }

  // ---------- Toasters / Confirm ----------
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
        reject: () => resolve(false),
      });
    });
  }

  abrirModalDrive() {
    this.dialog.open(SharePointDriveComponent, {
      width: '600px',
      height: '480px',
      disableClose: false,
      data: {
        documento: this.documento,
        convocatoria: this.convocatoria
      }
    });
  }

  toggleDetalleConvocatoria(item: any) {
    if (this.selectedItemCard && this.selectedItemCard.id === item.id) {
      this.closeCard();
    } else {
      this.selectedItemCard = item;
      this.isClosing = false;
    }
  }

  closeCard() {
    this.isClosing = true;
    setTimeout(() => {
      this.selectedItemCard = null;
      this.isClosing = false;
    }, 400);
  }

  getFechaActual(){
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  abrirUrlCondicion(item: any) {
    if (!item.rutaArchivo || item.rutaArchivo === 'NA') {
      this.showWarning('Esta condición aún no tiene un archivo asociado.');
      return;
    }

    try {
      window.open(item.rutaArchivo, '_blank');
    } catch (e) {
      this.showError('No se pudo abrir la URL de la condición');
    }
  }

  async cambiarEstadoAprobacion(event: Event, item: any) {
    event.preventDefault();

    const nuevoEstado = !item.estado;
    const accion = nuevoEstado ? 'aprobar' : 'marcar como pendiente';

    const confirmado = await this.showConfirm(`¿Deseas ${accion} la condición "${item.descripcion}"?`);

    if (confirmado) {
      const modelUpdate = { ...item, estado: nuevoEstado };

      this.api.put('CumplimientoCondicion/Actualiza_CumplimientoCondiciones', modelUpdate).subscribe({
        next: () => {
          item.estado = nuevoEstado;
          this.showSuccess(`Condición ${nuevoEstado ? 'aprobada' : 'pendiente'} correctamente`);
        },
        error: (err) => {
          this.showError('No se pudo actualizar el estado');
        }
      });
    }
  }

  // Método para crear un objeto compatible con EntregablePostulacionModel
createEntregableFromCondicion(condicion: any): any {
  return {
    id: condicion.id,
    url: condicion.url || 'NA',
    estado: condicion.estado,
    // Puedes agregar otras propiedades necesarias según el modelo EntregablePostulacionModel
    // Por ahora solo usamos las que necesitamos para el SharePointDriveComponent
  };
}

  onRegistroActualizado(updated: any) {
    if (!updated) return;

    // 1) Actualizar selectedItemCard si coincide
    if (this.selectedItemCard && this.selectedItemCard.id === updated.id) {
      this.selectedItemCard = { ...this.selectedItemCard, ...updated };
    }

    // 2) Actualizar la lista en memoria (this.data)
    if (Array.isArray(this.data)) {
      this.data = this.data.map((d: any) => d.id === updated.id ? { ...d, ...updated } : d);
    }

    // 3) Si usas filteredData (por filtros activos), actualizarlo también
    if (Array.isArray(this.filteredData)) {
      this.filteredData = this.filteredData.map((d: any) => d.id === updated.id ? { ...d, ...updated } : d);
    }

    // 4) Recalcular paginación y refrescar lo mostrado
    this.calculateTotalPages();
    this.updatePagedData();
  }
}
