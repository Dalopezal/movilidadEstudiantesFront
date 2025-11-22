import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificacionModalComponent } from '../notificacion-modal/notificacion-modal.component';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';
import { GestionEntregableComponent } from '../gestion-entregable/gestion-entregable.component';
import { BeneficiosComponent } from "../beneficios-postulacion/beneficios-postulacion.component";
import { FinanciacionComponent } from "../financiacion/financiacion.component";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { GestionCondicionComponent } from '../gestion-condicion/gestion-condicion.component';

interface FieldConfig {
  name: string;
  label: string;
  tipo?: 'text' | 'select' |'selectChange' | 'checkbox' | 'readonly' | 'date' | 'textarea' | 'number';
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
    MatSelectModule,
    NotificacionesComponent,
    GestionEntregableComponent,
    BeneficiosComponent,
    FinanciacionComponent,
    ConfirmDialogModule, NgxSonnerToaster,
    GestionCondicionComponent
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
  idConvocatoria: any;
  nombreConvocatoria: any;
  documento: any;
  nombreCompleto: any;
  convocatoria: any;
  convocatoriaId: any;
  usuario: any = {};
  nombreUsuario: string = '';
  idUsuario: any;
  campoEstado: Record<number, FieldConfig[]> = {};
  idCovocatoria: any;
  nombreCombocatoria: any;
  instituciones: any[] = [];
  convenios: any[] = [];
  tiposMovlidad: any[] = [];
  accionesEstado: Record<number, { texto: string; accion: (form?: NgForm) => void }[]> = {};

  postulantStepIndex: number = 0;
  selectedStepIndex: number = 0;

  constructor(private api: GenericApiService, private location: Location, private route: ActivatedRoute, public dialog: MatDialog, private confirmationService: ConfirmationService) {}

  estadosMap: Record<number, string> = {
    1:  'Pre‑postulación',
    2:  'Rechazado Pre‑postulación',
    21: 'Aceptado Pre‑postulación',

    4:  'Postulado',
    5:  'Rechazado Postulación',
    6:  'Aprobado Postulación',
    7:  'Aprobado Director de Programa',
    8:  'Rechazado Director de Programa',
    9:  'Aprobado Decanatura',
    10: 'Rechazado Decanatura',
    11: 'Aprobado Vicerrectoría Académica',
    12: 'Rechazado Vicerrectoría Académica',
    13: 'Aprobado Jefe Inmediato',
    14: 'Rechazado Jefe Inmediato',
    15: 'Aprobado Rectoría',
    16: 'Rechazado Rectoría',
    17: 'Postulado Universidad Destino',
    18: 'Rechazado Universidad Destino',
    19: 'Aprobado Universidad Destino',
    20: 'En Movilidad',
    22: 'Finalizado'
  };

  ngOnInit() {
    window.addEventListener("storage", this.onStorageChange.bind(this));
    const data = localStorage.getItem('usuario');
    this.usuario = data ? JSON.parse(data) : {};
    // ahora que usuario está cargado, construir acciones
    this.buildAccionesEstado();

    // lee params sólo una vez
    const params = this.route.snapshot.queryParams;
    this.idPostulacion = this.usuario.rolId == 7 ? params['id'] ? Number(params['id']) : undefined : params['idPostulacion'] ? Number(params['idPostulacion']) : undefined;
    this.idConvocatoria = params['idConvocatoria'];
    this.nombreConvocatoria = params['nombre'];

    this.cargatSecciones();
    this.getEstados();
  }

