/**
 * Given several parallel sensor readings for the same metric (e.g. the
 * three temperature sensors airTemp/bmpTemp/shtTemp), computes the
 * per-timestamp min, max, and average — the three series a band chart
 * needs. Used by SensorBandChart.tsx.
 *
 * Keeping this separate from the chart component means it can be reused
 * once real API data arrives: whatever fetches a station's history just
 * calls computeSensorBand([airTempHistory, bmpTempHistory, shtTempHistory])
 * instead of duplicating this math in the page.
 */
export function computeSensorBand(sensorSeries: number[][]) {
  const length = sensorSeries[0]?.length ?? 0;

  const min: number[] = [];
  const max: number[] = [];
  const average: number[] = [];

  for (let i = 0; i < length; i++) {
    const valuesAtIndex = sensorSeries.map((series) => series[i]);
    min.push(Math.min(...valuesAtIndex));
    max.push(Math.max(...valuesAtIndex));
    const sum = valuesAtIndex.reduce((total, v) => total + v, 0);
    average.push(Number((sum / valuesAtIndex.length).toFixed(1)));
  }

  return { min, max, average };
}