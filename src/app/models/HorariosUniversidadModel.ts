export class HorariosUniversidadModel {
  id: number;
  fechaNoLaboral: string;
  observacion: string;

  constructor(
    id?: number,
    fechaNoLaboral?: string,
    observacion?: string
  ) {
    this.id = id ?? 0;
    this.fechaNoLaboral = fechaNoLaboral ?? '';
    this.observacion = observacion ?? '';
  }

  static fromJSON(json: any): HorariosUniversidadModel {
    return new HorariosUniversidadModel(
      Number(json.id ?? 0),
      json.fechaNoLaboral ?? '',
      json.observacion ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      fechaNoLaboral: this.fechaNoLaboral,
      observacion: this.observacion
    };
  }
}
