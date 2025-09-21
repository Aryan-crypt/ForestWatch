export enum DeforestationStatus {
  SIGNIFICANT = 'Significant Deforestation Detected',
  MINOR = 'Minor Deforestation Detected',
  STABLE = 'No Major Deforestation Detected',
  UNKNOWN = 'Status Unknown',
}

export interface ChartDataPoint {
  year: number;
  loss: number; // in sq km
}

export interface DataSource {
  title: string;
  url: string;
}

export interface DeforestationDriver {
  reason: string;
  percentage: number;
}

export interface DeforestationData {
  forestName: string;
  status: DeforestationStatus;
  summary: string;
  conclusion: string;
  areaLost: string; // e.g., "approx. 15,000 sq km"
  timePeriod: string; // e.g., "2015-2023"
  estimatedInitialArea: string; // e.g., "approx. 6,000,000 sq km"
  chartData: ChartDataPoint[];
  deforestationDrivers: DeforestationDriver[];
  sources: DataSource[];
}