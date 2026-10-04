import React from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { Bars3D } from './Bars3D';
import { Lines3D } from './Lines3D';
import { Map3D } from './Map3D';

/** The 3D renderers, one chunk. A spec kind picks its renderer. */
export default function Chart3D({ spec }: { spec: Chart3DSpec }) {
  switch (spec.kind) {
    case 'bars':
      return <Bars3D spec={spec} />;
    case 'map':
      return <Map3D spec={spec} />;
    case 'lines':
      return <Lines3D spec={spec} />;
  }
}
