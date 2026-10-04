import React from 'react';
import type { Chart3DSpec } from '../charts3d/types';
import { Bars3D } from './Bars3D';

/** The 3D renderers, one chunk. A spec kind picks its renderer. */
export default function Chart3D({ spec }: { spec: Chart3DSpec }) {
  switch (spec.kind) {
    case 'bars':
      return <Bars3D spec={spec} />;
  }
}
