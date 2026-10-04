import * as generated from './generated.js';
import type { SchemaName } from './schemaNames';
import type { Validate, ValidationError } from './types';

export type TypedValidate<T> = ((data: unknown) => data is T) & { errors?: ValidationError[] | null };

/** The precompiled validator of a schema, as a type guard for T. */
export function validator<T>(name: SchemaName): TypedValidate<T> {
  const validate: Validate = generated[name];
  return validate as TypedValidate<T>;
}

/** The errors of the last run as one line, like Ajv's errorsText: "data/0/year must be >= 1810, ...". */
export function errorsText(errors: ValidationError[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'No errors';
  return errors.map((e) => `data${e.instancePath} ${e.message}`).join(', ');
}
