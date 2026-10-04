import { describe, expect, it } from 'vitest';
import { describeError } from '../../src/app/describeError';

describe('describeError', () => {
  it('uses the message of an Error', () => {
    expect(describeError(new Error('Failed to load forecast: Not Found'))).toBe('Failed to load forecast: Not Found');
  });

  it('uses a string as it is', () => {
    expect(describeError('boom')).toBe('boom');
  });

  it('reads a plain object as JSON', () => {
    expect(describeError({ code: 7 })).toBe('{"code":7}');
  });

  it('never throws for a value that cannot become a string: an object with no prototype, a circular one, a Symbol', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.a = 1;
    expect(() => describeError(bare)).not.toThrow();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(describeError(circular)).toBe('error desconocido');
    expect(describeError(Symbol('s'))).toBe('Symbol(s)');
  });

  it('says so for null and undefined', () => {
    expect(describeError(null)).toBe('error desconocido');
    expect(describeError(undefined)).toBe('error desconocido');
  });
});
