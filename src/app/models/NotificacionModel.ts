export class NotificacionModel {
  id: number = 0;
  nombre: string = "";
  fechaenvio: string = "";
  asunto: string = "";
  postulacionId: number = 0;

  static fromJSON(obj: any): NotificacionModel {
    const model = new NotificacionModel();
    Object.assign(model, obj);
    return model;
  }

  toJSON(): any {
    return { ...this };
  }
}
