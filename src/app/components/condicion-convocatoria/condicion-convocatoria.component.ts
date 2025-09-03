import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-condicion-convocatoria',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './condicion-convocatoria.component.html',
  styleUrls: ['./condicion-convocatoria.component.css']
})
export class CondicionConvocatoriaComponent {
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



