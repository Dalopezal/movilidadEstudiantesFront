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

interface FieldConfig {
  name: string;
  label: string;
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
      { name: 'nombreCompleto', label: 'Nombre' },
      { name: 'nombreConvocatoria', label: 'Convocatoria' },
      { name: 'codigoUcm', label: 'Código UCM' },
      { name: 'fechaPostulacion', label: 'Fecha Postulación' },
      { name: 'periodo', label: 'Periodo' },
      { name: 'nombreInstitucion', label: 'Institución' },
      { name: 'nombreTipoMovilidad', label: 'Tipo Movilidad' },
      { name: 'objetivo', label: 'Objetivo' }
    ],
    2: [ // Postulación Rechazada
      { name: 'motivoRechazo', label: 'Motivo Rechazo' },
      { name: 'observaciones', label: 'Observaciones' },
      { name: 'esNotificadoCorreo', label: 'Notificado Correo' }
    ],
    3: [ // Postulado
      { name: 'fechaInicioMovilidad', label: 'Fecha Inicio' },
      { name: 'fechaFinMovilidad', label: 'Fecha Fin' },
      { name: 'nombreInstitucion', label: 'Institución' },
      { name: 'convenioId', label: 'Convenio' },
      { name: 'asistioEntrevista', label: 'Asistió Entrevista' }
    ],
    4: [ // Aprobado Postulación
      { name: 'fechaEntregable', label: 'Fecha Entregable' },
      { name: 'requiereVisa', label: 'Requiere Visa' },
      { name: 'tipoFinanciacion', label: 'Tipo de Financiación' },
      { name: 'montoFinanciacion', label: 'Monto Financiación' }
    ],
    5: [ // Rechazado Documentos (ejemplo si existe en catálogo)
      { name: 'motivoRechazoDoc', label: 'Motivo Rechazo de Documentos' },
      { name: 'observaciones', label: 'Observaciones' }
    ],
    6: [ // Aceptado por Institución Destino
      { name: 'fechaAceptacion', label: 'Fecha Aceptación' },
      { name: 'documentoAceptacion', label: 'Documento Aceptación' }
    ],
    7: [ // Rechazado por Institución Destino
      { name: 'fechaRechazo', label: 'Fecha Rechazo' },
      { name: 'motivoRechazo', label: 'Motivo Rechazo' }
    ],
    8: [ // Trámite Visa
      { name: 'fechaSolicitudVisa', label: 'Fecha Solicitud Visa' },
      { name: 'estadoVisa', label: 'Estado de Visa' }
    ],
    9: [ // Trámite Seguro
      { name: 'aseguradora', label: 'Aseguradora' },
      { name: 'numeroPoliza', label: 'Número de Póliza' },
      { name: 'fechaVencimientoPoliza', label: 'Vencimiento Póliza' }
    ],
    10: [ // Trámite Pasaporte
      { name: 'numeroPasaporte', label: 'Número Pasaporte' },
      { name: 'fechaVencimientoPasaporte', label: 'Vencimiento Pasaporte' }
    ],
    11: [ // Carta de Compromiso
      { name: 'fechaCarta', label: 'Fecha Carta Compromiso' },
      { name: 'archivoCarta', label: 'Archivo Carta Compromiso' }
    ],
    12: [ // Cursos Propedéuticos
      { name: 'cursoNombre', label: 'Curso Nombre' },
      { name: 'cursoEstado', label: 'Estado Curso' }
    ],
    13: [ // Preparación Viaje
      { name: 'fechaTiquetes', label: 'Fecha Compra Tiquetes' },
      { name: 'aerolinea', label: 'Aerolínea' }
    ],
    14: [ // Llegada Destino
      { name: 'fechaLlegada', label: 'Fecha Llegada' },
      { name: 'ciudadLlegada', label: 'Ciudad de Llegada' }
    ],
    15: [ // Curso en Ejecución
      { name: 'materiasRegistradas', label: 'Materias Registradas' },
      { name: 'creditos', label: 'Créditos' }
    ],
    16: [ // Evaluación Progreso
      { name: 'avancePorcentaje', label: 'Avance %' },
      { name: 'observaciones', label: 'Observaciones' }
    ],
    17: [ // Solicitud Extensión
      { name: 'fechaSolicitudExtension', label: 'Fecha Solicitud Extensión' },
      { name: 'motivoExtension', label: 'Motivo Extensión' }
    ],
    18: [ // Extensión Aprobada/Rechazada
      { name: 'estadoExtension', label: 'Estado Extensión' },
      { name: 'nuevaFechaFin', label: 'Nueva Fecha Fin' }
    ],
    19: [ // En Movilidad
      { name: 'estadoPostulacionId', label: 'Estado' },
      { name: 'esMatriculadoSiiga', label: 'Matriculado SIIGA' },
      { name: 'esNotificadoRegistroAcademico', label: 'Notificado Registro Académico' }
    ],
    20: [ // Finalizado
      { name: 'certificadoMovilidad', label: 'Certificado Movilidad' },
      { name: 'realizoEncuestaSatisfaccion', label: 'Encuesta Satisfacción' },
      { name: 'registradoSire', label: 'Registrado SIRE' },
      { name: 'financiacionExterna', label: 'Financiación Externa' },
      { name: 'financiacioUcm', label: 'Financiación UCM' }
    ]
  };

  constructor(private api: GenericApiService, private location: Location, private route: ActivatedRoute ) {}

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
}
