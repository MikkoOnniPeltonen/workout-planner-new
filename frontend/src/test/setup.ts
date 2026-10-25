import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('@/services/auth.service', () => ({
  default: {
    verify: vi.fn(async () => ({
      _id: 'a'.repeat(24),
      name: 'Test athlete',
      email: 'test@example.com',
    })),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    demo: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom lacks a few browser APIs that framer-motion, Radix and Recharts rely on.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
