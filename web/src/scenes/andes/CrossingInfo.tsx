import React, { useEffect } from 'react';

/**
 * The pop-up that explains how the crossing was made: six columns, four secondary ones to distract the enemy and the main force split in two that met
 * again at Curimón before Chacabuco. The columns, roads and the place follow `forces.ts` and `docs/references.md` (H5, H16: the meeting at Curimón on
 * 8 or 9 February); the sources call the artillery and its supplies «parque», so the text does too. Closes with its button or Escape. It opens by itself, so it
 * does not take the focus (the keys of the scene, like Space for play, keep working).
 */
export function CrossingInfo({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <section className="andes-crossing andes-glass" role="dialog" aria-labelledby="andes-crossing-title">
      <header>
        <h2 id="andes-crossing-title">Cómo fue el cruce</h2>
        <button type="button" className="chip" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
      </header>
      <p>
        El Ejército de los Andes no cruzó la cordillera por un solo paso: lo hizo en <strong>seis columnas</strong> que avanzaron al mismo tiempo por pasos distintos.
      </p>
      <ul>
        <li>
          <strong>Cuatro columnas secundarias</strong>, dos por el norte (Cabot, por el paso de Guana, y Zelada, por Come-Caballos) y dos por el sur (Freire, por el Planchón, y
          Lemos, por el Portillo). Su misión era distraer al enemigo y obligarlo a dividir sus fuerzas.
        </li>
        <li>
          <strong>La fuerza principal, dividida en dos</strong>. Una columna al mando de San Martín cruzó por el paso de Los Patos. La otra, al mando de Las Heras, siguió el
          camino de Uspallata con la infantería, la artillería y el parque (municiones y provisiones).
        </li>
      </ul>
      <p>Las dos columnas se reunieron en Curimón, pocos días antes de la batalla de Chacabuco.</p>
    </section>
  );
}
