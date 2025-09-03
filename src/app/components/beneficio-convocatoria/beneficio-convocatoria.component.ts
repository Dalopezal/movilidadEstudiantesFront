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
        nombre: 'Beneficios UCM',
        descripcion: '40% de descuento',
        convocatoria: '2',
        completo: 1
      },
      {
        nombre: 'Beneficios UCM',
        descripcion: 'Apoyo Económico',
        convocatoria: '2',
        completo: 1
      },
      {
        nombre: 'Beneficios UCM',
        descripcion: 'ARL que cuenta como seguro de viaje por 4 meses',
        convocatoria: '3',
        completo: 1
      },
      {
        nombre: 'Beneficios UCM',
        descripcion: 'Descuentos de matrícula entre el 10% y el 40%',
        convocatoria: '3',
        completo: 1
      }
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
