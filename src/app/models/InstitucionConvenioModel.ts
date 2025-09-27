export class InstitucionConvenioModel {
  id: number;
  institucionId: string;
  convenioId: string;
  codigoUcm?: string;
  institucionNombre?: string;

  constructor(id: number = 0, institucionId: string = '', convenioId: string = '', codigoUcm: string = '', institucionNombre: string = '') {
    this.id = id;
    this.institucionId = institucionId;
    this.convenioId = convenioId;
    this.codigoUcm = codigoUcm;
    this.institucionNombre = institucionNombre;
  }

  static fromJSON(json: any): InstitucionConvenioModel {
    return new InstitucionConvenioModel(
      Number(json.id ?? 0),
      (json.institucionId ?? json.condicion?.id ?? 0),
      (json.convenioId ?? json.convocatoria?.id ?? 0),
      String(json.codigoUcm ?? json.condicion?.nombre ?? ''),
      String(json.institucionNombre ?? json.convocatoria?.nombre ?? '')
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      institucionId: this.institucionId,
      convenioId: this.convenioId
    };
  }
}
