import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-condicion',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './condicion.component.html',
  styleUrls: ['./condicion.component.css']  // corregido aquí
})
export class CondicionComponent implements OnInit {
  data = this.loadData();
  pagedData: any[] = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  pages: number[] = [];  // <-- Agrega esta propiedad
  pageSizeOptions = [10, 11, 20, 50]; // Opciones para selector

  ngOnInit() {
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.pages = this.getPagesArray();
    this.updatePagedData();
  }

  loadData(): any[] {
    const arr = [];
    for (let i = 1; i <= 0; i++) {
      arr.push({
        nombre: `Condición ${i}`,
        descripcion: `Descripción ${i}`,
        convocatoria: `Convocatoria ${i}`
      });
    }
    return arr;
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

  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((x, i) => i + 1);
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = +select.value;
    this.currentPage = 1; // resetear a página 1
    this.calculateTotalPages();
    this.updatePagedData();
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
