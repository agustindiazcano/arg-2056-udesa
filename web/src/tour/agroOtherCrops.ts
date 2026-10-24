import data from './agroOtherCrops.json';

const title = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

/** The crops of the MAGyP series other than soja, maíz, trigo and girasol, in tonnes for the campaign of the slide (`scripts/build_agro_other_crops.py`). */
export const OTHER_CROPS = {
  campaign: data.campaign,
  source: data.source,
  url: data.url,
  note: data.note,
  retrievedAt: data.retrieved_at,
  rows: Object.entries(data.crops_t as Record<string, number>).map(([crop, tonnes]) => ({ crop: title(crop), tonnes }))
};

/** All of them together, in million tonnes: the «Otros cultivos» block of the agro treemap. */
export const otherCropsMt = (): number => OTHER_CROPS.rows.reduce((sum, r) => sum + r.tonnes, 0) / 1e6;
