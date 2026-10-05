import React, { useState } from 'react';
import type { QualityTier } from '../../runtime/capabilities';
import type { GraphicsToggles } from './graphics';

const TIERS: ReadonlyArray<{ value: 'auto' | QualityTier; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Bajo' }
];

const SWITCHES: ReadonlyArray<{ key: keyof GraphicsToggles; label: string; needsTier: boolean }> = [
  { key: 'snow', label: 'Nieve', needsTier: true },
  { key: 'shadows', label: 'Sombras', needsTier: true },
  { key: 'textures', label: 'Texturas', needsTier: true },
  { key: 'trees', label: 'Árboles', needsTier: false }
];

/**
 * The graphics options of the scene: the quality (Auto is what the device suggests) and each effect on or off, for a machine that
 * cannot draw it all. At Bajo the snow, the shadows and the textures are off whatever the switches say.
 */
export function GraphicsMenu({
  toggles,
  onToggle,
  tier,
  choice,
  onChoice
}: {
  toggles: GraphicsToggles;
  onToggle: (key: keyof GraphicsToggles, value: boolean) => void;
  tier: QualityTier;
  choice: 'auto' | QualityTier;
  onChoice: (choice: 'auto' | QualityTier) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="andes-graphics">
      <button type="button" className="chip" aria-expanded={open} aria-controls="andes-graphics-panel" onClick={() => setOpen(!open)}>
        Gráficos
      </button>
      {open && (
        <div id="andes-graphics-panel" className="andes-graphics-panel andes-glass" role="group" aria-label="Opciones de gráficos">
          <div role="radiogroup" aria-label="Calidad" className="andes-graphics-row">
            {TIERS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={choice === t.value}
                className="chip"
                onClick={() => onChoice(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="andes-graphics-note">Calidad en uso: {TIERS.find((t) => t.value === tier)?.label}</p>
          {SWITCHES.map((sw) => {
            const blocked = sw.needsTier && tier === 'low';
            return (
              <label key={sw.key} className="andes-graphics-switch">
                <input
                  type="checkbox"
                  checked={toggles[sw.key] && !blocked}
                  disabled={blocked}
                  onChange={(e) => onToggle(sw.key, e.target.checked)}
                />
                {sw.label}
                {blocked ? ' (no en calidad Baja)' : ''}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
