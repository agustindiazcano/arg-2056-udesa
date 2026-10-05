import React, { useId } from 'react';
import { formatNumber } from '../../charts/format.js';
import { altitudeAtProgress, profileAreaPath, profileFrame, profilePath, profileTicks, profileX, profileY } from './profile.js';
import type { ProfilePoint } from './profile.js';

const WIDTH = 300;
const HEIGHT = 92;

/**
 * The altimetry of the crossing: the altitude along the route, the part already walked filled, and a marker that follows the army.
 * It is a picture of numbers that are also in the tiles and the table, so the label says them in words.
 */
export function AltitudeProfile({
  points,
  progress,
  events
}: {
  points: readonly ProfilePoint[];
  /** how much of the route the army has walked, 0 to 1 */
  progress: number;
  events: ReadonlyArray<{ progress: number; name: string }>;
}) {
  const clipId = useId();
  if (points.length === 0) {
    return (
      <section aria-label="Perfil de altitud" className="andes-profile">
        <h2 className="panel-title">Perfil de altitud</h2>
        <p className="andes-profile-empty">sin dato</p>
      </section>
    );
  }
  const frame = profileFrame(points, WIDTH, HEIGHT);
  const altitude = altitudeAtProgress(points, progress) ?? points[0]!.altitudeM;
  const highest = Math.max(...points.map((p) => p.altitudeM));
  const x = profileX(frame, progress);
  const y = profileY(frame, altitude);
  const label = `Perfil de altitud del cruce: desde ${formatNumber(points[0]!.altitudeM, 0)} m hasta ${formatNumber(
    points[points.length - 1]!.altitudeM,
    0
  )} m, con un máximo de ${formatNumber(highest, 0)} m; el ejército va por ${formatNumber(altitude, 0)} m.`;
  return (
    <section aria-label="Perfil de altitud" className="andes-profile">
      <h2 className="panel-title">Perfil de altitud</h2>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={label}
        data-testid="andes-profile"
        data-progress={progress.toFixed(3)}
        className="profile-svg"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={x} height={HEIGHT} />
          </clipPath>
        </defs>
        {profileTicks(frame).map((t) => (
          <g key={t}>
            <line className="profile-grid" x1={frame.padL} x2={WIDTH - frame.padR} y1={profileY(frame, t)} y2={profileY(frame, t)} />
            <text className="profile-tick" x={frame.padL - 4} y={profileY(frame, t)} textAnchor="end" dominantBaseline="middle">
              {formatNumber(t, 0)}
            </text>
          </g>
        ))}
        <path className="profile-area" d={profileAreaPath(frame, points)} />
        <path className="profile-done" d={profileAreaPath(frame, points)} clipPath={`url(#${clipId})`} />
        <path className="profile-line" d={profilePath(frame, points)} />
        {events.map((e) => (
          <circle key={e.name} className="profile-event" cx={profileX(frame, e.progress)} cy={profileY(frame, altitudeAtProgress(points, e.progress) ?? frame.min)} r={2}>
            <title>{e.name}</title>
          </circle>
        ))}
        <line className="profile-cursor" x1={x} x2={x} y1={frame.padT} y2={HEIGHT - frame.padB} />
        <circle className="profile-marker" cx={x} cy={y} r={4} />
      </svg>
      <p className="profile-now">
        <span>Ahora</span> <b>{formatNumber(altitude, 0)} m</b>
      </p>
    </section>
  );
}
