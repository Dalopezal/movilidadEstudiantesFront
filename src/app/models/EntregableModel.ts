export class EntregableModel {
  id: number;
  nombre: string;
  descripcion: string;
  convocatoriaId: number;
  nombreConvocatoria?: string;

  constructor();
  constructor(id?: number, nombre?: string, descripcion?: string, convocatoriaId?: number, nombreConvocatoria?: string, completo?: boolean);
  constructor(id?: number, nombre?: string, descripcion?: string, convocatoriaId?: number, nombreConvocatoria?: string, completo?: boolean) {
    this.id = id ?? 0;
    this.nombre = nombre ?? '';
    this.descripcion = descripcion ?? '';
    this.convocatoriaId = convocatoriaId ?? 0;
    this.nombreConvocatoria = nombreConvocatoria ?? '';
  }

  static fromJSON(json: any): EntregableModel {
    return new EntregableModel(
      Number(json.id ?? 0),
      json.nombre ?? '',
      json.descripcion ?? '',
      Number(json.convocatoriaId ?? json.convocatoriaId ?? 0),
      json.nombreConvocatoria ?? json.nombreConvocatoria ?? '',
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      convocatoriaId: this.convocatoriaId
    };
  }
}
