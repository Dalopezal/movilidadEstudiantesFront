export class PlanModel {
  id: number;
  titulo: string;
  esActiva: boolean;
  objetivosDesarrollo: string;
  idioma: string;
  resultadosAprendizaje: string;
  desempeno: string;
  comentarios: string;
  aproboPlan: boolean;

  constructor();
  constructor(
    id?: number,
    titulo?: string,
    esActiva?: boolean,
    objetivosDesarrollo?: string,
    idioma?: string,
    resultadosAprendizaje?: string,
    desempeno?: string,
    comentarios?: string,
    aproboPlan?: boolean
  );
  constructor(
    id?: number,
    titulo?: string,
    esActiva?: boolean,
    objetivosDesarrollo?: string,
    idioma?: string,
    resultadosAprendizaje?: string,
    desempeno?: string,
    comentarios?: string,
    aproboPlan?: boolean
  ) {
    this.id = id ?? 0;
    this.titulo = titulo ?? '';
    this.esActiva = esActiva ?? false;
    this.objetivosDesarrollo = objetivosDesarrollo ?? '';
    this.idioma = idioma ?? '';
    this.resultadosAprendizaje = resultadosAprendizaje ?? '';
    this.desempeno = desempeno ?? '';
    this.comentarios = comentarios ?? '';
    this.aproboPlan = aproboPlan ?? false;
  }

  static fromJSON(json: any): PlanModel {
    return new PlanModel(
      Number(json.id ?? 0),
      json.titulo ?? '',
      json.esActiva === undefined ? false : Boolean(json.esActiva),
      json.objetivosDesarrollo ?? '',
      json.idioma ?? '',
      json.resultadosAprendizaje ?? '',
      json.desempeno ?? '',
      json.comentarios ?? '',
      json.aproboPlan === undefined ? false : Boolean(json.aproboPlan)
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      titulo: this.titulo,
      esActiva: this.esActiva,
      objetivosDesarrollo: this.objetivosDesarrollo,
      idioma: this.idioma,
      resultadosAprendizaje: this.resultadosAprendizaje,
      desempeno: this.desempeno,
      comentarios: this.comentarios,
      aproboPlan: this.aproboPlan
    };
  }
}
