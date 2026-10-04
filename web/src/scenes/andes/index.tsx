import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '../../charts/DataTable.js';
import { formatNumber } from '../../charts/format.js';
import { useDataset } from '../../data/useDataset.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import type { DashView } from '../../dashboard/types.js';
import { useQualityOptional } from '../../runtime/CapabilityProvider.js';
import { WebGLRequired } from '../../runtime/WebGLRequired.js';
import { isSyntheticTerrain } from '../../terrain/synthetic.js';
import { useStore } from '../../state/store.js';
import { Tile, TileGrid } from '../../ui/Tile.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { forceText, parseAndesEvents } from './data.js';
import type { AndesEvent } from './data.js';
import { EventList, EventPanel } from './Panel.js';
import { buildRoute, campaignDay, positionAt } from './timeline.js';
import { useAndesTerrain } from './useAndesTerrain.js';

// Three.js lives in its own chunk: it loads only when the scene is opened.
const AndesRenderer = lazy(() => import('./Renderer.js'));

const TABLE_COLUMNS = [
  { key: 'day', header: 'Día' },
  { key: 'date', header: 'Fecha' },
  { key: 'name', header: 'Evento' },
  { key: 'altitude', header: 'Altitud' },
  { key: 'forces', header: 'Fuerzas' }
];

const rows = (events: readonly AndesEvent[]) =>
  events.map((e) => ({
    day: e.day_of_campaign,
    date: e.date,
    name: e.name,
    altitude: e.elevation_m === null ? 'sin dato' : `${formatNumber(e.elevation_m, 0)} m`,
    forces: e.forces.map(forceText).join('; ')
  }));

export default function Scene() {
  const { status, data } = useDataset('andes_events', parseAndesEvents);
  const events = useMemo(() => data ?? [], [data]);
  const route = useMemo(() => buildRoute(events), [events]);
  const terrainState = useAndesTerrain(status === 'success' ? route.points : null);
  const quality = useQualityOptional();
  const yearFloat = useStore((s) => s.yearFloat);
  const day = campaignDay(yearFloat, route.lastDay);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const selected = route.points.find((p) => p.id === selectedId) ?? null;

  const select = useCallback((id: string, from?: HTMLElement) => {
    if (from) opener.current = from;
    setSelectedId(id);
  }, []);
  const close = useCallback(() => {
    setSelectedId(null);
    opener.current?.focus();
  }, []);

  // Escape closes the panel and gives the focus back to the control that opened it; without a panel it is the shell's key
  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [selectedId, close]);

  if (status === 'loading') return <SceneLoading />;
  if (status === 'error' || !data) return <SceneError />;

  const position = positionAt(route, day);
  const terrain = terrainState.status === 'ready' ? terrainState : null;
  const label = `Mapa 3D del cruce de los Andes, día ${Math.round(day)} de la campaña${
    selected ? `; evento elegido: ${selected.name}` : ''
  }.`;

  const map = (
    <div className="andes-map">
      {quality?.caps.webgl2 ? (
        <>
          <WebGLRequired />
          {terrain ? (
            <Suspense fallback={<p role="status" className="poster">Cargando la vista 3D...</p>}>
              <AndesRenderer terrain={terrain.terrain} route={route} day={day} selectedId={selectedId} onSelect={(id) => (id === null ? close() : select(id))} label={label} />
            </Suspense>
          ) : (
            <p role="status" className="poster">Cargando el terreno...</p>
          )}
        </>
      ) : (
        <p role="status" className="notice">
          Esta vista necesita WebGL2. La lista y la tabla de eventos muestran los mismos datos.
        </p>
      )}
    </div>
  );

  const views: DashView[] = [
    { id: 'map', name: 'Mapa 3D', thumb: { kind: 'map' }, content: map },
    {
      id: 'table',
      name: 'Tabla de eventos',
      thumb: { kind: 'table' },
      content: <DataTable caption="Eventos de la campaña" columns={TABLE_COLUMNS} data={rows(route.points)} pageSize="fit" />
    }
  ];

  const synthetic = terrain && isSyntheticTerrain(terrain.terrain);
  return (
    <Dashboard
      title="Los Andes"
      subtitle="El cruce de 1817 sobre el terreno"
      sources={[...new Set(route.points.map((p) => p.source))]}
      retrievedAt={route.points[0]?.retrieved_at}
      views={views}
      notes={
        terrain && (
          <p className="andes-terrain-note" role="note">
            {terrain.terrain.meta.attribution}
            {synthetic && terrain.problem ? ` (${terrain.problem})` : ''}
          </p>
        )
      }
      rail={<EventList events={route.points} selectedId={selectedId} onSelect={select} />}
      tiles={
        <TileGrid>
          <Tile id="andes-day" label="Día de la campaña">
            <span className="tile-value">{Math.round(day)}</span>
          </Tile>
          <Tile id="andes-km" label="Recorrido">
            <span className="tile-value">{position ? `${formatNumber(position.distanceKm, 0)} km` : 'sin dato'}</span>
          </Tile>
          <Tile id="andes-alt" label="Altitud del ejército">
            <span className="tile-value">
              {position && position.altitudeM !== null ? `${formatNumber(position.altitudeM, 0)} m` : 'sin dato'}
            </span>
          </Tile>
          <Tile id="andes-events" label="Eventos">
            <span className="tile-value">{route.points.length}</span>
          </Tile>
        </TileGrid>
      }
      side={selected ? <EventPanel event={selected} onClose={close} /> : undefined}
    />
  );
}
