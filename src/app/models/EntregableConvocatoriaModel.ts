export class EntregablePostulacionModel {
  id: number;
  entregableId: number;
  postulacionId: number;
  url: string;
  estado: string | null;
  fechaEnvio: string | null;
  fechaRevision: string | null;
  estadoPostulacionId: number;
  nombreEstadoPostulacion: string | null;
  descripcion: string;
  nombreEntregable: string | null;

  constructor(
    id: number = 0,
    entregableId: number = 0,
    postulacionId: number = 0,
    url: string = '',
    estado: string | null = null,
    fechaEnvio: string | null = null,
    fechaRevision: string | null = null,
    estadoPostulacionId: number = 0,
    nombreEstadoPostulacion: string | null = null,
    descripcion: string = '',
    nombreEntregable: string | null = null
  ) {
    this.id = id;
    this.entregableId = entregableId;
    this.postulacionId = postulacionId;
    this.url = url;
    this.estado = estado;
    this.fechaEnvio = fechaEnvio;
    this.fechaRevision = fechaRevision;
    this.estadoPostulacionId = estadoPostulacionId;
    this.nombreEstadoPostulacion = nombreEstadoPostulacion;
    this.descripcion = descripcion;
    this.nombreEntregable = nombreEntregable;
  }

  static fromJSON(json: any): EntregablePostulacionModel {
    return new EntregablePostulacionModel(
      Number(json?.id ?? 0),
      Number(json?.entregableId ?? 0),
      Number(json?.postulacionId ?? 0),
      String(json?.url ?? ''),
      json?.estado ?? null,
      json?.fechaEnvio ?? null,
      json?.fechaRevision ?? null,
      Number(json?.estadoPostulacionId ?? 0),
      json?.nombreEstadoPostulacion ?? null,
      String(json?.descripcion ?? ''),
      json?.nombreEntregable ?? null
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      entregableId: this.entregableId,
      postulacionId: this.postulacionId,
      url: this.url,
      estado: this.estado,
      fechaEnvio: this.fechaEnvio,
      fechaRevision: this.fechaRevision,
      estadoPostulacionId: this.estadoPostulacionId,
      nombreEstadoPostulacion: this.nombreEstadoPostulacion,
      descripcion: this.descripcion,
      nombreEntregable: this.nombreEntregable
    };
  }
}
