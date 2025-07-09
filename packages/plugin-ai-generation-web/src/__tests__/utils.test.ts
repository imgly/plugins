import { describe, expect, it } from '@jest/globals';
import { getLabelFromId } from '../utils/utils';

describe('getLabelFromId', () => {
  it('should handle empty strings', () => {
    expect(getLabelFromId('')).toBe('');
  });

  it('should properly format snake_case strings', () => {
    expect(getLabelFromId('snake_case_id')).toBe('Snake Case Id');
    expect(getLabelFromId('another_snake_case')).toBe('Another Snake Case');
    expect(getLabelFromId('multi_word_variable_name')).toBe(
      'Multi Word Variable Name'
    );
  });

  it('should properly format kebab-case strings', () => {
    expect(getLabelFromId('kebab-case-id')).toBe('Kebab Case Id');
    expect(getLabelFromId('another-kebab-case')).toBe('Another Kebab Case');
    expect(getLabelFromId('multi-word-variable-name')).toBe(
      'Multi Word Variable Name'
    );
  });

  it('should properly format camelCase strings', () => {
    expect(getLabelFromId('camelCaseId')).toBe('Camel Case Id');
    expect(getLabelFromId('anotherCamelCase')).toBe('Another Camel Case');
    expect(getLabelFromId('multiWordVariableName')).toBe(
      'Multi Word Variable Name'
    );
  });

  it('should properly format PascalCase strings', () => {
    expect(getLabelFromId('PascalCaseId')).toBe('Pascal Case Id');
    expect(getLabelFromId('AnotherPascalCase')).toBe('Another Pascal Case');
    expect(getLabelFromId('MultiWordVariableName')).toBe(
      'Multi Word Variable Name'
    );
  });

  it('should handle mixed case formats', () => {
    expect(getLabelFromId('mixed_Case-format')).toBe('Mixed Case Format');
    expect(getLabelFromId('snake_with-kebab_andCamel')).toBe(
      'Snake With Kebab And Camel'
    );
    expect(getLabelFromId('Pascal_with-others')).toBe('Pascal With Others');
  });
});
