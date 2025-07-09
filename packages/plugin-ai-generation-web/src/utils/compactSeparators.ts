/**
 * For the given array that contains strings `ly.img.separator` and other items,
 * this function will remove all leading and trailing separators,
 * as well as any consecutive separators in between.
 */
function compactSeparators<T>(
  quickActions: (T | 'ly.img.separator')[]
): (T | 'ly.img.separator')[] {
  if (quickActions.length === 0) {
    return [];
  }

  // Create a new array for the result
  const result = [...quickActions];

  // Remove separators at the beginning
  while (result.length > 0 && result[0] === 'ly.img.separator') {
    result.shift();
  }

  // Remove separators at the end
  while (
    result.length > 0 &&
    result[result.length - 1] === 'ly.img.separator'
  ) {
    result.pop();
  }

  // Remove consecutive separators
  return result.reduce<(T | 'ly.img.separator')[]>((acc, current) => {
    // Skip if current is a separator and previous was also a separator
    if (
      current === 'ly.img.separator' &&
      acc.length > 0 &&
      acc[acc.length - 1] === 'ly.img.separator'
    ) {
      return acc;
    }

    acc.push(current);
    return acc;
  }, []);
}

export default compactSeparators;
