/** One error of a validator, in the shape Ajv reports it. */
export interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

/** A precompiled validator: true when the data is valid; otherwise `errors` lists every problem. */
export interface Validate {
  (data: unknown): boolean;
  errors?: ValidationError[] | null;
}
