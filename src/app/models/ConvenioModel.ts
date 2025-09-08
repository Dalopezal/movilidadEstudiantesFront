export class ConvenioModel {
  id: number;
  nombre: string;
  fechaInicio: string; // ISO date string 'YYYY-MM-DD'
  fechaFin: string;
  tipoConvenioId: number;
  clasificacionId: number;
  tipoActividadId: number;
  diasVigencia: number;
  esObligatoria: boolean;

  // optional display fields
  nombreTipoConvenio?: string;
  nombreClasificacion?: string;
  nombreTipoActividad?: string;

  constructor();
  constructor(
    id?: number,
    nombre?: string,
    fechaInicio?: string,
    fechaFin?: string,
    tipoConvenioId?: number,
    clasificacionId?: number,
    tipoActividadId?: number,
    diasVigencia?: number,
    esObligatoria?: boolean
  );
  constructor(
    id?: number,
    nombre?: string,
    fechaInicio?: string,
    fechaFin?: string,
    tipoConvenioId?: number,
    clasificacionId?: number,
    tipoActividadId?: number,
    diasVigencia?: number,
    esObligatoria?: boolean
  ) {
    this.id = id ?? 0;
    this.nombre = nombre ?? '';
    this.fechaInicio = fechaInicio ?? '';
    this.fechaFin = fechaFin ?? '';
    this.tipoConvenioId = tipoConvenioId ?? 0;
    this.clasificacionId = clasificacionId ?? 0;
    this.tipoActividadId = tipoActividadId ?? 0;
    this.diasVigencia = diasVigencia ?? 0;
    this.esObligatoria = esObligatoria ?? false;
  }

  static fromJSON(json: any): ConvenioModel {
    return new ConvenioModel(
      Number(json.id ?? 0),
      json.nombre ?? '',
      json.fechaInicio ?? json.fecha_inicio ?? '',
      json.fechaFin ?? json.fecha_fin ?? '',
      Number(json.tipoConvenioId ?? json.tipoConvenio?.id ?? 0),
      Number(json.clasificacionId ?? json.clasificacion?.id ?? 0),
      Number(json.tipoActividadId ?? json.tipoActividad?.id ?? 0),
      Number(json.diasVigencia ?? json.dias_vigencia ?? 0),
      json.esObligatoria === undefined ? false : Boolean(json.esObligatoria)
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      tipoConvenioId: this.tipoConvenioId,
      clasificacionId: this.clasificacionId,
      tipoActividadId: this.tipoActividadId,
      diasVigencia: this.diasVigencia,
      esObligatoria: this.esObligatoria
    };
  }
}
