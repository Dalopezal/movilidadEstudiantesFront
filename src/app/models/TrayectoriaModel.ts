export class TrayectoriaModel {
  id?: number;

  usuarioid: number;
  componenteCodigo: string;
  estrategiaid: number;
  periodo: number;
  fecha: string;
  areaformacion: string;
  totalcreditosprograma: number;
  componenteNombre: string;
  programa: string;
  planestudioid: number;
  plaFacultad: string;

  constructor() {
    this.usuarioid = 0;
    this.componenteCodigo = '';
    this.estrategiaid = 0;
    this.periodo = 0;
    this.fecha = '';
    this.areaformacion = '';
    this.totalcreditosprograma = 0;
    this.componenteNombre = '';
    this.programa = '';
    this.planestudioid = 0;
    this.plaFacultad = '';
  }

  static fromJSON(json: any): TrayectoriaModel {
    const m = new TrayectoriaModel();
    m.id = json.id ?? json.Id ?? undefined;

    m.usuarioid = json.usuarioid ?? json.usuarioId ?? 0;
    m.componenteCodigo = json.componenteCodigo ?? json.ComponenteCodigo ?? '';
    m.estrategiaid = json.estrategiaid ?? json.EstrategiaId ?? 0;
    m.periodo = json.periodo ?? json.Periodo ?? 0;
    m.fecha = json.fecha ?? json.Fecha ?? '';
    m.areaformacion = json.areaformacion ?? json.AreaFormacion ?? '';
    m.totalcreditosprograma = json.totalcreditosprograma ?? json.TotalCreditosPrograma ?? 0;
    m.componenteNombre = json.componenteNombre ?? json.ComponenteNombre ?? '';
    m.programa = json.programa ?? json.Programa ?? '';
    m.planestudioid = json.planestudioid ?? json.PlanEstudioId ?? 0;
    m.plaFacultad = json.plaFacultad ?? json.PlaFacultad ?? '';

    return m;
  }
}
