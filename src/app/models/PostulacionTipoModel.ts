// src/app/models/postulacion-consulta.model.ts
export class PostulacionTipoConsultaModel {
  idPostulacion: number = 0;
  fechaPostulacion: string = '';
  objetivoPostulacion: string = '';
  fechaInicioMovilidad: string = '';
  fechaFinMovilidad: string = '';
  periodo: number = 0;
  nombreInstitucion: string = '';
  codigoConvenio: string = '';
  nombreTipoMovilidad: string = '';
  idTipoMovilidad: number = 0;
  nombreModalidad: string = '';
  nombreCategoriaMovilidad: string = '';
  fechaInicioConvatoria: string = '';
  fechaFinConvocatoria: string = '';
  nombreModalidadConvocatoria: string = '';
  nombreEstadoPostulacion: string = '';
  idEstadoPostulacion: number = 0;
  documentoPostulado: string = '';
  correoPostulado: string = '';
  nombrePostulado: string = '';
  tipo: string = '';

  static fromJSON(obj: any): PostulacionTipoConsultaModel {
    const model = new PostulacionTipoConsultaModel();
    Object.assign(model, obj);
    return model;
  }

  toJSON(): any {
    return { ...this };
  }
}
