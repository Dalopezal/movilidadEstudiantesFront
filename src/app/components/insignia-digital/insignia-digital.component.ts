import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, takeUntil, lastValueFrom } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { GenericApiService } from '../../services/generic-api.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { InsigniaDigitalModel } from '../../models/InsigniaDigitalModel';
import { MsalService } from '@azure/msal-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-insignia-digital',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    NgxSonnerToaster,
    TranslateModule
  ],
  templateUrl: './insignia-digital.component.html',
  styleUrls: ['./insignia-digital.component.css'],
  providers: [ConfirmationService]
})
export class InsigniaDigitalComponent implements OnInit, OnDestroy {
  data: InsigniaDigitalModel[] = [];
  filteredData: InsigniaDigitalModel[] = [];
  pagedData: InsigniaDigitalModel[] = [];

  model: InsigniaDigitalModel = new InsigniaDigitalModel();
  isEditing = false;
  loading = false;
  loadingTable = false;
  filtro = '';

  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  totalPages = 0;
  pages: number[] = [];

  private destroy$ = new Subject<void>();

  // Archivo seleccionado por el usuario
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;

  // DriveId (usa el que compartiste)
  private driveId = "b!hxInP5NdSkWGDF706k5q4NgI4QHbbA9MuYfs3fRJTRQp2TIIFpMeSKgCChkFV0A1";

  isDragOver = false;

  constructor(
    private api: GenericApiService,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
    private msal: MsalService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.fetchInsignias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------
  // MSAL / Token
  // -----------------------
  private async ensureSignedIn(): Promise<void> {
    const account = this.msal.instance.getActiveAccount();
    if (!account) {
      const res = await this.msal.instance.loginPopup({
        scopes: ['User.Read', 'Sites.ReadWrite.All', 'Files.ReadWrite.All']
      });
      if (res.account) this.msal.instance.setActiveAccount(res.account);
    }
  }

  private async getToken(scopes: string[] = ['Sites.ReadWrite.All', 'Files.ReadWrite.All']): Promise<string> {
    const account = this.msal.instance.getActiveAccount();
    if (!account) {
      throw new Error(this.translate.instant('INSIGNIA_DIGITAL.ERROR_NO_CUENTA'));
    }
    const tokenResult = await this.msal.instance.acquireTokenSilent({ scopes, account });
    return tokenResult.accessToken;
  }

  // -----------------------
  // SHAREPOINT: obtener/crear carpeta
  // -----------------------
  private async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
    const token = await this.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Filtrar por nombre en los hijos
    const url = parentId
      ? `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${parentId}/children?$filter=name eq '${encodeURIComponent(folderName)}'`
      : `https://graph.microsoft.com/v1.0/drives/${this.driveId}/root/children?$filter=name eq '${encodeURIComponent(folderName)}'`;

    // Intentamos obtener (listar)
    try {
      const resp: any = await lastValueFrom(this.http.get(url, { headers }));
      if (resp?.value && resp.value.length > 0) {
        return resp.value[0].id;
      }
    } catch (err) {
      // continuar a creación
    }

    // Crear carpeta
    const createUrl = parentId
      ? `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${parentId}/children`
      : `https://graph.microsoft.com/v1.0/drives/${this.driveId}/root/children`;

    const createBody = { name: folderName, folder: {} };
    const created: any = await lastValueFrom(this.http.post(createUrl, createBody, { headers }));
    return created.id;
  }

