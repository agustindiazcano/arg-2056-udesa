// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { slideCsv, tableCsv, referencesCsv, tableJson, slideJson, referencesJson } from '../../src/datasets/csv';
import { REFERENCES } from '../../src/datasets/references';
import { buildSlides } from '../../src/datasets/slides';
import { DataPage } from '../../src/datasets/DataPage';
import { SECTIONS } from '../../src/types/scene';
import { SECTION_LABELS } from '../../src/content/sectionLabels';
import { reduce } from '../../src/state/reducer';
import { useStore } from '../../src/state/store';

describe('the CSV and JSON exports of a table', () => {
  it('starts with the byte order mark, ends lines with CRLF and keeps numbers as they are', () => {
    const csv = tableCsv({ id: 't', title: 'T', columns: ['Año', 'PBI'], rows: [[2025, 640.5], [2026, null]] });
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe('﻿Año,PBI\r\n2025,640.5\r\n2026,\r\n');
  });

  it('quotes a field with a comma, a quote or a line break', () => {
    const csv = tableCsv({ id: 't', title: 'T', columns: ['a'], rows: [['x, y'], ['di "hola"'], ['a\nb']] });
    expect(csv).toContain('"x, y"');
    expect(csv).toContain('"di ""hola"""');
    expect(csv).toContain('"a\nb"');
  });

  it('puts every table of a slide in one file, each after its title and a blank line', () => {
    const csv = slideCsv({
      id: '1',
      label: '1 · Uno',
      title: 'Uno',
      mock: true,
      tables: [
        { id: 'a', title: 'Primera', columns: ['x'], rows: [[1]] },
        { id: 'b', title: 'Segunda', columns: ['y'], rows: [[2]] }
      ],
      refs: []
    });
    expect(csv).toBe('﻿Primera\r\nx\r\n1\r\n\r\nSegunda\r\ny\r\n2\r\n');
  });

  it('makes the CSV of the references with their label, link and state', () => {
    const csv = referencesCsv(REFERENCES);
    expect(csv.split('\r\n')[0]).toBe('﻿id,fuente,url,estado');
    expect(csv).toContain('https://www.indec.gob.ar/ftp/cuadros/economia/productividad_stock_capital_10_26.pdf');
  });

  it('converts a table to JSON objects with column names as keys', () => {
    const json = tableJson({ id: 't', title: 'T', columns: ['Año', 'PBI'], rows: [[2025, 640.5], [2026, null]] });
    expect(json).toEqual([
      { Año: 2025, PBI: 640.5 },
      { Año: 2026, PBI: null }
    ]);
  });

  it('converts a full slide with all its tables to structured JSON', () => {
    const json = slideJson({
      id: '1',
      label: '1 · Uno',
      title: 'Uno',
      mock: true,
      tables: [{ id: 't1', title: 'T1', columns: ['col'], rows: [['val']] }],
      refs: []
    });
    expect(json.id).toBe('1');
    expect(json.tables[0]!.rows).toEqual([{ col: 'val' }]);
  });

  it('converts references to structured JSON', () => {
    const json = referencesJson(REFERENCES);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('id');
    expect(json[0]).toHaveProperty('url');
  });
});

