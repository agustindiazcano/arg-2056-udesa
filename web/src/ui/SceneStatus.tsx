import React from 'react';

export function SceneLoading() {
  return (
    <p role="status" className="fallback">
      Cargando...
    </p>
  );
}

export function SceneError() {
  return (
    <p role="alert" className="fallback scene-error">
      No se pudieron cargar los datos.
    </p>
  );
}
