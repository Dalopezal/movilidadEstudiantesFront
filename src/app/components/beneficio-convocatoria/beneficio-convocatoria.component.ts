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
  data: any[] = []; // Aquí tu JSON con todos los datos
  pagedData: any[] = []; // Datos para la página actual

  currentPage = 1;
  pageSize = 10; // Cantidad de filas por página
  totalPages = 0;
  pages: number[] = [];

  ngOnInit() {
    // Simula cargar datos JSON
    this.data = this.loadData();

    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    this.updatePagedData();
  }

  loadData(): any[] {
    // Aquí carga tu JSON real o simulado
    return [
      { nombre: 'Beneficio 1', descripcion: 'Desc 1', convocatoria: 'Conv 1' },
      { nombre: 'Beneficio 2', descripcion: 'Desc 2', convocatoria: 'Conv 2' },
      { nombre: 'Beneficio 3', descripcion: 'Desc 3', convocatoria: 'Conv 3' },
      { nombre: 'Beneficio 4', descripcion: 'Desc 4', convocatoria: 'Conv 4' },
      { nombre: 'Beneficio 5', descripcion: 'Desc 5', convocatoria: 'Conv 5' },
      { nombre: 'Beneficio 6', descripcion: 'Desc 6', convocatoria: 'Conv 6' },
      { nombre: 'Beneficio 7', descripcion: 'Desc 7', convocatoria: 'Conv 7' },
      { nombre: 'Beneficio 8', descripcion: 'Desc 8', convocatoria: 'Conv 8' },
      { nombre: 'Beneficio 9', descripcion: 'Desc 9', convocatoria: 'Conv 9' },
      { nombre: 'Beneficio 10', descripcion: 'Desc 10', convocatoria: 'Conv 10' },
      { nombre: 'Beneficio 11', descripcion: 'Desc 11', convocatoria: 'Conv 11' },
      { nombre: 'Beneficio 12', descripcion: 'Desc 12', convocatoria: 'Conv 12' },
      { nombre: 'Beneficio 13', descripcion: 'Desc 13', convocatoria: 'Conv 13' },
      { nombre: 'Beneficio 14', descripcion: 'Desc 14', convocatoria: 'Conv 14' },
    ];
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
}
