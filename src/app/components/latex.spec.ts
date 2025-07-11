import { LatexDirective } from './latex';

describe('Latex', () => {
  it('should create an instance', () => {
    const directive = new LatexDirective(null!, null!);
    expect(directive).toBeTruthy();
  });
});