  cargatSecciones(){
    this.campoEstado = {
      1: [ // Pre-postulación / Pendiente Pre-Postulación
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' }, // Cédula y nombre automático
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' }, // Default seleccionada previamente
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' }, // "Pendiente Pre-Postulación" o "Pre-postulado"
        { name: 'fechaPrePostulacion', label: 'Fecha Pre-Postulación', tipo: 'readonly' }, // Automático sistema
        { name: 'periodo', label: 'Periodo', tipo: 'number', editable: true},
        { name: 'institucionId', label: this.usuario.tipoUsuario == '1' ? 'Institución Destino' : 'Institución Origen', tipo: 'selectChange', editable: true, opciones: this.instituciones }, // Label cambia según rol
        { name: 'convenioId', label: 'Convenio', tipo: 'select', editable: true, opciones: this.convenios }, // Dependiente de institución
        { name: 'observaciones', label: 'Observaciones', tipo: 'textarea', editable: true },
        { name: 'tipoMovilidadId', label: 'Tipo Movilidad', tipo: 'select', editable: true, opciones: this.tiposMovlidad },
      ],
      2: [ // Rechazado Pre-postulación (solo rol ORI Interno 7)
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true }, // Obligatorio
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Rechazo Postulación', tipo: 'readonly' }
      ],
      21: [ // Aceptado Pre-postulación (solo rol ORI Interno 7)
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      3: [ // Postulado (lo hace el usuario)
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' },
        { name: 'periodo', label: 'Periodo', tipo: 'readonly' },
        { name: 'convenioId', label: 'Convenio', tipo: 'readonly' },
        { name: 'observaciones', label: 'Observaciones', tipo: 'textarea', editable: true },
        { name: 'tipoMovilidadId', label: 'Tipo Movilidad', tipo: 'readonly' },
        { name: 'urlEncuestaSatisfaccion', label: 'Encuesta Satisfacción', tipo: 'readonly' },
        { name: 'objetivo', label: 'Objetivo', tipo: 'textarea', editable: true }, // Obligatorio
        { name: 'fechaInicioMovilidad', label: 'Fecha Inicio Movilidad', tipo: 'date', editable: true },
        { name: 'fechaFinMovilidad', label: 'Fecha Fin Movilidad', tipo: 'date', editable: true },
        { name: 'institucionId', label: 'Institución', tipo: 'select', editable: true },
        { name: 'fechaEntregable', label: 'Fecha Entregable', tipo: 'date', editable: true },
        { name: 'asistioEntrevista', label: 'Asistió Entrevista', tipo: 'checkbox', editable: true }
      ],
      5: [ // Rechazado Postulación (lo hace ORI)
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      4: [ // Aprobado Postulación (lo hace ORI) - Estado 3 según documento
        { name: 'fechaEntregable', label: 'Fecha Entregable', tipo: 'readonly' },
        { name: 'requiereVisa', label: 'Requiere Visa', tipo: 'checkbox', editable: true }, // Lo pide ORI
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      6: [ // Aprobado Director de Programa
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      7: [ // Rechazado Director de Programa
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      8: [ // Aprobado Decanatura
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      9: [ // Rechazado Decanatura
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      10: [ // Aprobado Vicerrectoría Académica
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      11: [ // Rechazado Vicerrectoría Académica
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      12: [ // Aprobado Jefe Inmediato
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      13: [ // Rechazado Jefe Inmediato
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      14: [ // Aprobado Rectoría
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'fechaPostulacion', label: 'Fecha Postulación', tipo: 'readonly' }
      ],
      15: [ // Rechazado Rectoría
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
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
        { name: 'usuarioId', label: 'Usuario', tipo: 'readonly' },
        { name: 'convocatoriaId', label: 'Convocatoria', tipo: 'readonly' },
        { name: 'estadoPostulacionId', label: 'Estado', tipo: 'readonly' },
        { name: 'motivoRechazo', label: 'Motivo Rechazo', tipo: 'textarea', editable: true },
        { name: 'esNotificadoCorreo', label: 'Notificado Correo', tipo: 'checkbox', editable: true },
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
        { name: 'certificadoMovilidad', label: 'Certificado Movilidad', tipo: 'text', editable: true }, // Genera PDF
        { name: 'realizoEncuestaSatisfaccion', label: 'Realizó Encuesta Satisfacción', tipo: 'checkbox', editable: true },
        { name: 'registradoSire', label: 'Registrado SIRE', tipo: 'checkbox', editable: true },
        { name: 'financiacionExterna', label: 'Financiación Externa', tipo: 'text', editable: true },
        { name: 'financiacioUcm', label: 'Financiación UCM', tipo: 'text', editable: true }
      ]
    };

  }

  private getSelectedStepData(): any {
    return this.steps?.[this.selectedStepIndex]?.data ?? {};
  }

  private onStorageChange() {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (user?.rolId) {

    }
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
            //this.idPostulacion = params['id'];
            this.idPostulacion = this.usuario.rolId == 7 ? params['id'] ? Number(params['id']) : undefined : params['idPostulacion'] ? Number(params['idPostulacion']) : undefined;
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

private fetchListaInstituciones() {

  this.route.queryParams.subscribe(params => {
    this.idCovocatoria = params['idConvocatoria'];
    this.nombreCombocatoria = params['nombre'];
  });

  // this.api.get<any>('InstitucionConvenio/Consultar_InstitucionConvenioEspecifico?id=' + this.idCovocatoria)
  this.api.get<any>('/Institucion/Consultar_Institucion')
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
        this.instituciones = items.map(item => ({ value: item.id, label: item.nombre }));
        console.log("instituciones", this.instituciones);

        this.fetchListaTipoMovilidad();

        const payload = {
          ...this.steps[0].data
        };

        this.fetchListaConvocatoria(payload['institucionId']);

      },
      error: (err) => {
        console.error('Error al cargar estado para select', err);
        this.instituciones = [];
      }
    });
  }

  onFieldChange(field: FieldConfig, value: any) {
    this.steps[this.currentStep].data = {
      ...this.steps[this.currentStep].data,
      [field.name]: value
    };

    if (field.name === 'institucionId') {
      this.fetchListaConvocatoria(value);
    }
  }


  fetchListaConvocatoria(value: any){
    this.api.get<any>('InstitucionConvenio/Consultar_ConvenioXInstitucion?idInstitucion=' + value)
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
          this.convenios = items.map(item => ({ value: item.convenioId, label: item.codigoUcm }));
          this.cargatSecciones();

        },
        error: (err) => {
          console.error('Error al cargar estado para select', err);
          this.convenios = [];
        }
      });
  }

  fetchListaTipoMovilidad(){
    this.api.get<any>('TipoMovilidad/Consultar_TipoMovilida')
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
          this.tiposMovlidad = items.map(item => ({ value: item.id, label: item.nombre }));
          this.cargatSecciones();

        },
        error: (err) => {
          console.error('Error al cargar estado para select', err);
          this.tiposMovlidad = [];
        }
      });
  }

  private fasesPermitidasPorRol(rolId: any): number[] {
    const r = Number(rolId);

    const ROL_ORI = 7;
    const ROL_DIRECTOR = 100;
    const ROL_DECANATURA = 101;
    const ROL_VICERRECTORIA = 102;
    const ROL_JEFE = 103;
    const ROL_RECTORIA = 104;
    const ROL_UNIV_DESTINO = 105;

    switch (r) {
      case ROL_ORI:
        return [1,2,21,3,4,5,16,17,18,19,20];
      case ROL_DIRECTOR:
        return [6,7];
      case ROL_DECANATURA:
        return [8,9];
      case ROL_VICERRECTORIA:
        return [10,11];
      case ROL_JEFE:
        return [12,13];
      case ROL_RECTORIA:
        return [14,15];
      case ROL_UNIV_DESTINO:
        return [16,17,18];
      default:
        return [];
    }
  }

  private getFocusableIndexes(): number[] {
    if (!this.steps?.length) return [];

    const rolId = this.usuario?.rolId;
    const permitidas = this.fasesPermitidasPorRol(rolId);

    if (permitidas.length > 0) {
      const indices = permitidas
        .map(idEstado => this.steps.findIndex(s => s.id === idEstado))
        .filter(i => i >= 0);
      return indices;
    }

    const estadoRealId = this.steps[this.postulantStepIndex]?.id;
    const destinoEstadoId = this.computeDestinoEstadoId(estadoRealId, rolId);
    const destinoIndex = this.steps.findIndex(s => s.id === destinoEstadoId);
    return destinoIndex >= 0 ? [destinoIndex] : [this.postulantStepIndex];
  }

  private canFocusStep(targetIndex: number): boolean {
    return this.getFocusableIndexes().includes(targetIndex);
  }

  // Paso 2 – bitácora, asignar a los steps existentes
    getBitacora(id: number) {

    this.steps.forEach(step => {
        const fieldsForThisStep = this.campoEstado[step.id] || [];
        const stepData: any = {};

        this.route.queryParams.subscribe(params => {
          this.idCovocatoria = params['idConvocatoria'];
          this.nombreCombocatoria = params['nombre'];
        });

        // PASO 1: Cargar datos del localStorage primero
        fieldsForThisStep.forEach(field => {
          if (field.name === 'usuarioId' && this.usuario?.nombre) {
            stepData[field.name] = `${this.usuario.nombre}`;
          }

          if (field.name === 'convocatoriaId' && this.nombreCombocatoria) {
            stepData[field.name] = `${this.nombreCombocatoria}`;
          }

          if (field.name === 'estadoPostulacionId' && 'Pre-postulación') {
            stepData[field.name] = 'Pre-postulación';
            stepData['fechaPrePostulacion'] = new Date().toLocaleDateString();
          }
        });

        step.data = stepData;
      });

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

          console.log("bitacora:", bitacora);

          this.steps.forEach(step => {
            const fieldsForThisStep = this.campoEstado[step.id] || [];
            const stepData: any = {};

            bitacora.forEach(entry => {
              fieldsForThisStep.forEach(field => {
                if (field.name === 'usuarioId' && this.usuario?.nombre) {
                  //stepData[field.name] = this.usuario.nombre;
                  stepData[field.name] = entry[field.name];
                }else

                if (field.name === 'convocatoriaId' && this.nombreCombocatoria) {
                  stepData[field.name] = this.nombreCombocatoria;
                }else

                if (field.name === 'estadoPostulacionId') {
                  const estado = entry.estadoPostulacionId;
                  stepData[field.name] = this.estadosMap[estado] ?? estado;

                  if (estado === 1) {
                    stepData['fechaPrePostulacion'] = new Date().toLocaleDateString();
                  }
                } else if (entry[field.name] !== undefined && entry[field.name] !== null) {
                  stepData[field.name] = entry[field.name];
                }
              });
            });

            step.data = stepData;
          });

          if (bitacora.length > 0) {
            const ultimo = bitacora[bitacora.length - 1];
            console.log("ultimo registro:", ultimo);

            const index = this.steps.findIndex(s =>
              String(s.id) === String(ultimo.estadoPostulacionId)
            );
            console.log("index encontrado:", index);

            if (index >= 0) {
              // Índice real donde está el postulante
              this.postulantStepIndex = index;

              const estadoRealId = this.steps[index]?.id;
              const destinoEstadoId = this.computeDestinoEstadoId(estadoRealId, this.usuario?.rolId);
              const destinoIndex = this.steps.findIndex(s => s.id === destinoEstadoId);

              // Si encontramos el destino, enfocamos ahí; si no, al real
              const destino = destinoIndex >= 0 ? destinoIndex : index;

              this.selectedStepIndex = destino;
              this.currentStep = destino;

              this.documento = ultimo.documento;
              this.nombreCompleto = ultimo.nombreCompleto;
              this.convocatoria = ultimo.nombreConvocatoria;
              this.convocatoriaId = ultimo.convocatoriaId;
              this.idUsuario = ultimo.usuarioId;

              this.focusCurrentStep();
            }
          }

          this.fetchListaInstituciones();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar bitácora', err);
          this.loading = false;
        }
      });
      this.fetchListaInstituciones();
}

