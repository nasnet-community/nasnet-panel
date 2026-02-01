/**
 * Tests for Schema Utilities
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  makePartial,
  mergeSchemas,
  pickFields,
  omitFields,
  optionalString,
  requiredString,
  numberFromString,
  booleanFromString,
} from '../schema-utils';

describe('Schema Utilities', () => {
  describe('makePartial', () => {
    it('should make all fields optional', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number(),
      });

      const partialSchema = makePartial(schema);

      // All fields should be optional
      expect(partialSchema.safeParse({}).success).toBe(true);
      expect(partialSchema.safeParse({ name: 'John' }).success).toBe(true);
      expect(partialSchema.safeParse({ name: 'John', email: 'test@test.com' }).success).toBe(true);
    });
  });

  describe('mergeSchemas', () => {
    it('should merge two schemas', () => {
      const schema1 = z.object({
        name: z.string(),
      });

      const schema2 = z.object({
        email: z.string().email(),
      });

      const merged = mergeSchemas(schema1, schema2);

      // Should require both fields
      expect(merged.safeParse({ name: 'John', email: 'test@test.com' }).success).toBe(true);
      expect(merged.safeParse({ name: 'John' }).success).toBe(false);
      expect(merged.safeParse({ email: 'test@test.com' }).success).toBe(false);
    });
  });

  describe('pickFields', () => {
    it('should pick only specified fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number(),
      });

      const picked = pickFields(schema, ['name', 'email']);

      // Should only validate name and email
      expect(picked.safeParse({ name: 'John', email: 'test@test.com' }).success).toBe(true);
      // Should not require age
      expect(Object.keys(picked.shape)).toEqual(['name', 'email']);
    });
  });

  describe('omitFields', () => {
    it('should omit specified fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number(),
      });

      const omitted = omitFields(schema, ['age']);

      // Should only validate name and email
      expect(omitted.safeParse({ name: 'John', email: 'test@test.com' }).success).toBe(true);
      // Should not include age
      expect(Object.keys(omitted.shape)).toEqual(['name', 'email']);
    });
  });

  describe('optionalString', () => {
    it('should transform empty string to undefined', () => {
      const schema = optionalString();

      expect(schema.parse('')).toBeUndefined();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(undefined)).toBeUndefined();
    });
  });

  describe('requiredString', () => {
    it('should require non-empty string', () => {
      const schema = requiredString();

      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse('').success).toBe(false);
    });

    it('should use custom error message', () => {
      const schema = requiredString('Name is required');

      const result = schema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name is required');
      }
    });
  });

  describe('numberFromString', () => {
    it('should parse string to number', () => {
      const schema = numberFromString();

      expect(schema.parse('42')).toBe(42);
      expect(schema.parse('3.14')).toBe(3.14);
    });

    it('should reject invalid numbers', () => {
      const schema = numberFromString();

      expect(schema.safeParse('not a number').success).toBe(false);
    });
  });

  describe('booleanFromString', () => {
    it('should parse string to boolean', () => {
      const schema = booleanFromString();

      expect(schema.parse('true')).toBe(true);
      expect(schema.parse('True')).toBe(true);
      expect(schema.parse('TRUE')).toBe(true);
      expect(schema.parse('1')).toBe(true);
      expect(schema.parse('false')).toBe(false);
      expect(schema.parse('0')).toBe(false);
      expect(schema.parse('anything')).toBe(false);
    });
  });
});
