export class TrayectoriaModel {
  id?: number;
  usuarioid: number;
  componenteCodigo: string;
  estrategiaid: number;
  periodo: number;
  fecha: string;
  area_formacion: string;
  totalcreditosprograma: number;
  creditosComponente: number;
  componenteNombre: string;
  programa: string;
  planestudioid: number;
  plaFacultad: string;
  semestre?: number | null;

  constructor(
    id?: number,
    usuarioid: number = 1,
    componenteCodigo: string = '',
    estrategiaid: number = 0,
    periodo: number = 0,
    fecha: string = '',
    area_formacion: string = '',
    totalcreditosprograma: number = 0,
    creditosComponente: number = 0,
    componenteNombre: string = '',
    programa: string = '',
    planestudioid: number = 0,
    plaFacultad: string = '',
    semestre: number | null = null
  ) {
    this.id = id;
    this.usuarioid = usuarioid;
    this.componenteCodigo = componenteCodigo;
    this.estrategiaid = estrategiaid;
    this.periodo = periodo;
    this.fecha = fecha;
    this.area_formacion = area_formacion;
    this.totalcreditosprograma = totalcreditosprograma;
    this.creditosComponente = creditosComponente;
    this.componenteNombre = componenteNombre;
    this.programa = programa;
    this.planestudioid = planestudioid;
    this.plaFacultad = plaFacultad;
    this.semestre = semestre;
  }

  static fromJSON(json: any): TrayectoriaModel {
    return new TrayectoriaModel(
      json.id,
      json.usuarioid ?? 1,
      json.componenteCodigo ?? json.componente_codigo ?? '',
      Number(json.estrategiaid ?? 0),
      Number(json.periodo ?? 0),
      json.fecha ?? '',
      json.area_formacion ?? json.area_formacion ?? '',
      Number(json.totalcreditosprograma ?? json.total_creditos ?? 0),
      Number(json.creditosComponente ?? json.creditos_componente ?? 0),
      json.componenteNombre ?? json.componente_nombre ?? '',
      json.programa ?? '',
      Number(json.planestudioid ?? json.plan_id ?? 0),
      json.plaFacultad ?? json.pla_facultad ?? '',
      // semestre puede venir como 'semestre' o 'semestre_ucm'
      json.semestre !== undefined && json.semestre !== null
        ? Number(json.semestre)
        : (json.semestre_ucm !== undefined && json.semestre_ucm !== null ? Number(json.semestre_ucm) : null)
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      usuarioid: this.usuarioid,
      componenteCodigo: this.componenteCodigo,
      estrategiaid: this.estrategiaid,
      periodo: this.periodo,
      fecha: this.fecha,
      area_formacion: this.area_formacion,
      totalcreditosprograma: this.totalcreditosprograma,
      creditosComponente: this.creditosComponente,
      componenteNombre: this.componenteNombre,
      programa: this.programa,
      planestudioid: this.planestudioid,
      plaFacultad: this.plaFacultad,
      semestre: this.semestre
    };
  }
}
