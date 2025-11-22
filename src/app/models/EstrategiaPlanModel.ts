export class EstrategiaPlanModel {
  id?: number;
  nombre: string = '';
  reqDocenteAdicional: boolean = false;
  reqValidaSegIdioma: boolean = false;
  tieneinsignea: boolean = false;
  insigniaId?: number;
  reqValEstudiante: boolean = false;
  tipoestrategiaId?: number;
  reqGeneraCertificado: boolean = false;
  tipoEstrategiaNombre?: string;
  insigniaNombre?: string;

  static fromJSON(json: any): EstrategiaPlanModel {
    const model = new EstrategiaPlanModel();
    model.id = json.id;
    model.nombre = json.nombre || '';
    model.reqDocenteAdicional = !!json.reqDocenteAdicional;
    model.reqValidaSegIdioma = !!json.reqValidaSegIdioma;
    model.tieneinsignea = !!json.tieneinsignea;
    model.insigniaId = json.insigniaId;
    model.reqValEstudiante = !!json.reqValEstudiante;
    model.tipoestrategiaId = json.tipoestrategiaId;
    model.reqGeneraCertificado = !!json.reqGeneraCertificado;
    model.tipoEstrategiaNombre = json.tipoEstrategiaNombre;
    model.insigniaNombre = json.insigniaNombre;
    return model;
  }
}