  // -----------------------
  // SUBIR ARCHIVO (a carpeta Insignia)
  // devuelve: { webUrl, id, name }
  // -----------------------
  private async uploadFileToInsignia(file: File): Promise<any> {
    if (!file) throw new Error(this.translate.instant('INSIGNIA_DIGITAL.ERROR_NO_ARCHIVO'));

    await this.ensureSignedIn();
    const documentoFolderId = await this.getOrCreateFolder('Insignia'); // carpeta principal "Insignia"
    // Si quieres subcarpeta por convocatoria o similar, añadir aquí

    const token = await this.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const url = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${documentoFolderId}:/${encodeURIComponent(file.name)}:/content`;

    return new Promise<any>((resolve, reject) => {
      this.uploading = true;
      this.uploadProgress = 0;

      this.http.put(url, file, {
        headers,
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event: any) => {
          // event.type: 1->UploadProgress, 4->Response
          if (event.type === 1 && event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          }
          if (event.type === 4) {
            this.uploading = false;
            this.uploadProgress = 100;
            const driveItem = event.body;
            resolve({
              webUrl: driveItem?.webUrl,
              id: driveItem?.id,
              name: driveItem?.name
            });
          }
        },
        error: (err) => {
          this.uploading = false;
          this.uploadProgress = 0;
          reject(err);
        }
      });
    });
  }

  // -----------------------
  // ELIMINAR ARCHIVO EN INSIGNIA USANDO LA URL O NOMBRE
  // - Intentamos extraer el nombre desde la URL y buscar en la carpeta "Insignia".
  // -----------------------
  private async deleteFileByUrl(webUrl: string): Promise<void> {
    if (!webUrl) return;

    await this.ensureSignedIn();
    const token = await this.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Intentar extraer nombre del archivo de la URL (último segmento antes de query)
    try {
      const urlObj = new URL(webUrl);
      let pathname = decodeURIComponent(urlObj.pathname || '');
      // pathname puede contener '/:f:/r/path/...' en algunos casos o '/sites/.../Shared%20Documents/...' - buscaremos el filename
      const segments = pathname.split('/');
      let fileNameCandidate = segments.pop() || '';
      if (!fileNameCandidate && segments.length) fileNameCandidate = segments.pop() || '';

      // Si no obtenemos nombre, intentamos con search usando webUrl contenido
      // Pero lo más práctico: listamos los hijos de la carpeta Insignia y comparamos por webUrl o por name
      const folderId = await this.getOrCreateFolder('Insignia');
      const listUrl = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${folderId}/children`;
      const resp: any = await lastValueFrom(this.http.get(listUrl, { headers }));

      const children: any[] = resp?.value || [];
      // Intentamos encontrar por webUrl exacta:
      let found = children.find(c => (c.webUrl || '').split('?')[0] === webUrl.split('?')[0]);

      // Si no, por nombre:
      if (!found && fileNameCandidate) {
        found = children.find(c => c.name === fileNameCandidate);
      }

      // Si no encontrado, intentaremos búsqueda por contains del nombre:
      if (!found && fileNameCandidate) {
        found = children.find(c => (c.name || '').includes(fileNameCandidate));
      }

      if (found && found.id) {
        const delUrl = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${found.id}`;
        await lastValueFrom(this.http.delete(delUrl, { headers }));
      } else {
        // No se encontró; quizá ya fue eliminado o la URL apunta a otro drive
        console.warn('No se encontró el archivo en la carpeta Insignia para eliminar:', webUrl);
      }
    } catch (err) {
      console.error('Error al intentar borrar archivo por URL:', err);
      throw err;
    }
  }

  // -----------------------
  // HANDLERS FORM / FILE
  // -----------------------
  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
    // limpiar valor del input para permitir re-selección mismo archivo si se desea
    if (event.target) event.target.value = '';
  }

  async onSubmit(form?: NgForm) {
    if (form && form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const isUpdate = this.isEditing && this.model.id > 0;

      // Si estamos editando y hay un nuevo archivo seleccionado:
      if (isUpdate && this.selectedFile) {
        // Borrar primero el archivo actual de SharePoint si existe
        if (this.model.url) {
          try {
            await this.deleteFileByUrl(this.model.url);
          } catch (err) {
            console.warn('No se pudo borrar archivo anterior (seguimos con la actualización):', err);
            // no abortar la operación; dejamos que el usuario decida
          }
        }

        // Subir nuevo archivo y actualizar la URL en el modelo
        const uploadResp = await this.uploadFileToInsignia(this.selectedFile);
        this.model.url = uploadResp.webUrl;
      }

      // Si es creación y hay archivo seleccionado -> subir y setear url
      if (!isUpdate && this.selectedFile) {
        const uploadResp = await this.uploadFileToInsignia(this.selectedFile);
        this.model.url = uploadResp.webUrl;
      }

      // Si no hay archivo seleccionado en edición o creación, se mantiene la URL actual (si existe)
      const payload = this.model.toJSON ? this.model.toJSON() : { ...this.model };

      const endpoint = isUpdate
        ? 'InsigniaDigital/actualiza_InsigniaDigital'
        : 'InsigniaDigital/crear_InsigniaDigital';

      const obs = isUpdate ? this.api.put<any>(endpoint, payload) : this.api.post<any>(endpoint, payload);

      obs.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.fetchInsignias();
          this.resetForm(form);
          this.loading = false;
          this.selectedFile = null;
          this.uploadProgress = 0;
          this.uploading = false;

          if (response?.exito) {
            this.showSuccess(response.exito);
          } else if (response?.error) {
            this.showError(response.error);
          } else {
            this.showSuccess(this.translate.instant('INSIGNIA_DIGITAL.OPERACION_REALIZADA'));
          }
        },
        error: (err) => {
          console.error('Error al guardar insignia', err);
          this.showError(this.translate.instant('INSIGNIA_DIGITAL.ERROR_PROCESAR'));
          this.loading = false;
          this.uploading = false;
        }
      });
    } catch (err: any) {
      console.error('Error en flujo de subida/registro:', err);
      this.showError(err?.message || this.translate.instant('INSIGNIA_DIGITAL.ERROR_INESPERADO'));
      this.loading = false;
      this.uploading = false;
    }
  }

  async deleteItem(id: number) {
    const confirmado = await this.showConfirm(this.translate.instant('INSIGNIA_DIGITAL.CONFIRMAR_ELIMINAR'));
    if (!confirmado) return;

    const insigniaToDelete = this.data.find(i => i.id === id);
    if (!insigniaToDelete) {
      this.showError(this.translate.instant('INSIGNIA_DIGITAL.ERROR_NO_ENCONTRADA'));
      return;
    }

    // Intentar borrar archivo en SharePoint si existe
    if (insigniaToDelete.url) {
      try {
        await this.ensureSignedIn();
        await this.deleteFileByUrl(insigniaToDelete.url);
      } catch (err) {
        console.warn('No se pudo eliminar el archivo asociado. Se procederá a eliminar el registro igualmente.', err);
        // opcional: preguntar al usuario si desea continuar
      }
    }

    this.api.delete(`InsigniaDigital/Eliminar_Insignia/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchInsignias();
          this.showSuccess(this.translate.instant('INSIGNIA_DIGITAL.ELIMINADO_EXITO'));
        },
        error: (err) => {
          console.error('Error al eliminar insignia', err);
          this.showError(this.translate.instant('INSIGNIA_DIGITAL.ERROR_ELIMINAR'));
        }
      });
  }

  startEdit(item: InsigniaDigitalModel) {
    this.model = Object.assign(new InsigniaDigitalModel(), item);
    this.isEditing = true;
    // Reset file selection (si el usuario desea cambiarlo, seleccionará otro)
    this.selectedFile = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(form?: NgForm) {
    this.model = new InsigniaDigitalModel();
    this.isEditing = false;
    this.selectedFile = null;
    this.loading = false;
    this.uploading = false;
    this.uploadProgress = 0;
    if (form) {
      form.resetForm({
        url: '',
        nombre: '',
        estado: false
      });
    }
  }

  // -----------------------
  // CONSULTAS / BÚSQUEDA / PAGINACIÓN (mantengo tu lógica)
  // -----------------------
  fetchInsignias() {
    this.loadingTable = true;
    this.api.get<any>('InsigniaDigital/Consultar_InsigniaDigital')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let items: any[] = [];
          if (Array.isArray(response)) items = response;
          else if (response?.data) items = response.data;
          else if (response?.items) items = response.items;
          else {
            const arr = Object.values(response).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }

          this.data = items.map(item => InsigniaDigitalModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error al consultar insignias', err);
          this.showError(this.translate.instant('INSIGNIA_DIGITAL.ERROR_CARGAR'));
          this.data = [];
          this.filteredData = [];
          this.pagedData = [];
          this.loadingTable = false;
        }
      });
  }

  filterInsignias() {
    if (!this.filtro.trim()) {
      this.showWarning(this.translate.instant('INSIGNIA_DIGITAL.ADVERTENCIA_BUSQUEDA'));
      return;
    }

    this.loadingTable = true;
    const q = encodeURIComponent(this.filtro.trim());

    this.api.get<any>(`InsigniaDigital/Consultar_InsigniaPorNombre?nombre=${q}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let items: any[] = [];
          if (Array.isArray(response)) items = response;
          else if (response?.data) items = response.data;
          else if (response?.items) items = response.items;
          else {
            const arr = Object.values(response).find(v => Array.isArray(v));
            if (Array.isArray(arr)) items = arr;
          }

          this.data = items.map(item => InsigniaDigitalModel.fromJSON(item));
          this.filteredData = [...this.data];
          this.calculateTotalPages();
          this.updatePagedData();
          this.loadingTable = false;
        },
        error: (err) => {
          console.error('Error en búsqueda de insignias', err);
          this.showError(this.translate.instant('INSIGNIA_DIGITAL.ERROR_BUSQUEDA'));
          this.loadingTable = false;
        }
      });
  }

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

  // -----------------------
  // TOASTS / CONFIRMS
  // -----------------------
  showSuccess(mensaje: any) {
    toast.success(this.translate.instant('INSIGNIA_DIGITAL.OPERACION_EXITOSA'), {
      description: mensaje,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(mensaje: any) {
    toast.error(this.translate.instant('INSIGNIA_DIGITAL.ERROR'), {
      description: mensaje,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(mensaje: string) {
    toast.warning(this.translate.instant('INSIGNIA_DIGITAL.ATENCION'), {
      description: mensaje,
      unstyled: true,
      class: 'my-warning-toast'
    });
  }

  showConfirm(mensaje: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        message: mensaje,
        header: this.translate.instant('INSIGNIA_DIGITAL.CONFIRMAR_ACCION'),
        icon: 'pi pi-exclamation-triangle custom-confirm-icon',
        acceptLabel: this.translate.instant('INSIGNIA_DIGITAL.SI_CONFIRMO'),
        rejectLabel: this.translate.instant('INSIGNIA_DIGITAL.CANCELAR'),
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

  async eliminarArchivoActual() {
    const ok = await this.showConfirm(this.translate.instant('INSIGNIA_DIGITAL.CONFIRMAR_ELIMINAR_ARCHIVO'));
    if (!ok) return;

    try {
      await this.deleteFileByUrl(this.model.url);
      this.model.url = '';
      this.showSuccess(this.translate.instant('INSIGNIA_DIGITAL.ARCHIVO_ELIMINADO'));
    } catch (e) {
      this.showError(this.translate.instant('INSIGNIA_DIGITAL.ERROR_ELIMINAR_ARCHIVO'));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  removeSelectedFile() {
    this.selectedFile = null;
  }
}
