import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber } from '../../charts/format.js';
import { useDataset } from '../../data/useDataset.js';
import { Dashboard } from '../../dashboard/Dashboard.js';
import { useQualityOptional } from '../../runtime/CapabilityProvider.js';
import type { QualityTier } from '../../runtime/capabilities.js';
import { WebGLRequired } from '../../runtime/WebGLRequired.js';
import { useStore } from '../../state/store.js';
import { Tile, TileGrid } from '../../ui/Tile.js';
import { SlotPortal } from '../../dashboard/SlotPortal.js';
import { SceneError, SceneLoading } from '../../ui/SceneStatus.js';
import { startingMen } from './column.js';
import { MAIN_FORCE_ID } from './forces.js';
import { campaignEndDay, splitColumns } from './columns.js';
import { figuresNote, parseAndesEvents } from './data.js';
import { EventList, EventPanel } from './Panel.js';
import type { CameraMode } from './camera.js';
import { AltitudeProfile } from './AltitudeProfile.js';
import { BattleReport } from './BattleReport.js';
import { AndesIntro } from './AndesIntro.js';
import { CameraTuner } from './CameraTuner.js';
import { ForceButtons } from './ForceButtons.js';
import { ForceInfo } from './ForceInfo.js';
import type { CameraApi, CameraView } from './cameraKeyframes.js';
import { loadToggles, resolveGraphics } from './graphics.js';
import type { GraphicsToggles } from './graphics.js';
import { spo2Estimate } from './physiology.js';
import { altitudeProfile } from './profile.js';
import { AndesProgress } from './Progress.js';
import { buildRoute, campaignDateText, paceClock, paceProgress, positionAt } from './timeline.js';

// MapLibre and Three.js live in their own chunk: it loads only when the scene is opened.
const AndesRenderer = lazy(() => import('./MapLibreRenderer.js'));

/** A screen this wide or narrower is a laptop. */
const LAPTOP_QUERY = '(max-width: 1600px)';

