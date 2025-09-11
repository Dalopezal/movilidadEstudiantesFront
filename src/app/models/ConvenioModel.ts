export class ConvenioModel {
  id: number;
  codigoUcm: string;
  descripcion: string;
  fechaInicio: string; // ISO 'YYYY-MM-DD'
  fechaVencimiento: string;
  diasVigencia: number;
  estado: boolean;

  // ids
  tipoConvenioId: number;
  clasificacionConvenioId: number;
  // nota: la API original usa "tipoActividadid" (i minúscula). Lo incluimos y normalizamos.
  tipoActividadid: number;

  // campos opcionales para display (nombres legibles)
  nombreTipoConvenio?: string;
  nombreClasificacion?: string;
  nombreTipoActividad?: string;

  // nuevos campos solicitados
  nombreClasificacionConvenio?: string;
  nombreTipoActividadConvenio?: string;

  constructor(
    id: number = 0,
    codigoUcm: string = '',
    descripcion: string = '',
    fechaInicio: string = '',
    fechaVencimiento: string = '1900-01-01',
    diasVigencia: number = 0,
    estado: boolean = false,
    tipoConvenioId: number = 0,
    clasificacionConvenioId: number = 0,
    tipoActividadid: number = 0
  ) {
    this.id = id;
    this.codigoUcm = codigoUcm;
    this.descripcion = descripcion;
    this.fechaInicio = fechaInicio;
    this.fechaVencimiento = fechaVencimiento;
    this.diasVigencia = diasVigencia;
    this.estado = estado;
    this.tipoConvenioId = tipoConvenioId;
    this.clasificacionConvenioId = clasificacionConvenioId;
    this.tipoActividadid = tipoActividadid;
  }

  static fromJSON(json: any): ConvenioModel {
    if (!json) return new ConvenioModel();

    const id = Number(json.id ?? 0);

    // Normalizamos variantes de nombres y anidamientos
    const codigoUcm = String(json.codigoUcm ?? json.codigo_ucm ?? json.codigo ?? '');
    const descripcion = String(json.descripcion ?? json.description ?? json.nombre ?? '');

    const fechaInicio = String(json.fechaInicio ?? json.fecha_inicio ?? '');
    const fechaVencimiento = String(json.fechaVencimiento ?? json.fecha_vencimiento ?? json.fechaFin ?? json.fecha_fin ?? '');

    const diasVigencia = Number(json.diasVigencia ?? json.dias_vigencia ?? 0);

    // estado / esObligatoria / estado booleano
    const estado = json.estado !== undefined ? Boolean(json.estado) : (json.esObligatoria !== undefined ? Boolean(json.esObligatoria) : false);

    const tipoConvenioId = Number(json.tipoConvenioId ?? json.tipo_convenio_id ?? json.tipoConvenio?.id ?? 0);
    const clasificacionConvenioId = Number(json.clasificacionConvenioId ?? json.clasificacion_convenio_id ?? json.clasificacion?.id ?? json.clasificacionId ?? 0);
    // soporta tanto "tipoActividadid" como "tipoActividadId" y snake_case
    const tipoActividadid = Number(json.tipoActividadid ?? json.tipoActividadId ?? json.tipo_actividad_id ?? json.tipoActividad?.id ?? 0);

    const model = new ConvenioModel(
      id,
      codigoUcm,
      descripcion,
      fechaInicio,
      fechaVencimiento,
      diasVigencia,
      estado,
      tipoConvenioId,
      clasificacionConvenioId,
      tipoActividadid
    );

    // Campos opcionales para display (si vienen)
    model.nombreTipoConvenio = json.nombreTipoConvenio ?? json.nombre_tipo_convenio ?? json.tipoConvenio?.nombre ?? undefined;
    model.nombreClasificacion = json.nombreClasificacion ?? json.nombre_clasificacion ?? json.clasificacion?.nombre ?? undefined;
    model.nombreTipoActividad = json.nombreTipoActividad ?? json.nombre_tipo_actividad ?? json.tipoActividad?.nombre ?? undefined;

    // Nuevos campos solicitados: buscan variantes y caen a los campos anteriores si no existen
    model.nombreClasificacionConvenio =
      json.nombreClasificacionConvenio ??
      json.nombre_clasificacion_convenio ??
      json.nombreClasificacion ??
      model.nombreClasificacion ??
      undefined;

    model.nombreTipoActividadConvenio =
      json.nombreTipoActividadConvenio ??
      json.nombre_tipo_actividad_convenio ??
      json.nombreTipoActividad ??
      model.nombreTipoActividad ??
      undefined;

    return model;
  }

  // Emitimos el JSON con las claves que tu backend espera
  toJSON(): any {
    return {
      id: this.id,
      codigoUcm: this.codigoUcm,
      tipoConvenioId: this.tipoConvenioId,
      clasificacionConvenioId: this.clasificacionConvenioId,
      tipoActividadid: this.tipoActividadid, // respeta la clave "tipoActividadid"
      fechaInicio: this.fechaInicio,
      diasVigencia: this.diasVigencia,
      estado: this.estado,
      descripcion: this.descripcion,
      fechaVencimiento: this.fechaVencimiento,
      // opcionales/display (se envían sólo si existen)
      ...(this.nombreClasificacionConvenio ? { nombreClasificacionConvenio: this.nombreClasificacionConvenio } : {}),
      ...(this.nombreTipoActividadConvenio ? { nombreTipoActividadConvenio: this.nombreTipoActividadConvenio } : {}),
      ...(this.nombreTipoConvenio ? { nombreTipoConvenio: this.nombreTipoConvenio } : {}),
      ...(this.nombreClasificacion ? { nombreClasificacion: this.nombreClasificacion } : {}),
      ...(this.nombreTipoActividad ? { nombreTipoActividad: this.nombreTipoActividad } : {})
    };
  }
}
