import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '../../charts/DataTable.js';
import { formatNumber } from '../../charts/format.js';
import { useDataset } from '../../data/useDataset.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import { useQualityOptional } from '../../runtime/CapabilityProvider.js';
import { qualityTier } from '../../runtime/capabilities.js';
import type { QualityTier } from '../../runtime/capabilities.js';
import { WebGLRequired } from '../../runtime/WebGLRequired.js';
import { isSyntheticTerrain } from '../../terrain/synthetic.js';
import { useStore } from '../../state/store.js';
import { Tile, TileGrid } from '../../ui/Tile.js';
import { SlotPortal } from '../../dashboard/SlotPortal.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { sourceLine } from '../../ui/SceneShell.js';
import { startingMen } from './column.js';
import { figuresNote, forceText, parseAndesEvents } from './data.js';
import type { AndesEvent } from './data.js';
import { EventList, EventPanel } from './Panel.js';
import type { CameraMode } from './camera.js';
import { GraphicsMenu } from './GraphicsMenu.js';
import { loadToggles, resolveGraphics, saveToggles } from './graphics.js';
import type { GraphicsToggles } from './graphics.js';
import { vo2MaxShare } from './physiology.js';
import { AndesProgress } from './Progress.js';
import { buildRoute, paceClock, paceProgress, positionAt } from './timeline.js';
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

const CAMERA_BUTTONS: ReadonlyArray<{ mode: CameraMode; text: string }> = [
  { mode: 'follow', text: 'Seguir al ejército' },
  { mode: 'cine', text: 'Cine' },
  { mode: 'aerial', text: 'Aérea' },
  { mode: 'map', text: 'Vista de mapa' }
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
  const tier: QualityTier = quality?.tier ?? 'medium';
  const yearFloat = useStore((s) => s.yearFloat);
  // the high pass, the most epic part, gets more of the clock than the valleys (the whole campaign still takes the whole clock)
  const clock = useMemo(() => paceClock(route), [route]);
  const pace = useMemo(() => paceProgress(route), [route]);
  const day = clock(yearFloat);
  const percent = Math.round(pace.progress(yearFloat) * 100);
  const dispatch = useStore((s) => s.dispatch);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'table'>('map');
  const [camera, setCamera] = useState<CameraMode>('free');
  const [closeUp, setCloseUp] = useState(0);
  const [toggles, setToggles] = useState<GraphicsToggles>(loadToggles);
  const [tierChoice, setTierChoice] = useState<'auto' | QualityTier>('auto');
  const [listOpen, setListOpen] = useState(true);
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
  const graphics = resolveGraphics(tier, toggles);
  const vo2 = vo2MaxShare(position?.altitudeM ?? null);
  const terrain = terrainState.status === 'ready' ? terrainState : null;
  const label = `Mapa 3D del cruce de los Andes, día ${Math.round(day)} de la campaña${
    selected ? `; evento elegido: ${selected.name}` : ''
  }.`;

  const map = quality?.caps.webgl2 ? (
    <>
      <WebGLRequired />
      {terrain ? (
        <Suspense fallback={<p role="status" className="poster">Cargando la vista 3D...</p>}>
          <AndesRenderer
            terrain={terrain.terrain}
            route={route}
            day={day}
            selectedId={selectedId}
            camera={camera}
            graphics={graphics}
            closeUp={closeUp}
            onSelect={(id) => (id === null ? close() : select(id))}
            label={label}
          />
        </Suspense>
      ) : (
        <p role="status" className="poster">Cargando el terreno...</p>
      )}
    </>
  ) : (
    <p role="status" className="notice andes-notice">
      Esta vista necesita WebGL2. La lista y la tabla de eventos muestran los mismos datos.
    </p>
  );

  const synthetic = terrain && isSyntheticTerrain(terrain.terrain);
  const source = sourceLine([...new Set(route.points.map((p) => p.source))], route.points[0]?.retrieved_at);

  const stage = (
    <div className="andes-stage">
      <div className="andes-canvas">
        {view === 'map' ? (
          map
        ) : (
          <div className="andes-table andes-glass">
            <DataTable caption="Eventos de la campaña" columns={TABLE_COLUMNS} data={rows(route.points)} pageSize="fit" />
          </div>
        )}
      </div>

      <header className="andes-title andes-glass">
        <h1>Los Andes</h1>
        <p>El cruce de 1817 sobre el terreno</p>
      </header>

      <div className="andes-controls andes-glass" role="group" aria-label="Controles de la escena">
        <button type="button" className="chip" aria-pressed={view === 'map'} onClick={() => setView('map')}>
          Mapa 3D
        </button>
        <button type="button" className="chip" aria-pressed={view === 'table'} onClick={() => setView('table')}>
          Tabla de eventos
        </button>
        {CAMERA_BUTTONS.map(({ mode, text }) => (
          <button
            key={mode}
            type="button"
            className="chip"
            aria-pressed={camera === mode}
            disabled={view !== 'map'}
            onClick={() => setCamera(camera === mode ? 'free' : mode)}
          >
            {text}
          </button>
        ))}
        <button type="button" className="chip" disabled={view !== 'map'} onClick={() => setCloseUp(closeUp + 1)}>
          Ver de cerca
        </button>
        <button type="button" className="chip" aria-pressed={listOpen} onClick={() => setListOpen(!listOpen)}>
          Eventos
        </button>
        <GraphicsMenu
          toggles={toggles}
          onToggle={(key, value) => {
            const next = { ...toggles, [key]: value };
            setToggles(next);
            saveToggles(next);
          }}
          tier={tier}
          choice={tierChoice}
          onChoice={(choice) => {
            setTierChoice(choice);
            if (quality) quality.setTier(choice === 'auto' ? qualityTier(quality.caps) : choice);
          }}
        />
      </div>

      <SlotPortal slot="progress">
        <AndesProgress percent={percent} onChange={(p) => dispatch({ type: 'setYear', year: pace.yearAt(p / 100) })} />
      </SlotPortal>

      {listOpen && (
        <div className="andes-list andes-glass">
          <EventList events={route.points} selectedId={selectedId} onSelect={select} />
        </div>
      )}

      {selected && (
        <div className="andes-detail andes-glass">
          <EventPanel event={selected} onClose={close} />
        </div>
      )}

      <footer className="andes-foot">
        {terrain && (
          <p role="note">
            {terrain.terrain.meta.attribution}
            {synthetic && terrain.problem ? ` (${terrain.problem})` : ''}
          </p>
        )}
        {terrain && view === 'map' && <p>{figuresNote(startingMen(route.points) !== null)}</p>}
        {source && <p>{source}</p>}
      </footer>
    </div>
  );

  return (
    <Dashboard
      title="Los Andes"
      sources={[]}
      views={[]}
      stage={stage}
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
          <Tile id="andes-vo2" label="VO₂ máx. en sangre" note="Estimado: % de la capacidad a nivel del mar">
            <span className="tile-value">{vo2 === null ? 'sin dato' : `${Math.round(vo2 * 100)} %`}</span>
          </Tile>
          <Tile id="andes-events" label="Eventos">
            <span className="tile-value">{route.points.length}</span>
          </Tile>
        </TileGrid>
      }
    />
  );
}
