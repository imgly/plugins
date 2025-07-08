import { describe, expect, it } from '@jest/globals';
import compactSeparators from '../utils/compactSeparators';

describe('compactSeparators', () => {
  it('should return empty array for empty input', () => {
    expect(compactSeparators([])).toEqual([]);
  });

  it('should remove leading separators', () => {
    expect(compactSeparators(['ly.img.separator', 'action1'])).toEqual([
      'action1'
    ]);
    expect(
      compactSeparators(['ly.img.separator', 'ly.img.separator', 'action1'])
    ).toEqual(['action1']);
  });

  it('should remove trailing separators', () => {
    expect(compactSeparators(['action1', 'ly.img.separator'])).toEqual([
      'action1'
    ]);
    expect(
      compactSeparators(['action1', 'ly.img.separator', 'ly.img.separator'])
    ).toEqual(['action1']);
  });

  it('should remove both leading and trailing separators', () => {
    expect(
      compactSeparators(['ly.img.separator', 'action1', 'ly.img.separator'])
    ).toEqual(['action1']);
    expect(
      compactSeparators([
        'ly.img.separator',
        'ly.img.separator',
        'action1',
        'ly.img.separator',
        'ly.img.separator'
      ])
    ).toEqual(['action1']);
  });

  it('should remove consecutive separators in between', () => {
    expect(
      compactSeparators([
        'action1',
        'ly.img.separator',
        'ly.img.separator',
        'action2'
      ])
    ).toEqual(['action1', 'ly.img.separator', 'action2']);
    expect(
      compactSeparators([
        'action1',
        'ly.img.separator',
        'ly.img.separator',
        'ly.img.separator',
        'action2'
      ])
    ).toEqual(['action1', 'ly.img.separator', 'action2']);
  });

  it('should handle multiple actions with single separators (should remain unchanged)', () => {
    expect(
      compactSeparators([
        'action1',
        'ly.img.separator',
        'action2',
        'ly.img.separator',
        'action3'
      ])
    ).toEqual([
      'action1',
      'ly.img.separator',
      'action2',
      'ly.img.separator',
      'action3'
    ]);
  });

  it('should handle complex cases with multiple consecutive separators', () => {
    expect(
      compactSeparators([
        'ly.img.separator',
        'ly.img.separator',
        'action1',
        'ly.img.separator',
        'ly.img.separator',
        'ly.img.separator',
        'action2',
        'ly.img.separator',
        'action3',
        'ly.img.separator',
        'ly.img.separator'
      ])
    ).toEqual([
      'action1',
      'ly.img.separator',
      'action2',
      'ly.img.separator',
      'action3'
    ]);
  });

  it('should return empty array when input contains only separators', () => {
    expect(compactSeparators(['ly.img.separator'])).toEqual([]);
    expect(
      compactSeparators([
        'ly.img.separator',
        'ly.img.separator',
        'ly.img.separator'
      ])
    ).toEqual([]);
  });

  it('should handle single action without separators', () => {
    expect(compactSeparators(['action1'])).toEqual(['action1']);
  });

  it('should work with generic types', () => {
    interface TestAction {
      id: string;
      name: string;
    }

    const actions: (TestAction | 'ly.img.separator')[] = [
      'ly.img.separator',
      { id: '1', name: 'Action 1' },
      'ly.img.separator',
      'ly.img.separator',
      { id: '2', name: 'Action 2' },
      'ly.img.separator'
    ];

    const result = compactSeparators(actions);
    expect(result).toEqual([
      { id: '1', name: 'Action 1' },
      'ly.img.separator',
      { id: '2', name: 'Action 2' }
    ]);
  });

  it('should preserve non-separator items in correct order', () => {
    expect(
      compactSeparators([
        'action1',
        'action2',
        'ly.img.separator',
        'action3',
        'action4'
      ])
    ).toEqual(['action1', 'action2', 'ly.img.separator', 'action3', 'action4']);
  });
});
