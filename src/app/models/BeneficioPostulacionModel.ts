export class BeneficioPostulacionaModel {
  id: number = 0;
  beneficioConvocatoriaId: number = 0;
  postulacionId: number = 0;
  estado: boolean = false;
  nombreBeneficioConvocatoria: string = '';

  static fromJSON(json: any): BeneficioPostulacionaModel {
    const model = new BeneficioPostulacionaModel();

    model.id = Number(json.id ?? 0);
    model.beneficioConvocatoriaId = Number(
      json.beneficioConvocatoriaId ?? 0,
    );
    model.postulacionId = Number(json.postulacionId ?? 0);
    model.estado = Boolean(json.estado);
    model.nombreBeneficioConvocatoria =
      json.nombreBeneficioConvocatoria ?? '';

    return model;
  }

  toJSON(): any {
    return {
      id: this.id,
      beneficioConvocatoriaId: this.beneficioConvocatoriaId,
      postulacionId: this.postulacionId,
      estado: this.estado,
      nombreBeneficioConvocatoria: this.nombreBeneficioConvocatoria,
    };
  }
}
