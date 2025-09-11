// InstitucionModel.ts
export class InstitucionModel {
  id: number;
  nombre: string;
  contactoDescripcion: string;
  ciudadId: number | null; // <-- permitir null
  paisId?: number;
  nombrePais?: string;
  nombreCiudad?: string;

  constructor(
    id?: number,
    nombre?: string,
    contactoDescripcion?: string,
    ciudadId?: number | null, // <-- aceptar null
    paisId?: number,
    nombrePais?: string,
    nombreCiudad?: string
  ) {
    this.id = id ?? 0;
    this.nombre = nombre ?? '';
    this.contactoDescripcion = contactoDescripcion ?? '';
    this.ciudadId = ciudadId ?? null; // <-- null por defecto
    this.paisId = paisId;
    this.nombrePais = nombrePais;
    this.nombreCiudad = nombreCiudad;
  }

  static fromJSON(json: any): InstitucionModel {
    return new InstitucionModel(
      Number(json.id ?? 0),
      json.nombre ?? '',
      json.contactoDescripcion ?? '',
      json.ciudadId != null ? Number(json.ciudadId) : null, // <-- null si no hay valor
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
