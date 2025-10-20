export class InsigniaDigitalModel {
  id: number;
  url: string;
  nombre: string;
  estado: boolean;

  constructor(id?: number, url?: string, nombre?: string, estado?: boolean) {
    this.id = id ?? 0;
    this.url = url ?? '';
    this.nombre = nombre ?? '';
    this.estado = estado ?? false;
  }

  static fromJSON(json: any): InsigniaDigitalModel {
    return new InsigniaDigitalModel(
      Number(json.id ?? 0),
      json.url ?? '',
      json.nombre ?? '',
      json.estado === undefined ? true : Boolean(json.estado)
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      url: this.url,
      nombre: this.nombre,
      estado: this.estado
    };
  }
}
