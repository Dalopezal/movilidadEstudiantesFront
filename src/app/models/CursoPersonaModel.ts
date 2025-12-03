export class CursoPersonaModel {
  usuarioId: number;
  cursoId: number;
  periodo: number;
  fechainicio: string;
  fechafinal: string;
  costocurso: number;

  constructor() {
    this.usuarioId = 0;
    this.cursoId = 0;
    this.periodo = 0;
    this.fechainicio = '';
    this.fechafinal = '';
    this.costocurso = 0;
  }

  static fromJSON(json: any): CursoPersonaModel {
    const model = new CursoPersonaModel();
    model.usuarioId = json.usuarioId || json.UsuarioId || 0;
    model.cursoId = json.cursoId || json.CursoId || 0;
    model.periodo = json.periodo || json.Periodo || 0;
    model.fechainicio = json.fechainicio || json.Fechainicio || '';
    model.fechafinal = json.fechafinal || json.Fechafinal || '';
    model.costocurso = json.costocurso || json.Costocurso || 0;
    return model;
  }
}

export class CursoModel {
  programaCodigo: string;
  planestuId: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  instuducionid: number;

  constructor() {
    this.programaCodigo = '';
    this.planestuId = 0;
    this.codigo = '';
    this.nombre = '';
    this.descripcion = '';
    this.instuducionid = 0;
  }

  static fromJSON(json: any): CursoModel {
    const model = new CursoModel();
    model.programaCodigo = json.programaCodigo || json.ProgramaCodigo || '';
    model.planestuId = json.planestuId || json.PlanestuId || 0;
    model.codigo = json.codigo || json.Codigo || '';
    model.nombre = json.nombre || json.Nombre || '';
    model.descripcion = json.descripcion || json.Descripcion || '';
    model.instuducionid = json.instuducionid || json.Instuducionid || 0;
    return model;
  }
}

export interface DesarrolloProfesionalRow {
  id?: number;
  programaCodigo: number;
  planEstudio: number;
  codigoCurso: number;
  nombre: string;
  descripcion: string;
  institucionId: number;
  usuarioId: number;
  fechainicio: string;
  fechafinal: string;
  costoCurso: number;
}
