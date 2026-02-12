export interface FredObservation {
  date: string;
  value: string;
}

export interface FredObservationsResponse {
  observations: FredObservation[];
}

export interface FredSeries {
  id: string;
  title: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes: string;
}

export interface FredSeriesResponse {
  seriess: FredSeries[];
}
