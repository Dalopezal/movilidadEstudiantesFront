export class FinanciacionModel {
  id: number = 0;
  postulacionId: number = 0;
  arl: number = 0;
  comisionServicios: number = 0;
  descuentoMatricula: number = 0;
  valorApoyoAlojamiento: number = 0;
  valorApoyoEconomico: number = 0;
  valorOtros: number = 0;
  valorCompraTiquetes: number = 0;
  tipoFinanciacionExternaId: number = 0;
  tipoFinanciacionId: number = 0;
  nombreTipoFinanciacionExterna: string = '';
  nombreTipoFinanciacion: string = '';
  nombrePostulacion: string = '';

  static fromJSON(json: any): FinanciacionModel {
    const model = new FinanciacionModel();
    model.id = Number(json.id ?? 0);
    model.postulacionId = Number(json.postulacionId ?? 0);
    model.arl = Number(json.arl ?? 0);
    model.comisionServicios = Number(json.comisionServicios ?? 0);
    model.descuentoMatricula = Number(json.descuentoMatricula ?? 0);
    model.valorApoyoAlojamiento = Number(json.valorApoyoAlojamiento ?? 0);
    model.valorApoyoEconomico = Number(json.valorApoyoEconomico ?? 0);
    model.valorOtros = Number(json.valorOtros ?? 0);
    model.valorCompraTiquetes = Number(json.valorCompraTiquetes ?? 0);
    model.tipoFinanciacionExternaId = Number(json.tipoFinanciacionExternaId ?? 0);
    model.tipoFinanciacionId = Number(json.tipoFinanciacionId ?? 0);
    model.nombreTipoFinanciacionExterna = json.nombreTipoFinanciacionExterna ?? '';
    model.nombreTipoFinanciacion = json.nombreTipoFinanciacion ?? '';
    model.nombrePostulacion = json.nombrePostulacion ?? '';
    return model;
  }

  toJSON(): any {
    return {
      id: this.id,
      postulacionId: this.postulacionId,
      arl: this.arl,
      comisionServicios: this.comisionServicios,
      descuentoMatricula: this.descuentoMatricula,
      valorApoyoAlojamiento: this.valorApoyoAlojamiento,
      valorApoyoEconomico: this.valorApoyoEconomico,
      valorOtros: this.valorOtros,
      valorCompraTiquetes: this.valorCompraTiquetes,
      tipoFinanciacionExternaId: this.tipoFinanciacionExternaId,
      tipoFinanciacionId: this.tipoFinanciacionId,
      nombreTipoFinanciacionExterna: this.nombreTipoFinanciacionExterna,
      nombreTipoFinanciacion: this.nombreTipoFinanciacion,
      nombrePostulacion: this.nombrePostulacion
    };
  }
}
