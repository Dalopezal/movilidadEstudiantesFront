export class BeneficioPostulacionaModel {
  id: number = 0;
  beneficioConvocatoriaId: string = "";
  postulacionId: number = 0;
  estado: boolean = false;
  nombreBeneficio: string = '';

  static fromJSON(json: any): BeneficioPostulacionaModel {
    const model = new BeneficioPostulacionaModel();
    model.id = Number(json.id ?? 0);
    model.beneficioConvocatoriaId = (json.beneficioConvocatoriaId ?? 0);
    model.postulacionId = Number(json.postulacionId ?? 0);
    model.estado = Boolean(json.estado);
    model.nombreBeneficio = json.nombreBeneficio ?? '';
    return model;
  }

  toJSON(): any {
    return {
      id: this.id,
      beneficioConvocatoriaId: this.beneficioConvocatoriaId,
      postulacionId: this.postulacionId,
      estado: this.estado,
      nombreBeneficio: this.nombreBeneficio
    };
  }
}
