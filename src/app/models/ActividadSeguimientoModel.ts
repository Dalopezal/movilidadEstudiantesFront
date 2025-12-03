export class ActividadSeguimientoModel {
  id: number;
  fechainicio: string | null;
  fechafin: string | null;
  asignacionComponenteId: number | null;
  evaluacion: number | null;
  descripcion: string;
  herramientas: string;
  planId: number | null;
  estrategiaId: number | null;
  institucionId: number | null;
  programaUCM: string | null;
  componenteCodigoUCM: string | null;
  nombreComponenteUCM: string | null;
  institucionNombre: string | null;
  planTitulo: string | null;

  constructor();
  constructor(
    id?: number,
    fechainicio?: string | null,
    fechafin?: string | null,
    asignacionComponenteId?: number | null,
    evaluacion?: number | null,
    descripcion?: string,
    herramientas?: string,
    planId?: number | null,
    estrategiaId?: number | null,
    institucionId?: number | null,
    programaUCM?: string | null,
    componenteCodigoUCM?: string | null,
    nombreComponenteUCM?: string | null,
    institucionNombre?: string | null,
    planTitulo?: string | null
  );
  constructor(
    id?: number,
    fechainicio?: string | null,
    fechafin?: string | null,
    asignacionComponenteId?: number | null,
    evaluacion?: number | null,
    descripcion?: string,
    herramientas?: string,
    planId?: number | null,
    estrategiaId?: number | null,
    institucionId?: number | null,
    programaUCM?: string | null,
    componenteCodigoUCM?: string | null,
    nombreComponenteUCM?: string | null,
    institucionNombre?: string | null,
    planTitulo?: string | null
  ) {
    this.id = id ?? 0;
    this.fechainicio = fechainicio ?? null;
    this.fechafin = fechafin ?? null;
    this.asignacionComponenteId = asignacionComponenteId ?? null;
    this.evaluacion = evaluacion ?? null;
    this.descripcion = descripcion ?? '';
    this.herramientas = herramientas ?? '';
    this.planId = planId ?? null;
    this.estrategiaId = estrategiaId ?? null;
    this.institucionId = institucionId ?? null;
    this.programaUCM = programaUCM ?? null;
    this.componenteCodigoUCM = componenteCodigoUCM ?? null;
    this.nombreComponenteUCM = nombreComponenteUCM ?? null;
    this.institucionNombre = institucionNombre ?? null;
    this.planTitulo = planTitulo ?? null;
  }

  static fromJSON(json: any): ActividadSeguimientoModel {
    if (!json) {
      return new ActividadSeguimientoModel();
    }

    return new ActividadSeguimientoModel(
      Number(json.id ?? 0),
      json.fechainicio ?? null,
      json.fechafin ?? null,
      json.asignacionComponenteId !== undefined
        ? Number(json.asignacionComponenteId)
        : null,
      json.evaluacion !== undefined ? Number(json.evaluacion) : null,
      json.descripcion ?? '',
      json.herramientas ?? '',
      json.planId !== undefined ? Number(json.planId) : null,
      json.estrategiaId !== undefined ? Number(json.estrategiaId) : null,
      json.institucionId !== undefined ? Number(json.institucionId) : null,
      json.programaUCM ?? null,
      json.componenteCodigoUCM ?? null,
      json.nombreComponenteUCM ?? null,
      json.institucionNombre ?? null,
      json.planTitulo ?? null
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      fechainicio: this.fechainicio,
      fechafin: this.fechafin,
      asignacionComponenteId: this.asignacionComponenteId,
      evaluacion: this.evaluacion,
      descripcion: this.descripcion,
      herramientas: this.herramientas,
      planId: this.planId,
      estrategiaId: this.estrategiaId,
      institucionId: this.institucionId,
      programaUCM: this.programaUCM,
      componenteCodigoUCM: this.componenteCodigoUCM,
      nombreComponenteUCM: this.nombreComponenteUCM,
      institucionNombre: this.institucionNombre,
      planTitulo: this.planTitulo
    };
  }
}
