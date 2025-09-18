export class ConvocatoriaModel {
  id: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaCierre: string;
  requisitos: string;
  esActiva: boolean;
  categoriaMovilidadId: string;
  modalidadId: string;
  categoriaMovilidadNombre: string;
  movilidadNombre: string;

  constructor(
    id: number = 0,
    nombre: string = '',
    descripcion: string = '',
    fechaInicio: string = '',
    fechaCierre: string = '',
    requisitos: string = '',
    esActiva: boolean = false,
    categoriaMovilidadId: string = '',
    modalidadId: string = '',
    categoriaMovilidadNombre: string = '',
    movilidadNombre: string = ''
  ) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.fechaInicio = fechaInicio;
    this.fechaCierre = fechaCierre;
    this.requisitos = requisitos;
    this.esActiva = esActiva;
    this.categoriaMovilidadId = categoriaMovilidadId;
    this.modalidadId = modalidadId;
    this.categoriaMovilidadNombre = categoriaMovilidadNombre;
    this.movilidadNombre = movilidadNombre;
  }

  static fromJSON(json: any): ConvocatoriaModel {
    return new ConvocatoriaModel(
      Number(json?.id) || 0,
      json?.nombre ?? '',
      json?.descripcion ?? '',
      json?.fechaInicio ?? '',
      json?.fechaCierre ?? '',
      json?.requisitos ?? '',
      Boolean(json?.esActiva),
      (json?.categoriaMovilidadId) || 0,
      (json?.modalidadId) || 0,
      json?.categoriaMovilidadNombre ?? '',
      json?.movilidadNombre ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      fechaInicio: this.fechaInicio,
      fechaCierre: this.fechaCierre,
      requisitos: this.requisitos,
      esActiva: this.esActiva,
      categoriaMovilidadId: this.categoriaMovilidadId,
      modalidadId: this.modalidadId,
      categoriaMovilidadNombre: this.categoriaMovilidadNombre,
      movilidadNombre: this.movilidadNombre
    };
  }
}
