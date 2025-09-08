export class CondicionModel {
  id: number;
  nombreCondicion: string;
  descripcion: string;
  tipoCondicion: string;
  esObligatoria: boolean;
  momento: number;

  constructor();
  constructor(
    id?: number,
    nombreCondicion?: string,
    descripcion?: string,
    tipoCondicion?: string,
    esObligatoria?: boolean,
    momento?: number
  );
  constructor(
    id?: number,
    nombreCondicion?: string,
    descripcion?: string,
    tipoCondicion?: string,
    esObligatoria?: boolean,
    momento?: number
  ) {
    this.id = id ?? 0;
    this.nombreCondicion = nombreCondicion ?? '';
    this.descripcion = descripcion ?? '';
    this.tipoCondicion = tipoCondicion ?? '';
    this.esObligatoria = esObligatoria ?? false;
    this.momento = momento ?? 0;
  }

  static fromJSON(json: any): CondicionModel {
    return new CondicionModel(
      Number(json.id ?? 0),
      json.nombreCondicion ?? json.nombre ?? '',
      json.descripcion ?? '',
      json.tipoCondicion ?? json.tipo ?? '',
      json.esObligatoria === undefined ? false : Boolean(json.esObligatoria),
      json.momento !== undefined ? Number(json.momento) : 0
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      nombreCondicion: this.nombreCondicion,
      descripcion: this.descripcion,
      tipoCondicion: this.tipoCondicion,
      esObligatoria: this.esObligatoria,
      momento: this.momento
    };
  }
}
