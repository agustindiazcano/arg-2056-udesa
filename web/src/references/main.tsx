import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/tokens.css';
import './references.css';
import { ReferencesApp } from './ReferencesPage';
import { VercelMetrics } from '../runtime/VercelMetrics';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ReferencesApp />
    <VercelMetrics />
  </React.StrictMode>
);