// Devuelve el id de estado a enfocar (del catálogo) según estado real y rol
private computeDestinoEstadoId(estadoRealId: number, rolId: number): number {
    const esORI = Number(rolId) === 7;

    // Reglas por estado (catálogo):
    // 1: Pre‑postulación
    if (estadoRealId === 1) {
      // Usuario normal ve el 1
      return esORI ? 21 : 1;
    }

    // 2: Rechazado Pre‑postulación → mantener foco en 2
    if (estadoRealId === 2) return 2;

    // 21: Aceptado Pre‑postulación → usuario debe ir a Postulación (id=4 “Postulado” lo crea el usuario,
    // pero el formulario que llena es el de la fase “Postulación”, tu step id=3 con campos a diligenciar).
    // Si quieres que ambos (ORI y usuario) aterricen en el formulario de Postulación, usa id=3.
    if (estadoRealId === 21) return 3;

    // 4: Postulado → ORI puede aprobar/rechazar (5/3 según tu API), usuario sigue viendo 3 para editar/objetivo.
    if (estadoRealId === 4) {
      return esORI ? 4 : 3;
    }

    // 5: Rechazado Postulación → mantener foco en 5
    if (estadoRealId === 5) return 5;

    // 6/7: Director (Aprobado/Rechazado)
    if (estadoRealId === 6 || estadoRealId === 7) return estadoRealId;

    // 8/9: Decanatura (Aprobado/Rechazado)
    if (estadoRealId === 8 || estadoRealId === 9) return estadoRealId;

    // 10/11: Vicerrectoría (Aprobado/Rechazado)
    if (estadoRealId === 10 || estadoRealId === 11) return estadoRealId;

    // 12/13: Jefe Inmediato (Aprobado/Rechazado)
    if (estadoRealId === 12 || estadoRealId === 13) return estadoRealId;

    // 14/15: Rectoría (Aprobado/Rechazado)
    if (estadoRealId === 14 || estadoRealId === 15) return estadoRealId;

    // 16/17/18/19: Universidad Destino (Postulado/Aceptado/Rechazado/Aprobado)
    if ([16, 17, 18, 19].includes(estadoRealId)) return estadoRealId;

    // 20: En Movilidad
    if (estadoRealId === 20) return 20;

    // 22: Finalizado
    if (estadoRealId === 22) return 20; // si quieres mostrar “Finalizado” en el step 20 (tu catálogo lo etiqueta como Finalizado)

    // Por defecto, mantener el real
    return estadoRealId;
  }

  goToStep(index: number) {
    if (!this.steps?.length) return;

    if (!this.canFocusStep(index)) {
      this.showWarning('No puede navegar a este paso con su rol/fase actual.');
      return;
    }

    this.selectedStepIndex = index;
    this.focusCurrentStep();
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

  private buildAccionesEstado() {
    this.accionesEstado = {
    // ---------------- FASE PRE ----------------
      1: this.usuario.rolId != 7 ? [ // Pre-postulación
        { texto: 'Prepostularme', accion: (form?: NgForm) => this.onPrepostular(form) }
      ] : [],
      2: this.usuario.rolId == 7 ?[ // Rechazado Pre-postulación
        { texto: 'Rechazado Pre-postulación', accion: (form?: NgForm) => this.onRechazarPre(form) }
      ] : [],
      21: this.usuario.rolId == 7 ?[ // Aceptado Pre-postulación
        { texto: 'Aceptar Pre-postulación', accion: (form?: NgForm) => this.onAceptarPre(form) }
      ] : [],

      // ---------------- FASE POSTULACIÓN ----------------
      3: [ // En postulación (usuario llena formulario y confirma postulacion)
        { texto: 'Postularme', accion: () => this.onPostular() },
        { texto: 'Cancelar la postulación', accion: () => this.onCancelar() }
      ],
      4: [ // Aprobado Postulación (ORI)
        { texto: 'Aprobar postulación', accion: (form?: NgForm) => this.onAprobarPostulacion(form) }
      ],
      5: [ // Rechazado Postulación (ORI)
        { texto: 'Rechazar postulación', accion: (form?: NgForm) => this.onRechazarPostulacion(form) }
      ],

      // ---------------- FASE DIRECTOR ----------------
      6: [
        { texto: 'Aprobar director de programa', accion: () => this.onAprobarDirector() },
        // { texto: 'Rechazar director de programa', accion: () => this.onRechazarDirector() }
      ],
      7: [
        { texto: 'Rechazar director programa', accion: () => this.onConfirmarRechazoDirector() }
      ],

      // ---------------- FASE DECANATURA ----------------
      8: [
        { texto: 'Aprobado Decanatura', accion: () => this.onAprobarDecanatura() }
      ],
      9: [
        { texto: 'Rechazo Decanatura', accion: () => this.onRechazarDecanatura() }
      ],

      // ---------------- FASE VICERRECTORÍA ----------------
      10: [
        { texto: 'Aprobado Vicerrectoría Académica', accion: () => this.onAprobarVicerrectoria() }
      ],
      11: [
        { texto: 'Rechazo Vicerrectoría Académica', accion: () => this.onRechazarVicerrectoria() }
      ],

      // ---------------- JEFE INMEDIATO ----------------
      12: [
        { texto: 'Aprobado Jefe Inmediato', accion: () => this.onAprobarJefe() }
      ],
      13: [
        { texto: 'Rechazado Jefe Inmediato', accion: () => this.onRechazarJefe() }
      ],

      // ---------------- RECTORÍA ----------------
      14: [
        { texto: 'Aprobado Rectoría', accion: () => this.onAprobarRectoria() }
      ],
      15: [
        { texto: 'Rechazo Rectoría', accion: () => this.onRechazarRectoria() }
      ],

      // ---------------- UNIVERSIDAD DESTINO ----------------
      16: [
        { texto: 'Postulado Universidad Destino', accion: () => this.onPostularUniversidad() },
        { texto: 'Cancelar postulación', accion: () => this.onCancelar() }
      ],
      17: [
        { texto: 'Aceptado Universidad Destino', accion: () => this.onAprobarUniversidad() }
      ],
      18: [
        { texto: 'Rechazado Universidad Destino', accion: () => this.onRechazarUniversidad() }
      ],

      // ---------------- ETAPA FINAL ----------------
      19: [
        { texto: 'En movilidad', accion: () => this.onEnMovilidad() }
      ],
      20: [
        { texto: 'Finalizado', accion: () => this.onFinalizado() }
      ]
    };
  }

  // onPrepostular() {
  //   const payload = {
  //     ...this.steps[0].data,
  //     estadoPostulacionId: 1,
  //     convocatoriaId: this.convocatoriaId,
  //     usuarioId: this.usuario.usuarioId
  //   };
  //   this.api.post('Postulaciones/crear_Postulacion', payload).subscribe(() => {
  //     this.refreshBitacora();
  //   });
  // }

  async onPrepostular(form?: NgForm) {

    // Si hay formulario y no es válido: marcar touched y mostrar advertencia
    if (form && !form.valid) {
      // marcar todos los controls como touched para que aparezcan errores
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      this.showWarning('Complete todos los campos obligatorios antes de continuar.');
      return;
    }

    const confirmado = await this.showConfirm('¿Está seguro que desea realizar la pre-postulación?');

    if (!confirmado) {
      return;
    }

    const payload = {
      ...this.steps[0].data,
      estadoPostulacionId: 1,
      convocatoriaId: this.idCovocatoria,
      usuarioId: this.usuario.idUsuario,
    };

    this.loading = true;

    this.api.post('Postulaciones/crear_Postulacion', payload).subscribe({
      next: () => {
        this.loading = false;
        console.log('Pre-postulación creada exitosamente');
        this.showSuccess("Pre-postulación creada exitosamente");
        this.refreshBitacora();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al crear pre-postulación', err);
        this.showError('Ocurrió un error al crear la pre-postulación. Por favor intente nuevamente.');
      }
    });
  }

  onRechazarPre(form?: NgForm) {

    if (form && !form.valid) {
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      this.showWarning('Complete todos los campos obligatorios antes de continuar.');
      return;
    }

    const currentStepData = this.steps[this.selectedStepIndex]?.data || {};

    const payload = {
      motivoRechazo: currentStepData['motivoRechazo'],
      estadoPostulacionId: 2,
      esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
      usuarioId: this.usuario.rolId == 7 ? this.idUsuario : this.usuario.usuarioId,
      convocatoriaId: this.idCovocatoria,
      fechaPostulacion: this.getFechaActual()
    };

    this.api.post('Postulaciones/crear_Postulacion', payload).subscribe({
      next: (resp) => {
        console.log('Rechazado Pre-postulación:', resp);
        this.refreshBitacora();
      },
      error: (err) => {
        this.showWarning(err);
      }
    });
  }

  onAceptarPre(form?: NgForm) {

    // Si hay formulario y no es válido: marcar touched y mostrar advertencia
    if (form && !form.valid) {
      // marcar todos los controls como touched para que aparezcan errores
      Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
      this.showWarning('Complete todos los campos obligatorios antes de continuar.');
      return;
    }

    const payload = {
      ...this.steps[0].data,
      convocatoriaId: this.idCovocatoria,
      estadoPostulacionId: 21
    };
    this.api.post('Postulaciones/crear_Postulacion', payload).subscribe(() => {
      this.refreshBitacora();
    });
  }

  onPostular() {
  const currentStepData = this.steps[this.selectedStepIndex]?.data || {};
  const payload = {
    usuarioId: this.usuario.rolId == 7 ? this.idUsuario : this.usuario.usuarioId,
    convocatoriaId: this.idCovocatoria,
    estadoPostulacionId: 4,
    fechaPostulacion: currentStepData['fechaPostulacion'],
    periodo: currentStepData['periodo'],
    convenioId: currentStepData['convenioId'],
    observaciones: currentStepData['observaciones'],
    tipoMovilidadId: currentStepData['tipoMovilidadId'],
    urlEncuestaSatisfaccion: currentStepData['urlEncuestaSatisfaccion'],
    objetivo: currentStepData['objetivo'], // Obligatorio
    fechaInicioMovilidad: currentStepData['fechaFinMovilidad'],
    fechaFinMovilidad: currentStepData['fechaFinMovilidad'],
    institucionId: 1,
    fechaEntregable: currentStepData['fechaEntregable'],
    asistioEntrevista: currentStepData['asistioEntrevista'] || false,
    UrlEncuestaSatisfaccion: "https://docs.google.com/forms/d/e/1FAIpQLSe1piZ1G84UYLDpToyN86EZhhFDSB01FdUyRVmlksoGyAJ8-w/viewform"
  };

  this.api.post('Postulaciones/crear_Postulacion', payload).subscribe({
    next: (resp) => {
      console.log('Postulado exitosamente:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al postular:', err)
  });
}

onRechazarPostulacion(form?: NgForm) {

  // Si hay formulario y no es válido: marcar touched y mostrar advertencia
  if (form && !form.valid) {
    // marcar todos los controls como touched para que aparezcan errores
    Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
    this.showWarning('Complete todos los campos obligatorios antes de continuar.');
    return;
  }

  const currentStepData = this.steps[this.selectedStepIndex]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 5,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: this.idUsuario,
    convocatoriaId: this.idCovocatoria,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/crear_Postulacion', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Postulación:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar postulación:', err)
  });
}

