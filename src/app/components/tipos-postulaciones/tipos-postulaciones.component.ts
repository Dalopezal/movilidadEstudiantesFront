import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PostulcionesEntrantesComponent } from '../postulaciones-tipo/postulaciones-tipo.component';

@Component({
  selector: 'app-tipos-postulaciones',
  imports: [SidebarComponent, PostulcionesEntrantesComponent],
  templateUrl: './tipos-postulaciones.component.html',
  styleUrl: './tipos-postulaciones.component.css'
})
export class TiposPostulacionesComponent {

}
