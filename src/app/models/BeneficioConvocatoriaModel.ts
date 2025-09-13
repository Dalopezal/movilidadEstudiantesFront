export class BeneficioConvocatoriaModel {
  id: number;
  descripcion: string;
  convocatoriaId: string;
  nombreBeneficio: string;
  nombreConvocatoria: string;

  constructor();
  constructor(
    id: number,
    descripcion: string,
    convocatoriaId: string,
    nombreBeneficio: string,
    nombreConvocatoria: string
  );

  constructor(
    id?: number,
    descripcion?: string,
    convocatoriaId?: string,
    nombreBeneficio?: string,
    nombreConvocatoria?: string
  ) {
    this.id = id ?? 0;
    this.descripcion = descripcion ?? '';
    this.convocatoriaId = convocatoriaId ?? '';
    this.nombreBeneficio = nombreBeneficio ?? '';
    this.nombreConvocatoria = nombreConvocatoria ?? '';
  }

  static fromJSON(json: any): BeneficioConvocatoriaModel {
    return new BeneficioConvocatoriaModel(
      Number(json.id),
      json.descripcion ?? '',
      (json.convocatoriaId),
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
