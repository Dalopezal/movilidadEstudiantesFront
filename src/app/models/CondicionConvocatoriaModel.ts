export class CondicionConvocatoriaModel {
  id: number;
  condicionesId: number;
  convocatoriaId: number;
  nombreCondicion?: string;
  nombreConvocatoria?: string;

  constructor(id: number = 0, condicionesId: number = 0, convocatoriaId: number = 0, nombreCondicion: string = '', nombreConvocatoria: string = '') {
    this.id = id;
    this.condicionesId = condicionesId;
    this.convocatoriaId = convocatoriaId;
    this.nombreCondicion = nombreCondicion;
    this.nombreConvocatoria = nombreConvocatoria;
  }

  static fromJSON(json: any): CondicionConvocatoriaModel {
    return new CondicionConvocatoriaModel(
      Number(json.id ?? 0),
      Number(json.condicionesId ?? json.condicion?.id ?? 0),
      Number(json.convocatoriaId ?? json.convocatoria?.id ?? 0),
      String(json.nombreCondicion ?? json.condicion?.nombre ?? ''),
      String(json.nombreConvocatoria ?? json.convocatoria?.nombre ?? '')
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      condicionesId: this.condicionesId,
      convocatoriaId: this.convocatoriaId
    };
  }
}
