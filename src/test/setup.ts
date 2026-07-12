class TestDOMMatrix {}
class TestPath2D {}

if (!('DOMMatrix' in globalThis)) {
  Object.defineProperty(globalThis, 'DOMMatrix', { value: TestDOMMatrix })
}

if (!('Path2D' in globalThis)) {
  Object.defineProperty(globalThis, 'Path2D', { value: TestPath2D })
}

if (!('ImageData' in globalThis)) {
  Object.defineProperty(globalThis, 'ImageData', { value: class TestImageData {} })
}
