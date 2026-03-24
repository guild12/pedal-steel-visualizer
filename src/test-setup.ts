import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for jsdom
globalThis.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
