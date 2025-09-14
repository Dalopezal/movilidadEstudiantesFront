// src/app/models/postulacion-consulta.model.ts
export class PostulacionTipoConsultaModel {
  id: number = 0;
  usuarioId: number = 0;
  convocatoriaId: number = 0;
  estadoPostulacionId: number = 0;
  fechaPostulacion: string = '';
  objetivo: string = '';
  fechaInicioMovilidad: string = '';
  fechaFinMovilidad: string = '';
  periodo: number = 0;
  institucionId: number = 0;
  convenioId: number = 0;
  observaciones: string = '';
  fechaEntregable: string = '';
  postRolActivo: number = 0;
  tipoMovilidadId: number = 0;
  programaAdademico: string | null = null;
  nivelFormacion: string | null = null;
  facultadNombre: string | null = null;
  grupoInvestigacionNombre: string | null = null;
  dependenciaNombre: string | null = null;
  asistioEntrevista: boolean | null = null;
  financiacioUcm: boolean | null = null;
  financiacionExterna: boolean | null = null;
  registradoSire: boolean | null = null;
  realizoEncuestaSatisfaccion: boolean | null = null;
  urlEncuestaSatisfaccion: string | null = null;
  certificadoMovilidad: string | null = null;
  esMatriculadoSiiga: boolean | null = null;
  esNotificadoRegistroAcademico: boolean | null = null;
  motivoRechazo: string | null = null;
  esNotificadoCorreo: boolean | null = null;
  requiereVisa: boolean | null = null;
  promedioAcademico: number | null = null;

  // Campos adicionales amigables para mostrar en UI
  nombreCompleto: string = '';
  nombreEstado: string = '';
  nombreInstitucion: string = '';
  codigoUcm: string = '';
  nombreTipoMovilidad: string = '';
  nombreConvocatoria: string = '';

  static fromJSON(obj: any): PostulacionTipoConsultaModel {
    const model = new PostulacionTipoConsultaModel();
    Object.assign(model, obj);
    return model;
  }

  toJSON(): any {
    return { ...this };
  }
}
