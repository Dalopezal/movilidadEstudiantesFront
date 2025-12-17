import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { GenericApiService } from '../../services/generic-api.service';

type EstadoEjecutado = 'ejecutado';

interface EjecutadoItem {
  text: string;
  estado: EstadoEjecutado;
}

interface Materia {
  nombre: string;
  cumplidoPorSemestre: {
    [semestre: string]: {
      planeado: string[];
      ejecutado: EjecutadoItem[];
    };
  };
}

/* Tipos simplificados para las respuestas de las APIs */
interface PlaneadoApiItem {
  id?: number;
  componenteNombre: string;
  estrategiaNombre: string;
  semestreComponente: number;
  estrategiaid?: number;
  [key: string]: any;
}

interface EjecutadoApiItem {
  id?: number;
  nombreComponenteUCM: string;
  estrategiaNombre: string;
  semestreUCM: number;
  estrategiaId?: number;
  estrategiaid?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-planeacion-vs-ejecucion',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule
  ],
  templateUrl: './planeacion-vs-ejecucion.component.html',
  styleUrls: ['./planeacion-vs-ejecucion.component.css']
})
export class PlaneacionVsEjecucionComponent implements OnInit, OnDestroy {
  filtros = {
    programa: '',
    plan: null as number | null,
    anio: new Date().getFullYear(),
    periodo: null as number | null
  };

  programas = ['Enfermeria', 'Programa 2'];
  planes = [1, 2, 3];
  periodos = [1, 2];

  semestres: string[] = Array.from({ length: 10 }, (_, i) => `Semestre ${i + 1}`);

