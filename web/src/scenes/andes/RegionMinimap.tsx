import React, { useEffect, useRef } from 'react';
import { Map as MapLibreMap } from 'maplibre-gl';
import type { GeoJSONSource } from 'maplibre-gl';
import type { Column } from './columns';
import { REGION_BOUNDS, minimapData } from './regionMap';
import type { Route } from './timeline';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

interface RegionMinimapProps {
  /** the big map: the minimap follows where it looks */
  main: MapLibreMap | null;
  route: Route;
  km: number;
  columns: readonly Column[];
  day: number;
  /** the style of the base map, or null for a plain background (no MapTiler key) */
  styleUrl: string | null;
  /** the reader clicked a place of the minimap: the big map goes there */
  onGo: (lng: number, lat: number) => void;
}

/**
 * A small map of the whole region of the crossing, in a corner: the route of every force, its head as a dot and a ring where the big map is looking.
 * A click on it takes the big map there. It is the same MapTiler imagery as the big map, so its tiles are already in the browser cache.
 */
export function RegionMinimap({ main, route, km, columns, day, styleUrl, onGo }: RegionMinimapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const mainRef = useRef(main);
  mainRef.current = main;
  const dataRef = useRef({ route, km, columns, day });
  dataRef.current = { route, km, columns, day };
  const onGoRef = useRef(onGo);
  onGoRef.current = onGo;

  const draw = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const d = dataRef.current;
    const data = minimapData(d.route, d.km, d.columns, d.day);
    (map.getSource('mm-routes') as GeoJSONSource | undefined)?.setData(data.routes);
    (map.getSource('mm-heads') as GeoJSONSource | undefined)?.setData(data.heads);
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const map = new MapLibreMap({
      container: host,
      style: styleUrl ?? { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#1b2733' } }] },
      interactive: false,
      attributionControl: false,
      bounds: REGION_BOUNDS,
      fitBoundsOptions: { padding: 4 }
    });
    mapRef.current = map;
    map.on('load', () => {
      map.addSource('mm-routes', { type: 'geojson', data: EMPTY });
      map.addSource('mm-heads', { type: 'geojson', data: EMPTY });
      map.addSource('mm-view', { type: 'geojson', data: EMPTY });
      map.addLayer({ id: 'mm-routes', type: 'line', source: 'mm-routes', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });
      map.addLayer({ id: 'mm-heads', type: 'circle', source: 'mm-heads', paint: { 'circle-radius': 4, 'circle-color': '#2f7bff', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.2 } });
      map.addLayer({ id: 'mm-view', type: 'circle', source: 'mm-view', paint: { 'circle-radius': 9, 'circle-color': '#ffffff', 'circle-opacity': 0.12, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
      readyRef.current = true;
      drawRef.current();
      const c = mainRef.current?.getCenter();
      if (c) (map.getSource('mm-view') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [c.lng, c.lat] } }] });
    });
    const click = (e: MouseEvent) => {
      const box = host.getBoundingClientRect();
      const at = map.unproject([e.clientX - box.left, e.clientY - box.top]);
      onGoRef.current(at.lng, at.lat);
    };
    host.addEventListener('click', click);
    return () => {
      host.removeEventListener('click', click);
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl]);

  // the ring follows the big map
  useEffect(() => {
    if (!main) return undefined;
    const move = () => {
      const c = main.getCenter();
      const source = mapRef.current?.getSource('mm-view') as GeoJSONSource | undefined;
      source?.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [c.lng, c.lat] } }] });
    };
    main.on('move', move);
    move();
    return () => {
      main.off('move', move);
    };
  }, [main]);

  // the dots follow the clock
  useEffect(() => {
    draw();
  }, [route, km, columns, day]);

  return <div ref={hostRef} className="andes-mm" role="img" aria-label="Minimapa de la región del cruce: toque un lugar para ir ahí" data-testid="andes-minimap" />;
}
