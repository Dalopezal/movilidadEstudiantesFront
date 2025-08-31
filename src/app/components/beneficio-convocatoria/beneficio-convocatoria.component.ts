import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-beneficio-convocatoria',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './beneficio-convocatoria.component.html',
  styleUrls: ['./beneficio-convocatoria.component.css']
})
export class BeneficioConvocatoriaComponent {
  data: any[] = []; // Todos los datos
  pagedData: any[] = []; // Datos para la página actual

  currentPage = 1;
  pageSize = 10; // Valor inicial igual a la imagen
  pageSizeOptions = [10, 11, 20, 50]; // Opciones para selector
  totalPages = 0;
  pages: number[] = [];

  ngOnInit() {
    this.data = this.loadData();

    this.calculateTotalPages();
    this.updatePagedData();
  }

  loadData(): any[] {
    return [
      {
        nombre: 'Beneficio Saludable',
        descripcion: 'Apoyo económico destinado a cubrir gastos relacionados con tratamientos médicos especializados, medicamentos y terapias para mejorar la calidad de vida de los beneficiarios.',
        convocatoria: 'Convocatoria 2025-A',
        completo: 1
      },
      {
        nombre: 'Beca Estudiantil',
        descripcion: 'Financiamiento integral para estudiantes universitarios que incluye matrícula, materiales educativos y apoyo para actividades extracurriculares que fomenten el desarrollo académico y personal.',
        convocatoria: 'Convocatoria 2025-B',
        completo: 0
      },
      {
        nombre: 'Subsidio Vivienda',
        descripcion: 'Ayuda financiera para la adquisición, construcción o mejora de viviendas, destinada a familias de bajos ingresos que buscan mejorar sus condiciones habitacionales.',
        convocatoria: 'Convocatoria 2025-C',
        completo: 1
      },
      {
        nombre: 'Capacitación Laboral',
        descripcion: 'Programas de formación y actualización profesional que ofrecen cursos, talleres y certificaciones para mejorar las habilidades y competencias laborales de los participantes.',
        convocatoria: 'Convocatoria 2025-D',
        completo: 0
      },
      {
        nombre: 'Apoyo Emprendedor',
        descripcion: 'Fondos y asesoría técnica para personas que desean iniciar o fortalecer sus propios negocios, fomentando la innovación y el desarrollo económico local.',
        convocatoria: 'Convocatoria 2025-E',
        completo: 1
      },
      {
        nombre: 'Incentivo Cultural',
        descripcion: 'Promoción y financiamiento de actividades artísticas y culturales que contribuyan al enriquecimiento del patrimonio y la identidad comunitaria.',
        convocatoria: 'Convocatoria 2025-F',
        completo: 0
      },
      {
        nombre: 'Bono Alimentario',
        descripcion: 'Subsidio destinado a garantizar el acceso a una alimentación adecuada y nutritiva para familias en situación de vulnerabilidad social.',
        convocatoria: 'Convocatoria 2025-G',
        completo: 1
      },
      {
        nombre: 'Programa Ambiental',
        descripcion: 'Apoyo a proyectos orientados a la conservación del medio ambiente, manejo sostenible de recursos naturales y educación ambiental.',
        convocatoria: 'Convocatoria 2025-H',
        completo: 0
      },
      {
        nombre: 'Apoyo Deportivo',
        descripcion: 'Financiamiento y recursos para la práctica y desarrollo de actividades deportivas, incluyendo infraestructura, equipamiento y formación de atletas.',
        convocatoria: 'Convocatoria 2025-I',
        completo: 1
      },
      {
        nombre: 'Beca Técnica',
        descripcion: 'Formación técnica profesional en áreas específicas con alta demanda laboral, facilitando la inserción y permanencia en el mercado de trabajo.',
        convocatoria: 'Convocatoria 2025-J',
        completo: 0
      },
      {
        nombre: 'Subsidio Transporte',
        descripcion: 'Ayuda económica para facilitar el acceso al transporte público, reduciendo los costos de movilidad para estudiantes, trabajadores y personas en situación de vulnerabilidad.',
        convocatoria: 'Convocatoria 2025-K',
        completo: 1
      },
      {
        nombre: 'Fondo Innovación',
        descripcion: 'Recursos destinados a apoyar proyectos innovadores que generen soluciones tecnológicas, sociales o ambientales con impacto positivo en la comunidad.',
        convocatoria: 'Convocatoria 2025-L',
        completo: 0
      },
      {
        nombre: 'Programa Inclusión',
        descripcion: 'Iniciativas que promueven la igualdad de oportunidades y la participación activa de grupos vulnerables o en situación de exclusión social.',
        convocatoria: 'Convocatoria 2025-M',
        completo: 1
      },
      {
        nombre: 'Bono Educativo',
        descripcion: 'Subsidio para la adquisición de materiales escolares, uniformes y otros recursos necesarios para garantizar la continuidad educativa de niños y jóvenes.',
        convocatoria: 'Convocatoria 2025-N',
        completo: 0
      },
      {
        nombre: 'Apoyo Tecnológico',
        descripcion: 'Equipamiento y acceso a tecnologías de la información y comunicación para facilitar la educación, el trabajo y la inclusión digital.',
        convocatoria: 'Convocatoria 2025-O',
        completo: 1
      },
      {
        nombre: 'Fondo Cultural',
        descripcion: 'Financiamiento para la realización de eventos, festivales y proyectos culturales que fomenten la participación ciudadana y el desarrollo artístico.',
        convocatoria: 'Convocatoria 2025-P',
        completo: 0
      },
      {
        nombre: 'Subsidio Energético',
        descripcion: 'Ayuda para cubrir los costos de consumo energético en hogares de bajos recursos, promoviendo el acceso a servicios básicos esenciales.',
        convocatoria: 'Convocatoria 2025-Q',
        completo: 1
      },
      {
        nombre: 'Capacitación Digital',
        descripcion: 'Cursos y talleres para el desarrollo de habilidades digitales, facilitando la inclusión en la economía digital y el acceso a nuevas oportunidades laborales.',
        convocatoria: 'Convocatoria 2025-R',
        completo: 0
      },
      {
        nombre: 'Beca Deportiva',
        descripcion: 'Apoyo económico y formativo para atletas destacados que representan a sus comunidades en competencias locales, nacionales e internacionales.',
        convocatoria: 'Convocatoria 2025-S',
        completo: 1
      },
      {
        nombre: 'Incentivo Ambiental',
        descripcion: 'Proyectos y actividades que promueven la sostenibilidad ambiental, la reducción de la huella ecológica y la educación para el cuidado del planeta.',
        convocatoria: 'Convocatoria 2025-T',
        completo: 0
      },
    ];
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updatePagedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.data.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedData();
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = +select.value;
    this.currentPage = 1; // resetear a página 1
    this.calculateTotalPages();
    this.updatePagedData();
  }
}
