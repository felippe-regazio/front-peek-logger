import 'fake-indexeddb/auto'
import FrontPeekLooger from '../dist'

describe('Test common usage', () => {
  test('Basic instantiation', () => {
    const FPL = new FrontPeekLooger();

    expect(FPL).not.toBeUndefined();
  });
});