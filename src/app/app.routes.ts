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
import { PostulacionesDetalleComponent } from './components/postulaciones-detalle/postulaciones-detalle.component';
import { TiposConvocatoriaComponent } from './components/tipos-convocatoria/tipos-convocatoria.component';
import { PostulcionesEntrantesComponent } from './components/postulaciones-tipo/postulaciones-tipo.component';
import { AdminConvocatoriaComponent } from './components/admin-convocatoria/admin-convocatoria.component';
import { FinanciacionExternaComponent } from './components/financiacion-externa/financiacion-externa.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InstitucionConvenioComponent } from './components/institucion-convenio/institucion-convenio.component';

// Guards funcionales (ruta relativa desde app.routes.ts)
import { authGuard } from './guards/auth.guard';
import { redirectIfAuthenticatedGuard } from './guards/redirectIfAuthenticated.guard';
import { HorariosUniversidadComponent } from './components/horarios-universidad/horarios-universidad.component';
import { InsigniaDigitalComponent } from './components/insignia-digital/insignia-digital.component';
import { PlanComponent } from './components/plan/plan.component';
import { EstrategiaComponent } from './components/asignacion-estrategia/asignacion-estrategia.component';
import { AprobacionEstudiantesComponent } from './components/estrategia-plan/aprobacion-estudiantes.component';

export const routes: Routes = [
  // Login: si ya está autenticado redirige a /home
  { path: '', component: LoginComponent, canActivate: [redirectIfAuthenticatedGuard] },

  // Rutas protegidas por authGuard
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'beneficios-convocatoria', component: BeneficioConvocatoriaComponent, canActivate: [authGuard] },
  { path: 'condicion', component: CondicionComponent, canActivate: [authGuard] },
  { path: 'condicion-convocatoria', component: CondicionConvocatoriaComponent, canActivate: [authGuard] },
  { path: 'convenios', component: ConveniosComponent, canActivate: [authGuard] },
  { path: 'entregables', component: EntregableComponent, canActivate: [authGuard] },
  { path: 'instituciones', component: InstitucionesComponent, canActivate: [authGuard] },
  { path: 'postulacion-detalle', component: PostulacionesDetalleComponent, canActivate: [authGuard] },
  { path: 'convocatorias-general', component: ConvocatoriasGeneralComponent, canActivate: [authGuard] },
  { path: 'tipos-convocatorias', component: TiposConvocatoriaComponent, canActivate: [authGuard] },
  { path: 'postulacion-convocatoria', component: PostulcionesEntrantesComponent, canActivate: [authGuard] },
  { path: 'administracion-convocatoria', component: AdminConvocatoriaComponent, canActivate: [authGuard] },
  { path: 'financiacion-externa', component: FinanciacionExternaComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'institucion-convenio', component: InstitucionConvenioComponent, canActivate: [authGuard] },
  { path: 'horarios-universidad', component: HorariosUniversidadComponent, canActivate: [authGuard] },
  { path: 'insignia-digital', component: InsigniaDigitalComponent, canActivate: [authGuard] },
  { path: 'aprobacion-estudiante', component: AprobacionEstudiantesComponent, canActivate: [authGuard] },
  { path: 'planeacion', component: PlanComponent, canActivate: [authGuard] },
  { path: 'estrategia', component: EstrategiaComponent, canActivate: [authGuard] },

  // Wildcard -> login
  { path: '**', redirectTo: '' }
];
