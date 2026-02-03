
import React from 'react';

export const COLORS = {
  primary: '#0ea5e9', // Sky 500
  secondary: '#f97316', // Orange 500 (Sebrae color)
  success: '#10b981', // Emerald 500
  danger: '#ef4444', // Red 500
  warning: '#f59e0b', // Amber 500
  neutral: '#64748b', // Slate 500
};

export const PORTE_COLORS: Record<string, string> = {
  'MEI': '#0ea5e9',
  'Micro': '#f97316',
  'Pequeno': '#10b981',
  'Médio': '#64748b',
  'Grande': '#ef4444',
};

export const PORTES = ['MEI', 'Micro', 'Pequeno', 'Médio', 'Grande'];
export const SEXOS = ['Feminino', 'Masculino'];
export const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

export const UF_MAP: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 
  'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 
  'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 
  'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí', 
  'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul', 
  'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo', 
  'SE': 'Sergipe', 'TO': 'Tocantins'
};

export const UFS = Object.keys(UF_MAP).sort();

export const ORIGENS = ['Recursos Livres', 'Recursos Direcionados'];
export const MODALIDADES = [
  'Capital de Giro até 365 dias',
  'Capital de Giro acima 365 dias',
  'Investimento',
  'Cartão de Crédito',
  'Cheque Especial',
  'Outros'
];
