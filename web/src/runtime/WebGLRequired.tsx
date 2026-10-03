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
      <div role="status" aria-live="polite">
        <p>This view needs WebGL2. Your browser or device does not provide it.</p>
        <a href="references.html">Sources and methods</a>
      </div>
    );
  }
  if (tier === 'low') {
    return (
      <p role="status" aria-live="polite">
        This view runs in reduced quality on this device.
      </p>
    );
  }
  return null;
}
