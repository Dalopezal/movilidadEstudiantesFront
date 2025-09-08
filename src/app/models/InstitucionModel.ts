export class InstitucionModel {
  id: number;
  nombre: string;
  contactoDescripcion: string;
  ciudadId: number;
  paisId?: number;
  nombrePais?: string;
  nombreCiudad?: string;

  constructor();
  constructor(
    id?: number,
    nombre?: string,
    contactoDescripcion?: string,
    ciudadId?: number,
    paisId?: number,
    nombrePais?: string,
    nombreCiudad?: string
  );
  constructor(
    id?: number,
    nombre?: string,
    contactoDescripcion?: string,
    ciudadId?: number,
    paisId?: number,
    nombrePais?: string,
    nombreCiudad?: string
  ) {
    this.id = id ?? 0;
    this.nombre = nombre ?? '';
    this.contactoDescripcion = contactoDescripcion ?? '';
    this.ciudadId = ciudadId ?? 0;
    this.paisId = paisId;
    this.nombrePais = nombrePais;
    this.nombreCiudad = nombreCiudad;
  }

  static fromJSON(json: any): InstitucionModel {
    return new InstitucionModel(
      Number(json.id ?? 0),
      json.nombre ?? '',
      json.contactoDescripcion ?? '',
      Number(json.ciudadId ?? 0),
      json.paisId ? Number(json.paisId) : undefined,
      json.nombrePais ?? '',
      json.nombreCiudad ?? ''
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      contactoDescripcion: this.contactoDescripcion,
      ciudadId: this.ciudadId
    };
  }
}
