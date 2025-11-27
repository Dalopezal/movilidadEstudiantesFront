export class AsignacionPlanComponenteModel {
  id: number;
  planId: number | null;
  estrategiaId: number | null;
  estadoId: number | null;
  componenteCodigoUCM: string;
  docentetitularId: number | null;
  docenteauxId: number | null;
  nombreComponenteUCM: string;
  planestudioId: number | null;
  programaUCM: string;
  facultadoUCM: string;
  fechacreacion: string | null;
  programaExterno: string | null;
  colaboracion: boolean;
  numerogrupo: number | null;
  fechainicioSemestreUCM: string | null;
  fechafinSemestreUCM: string | null;
  creditosUCM: number | null;
  semestreUCM: number | null;
  facultaExterno: string | null;
  componenteExterno: string | null;
  institucionId: number | null;
  horasInternacionalizacion: number | null;
  institucionNombre: string;
  planTitulo: string;
  estrategiaNombre: string;
  nombreEstado: string;
  tipoEstrategiaNombre: string;

  constructor(
    id?: number,
    planId?: number,
    estrategiaId?: number,
    estadoId?: number,
    componenteCodigoUCM?: string,
    docentetitularId?: number,
    docenteauxId?: number,
    nombreComponenteUCM?: string,
    planestudioId?: number,
    programaUCM?: string,
    facultadoUCM?: string,
    fechacreacion?: string,
    programaExterno?: string,
    colaboracion?: boolean,
    numerogrupo?: number,
    fechainicioSemestreUCM?: string,
    fechafinSemestreUCM?: string,
    creditosUCM?: number,
    semestreUCM?: number,
    facultaExterno?: string,
    componenteExterno?: string,
    institucionId?: number,
    horasInternacionalizacion?: number,
    institucionNombre?: string,
    planTitulo?: string,
    estrategiaNombre?: string,
    nombreEstado?: string,
    tipoEstrategiaNombre?: string
  ) {
    this.id = id ?? 0;
    this.planId = planId ?? null;
    this.estrategiaId = estrategiaId ?? null;
    this.estadoId = estadoId ?? null;
    this.componenteCodigoUCM = componenteCodigoUCM ?? '';
    this.docentetitularId = docentetitularId ?? null;
    this.docenteauxId = docenteauxId ?? null;
    this.nombreComponenteUCM = nombreComponenteUCM ?? '';
    this.planestudioId = planestudioId ?? null;
    this.programaUCM = programaUCM ?? '';
    this.facultadoUCM = facultadoUCM ?? '';
    this.fechacreacion = fechacreacion ?? null;
    this.programaExterno = programaExterno ?? null;
    this.colaboracion = colaboracion ?? false;
    this.numerogrupo = numerogrupo ?? null;
    this.fechainicioSemestreUCM = fechainicioSemestreUCM ?? null;
    this.fechafinSemestreUCM = fechafinSemestreUCM ?? null;
    this.creditosUCM = creditosUCM ?? null;
    this.semestreUCM = semestreUCM ?? null;
    this.facultaExterno = facultaExterno ?? null;
    this.componenteExterno = componenteExterno ?? null;
    this.institucionId = institucionId ?? null;
    this.horasInternacionalizacion = horasInternacionalizacion ?? null;
    this.institucionNombre = institucionNombre ?? '';
    this.planTitulo = planTitulo ?? '';
    this.estrategiaNombre = estrategiaNombre ?? '';
    this.nombreEstado = nombreEstado ?? '';
    this.tipoEstrategiaNombre = tipoEstrategiaNombre ?? '';
  }

  static fromJSON(json: any): AsignacionPlanComponenteModel {
    return new AsignacionPlanComponenteModel(
      Number(json.id ?? 0),
      Number(json.planId ?? json.plan_id ?? 0) || 0,
      Number(json.estrategiaId ?? 0) || 0,
      Number(json.estadoId ?? 0) || 0,
      json.componenteCodigoUCM ?? '',
      Number(json.docentetitularId ?? 0) || 0,
      Number(json.docenteauxId ?? 0) || 0,
      json.nombreComponenteUCM ?? '',
      Number(json.planestudioId ?? 0) || 0,
      json.programaUCM ?? '',
      json.facultadoUCM ?? '',
      json.fechacreacion ?? null,
      json.programaExterno ?? null,
      json.colaboracion === undefined ? false : Boolean(json.colaboracion),
      json.numerogrupo !== undefined ? Number(json.numerogrupo) : 0,
      json.fechainicioSemestreUCM ?? null,
      json.fechafinSemestreUCM ?? null,
      json.creditosUCM !== undefined ? Number(json.creditosUCM) : 0,
      json.semestreUCM !== undefined ? Number(json.semestreUCM) : 0,
      json.facultaExterno ?? null,
      json.componenteExterno ?? null,
      json.institucionId !== undefined ? Number(json.institucionId) : 0,
      json.horasInternacionalizacion !== undefined ? Number(json.horasInternacionalizacion) : 0,
      json.institucionNombre ?? '',
      json.planTitulo ?? '',
      json.estrategiaNombre ?? '',
      json.nombreEstado ?? '',
      json.tipoEstrategiaNombre ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      planId: this.planId,
      estrategiaId: this.estrategiaId,
      estadoId: this.estadoId,
      componenteCodigoUCM: this.componenteCodigoUCM,
      docentetitularId: this.docentetitularId,
      docenteauxId: this.docenteauxId,
      nombreComponenteUCM: this.nombreComponenteUCM,
      planestudioId: this.planestudioId,
      programaUCM: this.programaUCM,
      facultadoUCM: this.facultadoUCM,
      fechacreacion: this.fechacreacion,
      programaExterno: this.programaExterno,
      colaboracion: this.colaboracion,
      numerogrupo: this.numerogrupo,
      fechainicioSemestreUCM: this.fechainicioSemestreUCM,
      fechafinSemestreUCM: this.fechafinSemestreUCM,
      creditosUCM: this.creditosUCM,
      semestreUCM: this.semestreUCM,
      facultaExterno: this.facultaExterno,
      componenteExterno: this.componenteExterno,
      institucionId: this.institucionId,
      horasInternacionalizacion: this.horasInternacionalizacion,
      institucionNombre: this.institucionNombre,
      planTitulo: this.planTitulo,
      estrategiaNombre: this.estrategiaNombre,
      nombreEstado: this.nombreEstado,
      tipoEstrategiaNombre: this.tipoEstrategiaNombre
    };
  }
}
