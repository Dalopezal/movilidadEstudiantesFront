export class HorariosUniversidadModel {
  id: number;
  fechaNoLaboral: string;
  componenteId: number;
  nombreComponente: string;

  constructor(
    id?: number,
    fechaNoLaboral?: string,
    componenteId?: number,
    nombreComponente?: string
  ) {
    this.id = id ?? 0;
    this.fechaNoLaboral = fechaNoLaboral ?? '';
    this.componenteId = componenteId ?? 0;
    this.nombreComponente = nombreComponente ?? '';
  }

  static fromJSON(json: any): HorariosUniversidadModel {
    return new HorariosUniversidadModel(
      Number(json.id ?? 0),
      json.fechaNoLaboral ?? '',
      Number(json.componenteId ?? 0),
      json.nombreComponente ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      fechaNoLaboral: this.fechaNoLaboral,
      componenteId: this.componenteId,
      nombreComponente: this.nombreComponente
    };
  }
}
