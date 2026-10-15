import agro from './agroArgentina.json';

/** Years of the crop series shown in the Resources slide (campaign start years in the MAGyP files). */
export interface CropSeries {
  crop: string;
  /** million tonnes per campaign, in the order of `AGRO_TONNES.campaigns`; null where the file has no campaign */
  values: Array<number | null>;
}

export interface AgroTonnes {
  campaigns: number[];
  series: CropSeries[];
}

type CropRow = { campaign: number; production_t: number | null };

/**
 * Production of the four main crops (MAGyP) in million tonnes, by campaign. A campaign missing from a crop's file stays null; nothing is
 * interpolated or carried over. The campaign is named by its start year (2024 is 2024/25).
 */
export function agroTonnes(): AgroTonnes {
  const crops = agro.crops as Record<string, CropRow[]>;
  const campaigns = [...new Set(Object.values(crops).flatMap((rows) => rows.map((r) => r.campaign)))].sort((a, b) => a - b);
  const series = Object.entries(crops).map(([crop, rows]) => ({
    crop,
    values: campaigns.map((c) => {
      const t = rows.find((r) => r.campaign === c)?.production_t;
      return t === null || t === undefined ? null : t / 1e6;
    })
  }));
  return { campaigns, series };
}

export const campaignLabel = (c: number): string => `${c}/${String(c + 1).slice(2)}`;
