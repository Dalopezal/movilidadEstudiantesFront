import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

declare var google: any;
declare var gapi: any;

@Component({
  selector: 'app-drive',
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
    NgxSonnerToaster,
    MatProgressBarModule
  ],
  templateUrl: './drive.component.html',
  styleUrls: ['./drive.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class DriveComponent {
  files: any[] = [];
  isAuthenticated = false;
  loading = false;
  uploading = false;
  error = '';

  private clientId = '399159101800-stm3ke3chlvtscr9mkde7rli01ao621q.apps.googleusercontent.com';
  private apiKey   = 'AIzaSyBlxhdswu6MBCvOQ9vY-Er3ucpnyBC0LYc';

  private scope = 'https://www.googleapis.com/auth/drive.file';
  private folderId = '1Bj0eiiZirD3q54W9zIKbpfRIT9aiBLbb';

  constructor(
    private dialogRef: MatDialogRef<DriveComponent>,
    private confirmationService: ConfirmationService
  ) {}

  async signIn() {
    try {
      this.loading = true;
      this.error = '';

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scope,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            this.error = 'Error de autenticación: ' + tokenResponse.error;
            this.loading = false;
            return;
          }
          await this.loadGapiClient(tokenResponse.access_token);
        }
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      this.error = 'Error al iniciar sesión: ' + err;
      this.loading = false;
    }
  }

  private async loadGapiClient(accessToken: string) {
    await new Promise((resolve) => gapi.load('client', resolve));
    await gapi.client.init({
      apiKey: this.apiKey,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    });
    gapi.client.setToken({ access_token: accessToken });
    this.isAuthenticated = true;
    await this.loadFiles();
  }

  private async loadFiles() {
    try {
      const resp = await gapi.client.drive.files.list({
        q: `'${this.folderId}' in parents and trashed = false`,
        pageSize: 20,
        fields: 'files(id, name, mimeType, modifiedTime, owners)',
        orderBy: 'modifiedTime desc'
      });
      this.files = resp.result.files || [];
    } catch (error) {
      this.error = 'Error al cargar archivos de la carpeta: ' + JSON.stringify(error);
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
    event.target.value = '';
  }

  uploadProgress = 0;

  async uploadFile(file: File): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      this.uploading = true;
      this.uploadProgress = 0;

      const metadata = {
        name: file.name,
        parents: [this.folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100);
        }
      });

      xhr.onreadystatechange = async () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          this.uploading = false;
          this.uploadProgress = 0;

          if (xhr.status === 200) {
            try {
              const uploadedFile = JSON.parse(xhr.responseText);

              // Aplicar permisos de lectura pública
              await gapi.client.drive.permissions.create({
                fileId: uploadedFile.id,
                resource: { type: 'anyone', role: 'reader' }
              });

              const shareUrl = `https://drive.google.com/file/d/${uploadedFile.id}/view`;
              await navigator.clipboard.writeText(shareUrl);

              this.showSuccess('¡Operación exitosa!', 'Archivo subido y URL copiada');
              await this.refreshFiles();
              resolve(shareUrl);
            } catch (error) {
              this.showError('Error al procesar', 'No se pudo configurar permisos');
              resolve(null);
            }
          } else {
            this.showError('Error al subir archivo', 'Intenta nuevamente');
            console.error('Upload error:', xhr.responseText);
            resolve(null);
          }
        }
      };

      xhr.onerror = () => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.showError('Error de conexión', 'Verifica tu internet');
        resolve(null);
      };

      xhr.open('POST', "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", true);
      xhr.setRequestHeader("Authorization", "Bearer " + gapi.client.getToken().access_token);
      xhr.send(form);
    });
  }

  async downloadFile(file: any) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: new Headers({
            "Authorization": "Bearer " + gapi.client.getToken().access_token
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        const permission = { type: "anyone", role: "reader" };
        await gapi.client.drive.permissions.create({
          fileId: file.id,
          resource: permission
        });

        this.showSuccess('¡Operación exitosa!', 'Archivo descargado');
      } else {
        throw new Error('Error al descargar');
      }
    } catch (error) {
      this.showError('Error al procesar', 'No se puede descargar archivo');
      console.error('Download error:', error);
    }
  }

  async deleteFile(file: any) {
    const confirmado = await this.showConfirm(`¿Estás seguro de eliminar "${file.name}"?`);
    if (confirmado) {
      try {
        await gapi.client.drive.files.delete({ fileId: file.id });
        this.showSuccess('¡Operación exitosa!', 'Archivo eliminado');
        await this.refreshFiles();
      } catch (error) {
        this.showError('Error al procesar', 'El archivo no se cargo desde esta fuente.');
        console.error('Delete error:', error);
      }
    }
  }

  openFile(file: any) {
    const url = `https://drive.google.com/file/d/${file.id}/view`;
    window.open(url, '_blank');
  }

  async refreshFiles() {
    if (this.isAuthenticated) {
      this.loading = true;
      await this.loadFiles();
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  showSuccess(msg: string, desc: string = '') {
    toast.success(msg, {
      description: desc,
      unstyled: true,
      class: 'my-success-toast'
    });
  }

  showError(msg: string, desc: string = '') {
    toast.error(msg, {
      description: desc,
      unstyled: true,
      class: 'my-error-toast'
    });
  }

  showWarning(msg: string, desc: string = '') {
    toast.warning(msg, {
      description: desc,
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
}
