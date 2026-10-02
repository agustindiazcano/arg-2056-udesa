import { ForecastOutput, parseForecastOutput } from '../types/forecast';

export async function loadForecast(url: string): Promise<ForecastOutput> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load forecast: ${response.statusText}`);
  }
  const data = await response.json();
  return parseForecastOutput(data);
}

export function isMock(doc: { source: string }): boolean {
  return doc.source === 'MOCK';
}