describe('the slides with data', () => {
  const slides = buildSlides();

  it('has a slide per step with data, in order, each with a number, a title and tables', () => {
    expect(slides.map((s) => s.id)).toEqual(['0', '8', '3', '21', '28', '16', '26', '5', '12', '14', '27', '29', '17', 'sim']);
    for (const [i, s] of slides.entries()) {
      expect(s.title.length).toBeGreaterThan(0);
      // the number of the label is the position of the slide (0, 1, 2...), not its id
      expect(s.label.startsWith(s.id === 'sim' ? 'Simulador' : `${i + 1} · `)).toBe(true);
      expect(s.tables.length).toBeGreaterThan(0);
      for (const t of s.tables) {
        expect(t.rows.length).toBeGreaterThan(0);
        for (const r of t.rows) expect(r).toHaveLength(t.columns.length);
      }
    }
  });

  it('marks the made-up slides, and the productivity slide as real data with its references', () => {
    expect(slides.find((s) => s.id === '12')!.mock).toBe(true);
    const prod = slides.find((s) => s.id === '14')!;
    expect(prod.mock).toBe(false);
    expect(prod.tables.map((t) => t.id)).toEqual(['tfp-level', 'tfp-change', 'oph-level', 'oph-change', 'cumulative']);
    expect(prod.tables[0]!.columns).toEqual(['Año', 'Argentina', 'Estados Unidos', 'Chile', 'Brasil']);
    expect(prod.tables[0]!.rows.at(-1)).toEqual([2023, 72.6, 151, 98.8, 100.9]);
    expect(prod.refs).toEqual(expect.arrayContaining(['P6', 'P7']));
  });

  it('every reference of a slide exists in the list of references, and every reference has a link', () => {
    const ids = new Set(REFERENCES.map((r) => r.id));
    for (const s of slides) for (const r of s.refs) expect(ids.has(r)).toBe(true);
    for (const r of REFERENCES) expect(r.url).toMatch(/^https:\/\//);
  });
});

describe('the Data section', () => {
  it('is a section after the Simulador, called Data', () => {
    expect(SECTIONS.indexOf('data')).toBe(SECTIONS.indexOf('simulator') + 1);
    expect(SECTION_LABELS.data).toBe('Data');
    const entered = reduce(useStore.getState(), { type: 'setSection', section: 'data' });
    expect(entered.section).toBe('data');
    expect(reduce(entered, { type: 'nextScene' })).toBe(entered);
  });
});

describe('the Data page', () => {
  let saved: string[];
  beforeEach(() => {
    saved = [];
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download);
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('has tabs for Data, Referencias, Metodología, and Uso de AI, showing the slide selector on Data', () => {
    render(<DataPage />);
    expect(screen.getByRole('button', { name: 'Data' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Referencias' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Metodología' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Uso de AI' })).toBeTruthy();

    const select = screen.getByRole('combobox', { name: 'Diapositiva' }) as HTMLSelectElement;
    const options = within(select).getAllByRole('option').map((o) => o.textContent);
    expect(options[0]).toBe('1 · El PBI de Argentina desde 1960');
    expect(options).toContain('10 · Productividad');
    expect(options.at(-1)).toMatch(/^Simulador/);
    expect(screen.getByRole('heading', { name: '1 · El PBI de Argentina desde 1960' })).toBeTruthy();
  });

  it('switches between Data, Referencias, Metodología, and Uso de AI tabs', () => {
    render(<DataPage />);
    // Click Referencias tab
    fireEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    expect(screen.getByRole('heading', { name: 'Referencias' })).toBeTruthy();
    const link = screen.getAllByRole('link', { name: /INDEC/ })[0] as HTMLAnchorElement;
    expect(link.href).toContain('indec.gob.ar');
    expect(link.target).toBe('_blank');

    // Click Metodología tab
    fireEvent.click(screen.getByRole('button', { name: 'Metodología' }));
    expect(screen.getByRole('heading', { name: 'Metodología y pipeline de datos' })).toBeTruthy();
    expect(screen.getByText(/La regla del 70/)).toBeTruthy();
    expect(screen.getByText(/Simulador del PBI y Proyecciones a 2056/)).toBeTruthy();

    // Click Uso de AI tab
    fireEvent.click(screen.getByRole('button', { name: 'Uso de AI' }));
    expect(screen.getByRole('heading', { name: 'Uso de AI y flujo de ingeniería' })).toBeTruthy();
    expect(screen.getByRole('table', { name: /Comparativa directa entre Branch tradicional y Git Worktree/i })).toBeTruthy();
    expect(screen.getAllByText(/Antigravity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Playwright/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Vitest/i).length).toBeGreaterThan(0);

    // Click back to Data tab
    fireEvent.click(screen.getByRole('button', { name: 'Data' }));
    expect(screen.getByRole('combobox', { name: 'Diapositiva' })).toBeTruthy();
  });

  it('shows only the tables of the chosen slide, not those of the others', () => {
    render(<DataPage />);
    const select = screen.getByRole('combobox', { name: 'Diapositiva' });
    expect(screen.queryByRole('heading', { name: '10 · Productividad' })).toBeNull();
    expect(screen.queryByRole('table', { name: 'PTF, índice 1955 = 100' })).toBeNull();
    fireEvent.change(select, { target: { value: '14' } });
    expect(screen.getByRole('heading', { name: '10 · Productividad' })).toBeTruthy();
    expect(screen.getAllByRole('table')).toHaveLength(5);
    expect(screen.queryByRole('heading', { name: '1 · El PBI de Argentina desde 1960' })).toBeNull();
    fireEvent.change(select, { target: { value: '12' } });
    expect(screen.getAllByRole('heading', { level: 3 })[0]!.textContent).toBe('9 · Composición del PBI y exportaciones por complejo');
  });

  it('downloads CSV and JSON for slides, tables, and references', () => {
    render(<DataPage />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Diapositiva' }), { target: { value: '14' } });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar CSV de la diapositiva' }));
    });
    expect(saved).toEqual(['diapositiva-14-productividad.csv']);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar JSON de la diapositiva' }));
    });
    expect(saved.at(-1)).toBe('diapositiva-14-productividad.json');

    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: /^Descargar CSV: / })[0]!);
    });
    expect(saved).toHaveLength(3);

    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: /^Descargar JSON: / })[0]!);
    });
    expect(saved).toHaveLength(4);

    // Switch to Referencias tab
    fireEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar referencias (CSV)' }));
    });
    expect(saved.at(-1)).toBe('referencias.csv');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Descargar referencias (JSON)' }));
    });
    expect(saved.at(-1)).toBe('referencias.json');
  });
});
