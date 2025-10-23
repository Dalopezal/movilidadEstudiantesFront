export class AsignacionEstrategiaModel {
  id: number;
  procesoId: number;
  estrategiaId: number;
  docenteId: number;
  componenteId: number;

  generaCertificado: boolean;
  obtuvoInsignia: boolean;

  fechaTrabajo: string;
  fechaEvaluacion: string;

  // Campos de solo lectura para tabla
  estado: string;
  nombreProceso: string;
  nombreEstrategia: string;
  nombreDocente: string;

  constructor();
  constructor(
    id?: number,
    procesoId?: number,
    estrategiaId?: number,
    docenteId?: number,
    componenteId?: number,
    generaCertificado?: boolean,
    obtuvoInsignia?: boolean,
    fechaTrabajo?: string,
    fechaEvaluacion?: string,
    estado?: string,
    nombreProceso?: string,
    nombreEstrategia?: string,
    nombreDocente?: string
  );
  constructor(
    id?: number,
    procesoId?: number,
    estrategiaId?: number,
    docenteId?: number,
    componenteId?: number,
    generaCertificado?: boolean,
    obtuvoInsignia?: boolean,
    fechaTrabajo?: string,
    fechaEvaluacion?: string,
    estado?: string,
    nombreProceso?: string,
    nombreEstrategia?: string,
    nombreDocente?: string
  ) {
    this.id = id ?? 0;
    this.procesoId = procesoId ?? 0;
    this.estrategiaId = estrategiaId ?? 0;
    this.docenteId = docenteId ?? 0;
    this.componenteId = componenteId ?? 0;

    this.generaCertificado = generaCertificado ?? false;
    this.obtuvoInsignia = obtuvoInsignia ?? false;

    this.fechaTrabajo = fechaTrabajo ?? '';
    this.fechaEvaluacion = fechaEvaluacion ?? '';

    this.estado = estado ?? '';
    this.nombreProceso = nombreProceso ?? '';
    this.nombreEstrategia = nombreEstrategia ?? '';
    this.nombreDocente = nombreDocente ?? '';
  }

  static fromJSON(json: any): AsignacionEstrategiaModel {
    return new AsignacionEstrategiaModel(
      Number(json.id ?? json.ID ?? 0),
      Number(json.procesoId ?? json.ProcesoId ?? 0),
      Number(json.estrategiaId ?? json.EstrategiaId ?? 0),
      Number(json.docenteId ?? json.DocenteId ?? 0),
      Number(json.componenteId ?? json.ComponenteId ?? 0),
      json.generaCertificado === undefined ? Boolean(json.GeneraCertificado ?? false) : Boolean(json.generaCertificado),
      json.obtuvoInsignia === undefined ? Boolean(json.ObtuvoInsignia ?? false) : Boolean(json.obtuvoInsignia),
      (json.fechaTrabajo ?? json.FechaTrabajo ?? '') || '',
      (json.fechaEvaluacion ?? json.FechaEvaluacion ?? '') || '',
      json.estado ?? json.Estado ?? '',
      json.nombreProceso ?? json.NombreProceso ?? '',
      json.nombreEstrategia ?? json.NombreEstrategia ?? '',
      json.nombreDocente ?? json.NombreDocente ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      procesoId: this.procesoId,
      estrategiaId: this.estrategiaId,
      docenteId: this.docenteId,
      componenteId: this.componenteId,
      generaCertificado: this.generaCertificado,
      obtuvoInsignia: this.obtuvoInsignia,
      fechaTrabajo: this.fechaTrabajo,
      fechaEvaluacion: this.fechaEvaluacion
      // Los campos de solo lectura no se envían en payloads
    };
  }
}