  materias: Materia[] = [];

  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private api: GenericApiService) {}

  programasLst: any[] = [];
  anios: number[] = [];

  ngOnInit(): void {
    this.populateYears();
    this.fetchProgramas();
    // Cargar datos inicialmente
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchProgramas() {
    this.api.getExterno<any>('orisiga/programacademico/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          let items: any[] = [];
          if (Array.isArray(resp)) items = resp;
          else if (resp && typeof resp === 'object') {
            if (Array.isArray(resp.data)) items = resp.data;
            else if (Array.isArray(resp.items)) items = resp.items;
            else {
              const arr = Object.values(resp).find(v => Array.isArray(v));
              if (Array.isArray(arr)) items = arr;
            }
          }
          this.programasLst = items.map(item => ({ id: item.programa_codigo, nombre: item.programa_nombre }));
        },
        error: (err) => {
          console.error('Error al cargar programas', err);
          this.programasLst = [];
        }
      });
  }

  filtrar(): void {
    this.loadData();
  }

  // --- utilitarios ---
  private normalizeText(v: any): string {
    if (v === null || v === undefined) return '';
    return String(v).trim().toLowerCase();
  }

  private ensureMateria(map: Map<string, Materia>, nombre: string): Materia {
    const key = (nombre ?? '').trim();
    if (!map.has(key)) {
      const m: Materia = {
        nombre: key,
        cumplidoPorSemestre: {}
      };
      // Inicializar 10 semestres
      for (let i = 1; i <= 10; i++) {
        m.cumplidoPorSemestre[`Semestre ${i}`] = { planeado: [], ejecutado: [] };
      }
      map.set(key, m);
    }
    return map.get(key)!;
  }

  private compositeKeyByName(componentName: string, semestre: number, estrategiaName: string) {
    return `${this.normalizeText(componentName)}||${semestre}||${this.normalizeText(estrategiaName)}`;
  }

  private compositeKeyById(componentName: string, semestre: number, estrategiaId: number | undefined) {
    if (estrategiaId === null || estrategiaId === undefined) return null;
    return `${this.normalizeText(componentName)}||${semestre}||ID:${estrategiaId}`;
  }

  // ----------------------
  // Carga y procesamiento
  // ----------------------
  loadData(): void {
    this.loading = true;
    this.error = null;

    const { programa, plan, anio, periodo } = this.filtros;

    const endpointPlaneado = `Trayectoria/Consultar_TrayectoriaPlaneado?Programa=${encodeURIComponent(programa)}&Planid=${encodeURIComponent(String(plan))}&Anio=${encodeURIComponent(String(anio))}&Periodo=${encodeURIComponent(String(periodo))}`;
    const endpointEjecutado = `AsignacionPlanComponente/Consultar_TrayectoriaEjecutado?Programa=${encodeURIComponent(programa)}&Planid=${encodeURIComponent(String(plan))}&Anio=${encodeURIComponent(String(anio))}&Periodo=${encodeURIComponent(String(periodo))}`;

    const reqPlaneado$ = this.api.get<{ exito: string; datos: PlaneadoApiItem[] }>(endpointPlaneado);
    const reqEjecutado$ = this.api.get<{ exito: string; datos: EjecutadoApiItem[] }>(endpointEjecutado);

    forkJoin([reqPlaneado$, reqEjecutado$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([planeadoRes, ejecutadoRes]) => {
          try {
            const planeado: PlaneadoApiItem[] = planeadoRes?.datos || [];
            const ejecutado: EjecutadoApiItem[] = ejecutadoRes?.datos || [];

            const materiaMap = new Map<string, Materia>();
            const ejecById = new Map<string, EjecutadoApiItem[]>();
            const ejecByName = new Map<string, EjecutadoApiItem[]>();

            // 1) indexar ejecutado por id y por nombre+semestre+componente
            for (const e of ejecutado) {
              const compName = e.nombreComponenteUCM || '';
              const sem = Number(e.semestreUCM || 1) || 1;
              const estrName = e.estrategiaNombre || '';
              const estrId = (e as any).estrategiaId ?? (e as any).estrategiaid ?? undefined;

              const idKey = this.compositeKeyById(compName, sem, estrId);
              if (idKey) {
                if (!ejecById.has(idKey)) ejecById.set(idKey, []);
                ejecById.get(idKey)!.push(e);
              }

              const nameKey = this.compositeKeyByName(compName, sem, estrName);
              if (!ejecByName.has(nameKey)) ejecByName.set(nameKey, []);
              ejecByName.get(nameKey)!.push(e);
            }

            // 2) procesar planeado (agregar planeado y marcar ejecutado solo si existe en ejecutado)
            for (const p of planeado) {
              const comp = p.componenteNombre || '';
              const sem = Number(p.semestreComponente || 1) || 1;
              const estr = p.estrategiaNombre || '';
              const estrId = (p as any).estrategiaid ?? (p as any).estrategiaId ?? undefined;

              const materia = this.ensureMateria(materiaMap, comp);
              const semestreKey = `Semestre ${sem}`;

              // agregar planeado si no existe
              const alreadyPlaneado = materia.cumplidoPorSemestre[semestreKey].planeado
                .some(pl => this.normalizeText(pl) === this.normalizeText(estr));
              if (!alreadyPlaneado) {
                materia.cumplidoPorSemestre[semestreKey].planeado.push(estr);
              }

              // buscar en ejecutado por id primero, luego por nombre
              let matchedEjecutado = false;
              const idKey = this.compositeKeyById(comp, sem, estrId);
              if (idKey && ejecById.has(idKey)) {
                matchedEjecutado = true;
              } else {
                const nameKey = this.compositeKeyByName(comp, sem, estr);
                if (ejecByName.has(nameKey)) matchedEjecutado = true;
              }

              // Ahora: solo añadimos a ejecutado si realmente existe ejecución (no hay 'pendiente')
              if (matchedEjecutado) {
                // evitar duplicados en ejecutado
                const exists = materia.cumplidoPorSemestre[semestreKey].ejecutado
                  .some(ev => this.normalizeText(ev.text) === this.normalizeText(estr));
                if (!exists) {
                  materia.cumplidoPorSemestre[semestreKey].ejecutado.push({
                    text: estr,
                    estado: 'ejecutado'
                  });
                }
              }
            }

            // 3) añadir ejecuciones que no estaban en planeado (para mostrarlas como ejecutado)
            for (const e of ejecutado) {
              const comp = e.nombreComponenteUCM || '';
              const sem = Number(e.semestreUCM || 1) || 1;
              const estr = e.estrategiaNombre || '';
              const estrId = (e as any).estrategiaId ?? (e as any).estrategiaid ?? undefined;

              const materia = this.ensureMateria(materiaMap, comp);
              const semestreKey = `Semestre ${sem}`;

              const alreadyInEjecutado = materia.cumplidoPorSemestre[semestreKey].ejecutado
                .some(ev => this.normalizeText(ev.text) === this.normalizeText(estr));

              if (!alreadyInEjecutado) {
                materia.cumplidoPorSemestre[semestreKey].ejecutado.push({
                  text: estr,
                  estado: 'ejecutado'
                });
              }
            }

            // 4) transformar a array ordenado
            this.materias = Array.from(materiaMap.values()).sort((a, b) =>
              a.nombre.localeCompare(b.nombre, undefined, { numeric: true })
            );

            this.loading = false;
          } catch (err: any) {
            this.loading = false;
            this.error = 'Error procesando datos: ' + (err?.message || err);
            console.error(err);
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error cargando datos: ' + (err?.message || JSON.stringify(err));
          console.error('Error loadData:', err);
        }
      });
  }

  private populateYears(): void {
    const currentYear = new Date().getFullYear();
    // 5 años: actual y 4 anteriores
    this.anios = Array.from({ length: 5 }, (_, i) => currentYear - i);
    if (!this.filtros?.anio || !this.anios.includes(Number(this.filtros.anio))) {
      this.filtros.anio = currentYear;
    }
  }

  // Helper para la vista: obtener lista de materias (componentes) que tengan contenido en ese semestre
  getMateriasForSemester(semestreKey: string) {
    // Devuelve lista de objetos con nombre, planeado[], ejecutado[]
    return this.materias
      .map(m => ({
        nombre: m.nombre,
        planeado: m.cumplidoPorSemestre[semestreKey]?.planeado || [],
        ejecutado: (m.cumplidoPorSemestre[semestreKey]?.ejecutado || []).map(e => e.text)
      }))
      .filter(x => (x.planeado && x.planeado.length > 0) || (x.ejecutado && x.ejecutado.length > 0));
  }
}
