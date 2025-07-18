// src/types/collection.ts

export interface Collection {
  id: string;
  name: string;
  type: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    options?: Record<string, unknown>;
  }>;
  indexes?: string[];
}
