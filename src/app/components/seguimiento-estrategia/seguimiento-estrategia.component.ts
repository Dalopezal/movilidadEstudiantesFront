import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// import { GenericApiService } from '../../services/generic-api.service';

interface SeguimientoEstrategiaModel {
  id: number;

  fechaInicio: string;
  fechaFin: string;

  estrategiaEvaluacionId: number;
  nombreEstrategia: string;

  generaCertificado: boolean;
  obtuvoInsignia: boolean;
  terminado: boolean;

  archivoEstudiantes?: File | null;
  archivoDocentes?: File | null;

  archivoEstudiantesNombre?: string;
  archivoDocentesNombre?: string;
}

@Component({
  selector: 'app-seguimiento-estrategia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NgxSonnerToaster, ConfirmDialogModule],
  templateUrl: './seguimiento-estrategia.component.html',
  styleUrls: ['./seguimiento-estrategia.component.css'],
  providers: [ConfirmationService]
})
export class SeguimientoEstrategiaComponent implements OnInit, OnDestroy {
  // catálogos
  estrategiasEvaluacion: { id: number; nombre: string }[] = [];

  model: SeguimientoEstrategiaModel = {
    id: 0,
    fechaInicio: '',
    fechaFin: '',
    estrategiaEvaluacionId: 0,
    nombreEstrategia: '',
    generaCertificado: false,
    obtuvoInsignia: false,
    terminado: false,
    archivoEstudiantes: null,
    archivoDocentes: null,
    archivoEstudiantesNombre: '',
    archivoDocentesNombre: '',
  };

  loading = false;
  dateRangeInvalid = false;

  private destroy$ = new Subject<void>();

  constructor(
    private confirmation: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCatalogos() {
    // this.api.get('EstrategiasEvaluacion/Consultar').pipe(takeUntil(this.destroy$)).subscribe(...)
    this.estrategiasEvaluacion = [
      { id: 1, nombre: 'Rúbrica' },
      { id: 2, nombre: 'Proyecto final' },
      { id: 3, nombre: 'Portafolio' },
    ];
  }

  onEstrategiaChange() {
    const e = this.estrategiasEvaluacion.find(x => x.id === this.model.estrategiaEvaluacionId);
    this.model.nombreEstrategia = e ? e.nombre : '';
  }

  validarRangoFechas() {
    const fi = this.model.fechaInicio ? new Date(this.model.fechaInicio) : null;
    const ff = this.model.fechaFin ? new Date(this.model.fechaFin) : null;
    this.dateRangeInvalid = !!(fi && ff && ff < fi);
  }

  onArchivoEstudiantesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.model.archivoEstudiantes = file;
    this.model.archivoEstudiantesNombre = file ? file.name : '';
  }

  onArchivoDocentesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.model.archivoDocentes = file;
    this.model.archivoDocentesNombre = file ? file.name : '';
  }

  limpiarArchivo(tipo: 'estudiantes' | 'docentes') {
    if (tipo === 'estudiantes') {
      this.model.archivoEstudiantes = null;
      this.model.archivoEstudiantesNombre = '';
    } else {
      this.model.archivoDocentes = null;
      this.model.archivoDocentesNombre = '';
    }
  }

  descargarPlantilla(tipo: 'estudiantes' | 'docentes') {
    const url = tipo === 'estudiantes'
      ? 'https://example.com/plantillas/plantilla_estudiantes.xlsx'
      : 'https://example.com/plantillas/plantilla_docentes.xlsx';
    window.open(url, '_blank');
  }

  verInsignia() {
    //toast.info('Abrir visor de insignia', { description: 'Aquí puedes implementar ver insignia' });
  }

  // ---------- Submit ----------
  async onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    if (this.model.estrategiaEvaluacionId === 0) {
      this.showWarning('Debe seleccionar la estrategia de evaluación.');
      return;
    }
    this.validarRangoFechas();
    if (this.dateRangeInvalid) {
      this.showWarning('La fecha de fin debe ser mayor o igual a la fecha de inicio.');
      return;
    }

    if (this.model.terminado) {
      const ok = await this.confirm('¿Marcar como terminado? No podrás editar luego.');
      if (!ok) return;
    }

    this.loading = true;

    try {
      const fd = new FormData();
      fd.append('fechaInicio', this.model.fechaInicio);
      fd.append('fechaFin', this.model.fechaFin);
      fd.append('estrategiaEvaluacionId', String(this.model.estrategiaEvaluacionId));
      fd.append('generaCertificado', String(this.model.generaCertificado));
      fd.append('obtuvoInsignia', String(this.model.obtuvoInsignia));
      fd.append('terminado', String(this.model.terminado));
      if (this.model.archivoEstudiantes) fd.append('archivoEstudiantes', this.model.archivoEstudiantes);
      if (this.model.archivoDocentes) fd.append('archivoDocentes', this.model.archivoDocentes);

      // await this.api.post('SeguimientoEstrategia/Guardar', fd).toPromise();

      await new Promise(r => setTimeout(r, 900));

      this.loading = false;
      this.showSuccess('Seguimiento guardado correctamente.');
    } catch (err) {
      console.error(err);
      this.loading = false;
      this.showError('No se pudo guardar el seguimiento. Intenta de nuevo.');
    }
  }

  // ---------- Toasters + confirm ----------
  showSuccess(msg: string, desc?: string) {
    toast.success(msg, { description: desc, unstyled: true, class: 'my-success-toast' });
  }
  showError(msg: string, desc?: string) {
    toast.error(msg, { description: desc, unstyled: true, class: 'my-error-toast' });
  }
  showWarning(msg: string, desc?: string) {
    toast.warning(msg, { description: desc, unstyled: true, class: 'my-warning-toast' });
  }
  confirm(message: string): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmation.confirm({
        message,
        header: 'Confirmar acción',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí',
        rejectLabel: 'Cancelar',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  resetForm(myForm: NgForm) {
    this.model = {
      id: 0,
      fechaInicio: '',
      fechaFin: '',
      estrategiaEvaluacionId: 0,
      nombreEstrategia: '',
      generaCertificado: false,
      obtuvoInsignia: false,
      terminado: false,
      archivoEstudiantes: null,
      archivoDocentes: null,
      archivoEstudiantesNombre: '',
      archivoDocentesNombre: '',
    };

    this.dateRangeInvalid = false;

    myForm.resetForm(this.model);
  }
}
