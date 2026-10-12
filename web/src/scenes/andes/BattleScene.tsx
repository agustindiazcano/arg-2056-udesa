import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap } from 'maplibre-gl';
import { formatDate } from '../../charts/format';
import { BATTLE_NOTICE, BATTLE_SCENE_VIEW, BATTLE_UNITS, battleUnitsGeoJson } from './battleField';
import type { BattleUnit } from './battleField';
import { DEM_URL, EXAGGERATION, MAPTILER_KEY, STYLE_URL } from './mapStyle';

const BATTLE_DATE = '1817-02-12';
const number = new Intl.NumberFormat('es-AR');

function Flag({ royalist }: { royalist: boolean }) {
  return royalist ? (
    <span className="andes-flag andes-flag--royal andes-flag--inline" role="img" aria-label="Bandera realista (cruz de Borgoña)">
      <i />
    </span>
  ) : (
    <span className="andes-flag andes-flag--patriot andes-flag--inline" role="img" aria-label="Bandera del Ejército de los Andes">
      <i />
      <i />
    </span>
  );
}

function Side({ title, royalist, units }: { title: string; royalist: boolean; units: readonly BattleUnit[] }) {
  const men = units.reduce((sum, u) => sum + u.men, 0);
  return (
    <section className="andes-b3d-side" aria-label={title}>
      <h3>
        <Flag royalist={royalist} />
        {title}
      </h3>
      <ul>
        {units.map((u) => (
          <li key={u.id}>
            <strong>{u.name}</strong>
            <span>unos {number.format(u.men)}</span>
            <small>{u.note}</small>
          </li>
        ))}
      </ul>
      <p className="andes-b3d-total">
        {royalist ? 'Suman unos' : 'Suman unos'} {number.format(men)} {royalist ? 'en las unidades que dan las fuentes (el total, de 2.080 a 2.500)' : '(el total, unos 3.500)'}
      </p>
    </section>
  );
}

/**
 * The battle of Chacabuco as a small 3D scene over the map: the real relief and satellite imagery of the field (MapTiler, like the big map), with the units of both
 * sides as blocks facing each other, the sky above and the notice that it is a recreation. The positions are schematic (see `battleField.ts`). The reader can orbit it.
 * It goes back to the big map with the button or with Escape.
 */
export function BattleScene({ onClose }: { onClose: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState<string | null>(MAPTILER_KEY === '' ? 'Falta la clave de MapTiler (VITE_MAPTILER_KEY): sin ella no hay mapa satelital ni relieve, pero las unidades se listan abajo.' : null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || MAPTILER_KEY === '') return undefined;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: host,
        style: STYLE_URL,
        center: [BATTLE_SCENE_VIEW.lon, BATTLE_SCENE_VIEW.lat],
        zoom: BATTLE_SCENE_VIEW.zoom,
        pitch: BATTLE_SCENE_VIEW.pitch,
        bearing: BATTLE_SCENE_VIEW.bearing,
        maxPitch: 80,
        maxZoom: 17,
        attributionControl: { compact: true }
      });
    } catch {
      setProblem('No se pudo crear el mapa 3D en este dispositivo (hace falta WebGL).');
      return undefined;
    }
    map.on('load', () => {
      map.addSource('terrain-dem', { type: 'raster-dem', url: DEM_URL, tileSize: 256 });
      map.setTerrain({ source: 'terrain-dem', exaggeration: EXAGGERATION });
      map.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain-dem',
        paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#0b1220', 'hillshade-highlight-color': '#ffffff', 'hillshade-accent-color': '#0b1220' }
      });
      map.setSky({ 'sky-color': '#5b9bd5', 'horizon-color': '#cfe3f3', 'fog-color': '#dbe7f2', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.8, 'fog-ground-blend': 0.2 });
      map.addSource('units', { type: 'geojson', data: battleUnitsGeoJson() });
      map.addLayer({
        id: 'units-block',
        type: 'fill-extrusion',
        source: 'units',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.88 }
      });
      map.addLayer({
        id: 'units-label',
        type: 'symbol',
        source: 'units',
        filter: ['==', ['geometry-type'], 'Point'],
        layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-offset': [0, -2.2], 'text-allow-overlap': true, 'text-ignore-placement': true },
        paint: { 'text-color': '#ffffff', 'text-halo-color': '#0b1220', 'text-halo-width': 2 }
      });
    });
    return () => {
      map.remove();
    };
  }, []);

  const patriots = BATTLE_UNITS.filter((u) => u.side === 'patriot');
  const royalists = BATTLE_UNITS.filter((u) => u.side === 'royalist');

  return (
    <div className="andes-b3d andes-glass" role="dialog" aria-label="Batalla de Chacabuco, recreación en 3D">
      <header className="andes-b3d-head">
        <div>
          <time dateTime={BATTLE_DATE}>{formatDate(BATTLE_DATE)}</time>
          <h2>Batalla de Chacabuco</h2>
        </div>
        <span className="andes-b3d-tag">Recreación</span>
        <button type="button" className="chip" onClick={onClose}>
          Volver al mapa
        </button>
      </header>
      <div className="andes-b3d-body">
        <div className="andes-b3d-map" ref={hostRef}>
          {problem && <p className="andes-b3d-problem">{problem}</p>}
        </div>
        <div className="andes-b3d-legend">
          <Side title="Ejército de los Andes" royalist={false} units={patriots} />
          <Side title="Fuerzas realistas" royalist units={royalists} />
        </div>
      </div>
      <p className="andes-b3d-notice" role="note">
        {BATTLE_NOTICE}
      </p>
    </div>
  );
}
