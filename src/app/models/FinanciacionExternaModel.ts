// src/app/models/postulacion.model.ts
export class FinanciacionExternaModel {
  id: number = 0;
  nombre: string = "";
  estado: boolean = false;

  static fromJSON(obj: any): FinanciacionExternaModel {
    const model = new FinanciacionExternaModel();
    Object.assign(model, obj);
    return model;
  }

  toJSON(): any {
    return { ...this };
  }
}
