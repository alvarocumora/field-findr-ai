import '@testing-library/jest-dom/vitest';

// jsdom lacks matchMedia — several UI components consult it.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom lacks ResizeObserver — radix components use it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as Record<string, unknown>).ResizeObserver =
  (globalThis as Record<string, unknown>).ResizeObserver ?? ResizeObserverStub;
