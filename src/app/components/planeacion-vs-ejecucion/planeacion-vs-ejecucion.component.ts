import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component'; // Asegúrate de que esta importación sea correcta
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Registro {
  componente: string;
  planeado: string[];
  ejecutado: string[];
  programa: string;
  plan: string;
  anio: number;
  periodo: string;
}

@Component({
  selector: 'app-planeacion-vs-ejecucion', // O el nombre que le hayas dado a tu componente
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
  ],
  standalone: true, // Si estás usando componentes standalone
  templateUrl: './planeacion-vs-ejecucion.component.html',
  styleUrl: './planeacion-vs-ejecucion.component.css'
})
export class PlaneacionVsEjecucionComponent implements OnInit {
  filtros = {
    programa: '',
    plan: '',
    componente: '',
    anio: null as number | null,
    periodo: ''
  };

  programas = ['Movilidad Internacional', 'Intercambio Académico', 'Capacitación Docente'];
  planes = ['Plan Estratégico 2023-2025', 'Plan Anual 2024'];
  componentes = ['Becas Externas', 'Convenios Internacionales', 'Movilidad Docente', 'Estancias Cortas'];
  anios = [2022, 2023, 2024];
  periodos = ['Q1', 'Q2', 'Q3', 'Q4'];

  registrosOriginales: Registro[] = [
    {
      componente: 'Becas Externas',
      planeado: ['Identificar 50 becas', 'Publicar convocatoria', 'Evaluar 100 solicitudes', 'Seleccionar 20 becarios', 'Gestionar visas'],
      ejecutado: ['Identificar 45 becas', 'Publicar convocatoria', 'Evaluar 90 solicitudes'],
      programa: 'Movilidad Internacional',
      plan: 'Plan Estratégico 2023-2025',
      anio: 2023,
      periodo: 'Q1'
    },
    {
      componente: 'Convenios Internacionales',
      planeado: ['Contactar 10 universidades', 'Negociar 3 acuerdos', 'Firmar 2 convenios'],
      ejecutado: ['Contactar 8 universidades', 'Negociar 2 acuerdos'],
      programa: 'Movilidad Internacional',
      plan: 'Plan Estratégico 2023-2025',
      anio: 2023,
      periodo: 'Q2'
    },
    {
      componente: 'Movilidad Docente',
      planeado: ['Abrir 2 convocatorias', 'Seleccionar 15 docentes', 'Organizar logística'],
      ejecutado: ['Abrir 1 convocatoria', 'Seleccionar 10 docentes', 'Organizar logística'],
      programa: 'Intercambio Académico',
      plan: 'Plan Anual 2024',
      anio: 2024,
      periodo: 'Q2'
    },
    {
      componente: 'Estancias Cortas',
      planeado: ['Definir 5 programas', 'Promocionar programas', 'Recibir 30 estudiantes'],
      ejecutado: ['Definir 4 programas', 'Promocionar programas', 'Recibir 25 estudiantes'],
      programa: 'Capacitación Docente',
      plan: 'Plan Anual 2024',
      anio: 2024,
      periodo: 'Q3'
    }
  ];

  registrosFiltrados: Registro[] = [];

  ngOnInit(): void {
    this.registrosFiltrados = [...this.registrosOriginales];
  }

  filtrar(): void {
    this.registrosFiltrados = this.registrosOriginales.filter(r =>
      (!this.filtros.programa || r.programa === this.filtros.programa) &&
      (!this.filtros.plan || r.plan === this.filtros.plan) &&
      (!this.filtros.componente || r.componente === this.filtros.componente) &&
      (!this.filtros.anio || r.anio === this.filtros.anio) &&
      (!this.filtros.periodo || r.periodo === this.filtros.periodo)
    );
  }
}
