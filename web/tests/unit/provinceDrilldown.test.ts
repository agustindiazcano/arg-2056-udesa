import { describe, it, expect } from 'vitest';
import {
  getProvinceDepartmentProduction,
  getDepartmentProjects,
  provinceDrilldownData
} from '../../src/tour/provinceDrilldown.js';

describe('provinceDrilldownData (C3 & C4)', () => {
  describe('when no province is selected', () => {
    it('returns national provinces ranking', () => {
      const data = provinceDrilldownData('mineria', null);
      expect(data.kind).toBe('provinces');
      expect(data.title).toBe('Minería: provincias que producen');
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0]?.name).toBeDefined();
    });
  });

  describe('when a province with department data is selected (e.g. Salta)', () => {
    it('returns department ranking for Salta in mineria', () => {
      const depts = getProvinceDepartmentProduction('mineria', 'AR-A');
      expect(depts).not.toBeNull();
      const data = provinceDrilldownData('mineria', 'AR-A');
      expect(data.kind).toBe('departments');
      expect(data.title).toBe('Salta: producción minera por departamento');
      expect(data.rows.length).toBeGreaterThan(0);
      // Los Andes is the primary mining department in Salta
      const losAndes = data.rows.find((r) => r.name.toLowerCase().includes('los andes'));
      expect(losAndes).toBeDefined();
      expect(losAndes?.value).toBeGreaterThan(0);
    });

    it('returns department ranking for San Juan in mineria', () => {
      const data = provinceDrilldownData('mineria', 'AR-J');
      expect(data.kind).toBe('departments');
      expect(data.title).toBe('San Juan: producción minera por departamento');
      const iglesia = data.rows.find((r) => r.name.toLowerCase().includes('iglesia'));
      expect(iglesia).toBeDefined();
    });
  });

  describe('when a province WITHOUT department data is selected', () => {
    it('falls back to mineral/sector production of that province', () => {
      // Tierra del Fuego (AR-V) has small or no department mining data
      const data = provinceDrilldownData('mineria', 'AR-R'); // Rio Negro has no department mining data
      expect(data.kind).toBe('minerals');
      expect(data.title).toBe('Río Negro: producción por mineral');
      expect(data.rows.length).toBeGreaterThan(0);
    });
  });

  describe('getDepartmentProjects (C4)', () => {
    it('returns mining projects for Los Andes, Salta', () => {
      const projects = getDepartmentProjects('AR-A', 'Los Andes');
      expect(projects.length).toBeGreaterThan(0);
      const names = projects.map((p) => p.name);
      expect(names).toContain('Taca Taca');
      expect(names).toContain('Centenario-Ratones');
    });

    it('returns empty array when department has no registered projects', () => {
      const projects = getDepartmentProjects('AR-A', 'Cerrillos');
      expect(projects).toEqual([]);
    });

    it('returns empty array for unknown department or province', () => {
      expect(getDepartmentProjects('AR-A', 'Nonexistent')).toEqual([]);
    });
  });
});
