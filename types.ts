
export interface TomadorRow {
  MES: string;
  PORTE: string;
  SEXO: string;
  REGIAO: string;
  UF: string;
  QTDE_EMPRESAS_TOMADORAS: number;
  DATA: string;
  DATA_FINAL: string;
}

export interface EstoqueRow {
  MES: string;
  PORTE: string;
  SEXO: string;
  REGIAO: string;
  UF: string;
  ORIGEM: string;
  MODALIDADE: string;
  SALDO_CARTEIRA_CREDITO: number;
  SALDO_INADIMPLENCIA: number;
  QTD_OPERACOES: number;
  NUM_TAXA_POND: number;
  DEN_TAXA_POND: number;
  DATA: string;
  DATA_FINAL: string;
}

export interface ConcessaoRow {
  TRIMESTRE: string;
  PORTE: string;
  SEXO: string;
  REGIAO: string;
  UF: string;
  ORIGEM: string;
  MODALIDADE: string;
  CONCESSAO: number;
  DATA: string;
  DATA_FINAL: string;
}

export interface FilterState {
  porte: string[];
  sexo: string[];
  regiao: string[];
  uf: string[];
  origem: string[];
  modalidade: string[];
}

export interface AggregatedData {
  quarter: string;
  tomadores: number;
  operacoes: number;
  concessao: number;
  saldo: number;
  inadimplencia: number;
  taxaJuros: number;
  inadRate: number;
  isForecast?: boolean;
  confidenceUpper?: number;
  confidenceLower?: number;
}

export interface ForecastResult {
  data: AggregatedData[];
  modelInfo: string;
}
