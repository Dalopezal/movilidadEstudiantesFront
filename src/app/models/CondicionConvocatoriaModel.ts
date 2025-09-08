export class CondicionConvocatoriaModel {
  id: number;
  condicionId: string;
  convocatoriaId: string;
  nombreCondicion?: string;
  nombreConvocatoria?: string;

  constructor();
  constructor(id?: number, condicionId?: string, convocatoriaId?: string, nombreCondicion?: string, nombreConvocatoria?: string);
  constructor(id?: number, condicionId?: string, convocatoriaId?: string, nombreCondicion?: string, nombreConvocatoria?: string) {
    this.id = id ?? 0;
    this.condicionId = condicionId ?? '';
    this.convocatoriaId = convocatoriaId ?? '';
    this.nombreCondicion = nombreCondicion ?? '';
    this.nombreConvocatoria = nombreConvocatoria ?? '';
  }

  static fromJSON(json: any): CondicionConvocatoriaModel {
    return new CondicionConvocatoriaModel(
      Number(json.id ?? 0),
      json.condicionId ?? json.condicion?.id ?? '',
      json.convocatoriaId ?? json.convocatoria?.id ?? '',
      json.nombreCondicion ?? json.condicion?.nombre ?? '',
      json.nombreConvocatoria ?? json.convocatoria?.nombre ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      condicionId: this.condicionId,
      convocatoriaId: this.convocatoriaId
    };
  }
}
