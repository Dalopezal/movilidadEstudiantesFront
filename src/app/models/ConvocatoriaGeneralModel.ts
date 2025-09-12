// src/app/models/ConvocatoriaGeneralModel.ts
export class ConvocatoriaGeneralModel {
  id?: number;
  nombre: string = '';
  descripcion: string = '';
  fechaInicio: string = '';
  fechaCierre: string = '';
  requisitos: string = '';
  esActiva: boolean = false;
  categoriaMovilidadId: number | null = null;
  modalidadId: number | null = null;
  categoriaMovilidadNombre?: string;
  movilidadNombre?: string;

  constructor(init?: Partial<ConvocatoriaGeneralModel>) {
    Object.assign(this, init);
  }

  static fromJSON(json: any): ConvocatoriaGeneralModel {
    return new ConvocatoriaGeneralModel({
      id: json.id,
      nombre: json.nombre,
      descripcion: json.descripcion,
      fechaInicio: json.fechaInicio,
      fechaCierre: json.fechaCierre,
      requisitos: json.requisitos,
      esActiva: json.esActiva,
      categoriaMovilidadId: json.categoriaMovilidadId,
      modalidadId: json.modalidadId,
      categoriaMovilidadNombre: json.categoriaMovilidadNombre,
      movilidadNombre: json.movilidadNombre,
    });
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaInicio: this.fechaInicio,
      fechaCierre: this.fechaCierre,
      requisitos: this.requisitos,
      esActiva: this.esActiva,
      categoriaMovilidadId: this.categoriaMovilidadId,
      modalidadId: this.modalidadId
    };
  }
}
