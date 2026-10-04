import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/tokens.css';
import './styles/ui.css';
import { VercelMetrics } from './runtime/VercelMetrics';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    <VercelMetrics />
  </React.StrictMode>
);
