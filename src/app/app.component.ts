import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component'; // Ajusta la ruta según tu estructura

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet, FooterComponent],
  template: `
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class AppComponent {}
