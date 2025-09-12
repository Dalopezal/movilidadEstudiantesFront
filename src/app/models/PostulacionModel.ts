// src/app/models/postulacion.model.ts
export class PostulacionModel {
  id: number = 0;
  usuarioId: number = 0;
  convocatoriaId: number = 0;
  estadoPostulacionId: number = 0;
  objetivo: string = '';
  fechaInicioMovilidad: string = '';
  fechaFinMovilidad: string = '';
  periodo: number = 0;
  institucionId: number = 0;
  convenioId: number = 0;
  observaciones: string = '';
  fechaEntregable: string = '';
  tipoMovilidadId: number = 0;
  asistioEntrevista: boolean = false;
  financiacioUcm: boolean = false;
  financiacionExterna: boolean = false;
  registradoSire: boolean = false;
  realizoEncuestaSatisfaccion: boolean = false;
  urlEncuestaSatisfaccion: string = '';
  certificadoMovilidad: boolean = false;
  esMatriculadoSiiga: boolean = false;
  esNotificadoRegistroAcademico: boolean = false;
  motivoRechazo: string = '';
  esNotificadoCorreo: boolean = false;
  requiereVisa: boolean = false;

  static fromJSON(obj: any): PostulacionModel {
    const model = new PostulacionModel();
    Object.assign(model, obj);
    return model;
  }

  toJSON(): any {
    return { ...this };
  }
}
