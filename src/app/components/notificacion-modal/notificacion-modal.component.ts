import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfirmationService } from 'primeng/api';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { GenericApiService } from '../../services/generic-api.service';

interface NotificacionData {
  stepId: number;
  stepNombre: string;
  postulacionId: number;
}

@Component({
  selector: 'app-notificacion-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NgxSonnerToaster
  ],
  providers: [ConfirmationService],
  templateUrl: './notificacion-modal.component.html',
  styleUrls: ['./notificacion-modal.component.css']
})
export class NotificacionModalComponent {
  asunto = '';
  nombre = '';
  descripcion = '';
  enviando = false;

  constructor(
    private dialogRef: MatDialogRef<NotificacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NotificacionData,
    private api: GenericApiService
  ) {}

  isFormValid(): boolean {
    return !!(this.nombre?.trim() && this.descripcion?.trim());
  }

  async enviarNotificacion() {
    if (!this.isFormValid()) return;

    this.enviando = true;

    const payload = {
      postulacionId: this.data.postulacionId,
      nombre: this.nombre.trim(),
      asunto: this.nombre.trim(),
      descripcion: this.descripcion.trim()
    };

    try {
      const response = await this.api.post('Notificaciones/Ingresar_Notificaciones', payload).toPromise();

      this.showSuccess('¡Notificación enviada!', 'El mensaje se envió correctamente');

      setTimeout(() => {
        this.dialogRef.close({ success: true, data: response });
      }, 1500);

    } catch (error) {
      console.error('Error al enviar notificación:', error);
      this.showError('Error al enviar', 'No se pudo enviar la notificación');
      this.enviando = false;
    }
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
}