onAprobarPostulacion(form?: NgForm) {

  // Si hay formulario y no es válido: marcar touched y mostrar advertencia
  if (form && !form.valid) {
    // marcar todos los controls como touched para que aparezcan errores
    Object.values(form.controls).forEach(ctrl => ctrl.markAsTouched());
    this.showWarning('Complete todos los campos obligatorios antes de continuar.');
    return;
  }

  const currentStepData = this.steps[this.selectedStepIndex]?.data || {};
  const payload = {
    fechaEntregable: currentStepData['fechaEntregable'],
    requiereVisa: currentStepData['requiereVisa'] || false,
    fechaPostulacion: currentStepData['fechaPostulacion'],
    estadoPostulacionId: 4,
    usuarioId: this.idUsuario,
    convocatoriaId: this.idCovocatoria,
  };

  this.api.post('Postulaciones/crear_Postulacion', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Postulación:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar postulación:', err)
  });
}

onRechazarDirector() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 7,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/RechazarDirector', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Director:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar director:', err)
  });
}

onAprobarDirector() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 6,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/AprobarDirector', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Director:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar director:', err)
  });
}

onConfirmarRechazoDirector() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 7,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/ConfirmarRechazoDirector', payload).subscribe({
    next: (resp) => {
      console.log('Confirmado Rechazo Director:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al confirmar rechazo director:', err)
  });
}

