import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { BeneficioConvocatoriaComponent } from './components/beneficio-convocatoria/beneficio-convocatoria.component';
import { CondicionComponent } from './components/condicion/condicion.component';
import { CondicionConvocatoriaComponent } from './components/condicion-convocatoria/condicion-convocatoria.component';
import { ConveniosComponent } from './components/convenios/convenios.component';
import { EntregableComponent } from './components/entregable/entregable.component';
import { InstitucionesComponent } from './components/instituciones/instituciones.component';
import { ConvocatoriasGeneralComponent } from './components/convocatorias-general/convocatorias-general.component';
import { TiposPostulacionesComponent } from './components/tipos-postulaciones/tipos-postulaciones.component';
import { PostulacionesDetalleComponent } from './components/postulaciones-detalle/postulaciones-detalle.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'beneficios-convocatoria', component: BeneficioConvocatoriaComponent },
  { path: 'condicion', component: CondicionComponent },
  { path: 'condicion-convocatoria', component: CondicionConvocatoriaComponent },
  { path: 'convenios', component: ConveniosComponent },
  { path: 'entregables', component: EntregableComponent },
  { path: 'instituciones', component: InstitucionesComponent },
  { path: 'postulacion-detalle', component: PostulacionesDetalleComponent },
  { path: 'convocatorias-general', component: ConvocatoriasGeneralComponent },
  { path: 'tipos-postulaciones', component: TiposPostulacionesComponent },
  { path: '**', redirectTo: '' }
];
