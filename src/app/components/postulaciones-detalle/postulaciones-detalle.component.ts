import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { GenericApiService } from '../../services/generic-api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationService } from 'primeng/api';

// Angular Material Imports
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-postulaciones-detalle',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './postulaciones-detalle.component.html',
  styleUrls: ['./postulaciones-detalle.component.css'],
  providers: [ConfirmationService]
})
export class PostulacionesDetalleComponent implements OnInit, OnDestroy {

  @ViewChild('stepper') stepper!: MatStepper;

  steps: any[] = [];
  currentStep = 0;
  private destroy$ = new Subject<void>();
  loading: boolean = false;

  constructor(private api: GenericApiService) {}

  ngOnInit() {
    this.getEstados();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
            descripcion: item.descripcion ?? `Descripción del paso ${idx + 1}`
          }));
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar estados para el stepper', err);
          this.steps = [];
          this.loading = false;
        }
      });
  }

  // Métodos para navegación programática (opcional)
  goToStep(index: number) {
    if (this.stepper && index >= 0 && index < this.steps.length) {
      this.stepper.selectedIndex = index;
      this.currentStep = index;
    }
  }

  nextStep() {
    if (this.stepper) {
      this.stepper.next();
      this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1);
    }
  }

  prevStep() {
    if (this.stepper) {
      this.stepper.previous();
      this.currentStep = Math.max(this.currentStep - 1, 0);
    }
  }
}
