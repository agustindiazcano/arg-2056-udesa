import React from 'react';
import ReactDOM from 'react-dom/client';
import { Root } from './app/Root';
import './styles/tokens.css';
import './styles/ui.css';
import { VercelMetrics } from './runtime/VercelMetrics';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
    <VercelMetrics />
  </React.StrictMode>
);