const CAMERA_BUTTONS: ReadonlyArray<{ mode: CameraMode; text: string }> = [
  { mode: 'aerial', text: 'Aérea' },
  { mode: 'map', text: 'Vista de mapa' }
];

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
  const [tourPlay, setTourPlay] = useState(0);
  const [focus, setFocus] = useState<{ id: string; n: number; near: boolean } | null>(null);
  /** the force the camera follows as the clock runs: chosen in a button or on the map, until the camera is set free */
  const [followId, setFollowId] = useState<string | null>(null);
  const [activeForce, setActiveForce] = useState<string | null>(null);
  /** the intro (the clouds, the camera tour and the spotlight over each force) is going on: the button "Saltar intro" shows until it is over */
  const [introOn, setIntroOn] = useState(true);
  const [skipIntro, setSkipIntro] = useState(false);
  /** grows each time the button of the battle of Chacabuco is pressed */
  const [battleShow, setBattleShow] = useState(0);
  const tourCount = useRef(0);
  const playTour = useCallback(() => {
    setIntroOn(true);
    tourCount.current += 1;
    setTourPlay(tourCount.current);
  }, []);
  const cameraApi = useRef<CameraApi | null>(null);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [camView, setCamView] = useState<CameraView>({ lon: -70, lat: -32, zoom: 6, pitch: 40, bearing: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraMode>('free');
  const [toggles] = useState<GraphicsToggles>(loadToggles);
  // the dates and events are a dropdown, closed at first, so the left side of the map stays free
  const [eventsOpen, setEventsOpen] = useState(false);
  // the panel of the right (the minimap, the profile) is folded away by default on a laptop, where the map needs the room
  const [sideOpen, setSideOpen] = useState(() => !(typeof window !== 'undefined' && window.matchMedia?.(LAPTOP_QUERY).matches));
  const opener = useRef<HTMLElement | null>(null);
  const selected = route.points.find((p) => p.id === selectedId) ?? null;

  const select = useCallback(
    (id: string, from?: HTMLElement) => {
      if (from) opener.current = from;
      setSelectedId(id);
      // the battle of Chacabuco: the clock goes to the end of the crossing, when the forces have arrived and stand in their lines
      const chosen = route.points.find((p) => p.id === id);
      if (chosen && /batalla/i.test(chosen.name)) dispatch({ type: 'setYear', year: pace.yearAt(1) });
      // a combat before the battle: the clock goes to its day, when the royalists (red balls and their flag) are on the place
      else if (chosen && /combate/i.test(chosen.name) && route.totalKm > 0) dispatch({ type: 'setYear', year: pace.yearAt(chosen.distanceKm / route.totalKm) });
    },
    [route, dispatch, pace]
  );
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

  /** The camera starts following a force (`near`: from close by, `false`: from afar) and keeps following it as the clock runs. */
  const followForce = (id: string, near: boolean) => {
    setCamera('free');
    setActiveForce(id);
    setFollowId(id);
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1, near }));
  };
  /** The reader skips the intro: the clouds leave, the tour and the spotlight stop, and the camera is left pointing at the main force. */
  const skipTheIntro = () => {
    setSkipIntro(true);
    setIntroOn(false);
    setTourPlay(0);
    setFocus((f) => ({ id: MAIN_FORCE_ID, n: (f?.n ?? 0) + 1, near: false }));
  };
  /** The button of the battle of Chacabuco: the progress goes to 100 %, the light falls on the field with its name and the camera goes over the two lines. */
  const showBattle = () => {
    setFollowId(null);
    setCamera('free');
    setSkipIntro(true);
    setIntroOn(false);
    setTourPlay(0);
    dispatch({ type: 'setYear', year: pace.yearAt(1) });
    setBattleShow((n) => n + 1);
  };
  /** The camera stops following a force and goes back to the reader's hands. */
  const freeCamera = () => {
    setFollowId(null);
    setCamera('free');
  };

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
          followId={followId}
          onSelect={(id) => (id === null ? close() : select(id))}
          onTimeScale={setTimeScale}
          onReady={() => setMapReady(true)}
          cameraApi={cameraApi}
          tourPlay={tourPlay}
          focusForce={focus}
          onFocusForce={(id) => followForce(id, false)}
          onTourEnd={() => setTourPlay(0)}
          onIntroEnd={() => setIntroOn(false)}
          battleShow={battleShow}
          onView={tunerOpen ? setCamView : undefined}
          label={label}
        />
      </Suspense>
    </>
  ) : (
    <p role="status" className="notice andes-notice">
      Esta vista necesita WebGL2. La lista de eventos muestra los mismos datos.
    </p>
  );


  const stage = (
    <div className="andes-stage">
      <AndesIntro ready={mapReady} skip={skipIntro} onDone={(skipped) => {
          if (!skipped) playTour();
        }} />
      <div className="andes-canvas">{map}</div>

      <div className="andes-forces-top">
        <ForceButtons
          active={activeForce}
          onGo={(id) => {
            followForce(id, false);
          }}
        />
      </div>

      {introOn && quality?.caps.webgl2 && (
        <button type="button" className="andes-intro-skip" onClick={skipTheIntro}>
          Saltar intro
        </button>
      )}

      <button
        type="button"
        className="chip andes-side-toggle"
        aria-expanded={sideOpen}
        aria-label="Panel lateral"
        title={sideOpen ? 'Ocultar el panel de la derecha' : 'Mostrar el panel de la derecha'}
        onClick={() => setSideOpen(!sideOpen)}
      >
        <span aria-hidden="true">{sideOpen ? '▸' : '◂'}</span>
      </button>

      <header className="andes-title andes-glass">
        <h1>Los Andes</h1>
        <p>El cruce de 1817 sobre el terreno</p>
      </header>

      <div className="andes-nav andes-modes" role="group" aria-label="Controles de la escena">
        <button type="button" className="chip" onClick={showBattle}>
          Batalla de Chacabuco
        </button>
        {CAMERA_BUTTONS.map(({ mode, text }) => (
          <button key={mode} type="button" className="chip" aria-pressed={camera === mode} onClick={() => {
              setFollowId(null);
              setCamera(camera === mode ? 'free' : mode);
            }}>
            {text}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            setFollowId(null);
            setCamera('free');
            playTour();
          }}
        >
          Tour
        </button>
        <button type="button" className="chip" onClick={() => followForce(followId ?? activeForce ?? MAIN_FORCE_ID, true)}>
          Ver de cerca
        </button>
        <button type="button" className="chip" onClick={() => followForce(followId ?? activeForce ?? MAIN_FORCE_ID, false)}>
          Ver de lejos
        </button>
        <button type="button" className="chip" aria-pressed={camera === 'free' && followId === null} onClick={freeCamera}>
          Cámara libre
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={tunerOpen}
          onClick={() => {
            if (!tunerOpen && cameraApi.current) setCamView(cameraApi.current.get());
            setTunerOpen(!tunerOpen);
          }}
        >
          Cámara en números
        </button>
      </div>

      <SlotPortal slot="progress">
        <AndesProgress percent={percent} onChange={(p) => dispatch({ type: 'setYear', year: pace.yearAt(p / 100) })} />
      </SlotPortal>

      <div className="andes-list andes-glass">
        <button type="button" className="andes-list-toggle" aria-expanded={eventsOpen} aria-controls="andes-events" onClick={() => setEventsOpen(!eventsOpen)}>
          <span>Eventos del cruce ({route.points.length})</span>
          <span aria-hidden="true">{eventsOpen ? '▴' : '▾'}</span>
        </button>
        <div id="andes-events" hidden={!eventsOpen}>
          {eventsOpen && <EventList events={route.points} selectedId={selectedId} onSelect={select} />}
        </div>
      </div>

      {<ForceInfo id={activeForce} onClose={() => setActiveForce(null)} />}

      {tunerOpen && <CameraTuner api={cameraApi} view={camView} day={day} onGo={() => setCamera('free')} />}

      {selected && (
        <div className="andes-detail andes-glass">
          <EventPanel event={selected} onClose={close} />
        </div>
      )}

      {selected?.outcome && <BattleReport event={selected} />}

      <footer className="andes-foot">
        <button type="button" className="andes-foot-btn" aria-label="Créditos, fuentes y aclaraciones" aria-describedby="andes-foot-tip">
          i
        </button>
        <div id="andes-foot-tip" className="andes-foot-tip">
        <p role="note">
          Imágenes satelitales y relieve: © MapTiler © OpenStreetMap contributors. Los lugares, las fechas intermedias y el trazado son aproximados.
        </p>
        {<p>{figuresNote(startingMen(route.points) !== null)}</p>}
        <p>Fuentes: UNCuyo, Los Andes, Diario de Cuyo, Wikipedia, El Arcón de la Historia, MapTiler y OpenStreetMap. Detalle en «Fuentes y métodos».</p>
        </div>
      </footer>
    </div>
  );

  return (
    <Dashboard
      title="Los Andes"
      sources={[]}
      views={[]}
      stage={stage}
      sideHidden={!sideOpen}
      side={
        <AltitudeProfile
          points={profile}
          progress={crossed}
          events={route.points.map((p) => ({ progress: route.totalKm > 0 ? p.distanceKm / route.totalKm : 0, name: p.name }))}
        />
      }
      tiles={
        <TileGrid>
          <Tile id="andes-date" label="Fecha">
            <span className="tile-value">{campaignDateText(day)}</span>
          </Tile>
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
