export type Technology = 'Vapor' | 'Diésel eléctrico' | 'Eléctrico' | 'Levitación';
export type TrainId = 'rocket' | 'garratt' | 'bigboy' | 'deltic' | 'shinkansen' | 'tgv' | 'velaro' | 'maglev';
export type PartId = 'body' | 'power' | 'drive' | 'running' | 'supply';
export type ViewMode = 'assembled' | 'exploded' | 'isolated';
export type Tab = 'engineering' | 'history' | 'sources';
export interface Source {
  id: string; title: string; institution: string; url: string;
  kind: 'Colección' | 'Archivo' | 'Fabricante' | 'Operador' | 'Manual';
  scope: string; locator?: string;
}
export interface Passage { title: string; text: string; sources: string[]; interpretation?: boolean }
export interface Part {
  id: PartId; name: string; short: string; description: string;
  material: string; reason: string; evolution: string; detail: string;
  formula?: string; sources: string[]; diagram: 'steam' | 'deltic' | 'motor' | 'maglev' | 'bogie' | 'structure' | 'boiler' | 'pantograph' | 'transformer' | 'tender' | 'generator' | 'cooling';
}
export interface Train {
  id: TrainId; name: string; subtitle: string; year: number; yearLabel: string;
  country: string; region: string; flag: string; technology: Technology;
  accent: string; maker: string; tagline: string; summary: string; configuration: string;
  stats: { label: string; value: string; note: string; source: string }[];
  history: Passage[]; materials: Passage[]; parts: Part[];
  sources: string[]; drawings: { title: string; source: string; status: string }[];
  fidelity: string; energy: string[]; length: number; gauge: number;
}
