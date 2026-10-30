import { describe, expect, it } from 'vitest';
import { buildDepartmentMap } from '../../src/charts/builders/provinceMap.js';

const geo = {
  provinceId: 'AR-J',
  features: ['Capital', 'Calingasta'].map((departamento) => ({
    properties: { departamento, cabecera: `${departamento} cabecera`, centroid: [-68, -31] as [number, number] }
  }))
};

describe('department map labels', () => {
  it('hides idle labels and reveals the hovered department', () => {
    const { option } = buildDepartmentMap(geo, 'San Juan');
    expect(option.geo.label.show).toBe(false);
    expect(option.geo.emphasis.label.show).toBe(true);
    expect(option.geo.regions).toEqual([]);
    expect(option.series[1].label?.show).toBe(false);
  });

  it('keeps only the selected department named and clears it on deselection', () => {
    const { option } = buildDepartmentMap(geo, 'San Juan', 'Calingasta');
    expect(option.geo.regions).toEqual([
      { name: 'Calingasta', label: { show: true, color: option.geo.emphasis.label.color, fontSize: 11 } }
    ]);
    expect(buildDepartmentMap(geo, 'San Juan', null).option.geo.regions).toEqual([]);
    expect(buildDepartmentMap(geo, 'San Juan', 'Unknown').option.geo.regions).toEqual([]);
  });
});
