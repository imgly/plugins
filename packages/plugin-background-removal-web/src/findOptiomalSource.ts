import type { Source } from '@cesdk/cesdk-js';

export const THRESHOLD = 1024;

function findOptimalSource(sourceSet: Source[], threshold = THRESHOLD) {
  if (sourceSet.length === 0) return undefined;

  const [over, below] = sourceSet.reduce(
    (acc: [Source[], Source[]], source) => {
      if (source.width >= threshold && source.height >= threshold) {
        acc[0].push(source);
      } else {
        acc[1].push(source);
      }
      return acc;
    },
    [[], []]
  );

  if (over.length > 0) {
    // Lowest resolution image that is over <THRESHOLD>x<THRESHOLD>
    return over.sort((a, b) => a.width * a.height - b.width * b.height)[0];
  } else {
    // Highest resolution image that is below <THRESHOLD>x<THRESHOLD>
    return below.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }
}

export default findOptimalSource;
