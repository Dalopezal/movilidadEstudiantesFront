import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationService } from 'primeng/api';

// Angular Material Imports
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'; // 👈 Nuevo para selects
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DriveComponent } from '../drive/drive.component';

interface FieldConfig {
  name: string;
  label: string;
  tipo?: 'text' | 'select' | 'checkbox' | 'readonly' | 'date' | 'textarea';
  editable?: boolean;
  opciones?: { value: any, label: string }[];
}

interface StepData {
  [key: string]: string | number | boolean;
}

interface Step {
  id: number;
  nombre: string;
  descripcion: string;
  data: StepData;
}

@Component({
  selector: 'app-postulaciones-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    // Angular Material
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './postulaciones-detalle.component.html',
  styleUrls: ['./postulaciones-detalle.component.css'],
  providers: [ConfirmationService]
})
export class PostulacionesDetalleComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;

  steps: Step[] = [];
  currentStep = 0;
  private destroy$ = new Subject<void>();
  loading = false;
  idPostulacion: any;

  campoEstado: Record<number, FieldConfig[]> = {
    1: [ // Pre-postulación
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' },
      { name: 'periodo', label: 'Periodo', tipo: 'select', editable: true, opciones: [
        { value: 1, label: 'Periodo 1' }, { value: 2, label: 'Periodo 2' }
      ]},
      { name: 'convenioId', label: 'Convenio', tipo: 'select', editable: true },
      { name: 'observaciones', label: 'Observaciones', tipo: 'textarea', editable: true },
      { name: 'tipoMovilidadId', label: 'Tipo Movilidad', tipo: 'select', editable: true },
      { name: 'urlEncuestaSatisfaccion', label: 'Encuesta Satisfacción', tipo: 'checkbox', editable: false }
    ],
    2: [ // Rechazado Pre-postulación
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    3: [ // Postulado
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' },
      { name: 'periodo', label: 'Periodo', tipo: 'readonly' },
      { name: 'convenioId', label: 'Convenio', tipo: 'readonly' },
      { name: 'observaciones', label: 'Observaciones', tipo: 'text', editable: true },
      { name: 'tipoMovilidadId', label: 'Tipo Movilidad', tipo: 'readonly' },
      { name: 'urlEncuestaSatisfaccion', label: 'Encuesta', tipo: 'readonly' },
      { name: 'objetivo', label: 'Objetivo', tipo: 'text', editable: true },
      { name: 'fechaInicioMovilidad', label: 'Fecha Inicio', tipo: 'date', editable: true },
      { name: 'fechaFinMovilidad', label: 'Fecha Fin', tipo: 'date', editable: true },
      { name: 'institucionId', label: 'Institución', tipo: 'select', editable: true },
      { name: 'fechaEntregable', label: 'Fecha Entregable', tipo: 'date', editable: true },
      { name: 'asistioEntrevista', label: 'Asistió Entrevista', tipo: 'checkbox', editable: true }
    ],
    4: [ // Aprobado Postulación
      { name: 'fechaEntregable', label: 'Fecha Entregable', tipo: 'readonly' },
      { name: 'requiereVisa', label: 'Requiere Visa', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    5: [ // Rechazado Postulación
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    6: [ // Aprobado Director de Programa
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    7: [ // Rechazado Director de Programa
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    8: [ // Aprobado Decanatura
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    9: [ // Rechazado Decanatura
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    10: [ // Aprobado Vicerrectoría Académica
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    11: [ // Rechazado Vicerrectoría Académica
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    12: [ // Aprobado Jefe Inmediato
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    13: [ // Rechazado Jefe Inmediato
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    14: [ // Aprobado Rectoría
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    15: [ // Rechazado Rectoría
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    16: [ // Postulado Universidad Destino
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    17: [ // Aprobado Universidad Destino
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    18: [ // Rechazado Universidad Destino
      { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'text', editable: true },
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
      { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
      { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
    ],
    19: [ // En Movilidad
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' },
      { name: 'esMatriculadoSiiga', label: 'Matriculado SIIGA', tipo: 'checkbox', editable: true },
      { name: 'esNotificadoRegistroAcademico', label: 'Notificado Registro Académico', tipo: 'checkbox', editable: true }
    ],
    20: [ // Finalizado
      { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' },
      { name: 'certificadoMovilidad', label: 'Certificado Movilidad', tipo: 'text', editable: true },
      { name: 'realizoEncuestaSatisfaccion', label: 'Encuesta Satisfacción', tipo: 'checkbox', editable: true },
      { name: 'registradoSire', label: 'Registrado SIRE', tipo: 'checkbox', editable: true },
      { name: 'financiacionExterna', label: 'Financiación Externa', tipo: 'text', editable: true },
      { name: 'financiacioUcm', label: 'Financiación UCM', tipo: 'text', editable: true }
    ]
  };

  constructor(private api: GenericApiService, private location: Location, private route: ActivatedRoute, public dialog: MatDialog ) {}

  ngOnInit() {
    this.getEstados();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Paso 1 – estados catálogo
  getEstados() {
    this.loading = true;
    this.api.get<any>('EstadosPostulacion/Consultar_Estado')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];

          if (Array.isArray(resp)) {
            items = resp;
          } else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp.data)) items = resp.data;
            else if (Array.isArray(resp.items)) items = resp.items;
            else {
              const arr = Object.values(resp).find(v => Array.isArray(v));
              if (Array.isArray(arr)) items = arr;
            }
          }

          this.steps = items.map((item, idx) => ({
            id: item.id ?? idx,
            nombre: item.nombre ?? `Paso ${idx + 1}`,
            descripcion: item.descripcion ?? '',
            data: {}
          }));

          this.route.queryParams.subscribe(params => {
            this.idPostulacion = params['id'];
          });
          this.getBitacora(this.idPostulacion);

          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando estados', err);
          this.steps = [];
          this.loading = false;
        }
      });
  }

  // Paso 2 – bitácora, asignar a los steps existentes
  getBitacora(id: number) {
  this.api.get<any>(`Postulaciones/Consultar_PostulacionBitacora?id=${id}`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (resp) => {
        let bitacora: any[] = [];

        if (Array.isArray(resp)) {
          bitacora = resp;
        } else if (resp && typeof resp === 'object') {
          if (Array.isArray(resp.data)) bitacora = resp.data;
          else if (Array.isArray(resp.items)) bitacora = resp.items;
          else {
            const arr = Object.values(resp).find(v => Array.isArray(v));
            if (Array.isArray(arr)) bitacora = arr;
          }
        }

        // 🔹 NUEVO: Llenamos TODOS los steps con los datos disponibles
        this.steps.forEach(step => {
          // Para cada step, buscamos en la bitácora los datos que le corresponden
          const fieldsForThisStep = this.campoEstado[step.id] || [];

          // Creamos un objeto con los datos de este step
          const stepData: any = {};

          // Recorremos toda la bitácora para extraer los campos que necesita este step
          bitacora.forEach(entry => {
            fieldsForThisStep.forEach(field => {
              // Si el registro de bitácora tiene este campo, lo copiamos
              if (entry[field.name] !== undefined && entry[field.name] !== null) {
                stepData[field.name] = entry[field.name];
              }
            });
          });

          // Asignamos los datos recopilados al step
          step.data = stepData;
        });

        // 🔹 El último registro de bitácora corresponde al estado actual
        if (bitacora.length > 0) {
          const ultimo = bitacora[bitacora.length - 1];
          const index = this.steps.findIndex(s => s.id === ultimo.estadoPostulacionId);

          if (index >= 0) {
            this.currentStep = index;
            setTimeout(() => {
              if (this.stepper) {
                this.stepper.selectedIndex = index;
              }
            }, 100);
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar bitácora', err);
        this.loading = false;
      }
    });
}

  goToStep(index: number) {
    if (this.stepper && index >= 0 && index < this.steps.length) {
      this.stepper.selectedIndex = index;
      this.currentStep = index;
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      if (this.stepper) {
        this.stepper.selectedIndex = this.currentStep;
      }
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      if (this.stepper) {
        this.stepper.selectedIndex = this.currentStep;
      }
    }
  }

  goBack() {
    this.location.back();
  }

  accionesEstado: Record<number, { texto: string; accion: () => void }[]> = {
    1: [
      { texto: 'Prepostularme', accion: () => this.onPrepostular() }
    ],
    2: [
      { texto: 'Rechazar Pre-postulación', accion: () => this.onRechazarPre() },
      { texto: 'Aceptar Pre-postulación', accion: () => this.onAceptarPre() }
    ],
    3: [
      { texto: 'Postularme', accion: () => this.onPostular() },
      { texto: 'Cancelar postulación', accion: () => this.onCancelar() }
    ],
    4: [], // solo consulta
    5: [
      { texto: 'Rechazar postulación', accion: () => this.onRechazarPostulacion() },
      { texto: 'Aprobar postulación', accion: () => this.onAprobarPostulacion() }
    ],
    6: [
      { texto: 'Rechazar director de programa', accion: () => this.onRechazarDirector() },
      { texto: 'Aprobar director de programa', accion: () => this.onAprobarDirector() }
    ],
    7: [
      { texto: 'Rechazada por director programa', accion: () => this.onConfirmarRechazoDirector() }
    ],
    8: [
      { texto: 'Aprobado Decanatura', accion: () => this.onAprobarDecanatura() }
    ],
    9: [
      { texto: 'Rechazo Decanatura', accion: () => this.onRechazarDecanatura() }
    ],
    10: [
      { texto: 'Aprobado Vicerrectoría Académica', accion: () => this.onAprobarVicerrectoria() }
    ],
    11: [
      { texto: 'Rechazo Vicerrectoría Académica', accion: () => this.onRechazarVicerrectoria() }
    ],
    12: [
      { texto: 'Aprobado Jefe Inmediato', accion: () => this.onAprobarJefe() }
    ],
    13: [
      { texto: 'Rechazado Jefe Inmediato', accion: () => this.onRechazarJefe() }
    ],
    14: [
      { texto: 'Aprobado Rectoría', accion: () => this.onAprobarRectoria() }
    ],
    15: [
      { texto: 'Rechazo Rectoría', accion: () => this.onRechazarRectoria() }
    ],
    16: [
      { texto: 'Postulado Universidad Destino', accion: () => this.onPostularUniversidad() },
      { texto: 'Cancelar postulación', accion: () => this.onCancelar() }
    ],
    17: [
      { texto: 'Aprobado Universidad Destino', accion: () => this.onAprobarUniversidad() },
      { texto: 'Cancelar postulación', accion: () => this.onCancelar() }
    ],
    18: [
      { texto: 'Rechazo Universidad Destino', accion: () => this.onRechazarUniversidad() }
    ],
    19: [
      { texto: 'En movilidad', accion: () => this.onEnMovilidad() }
    ],
    20: [
      { texto: 'Finalizado', accion: () => this.onFinalizado() }
    ]
  };

  onPrepostular() {
    const payload = { ...this.steps[0].data, estadoPostulacionId: 1 };
    this.api.post('Postulaciones/Prepostular', payload).subscribe(resp => {
      console.log('Prepostulado:', resp);
      this.refreshBitacora();
    });
  }

  onRechazarPre() {
    const payload = { ...this.steps[1].data, estadoPostulacionId: 2 };
    this.api.post('Postulaciones/RechazarPre', payload).subscribe(resp => {
      console.log('Rechazado Pre:', resp);
      this.refreshBitacora();
    });
  }

  onAceptarPre() {
    const payload = { ...this.steps[1].data, estadoPostulacionId: 21 };
    this.api.post('Postulaciones/AceptarPre', payload).subscribe(resp => {
      console.log('Aceptado Pre:', resp);
      this.refreshBitacora();
    });
  }

  onPostular() {
    const payload = { ...this.steps[2].data, estadoPostulacionId: 3 };
    this.api.post('Postulaciones/Postular', payload).subscribe(resp => {
      console.log('Postulado:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 4-5: Postulación
  onRechazarPostulacion() {
    const payload = { ...this.steps[4].data, estadoPostulacionId: 5 };
    this.api.post('Postulaciones/RechazarPostulacion', payload).subscribe(resp => {
      console.log('Rechazado Postulación:', resp);
      this.refreshBitacora();
    });
  }

  onAprobarPostulacion() {
    const payload = { ...this.steps[4].data, estadoPostulacionId: 4 };
    this.api.post('Postulaciones/AprobarPostulacion', payload).subscribe(resp => {
      console.log('Aprobado Postulación:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 6-7: Director de Programa
  onRechazarDirector() {
    const payload = { ...this.steps[5].data, estadoPostulacionId: 7 };
    this.api.post('Postulaciones/RechazarDirector', payload).subscribe(resp => {
      console.log('Rechazado Director:', resp);
      this.refreshBitacora();
    });
  }

  onAprobarDirector() {
    const payload = { ...this.steps[5].data, estadoPostulacionId: 6 };
    this.api.post('Postulaciones/AprobarDirector', payload).subscribe(resp => {
      console.log('Aprobado Director:', resp);
      this.refreshBitacora();
    });
  }

  onConfirmarRechazoDirector() {
    const payload = { ...this.steps[6].data, estadoPostulacionId: 7 };
    this.api.post('Postulaciones/ConfirmarRechazoDirector', payload).subscribe(resp => {
      console.log('Confirmado Rechazo Director:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 8-9: Decanatura
  onAprobarDecanatura() {
    const payload = { ...this.steps[7].data, estadoPostulacionId: 8 };
    this.api.post('Postulaciones/AprobarDecanatura', payload).subscribe(resp => {
      console.log('Aprobado Decanatura:', resp);
      this.refreshBitacora();
    });
  }

  onRechazarDecanatura() {
    const payload = { ...this.steps[8].data, estadoPostulacionId: 9 };
    this.api.post('Postulaciones/RechazarDecanatura', payload).subscribe(resp => {
      console.log('Rechazado Decanatura:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 10-11: Vicerrectoría Académica
  onAprobarVicerrectoria() {
    const payload = { ...this.steps[9].data, estadoPostulacionId: 10 };
    this.api.post('Postulaciones/AprobarVicerrectoria', payload).subscribe(resp => {
      console.log('Aprobado Vicerrectoría:', resp);
      this.refreshBitacora();
    });
  }

  onRechazarVicerrectoria() {
    const payload = { ...this.steps[10].data, estadoPostulacionId: 11 };
    this.api.post('Postulaciones/RechazarVicerrectoria', payload).subscribe(resp => {
      console.log('Rechazado Vicerrectoría:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 12-13: Jefe Inmediato
  onAprobarJefe() {
    const payload = { ...this.steps[11].data, estadoPostulacionId: 12 };
    this.api.post('Postulaciones/AprobarJefe', payload).subscribe(resp => {
      console.log('Aprobado Jefe Inmediato:', resp);
      this.refreshBitacora();
    });
  }

  onRechazarJefe() {
    const payload = { ...this.steps[12].data, estadoPostulacionId: 13 };
    this.api.post('Postulaciones/RechazarJefe', payload).subscribe(resp => {
      console.log('Rechazado Jefe Inmediato:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 14-15: Rectoría
  onAprobarRectoria() {
    const payload = { ...this.steps[13].data, estadoPostulacionId: 14 };
    this.api.post('Postulaciones/AprobarRectoria', payload).subscribe(resp => {
      console.log('Aprobado Rectoría:', resp);
      this.refreshBitacora();
    });
  }

  onRechazarRectoria() {
    const payload = { ...this.steps[14].data, estadoPostulacionId: 15 };
    this.api.post('Postulaciones/RechazarRectoria', payload).subscribe(resp => {
      console.log('Rechazado Rectoría:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 16-18: Universidad Destino
  onPostularUniversidad() {
    const payload = { ...this.steps[15].data, estadoPostulacionId: 16 };
    this.api.post('Postulaciones/PostularUniversidad', payload).subscribe(resp => {
      console.log('Postulado Universidad Destino:', resp);
      this.refreshBitacora();
    });
  }

  onAprobarUniversidad() {
    const payload = { ...this.steps[16].data, estadoPostulacionId: 17 };
    this.api.post('Postulaciones/AprobarUniversidad', payload).subscribe(resp => {
      console.log('Aprobado Universidad Destino:', resp);
      this.refreshBitacora();
    });
  }

  onRechazarUniversidad() {
    const payload = { ...this.steps[17].data, estadoPostulacionId: 18 };
    this.api.post('Postulaciones/RechazarUniversidad', payload).subscribe(resp => {
      console.log('Rechazado Universidad Destino:', resp);
      this.refreshBitacora();
    });
  }

  // Estados 19-20: En Movilidad y Finalizado
  onEnMovilidad() {
    const payload = { ...this.steps[18].data, estadoPostulacionId: 19 };
    this.api.post('Postulaciones/EnMovilidad', payload).subscribe(resp => {
      console.log('En Movilidad:', resp);
      this.refreshBitacora();
    });
  }

  onFinalizado() {
    const payload = { ...this.steps[19].data, estadoPostulacionId: 20 };
    this.api.post('Postulaciones/Finalizado', payload).subscribe(resp => {
      console.log('Finalizado:', resp);
      this.refreshBitacora();
    });
  }

  onCancelar() {
    console.log('Cancelar postulación (placeholder)');

  }

  private refreshBitacora() {
    if (this.idPostulacion) {
      this.getBitacora(this.idPostulacion);
    }
  }

  // Método para obtener la clase CSS según el estado
  getEstadoClass(estadoId: number): string {
    const estadosAmarillos = [1]; // Pre-postulación
    const estadosRojos = [2, 5, 7, 9, 11, 13, 15, 18]; // Todos los rechazos
    const estadosVerdes = [3, 4, 6, 8, 10, 12, 14, 16, 17, 19, 20]; // Aprobaciones y progreso

    if (estadosAmarillos.includes(this.currentStep)) return 'estado-amarillo';
    if (estadosRojos.includes(this.currentStep)) return 'estado-rojo';
    if (estadosVerdes.includes(this.currentStep)) return 'estado-verde';

    return '';
  }

  // Método actualizado para colores
  getColorEstado(id: number): string {
    const estadosAmarillos = [1];
    const estadosRojos = [2, 5, 7, 9, 11, 13, 15, 18];
    const estadosVerdes = [3, 4, 6, 8, 10, 12, 14, 16, 17, 19, 20];

    if (estadosAmarillos.includes(id)) return '#FFD700';
    if (estadosRojos.includes(id)) return '#FF4444';
    if (estadosVerdes.includes(id)) return '#22c55e';

    return '#e2e8f0';
  }

  getButtonColor(texto: string): 'primary' | 'accent' | 'warn' {
    if (texto.toLowerCase().includes('rechazo') || texto.toLowerCase().includes('rechazar')) {
      return 'warn';
    }
    if (texto.toLowerCase().includes('aprobar') || texto.toLowerCase().includes('aceptar')) {
      return 'accent';
    }
    return 'primary';
  }

  getButtonIcon(texto: string): string {
    if (texto.toLowerCase().includes('rechazo') || texto.toLowerCase().includes('rechazar')) return 'close';
    if (texto.toLowerCase().includes('aprobar') || texto.toLowerCase().includes('aceptar')) return 'check_circle';
    if (texto.toLowerCase().includes('postular')) return 'assignment';
    if (texto.toLowerCase().includes('cancelar')) return 'cancel';
    if (texto.toLowerCase().includes('finalizado')) return 'flag';
    return 'touch_app';
  }

  onEnviarNotificacion(step: any) {

  }

  onVerNotificaciones(step: any) {

  }

  abrirModalDrive() {
    this.dialog.open(DriveComponent, {
      width: '600px',
      height: '480px',
      disableClose: false
    });
  }

}
