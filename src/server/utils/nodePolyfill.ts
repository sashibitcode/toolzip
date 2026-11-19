import CSSMatrix from '@thednp/dommatrix';

export function ensureNodePolyfills() {
  const g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : window;

  if (typeof (g as any).DOMMatrix === 'undefined') {
    (g as any).DOMMatrix = CSSMatrix;
  }
  if (typeof (globalThis as any).DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = CSSMatrix;
  }
  if (typeof global !== 'undefined' && typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = CSSMatrix;
  }

  class MockPath2D {
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    rect() {}
  }

  if (typeof (g as any).Path2D === 'undefined') {
    (g as any).Path2D = MockPath2D;
  }
  if (typeof (globalThis as any).Path2D === 'undefined') {
    (globalThis as any).Path2D = MockPath2D;
  }
  if (typeof global !== 'undefined' && typeof (global as any).Path2D === 'undefined') {
    (global as any).Path2D = MockPath2D;
  }

  class MockImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(w = 0, h = 0) {
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
  }

  if (typeof (g as any).ImageData === 'undefined') {
    (g as any).ImageData = MockImageData;
  }
  if (typeof (globalThis as any).ImageData === 'undefined') {
    (globalThis as any).ImageData = MockImageData;
  }
  if (typeof global !== 'undefined' && typeof (global as any).ImageData === 'undefined') {
    (global as any).ImageData = MockImageData;
  }
}

ensureNodePolyfills();