onAprobarDecanatura() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 8,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/AprobarDecanatura', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Decanatura:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar decanatura:', err)
  });
}

onRechazarDecanatura() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 9,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/RechazarDecanatura', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Decanatura:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar decanatura:', err)
  });
}

onAprobarVicerrectoria() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 10,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/AprobarVicerrectoria', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Vicerrectoría:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar vicerrectoría:', err)
  });
}

onRechazarVicerrectoria() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 11,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/RechazarVicerrectoria', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Vicerrectoría:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar vicerrectoría:', err)
  });
}

onAprobarJefe() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 12,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/AprobarJefe', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Jefe Inmediato:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar jefe inmediato:', err)
  });
}

onRechazarJefe() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 13,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/RechazarJefe', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Jefe Inmediato:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar jefe inmediato:', err)
  });
}

onAprobarRectoria() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 14,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/AprobarRectoria', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Rectoría:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar rectoría:', err)
  });
}

onRechazarRectoria() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 15,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/RechazarRectoria', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Rectoría:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar rectoría:', err)
  });
}

onPostularUniversidad() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 16,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/PostularUniversidad', payload).subscribe({
    next: (resp) => {
      console.log('Postulado Universidad Destino:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al postular universidad:', err)
  });
}

onAprobarUniversidad() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 17,
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/AprobarUniversidad', payload).subscribe({
    next: (resp) => {
      console.log('Aprobado Universidad Destino:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al aprobar universidad:', err)
  });
}

