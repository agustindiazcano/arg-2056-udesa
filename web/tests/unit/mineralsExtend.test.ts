import { describe, it, expect } from 'vitest';
import { totals, breakdown } from '../../src/tour/resourcesData.js';
import { PROVINCE_MINING_BREAKDOWN } from '../../src/tour/provinceSectorBreakdown.js';
import { getDepartmentProjects } from '../../src/tour/provinceDrilldown.js';
import { searchGeo } from '../../src/ui/mapSearchLogic.js';

describe('Minerals extension C1 (res-minerals-extend)', () => {
  it('totals("mineria") includes copper, boron, and molybdenum alongside lithium, gold and silver', () => {
    const mineriaTotals = totals('mineria');
    const labels = mineriaTotals.map((t) => t.label);

    expect(labels).toContain('Exportaciones mineras de 2024');
    expect(labels).toContain('Recursos de litio');
    expect(labels).toContain('Recursos de cobre');
    expect(labels).toContain('Recursos de oro');
    expect(labels).toContain('Recursos de plata');
    expect(labels).toContain('Reservas de boro (boratos)');
    expect(labels).toContain('Potencial de molibdeno');

    const copper = mineriaTotals.find((t) => t.label === 'Recursos de cobre');
    expect(copper?.value).toBe('116,7');
    expect(copper?.unit).toMatch(/millones de toneladas/i);

    const boron = mineriaTotals.find((t) => t.label === 'Reservas de boro (boratos)');
    expect(boron?.value).toBe('3.ª');
    expect(boron?.unit).toMatch(/reserva mundial/i);

    const moly = mineriaTotals.find((t) => t.label === 'Potencial de molibdeno');
    expect(moly?.value).toBe('2,2+');
    expect(moly?.unit).toMatch(/millones de t/i);
  });

  it('breakdown("mineria") breaks out Boratos and Cobre/molibdeno preserving the 4.673 bn USD total', () => {
    const bd = breakdown('mineria');
    const labels = bd.parts.map((p) => p.label);

    expect(labels).toContain('Oro');
    expect(labels).toContain('Plata');
    expect(labels).toContain('Litio');
    expect(labels).toContain('Boratos');
    expect(labels).toContain('Cobre, molibdeno y resto');

    const total = bd.parts.reduce((sum, p) => sum + p.value, 0);
    expect(Math.round(total * 1000) / 1000).toBe(4.673);
  });

  it('PROVINCE_MINING_BREAKDOWN specifies borates, copper and molybdenum for Salta, San Juan and Catamarca', () => {
    const salta = PROVINCE_MINING_BREAKDOWN['AR-A']!;
    const saltaLabels = salta.map((p) => p.label);
    expect(saltaLabels.some((l) => /boratos/i.test(l))).toBe(true);
    expect(saltaLabels.some((l) => /cobre/i.test(l) && /molibdeno/i.test(l))).toBe(true);
    expect(salta.reduce((sum, p) => sum + p.value, 0)).toBe(1800);

    const sanJuan = PROVINCE_MINING_BREAKDOWN['AR-J']!;
    const sanJuanLabels = sanJuan.map((p) => p.label);
    expect(sanJuanLabels.some((l) => /cobre/i.test(l) && /molibdeno/i.test(l))).toBe(true);
    expect(sanJuan.reduce((sum, p) => sum + p.value, 0)).toBe(2600);
  });

  it('Taca Taca project is registered in Los Andes, Salta with official NI 43-101 parameters', () => {
    const projects = getDepartmentProjects('AR-A', 'los andes');
    const taca = projects.find((p) => p.name === 'Taca Taca');
    expect(taca).toBeDefined();
    expect(taca?.company).toBe('First Quantum Minerals');
    expect(taca?.kind).toMatch(/cobre/i);
    expect(taca?.kind).toMatch(/molibdeno/i);
    expect(taca?.investment).toBe(4232);
    expect(taca?.capacity).toMatch(/227 kt/);
    expect(taca?.capacity).toMatch(/2\.205 t/);
  });

  it('searchGeo searches and returns mining projects like Taca Taca linking to their department and province', () => {
    const results = searchGeo('taca taca');
    expect(results.length).toBeGreaterThan(0);
    const taca = results.find((r) => r.name === 'Taca Taca');
    expect(taca).toBeDefined();
    expect(taca?.type).toBe('proyecto');
    expect(taca?.provinceId).toBe('AR-A');
    expect(taca?.department).toBe('Los Andes');
    expect(taca?.subtitle).toMatch(/los andes/i);
  });
});
