import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '../../charts/DataTable.js';
import { formatNumber } from '../../charts/format.js';
import { useDataset } from '../../data/useDataset.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import { useQualityOptional } from '../../runtime/CapabilityProvider.js';
import { qualityTier } from '../../runtime/capabilities.js';
import type { QualityTier } from '../../runtime/capabilities.js';
import { WebGLRequired } from '../../runtime/WebGLRequired.js';
import { useStore } from '../../state/store.js';
import { Tile, TileGrid } from '../../ui/Tile.js';
import { SlotPortal } from '../../dashboard/SlotPortal.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { startingMen } from './column.js';
import { campaignEndDay, splitColumns } from './columns.js';
import { figuresNote, forceText, parseAndesEvents } from './data.js';
import type { AndesEvent } from './data.js';
import { EventList, EventPanel } from './Panel.js';
import type { CameraMode } from './camera.js';
import { AltitudeProfile } from './AltitudeProfile.js';
import { AndesIntro } from './AndesIntro.js';
import { CameraTuner } from './CameraTuner.js';
import type { CameraApi, CameraView } from './cameraKeyframes.js';
import { GraphicsMenu } from './GraphicsMenu.js';
import { loadToggles, resolveGraphics, saveToggles } from './graphics.js';
import type { GraphicsToggles } from './graphics.js';
import { spo2Estimate } from './physiology.js';
import { altitudeProfile } from './profile.js';
import { AndesProgress } from './Progress.js';
import { buildRoute, paceClock, paceProgress, positionAt } from './timeline.js';

// MapLibre and Three.js live in their own chunk: it loads only when the scene is opened.
const AndesRenderer = lazy(() => import('./MapLibreRenderer.js'));

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
  const split = useMemo(() => splitColumns(events), [events]);
  // the clock runs to the arrival of the last column; the main one waits at Chacabuco until then
  const route = useMemo(() => buildRoute(split.main, campaignEndDay(buildRoute(split.main), split.columns)), [split]);
  const quality = useQualityOptional();
  const tier: QualityTier = quality?.tier ?? 'medium';
  const yearFloat = useStore((s) => s.yearFloat);
  // the high pass, the most epic part, gets more of the clock than the valleys (the whole campaign still takes the whole clock)
  const clock = useMemo(() => paceClock(route), [route]);
  const pace = useMemo(() => paceProgress(route), [route]);
  const profile = useMemo(() => altitudeProfile(route), [route]);
  const day = clock(yearFloat);
  const crossed = pace.progress(yearFloat);
  const percent = Math.round(crossed * 100);
  const dispatch = useStore((s) => s.dispatch);
  const setTimeScale = useStore((s) => s.setTimeScale);
  const [mapReady, setMapReady] = useState(false);
  const cameraApi = useRef<CameraApi | null>(null);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [camView, setCamView] = useState<CameraView>({ lon: -70, lat: -32, zoom: 6, pitch: 40, bearing: 0 });

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
  const spo2 = spo2Estimate(position?.altitudeM ?? null);
  const label = `Mapa 3D del cruce de los Andes, día ${Math.round(day)} de la campaña${
    selected ? `; evento elegido: ${selected.name}` : ''
  }.`;

  const map = quality?.caps.webgl2 ? (
    <>
      <WebGLRequired />
      <Suspense fallback={<p role="status" className="poster">Cargando el mapa...</p>}>
        <AndesRenderer
          route={route}
          columns={split.columns}
          day={day}
          selectedId={selectedId}
          camera={camera}
          graphics={graphics}
          closeUp={closeUp}
          onSelect={(id) => (id === null ? close() : select(id))}
          onTimeScale={setTimeScale}
          onReady={() => setMapReady(true)}
          cameraApi={cameraApi}
          onView={tunerOpen ? setCamView : undefined}
          label={label}
        />
      </Suspense>
    </>
  ) : (
    <p role="status" className="notice andes-notice">
      Esta vista necesita WebGL2. La lista y la tabla de eventos muestran los mismos datos.
    </p>
  );


  const stage = (
    <div className="andes-stage">
      <AndesIntro ready={mapReady || view === 'table'} />
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

      <SlotPortal slot="nav">
        <div className="andes-nav" role="group" aria-label="Controles de la escena">
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
          <button
            type="button"
            className="chip"
            aria-pressed={tunerOpen}
            disabled={view !== 'map'}
            onClick={() => {
              if (!tunerOpen && cameraApi.current) setCamView(cameraApi.current.get());
              setTunerOpen(!tunerOpen);
            }}
          >
            Cámara en números
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
      </SlotPortal>

      <SlotPortal slot="progress">
        <AndesProgress percent={percent} onChange={(p) => dispatch({ type: 'setYear', year: pace.yearAt(p / 100) })} />
      </SlotPortal>

      {listOpen && (
        <div className="andes-list andes-glass">
          <EventList events={route.points} selectedId={selectedId} onSelect={select} />
        </div>
      )}

      {view === 'map' && tunerOpen && <CameraTuner api={cameraApi} view={camView} day={day} onGo={() => setCamera('free')} />}

      {selected && (
        <div className="andes-detail andes-glass">
          <EventPanel event={selected} onClose={close} />
        </div>
      )}

      <footer className="andes-foot">
        <p role="note">
          Imágenes satelitales y relieve: © MapTiler © OpenStreetMap contributors. Los lugares, las fechas intermedias y el trazado son aproximados.
        </p>
        {view === 'map' && <p>{figuresNote(startingMen(route.points) !== null)}</p>}
        <p>Fuentes: UNCuyo, Los Andes, Diario de Cuyo, Wikipedia, El Arcón de la Historia, MapTiler y OpenStreetMap. Detalle en «Fuentes y métodos».</p>
      </footer>
    </div>
  );

  return (
    <Dashboard
      title="Los Andes"
      sources={[]}
      views={[]}
      stage={stage}
      side={
        <AltitudeProfile
          points={profile}
          progress={crossed}
          events={route.points.map((p) => ({ progress: route.totalKm > 0 ? p.distanceKm / route.totalKm : 0, name: p.name }))}
        />
      }
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
          <Tile id="andes-spo2" label="Saturación de oxígeno (SpO₂)" note="Estimada por la altura; depende de cada persona">
            <span className="tile-value">{spo2 === null ? 'sin dato' : `${Math.round(spo2)} %`}</span>
          </Tile>
          <Tile id="andes-events" label="Eventos">
            <span className="tile-value">{route.points.length}</span>
          </Tile>
        </TileGrid>
      }
    />
  );
}
