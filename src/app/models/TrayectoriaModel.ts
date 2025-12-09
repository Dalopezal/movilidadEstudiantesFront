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

  constructor(
    id?: number,
    usuarioid: number = 1,
    componenteCodigo: string = '',
    estrategiaid: number = 0,
    periodo: number = 0,
    fecha: string = '',
    areaformacion: string = '',
    totalcreditosprograma: number = 0,
    componenteNombre: string = '',
    programa: string = '',
    planestudioid: number = 0,
    plaFacultad: string = ''
  ) {
    this.id = id;
    this.usuarioid = usuarioid;
    this.componenteCodigo = componenteCodigo;
    this.estrategiaid = estrategiaid;
    this.periodo = periodo;
    this.fecha = fecha;
    this.areaformacion = areaformacion;
    this.totalcreditosprograma = totalcreditosprograma;
    this.componenteNombre = componenteNombre;
    this.programa = programa;
    this.planestudioid = planestudioid;
    this.plaFacultad = plaFacultad;
  }

  static fromJSON(json: any): TrayectoriaModel {
    return new TrayectoriaModel(
      json.id,
      json.usuarioid ?? 1,
      json.componenteCodigo ?? '',
      Number(json.estrategiaid ?? 0),
      Number(json.periodo ?? 0),
      json.fecha ?? '',
      json.areaformacion ?? '',
      Number(json.totalcreditosprograma ?? 0),
      json.componenteNombre ?? '',
      json.programa ?? '',
      Number(json.planestudioid ?? 0),
      json.plaFacultad ?? ''
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
      areaformacion: this.areaformacion,
      totalcreditosprograma: this.totalcreditosprograma,
      componenteNombre: this.componenteNombre,
      programa: this.programa,
      planestudioid: this.planestudioid,
      plaFacultad: this.plaFacultad
    };
  }
}
