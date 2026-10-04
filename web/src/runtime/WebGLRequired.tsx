import React from 'react';
import { useQuality } from './CapabilityProvider';

/**
 * What a WebGL scene (the Andes scene) shows when the device cannot run it as is. No WebGL2: the view cannot render,
 * with a way out to the references page. WebGL2 but the low tier (weak device, data saver or `?quality=low`): the view
 * runs in reduced quality. A capable device: nothing.
 */
export function WebGLRequired() {
  const { caps, tier } = useQuality();

  if (!caps.webgl2) {
    return (
      <div role="status" aria-live="polite" className="notice">
        <p>Esta vista necesita WebGL2. Tu navegador o dispositivo no lo ofrece.</p>
        <a href="references.html">Fuentes y métodos</a>
      </div>
    );
  }
  if (tier === 'low') {
    return (
      <p role="status" aria-live="polite" className="notice">
        Esta vista funciona con calidad reducida en este dispositivo.
      </p>
    );
  }
  return null;
}
