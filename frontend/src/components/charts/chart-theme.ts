/**
 * Chart colors for the dark card surface (#18181b). The series color was checked with the dataviz
 * palette validator: inside the dark lightness band, above the chroma floor, and at least 3:1
 * against the surface. The brand green (#22c55e) is too light to pass, so it only marks hover.
 */
export const chartTheme = {
  series: '#16a34a',
  seriesActive: '#22c55e',
  surface: '#18181b',
  grid: '#27272a',
  baseline: '#3f3f46',
  hover: 'rgba(255, 255, 255, 0.04)',
  mutedText: '#a1a1aa',
  secondaryText: '#d4d4d8',
};
