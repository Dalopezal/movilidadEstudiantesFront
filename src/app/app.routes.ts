import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { BeneficioConvocatoriaComponent } from './components/beneficio-convocatoria/beneficio-convocatoria.component';
import { CondicionComponent } from './components/condicion/condicion.component';
import { CondicionConvocatoriaComponent } from './components/condicion-convocatoria/condicion-convocatoria.component';
import { ConveniosComponent } from './components/convenios/convenios.component';
import { EntregableComponent } from './components/entregable/entregable.component';
import { InstitucionesComponent } from './components/instituciones/instituciones.component';
import { PostulacionesComponent } from './components/postulaciones/postulaciones.component';
import { ConvocatoriasGeneralComponent } from './components/convocatorias-general/convocatorias-general.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'beneficios-convocatoria', component: BeneficioConvocatoriaComponent },
  { path: 'condicion', component: CondicionComponent },
  { path: 'condicion-convocatoria', component: CondicionConvocatoriaComponent },
  { path: 'convenios', component: ConveniosComponent },
  { path: 'entregables', component: EntregableComponent },
  { path: 'instituciones', component: InstitucionesComponent },
  { path: 'postulaciones', component: PostulacionesComponent },
  { path: 'convocatorias-general', component: ConvocatoriasGeneralComponent },
  { path: '**', redirectTo: '' }
];
