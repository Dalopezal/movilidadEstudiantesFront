import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-sharepoint-drive',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    ConfirmDialogModule,
    ToastModule,
    MatProgressBarModule
  ],
  templateUrl: './drive.component.html',
  styleUrls: ['./drive.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class SharePointDriveComponent {
  files: any[] = [];
  isAuthenticated = false;
  loading = false;
  uploading = false;
  error = '';

  uploadProgress = 0;

  @Input() convocatoria!: any;
  @Input() documento!: any;

  // driveId de Procesos_Movilidad
  private driveId = "b!hxInP5NdSkWGDF706k5q4NgI4QHbbA9MuYfs3fRJTRQp2TIIFpMeSKgCChkFV0A1";

  constructor(
    private http: HttpClient,
    private msal: MsalService,
    private confirmationService: ConfirmationService,
  ) {}

  // Login con MSAL
  async signIn() {
    this.loading = true;
    this.error = '';
    try {
      const response = await this.msal.instance.loginPopup({
        scopes: ['User.Read', 'Sites.ReadWrite.All', 'Files.ReadWrite.All']
      });

      if (response.account) {
        this.msal.instance.setActiveAccount(response.account);
        this.isAuthenticated = true;
        await this.loadFiles();
      }
    } catch (err: any) {
      this.error = 'Error autenticación: ' + err.message;
    } finally {
      this.loading = false;
    }
  }

  // Listar archivos en {documento}/{convocatoria}
  async loadFiles() {
    this.loading = true;
    try {
      const documentoFolderId = await this.getOrCreateFolder(this.documento);
      const convocatoriaFolderId = await this.getOrCreateFolder(this.convocatoria, documentoFolderId);

      const token = await this.getToken(['Sites.ReadWrite.All', 'Files.ReadWrite.All']);
      const headers = { Authorization: `Bearer ${token}` };

      const resp: any = await this.http.get(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${convocatoriaFolderId}/children`,
        { headers }
      ).toPromise();

      this.files = resp.value || [];
    } catch (err: any) {
      this.error = 'Error al cargar archivos: ' + err.message;
    } finally {
      this.loading = false;
    }
  }

  // Subida de archivo
  async uploadFile(file: File) {
    this.uploading = true;
    this.uploadProgress = 0;
    try {
      const documentoFolderId = await this.getOrCreateFolder(this.documento);
      const convocatoriaFolderId = await this.getOrCreateFolder(this.convocatoria, documentoFolderId);

      const token = await this.getToken(['Sites.ReadWrite.All', 'Files.ReadWrite.All']);
      const headers = { Authorization: `Bearer ${token}` };

      const url = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${convocatoriaFolderId}:/${file.name}:/content`;

      this.http.put(url, file, {
        headers,
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event: any) => {
          if (event.type === 1 && event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          }
          if (event.type === 4) {
            this.showSuccess('¡Archivo listo!', 'Subido exitosamente');
            this.uploading = false;
            this.loadFiles();
          }
        },
        error: (err) => {
          this.showError('Error al subir', err.message);
          this.uploading = false;
        }
      });
    } catch (err: any) {
      this.showError('Error inesperado', err.message);
      this.uploading = false;
    }
  }

  // Descargar archivo
  async downloadFile(file: any) {
    try {
      const token = await this.getToken(['Sites.ReadWrite.All', 'Files.ReadWrite.All']);
      const blob: any = await this.http.get(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${file.id}/content`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' as 'json'
        }
      ).toPromise();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      window.URL.revokeObjectURL(url);

      this.showSuccess('Archivo descargado');
    } catch (err: any) {
      this.showError('Error al descargar', err.message);
    }
  }

  // Eliminar archivo
  async deleteFile(file: any) {
    const confirmado = await this.showConfirm(`¿Estás seguro de eliminar "${file.name}"?`);
    if (confirmado) {
      try {
        const token = await this.getToken(['Sites.ReadWrite.All', 'Files.ReadWrite.All']);
        await this.http.delete(
          `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${file.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).toPromise();

        this.showSuccess('Archivo eliminado');
        this.loadFiles();
      } catch (err: any) {
        this.showError('Error al eliminar', err.message);
      }
    }
  }

  // Abrir archivo en nueva pestaña
  async openFile(file: any) {
    try {
      const token = await this.getToken(['Sites.ReadWrite.All', 'Files.ReadWrite.All']);
      const headers = { Authorization: `Bearer ${token}` };

      const metadata: any = await this.http.get(
        `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${file.id}`,
        { headers }
      ).toPromise();

      if (metadata && metadata.webUrl) {
        window.open(metadata.webUrl, '_blank'); // ← link directo de SharePoint
      } else {
        this.showError('No se pudo obtener el enlace de visualización');
      }
    } catch (err: any) {
      this.showError('Error al abrir archivo', err.message);
    }
  }

  // Notifications
  showSuccess(msg: string, desc: string = '') {
    toast.success(msg, { description: desc, unstyled: true, class: 'my-success-toast' });
  }
  showError(msg: string, desc: string = '') {
    toast.error(msg, { description: desc, unstyled: true, class: 'my-error-toast' });
  }
  showWarning(msg: string, desc: string = '') {
    toast.warning(msg, { description: desc, unstyled: true, class: 'my-warning-toast' });
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

  // Función auxiliar para obtener token
  private async getToken(scopes: string[]): Promise<string> {
    const account = this.msal.instance.getActiveAccount();
    if (!account) {
      throw new Error('No active account. Please login first.');
    }

    const tokenResult = await this.msal.instance.acquireTokenSilent({
      scopes,
      account
    });
    return tokenResult.accessToken;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
    event.target.value = '';
  }

  async refreshFiles() {
    if (this.isAuthenticated) {
      this.loadFiles();
    }
  }

  // Obtener o crear carpeta en el drive de SharePoint
  private async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
    const token = await this.getToken(['Sites.ReadWrite.All', 'Files.ReadWrite.All']);
    const headers = { Authorization: `Bearer ${token}` };

    let url = parentId
      ? `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${parentId}/children?$filter=name eq '${folderName}'`
      : `https://graph.microsoft.com/v1.0/drives/${this.driveId}/root/children?$filter=name eq '${folderName}'`;

    const resp: any = await this.http.get(url, { headers }).toPromise();

    if (resp.value && resp.value.length > 0) {
      return resp.value[0].id;
    }

    // Crear carpeta si no existe
    const createUrl = parentId
      ? `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${parentId}/children`
      : `https://graph.microsoft.com/v1.0/drives/${this.driveId}/root/children`;

    const createBody = { name: folderName, folder: {} };
    const created: any = await this.http.post(createUrl, createBody, { headers }).toPromise();

    return created.id;
  }

  // En tu SharePointDriveComponent
  getFileIcon(file: any): string {
    if (file.folder) {
      return 'folder';
    }

    const fileName = file.name?.toLowerCase() || '';
    const extension = fileName.split('.').pop() || '';

    // Documentos
    if (['pdf'].includes(extension)) {
      return 'picture_as_pdf';
    }
    if (['doc', 'docx'].includes(extension)) {
      return 'description';
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return 'grid_on';
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return 'slideshow';
    }
    if (['txt'].includes(extension)) {
      return 'text_snippet';
    }

    // Imágenes
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return 'image';
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return 'movie';
    }

    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
      return 'audiotrack';
    }

    // Archivos comprimidos
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    }

    // Código
    if (['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c'].includes(extension)) {
      return 'code';
    }

    // Por defecto
    return 'insert_drive_file';
  }

  getFileColor(file: any): string {
    const extension = (file.name?.split('.').pop() || '').toLowerCase();
    if (['pdf'].includes(extension)) return '#e53935';
    if (['doc','docx'].includes(extension)) return '#1976d2';
    if (['xls','xlsx'].includes(extension)) return '#2e7d32';
    if (['ppt','pptx'].includes(extension)) return '#e65100';
    if (['jpg','jpeg','png','gif'].includes(extension)) return '#8e24aa';
    return '#424242';
  }
}
