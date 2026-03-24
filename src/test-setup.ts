import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for jsdom
globalThis.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
