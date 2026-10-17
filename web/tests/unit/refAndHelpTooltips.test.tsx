// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RefLink, refNumber, shortRefLabel } from '../../src/ui/RefLink';
import { ChartHelp } from '../../src/ui/ChartHelp';
import { REFERENCES } from '../../src/datasets/references';

afterEach(cleanup);

describe('RefLink numbered references', () => {
  it('assigns 1-based canonical numbers to every reference in REFERENCES', () => {
    expect(refNumber(REFERENCES[0]!.id)).toBe(1);
    const fmiIdx = REFERENCES.findIndex((r) => r.id === 'F1');
    expect(refNumber('F1')).toBe(fmiIdx + 1);
  });

  it('extracts a concise short label from a full reference description', () => {
    expect(shortRefLabel('FMI, World Economic Outlook (API SDMX)')).toBe('FMI');
    expect(shortRefLabel('Banco Mundial, WDI, todos los países')).toBe('Banco Mundial');
    expect(shortRefLabel('Penn World Table 11.0 (Groningen Growth and Development Centre)')).toBe('Penn World Table 11.0');
  });

  it('renders a compact numbered link without native title attribute, shows URL tooltip on hover, and opens in a new tab', () => {
    render(<RefLink id="F1" />);
    const num = refNumber('F1');
    const link = screen.getByRole('link', { name: /FMI, World Economic Outlook/i }) as HTMLAnchorElement;
    expect(link.getAttribute('title')).toBeNull();
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(link.textContent).toContain(`[${num}]`);
    expect(link.textContent).toContain('FMI');

    // Hover shows the custom styled tooltip with the URL text
    fireEvent.mouseEnter(link);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('https://www.imf.org/external/datamapper/NGDPD@WEO/ARG');

    fireEvent.mouseLeave(link);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('ChartHelp question-mark tooltip and popup', () => {
  it('shows custom styled tooltip on hover without native title attribute, and opens a modal dialog on click', () => {
    render(
      <ChartHelp
        title="Crecimiento real del PBI"
        paragraphs={['El PBI real mide el valor de la producción a precios constantes de 2015.']}
        how="Mové el control del año para explorar la serie."
        refs={['W5', 'F1']}
      />
    );

    const btn = screen.getByRole('button', { name: /Explicación: Crecimiento real del PBI/i });
    expect(btn.getAttribute('title')).toBeNull();
    expect(btn.textContent).toBe('?');

    // Hover displays the custom styled tooltip
    fireEvent.mouseEnter(btn);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('El PBI real mide el valor de la producción a precios constantes de 2015.');

    // Click opens the popup dialog with full explanation and numbered references
    fireEvent.click(btn);
    const dialog = screen.getByRole('dialog', { name: /Crecimiento real del PBI/i });
    expect(dialog.textContent).toContain('Cómo leer este gráfico');
    expect(dialog.textContent).toContain('Mové el control del año para explorar la serie.');
    expect(dialog.textContent).toContain(`[${refNumber('W5')}]`);

    // Close button dismisses the dialog
    fireEvent.click(screen.getByRole('button', { name: /Cerrar explicación/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
