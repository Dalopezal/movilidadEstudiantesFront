import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConvocatoriasGeneralComponent } from '../convocatorias-general/convocatorias-general.component';

@Component({
  standalone: true,
  selector: 'app-tipos-convocatoria',
  imports: [SidebarComponent, ConvocatoriasGeneralComponent],
  templateUrl: './tipos-convocatoria.component.html',
  styleUrl: './tipos-convocatoria.component.css'
})
export class TiposConvocatoriaComponent {

}