onRechazarUniversidad() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    motivoRechazo: currentStepData['motivoRechazo'],
    estadoPostulacionId: 18,
    esNotificadoCorreo: currentStepData['esNotificadoCorreo'] || false,
    usuarioId: currentStepData['usuarioId'],
    convocatoriaId: currentStepData['convocatoriaId'],
    fechaPostulacion: currentStepData['fechaPostulacion']
  };

  this.api.post('Postulaciones/RechazarUniversidad', payload).subscribe({
    next: (resp) => {
      console.log('Rechazado Universidad Destino:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al rechazar universidad:', err)
  });
}

onEnMovilidad() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 19,
    fechaPostulacion: currentStepData['fechaPostulacion'],
    esMatriculadoSiiga: currentStepData['esMatriculadoSiiga'] || false,
    esNotificadoRegistroAcademico: currentStepData['esNotificadoRegistroAcademico'] || false
  };

  this.api.post('Postulaciones/EnMovilidad', payload).subscribe({
    next: (resp) => {
      console.log('En Movilidad:', resp);
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al marcar en movilidad:', err)
  });
}

onFinalizado() {
  const currentStepData = this.steps[this.currentStep]?.data || {};
  const payload = {
    estadoPostulacionId: 20,
    fechaPostulacion: currentStepData['fechaPostulacion'],
    certificadoMovilidad: currentStepData['certificadoMovilidad'],
    realizoEncuestaSatisfaccion: currentStepData['realizoEncuestaSatisfaccion'] || false,
    registradoSire: currentStepData['registradoSire'] || false,
    financiacionExterna: currentStepData['financiacionExterna'],
    financiacioUcm: currentStepData['financiacioUcm']
  };

  this.api.post('Postulaciones/Finalizado', payload).subscribe({
    next: (resp) => {
      console.log('Finalizado:', resp);
      // Aquí puedes agregar lógica para generar el PDF del certificado
      this.generarCertificadoMovilidad();
      this.refreshBitacora();
    },
    error: (err) => console.error('Error al finalizar:', err)
  });
}

