import { describe, expect, it } from 'vitest';
import { countDelta, percentDelta } from './stats';

describe('countDelta', () => {
  it('signs the difference and gives its direction', () => {
    expect(countDelta(5, 3)).toEqual({ label: '+2', direction: 'up' });
    expect(countDelta(1, 4)).toEqual({ label: '−3', direction: 'down' });
    expect(countDelta(2, 2)).toEqual({ label: '±0', direction: 'flat' });
  });
});

describe('percentDelta', () => {
  it('rounds the percentage change', () => {
    expect(percentDelta(150, 100)).toEqual({ label: '+50%', direction: 'up' });
    expect(percentDelta(2, 3)).toEqual({ label: '−33%', direction: 'down' });
  });

  it('has nothing to say without a previous value', () => {
    expect(percentDelta(1200, 0)).toBeUndefined();
  });
});
