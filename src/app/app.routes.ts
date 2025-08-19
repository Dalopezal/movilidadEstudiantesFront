import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { BeneficioConvocatoriaComponent } from './components/beneficio-convocatoria/beneficio-convocatoria.component';
import { CondicionComponent } from './components/condicion/condicion.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'beneficios-convocatoria', component: BeneficioConvocatoriaComponent },
  { path: 'condicion', component: CondicionComponent },
  { path: '**', redirectTo: '' }
];