onCancelar() {
  // Placeholder - implementar según necesidades
  console.log('Cancelar postulación - funcionalidad pendiente');
  // Aquí puedes agregar un modal de confirmación o lógica específica
}

// Método adicional para generar certificado de movilidad
generarCertificadoMovilidad() {
  // Implementar generación de PDF con datos quemados como indica el documento
  console.log('Generando certificado de movilidad PDF...');
  // Aquí puedes usar una librería como jsPDF o llamar a un endpoint que genere el PDF
}

// Método actualizado para colores
getColorEstado(id: number): string {
  const estadosAmarillos = [1]; // Pre-postulación
  const estadosRojos = [2, 5, 7, 9, 11, 13, 15, 18]; // Todos los rechazos
  const estadosVerdes = [3, 4, 6, 8, 10, 12, 14, 16, 17, 19, 20, 21]; // Aprobaciones y progreso

  if (estadosAmarillos.includes(id)) return '#eac701ff'; // Amarillo
  if (estadosRojos.includes(id)) return '#FF4444'; // Rojo
  if (estadosVerdes.includes(id)) return '#22c55e'; // Verde

  return '#e2e8f0'; // Gris por defecto
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
    const dialogRef = this.dialog.open(NotificacionModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        stepId: step.id,
        stepNombre: step.nombre,
        postulacionId: this.idPostulacion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Notificación enviada exitosamente:', result.data);
      }
    });
  }

  onVerNotificaciones() {
    this.idPostulacion = this.idPostulacion;
    const modalElement = document.getElementById('NotificacionModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  onGestioDocumental(step: any) {
    this.idPostulacion = this.idPostulacion;
    alert(this.idPostulacion);
    alert(this.convocatoriaId);
    alert(this.convocatoria);
    alert(this.documento);
    const modalElement = document.getElementById('GestionDocumentalnModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  focusCurrentStep() {
    setTimeout(() => {
      const el = document.getElementById('step-item-' + this.currentStep);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  onGestioBeneficios(step: any) {
    this.idPostulacion = this.idPostulacion;
    const modalElement = document.getElementById('BeneficiosModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  onGestioFinanciacion(step: any) {
    this.idPostulacion = this.idPostulacion;
    const modalElement = document.getElementById('FinanciacionModel');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  onGestioEncuesta(step: any) {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSe1piZ1G84UYLDpToyN86EZhhFDSB01FdUyRVmlksoGyAJ8-w/viewform");
  }

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

  getFechaActual(){
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const customFormat = `${year}-${month}-${day}`;

    return customFormat;
  }
}
