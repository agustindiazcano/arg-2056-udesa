import type { Terrain } from '../types/terrain.js';
import { decodeTerrarium } from './decode.js';
import { parseTerrainMeta } from './meta.js';

export interface DecodedImage {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}

interface FetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  blob: () => Promise<Blob>;
}

export interface LoadDeps {
  fetch?: (url: string) => Promise<FetchResponse>;
  decodeImage?: (blob: Blob) => Promise<DecodedImage>;
}

/** Default browser decoder (canvas). Not unit-tested: tests inject their own `decodeImage`. */
export async function decodeImageInBrowser(blob: Blob): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('2D canvas is not available');
  context.drawImage(bitmap, 0, 0);
  const data = context.getImageData(0, 0, bitmap.width, bitmap.height);
  return { rgba: data.data, width: bitmap.width, height: bitmap.height };
}

async function request(fetchFn: NonNullable<LoadDeps['fetch']>, url: string): Promise<FetchResponse> {
  let response: FetchResponse;
  try {
    response = await fetchFn(url);
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  return response;
}

export async function loadTerrain(baseUrl: string, id: string, deps: LoadDeps = {}): Promise<Terrain> {
  const fetchFn = deps.fetch ?? ((url: string) => globalThis.fetch(url));
  const decodeImage = deps.decodeImage ?? decodeImageInBrowser;
  const base = baseUrl.replace(/\/+$/, '');

  const metaResponse = await request(fetchFn, `${base}/${id}.json`);
  let meta;
  try {
    meta = parseTerrainMeta(await metaResponse.json());
  } catch (err) {
    throw new Error(`Invalid terrain metadata for ${id}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const imageResponse = await request(fetchFn, `${base}/${meta.files.height}`);
  let image: DecodedImage;
  try {
    image = await decodeImage(await imageResponse.blob());
  } catch (err) {
    throw new Error(`Failed to decode terrain image ${id}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (image.width !== meta.width || image.height !== meta.height) {
    throw new Error(
      `Terrain image ${id} is ${image.width}x${image.height} but its metadata says ${meta.width}x${meta.height}`
    );
  }
  return { meta, heights: decodeTerrarium(image.rgba, image.width, image.height) };
}
