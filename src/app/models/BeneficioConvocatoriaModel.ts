export class BeneficioConvocatoriaModel {
  id: number;
  descripcion: string;
  convocatoriaId: number;
  nombreBeneficio: string;
  nombreConvocatoria: string;

  // Constructor vacío
  constructor();
  // Constructor con parámetros
  constructor(
    id: number,
    descripcion: string,
    convocatoriaId: number,
    nombreBeneficio: string,
    nombreConvocatoria: string
  );
  // Implementación del constructor
  constructor(
    id?: number,
    descripcion?: string,
    convocatoriaId?: number,
    nombreBeneficio?: string,
    nombreConvocatoria?: string
  ) {
    this.id = id ?? 0;
    this.descripcion = descripcion ?? '';
    this.convocatoriaId = convocatoriaId ?? 0;
    this.nombreBeneficio = nombreBeneficio ?? '';
    this.nombreConvocatoria = nombreConvocatoria ?? '';
  }

  static fromJSON(json: any): BeneficioConvocatoriaModel {
    return new BeneficioConvocatoriaModel(
      Number(json.id),
      json.descripcion ?? '',
      Number(json.convocatoriaId),
      json.nombreBeneficio ?? '',
      json.nombreConvocatoria ?? ''
    );
  }

  toJSON(): any {
    return {
      descripcion: this.descripcion,
      convocatoriaId: this.convocatoriaId,
      nombreBeneficio: this.nombreBeneficio,
    };
  }
}
