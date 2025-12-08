import { AppElement } from './app.element';

describe('AppElement', () => {
  let app: AppElement;

  beforeEach(() => {
    app = new AppElement();
  });

  it('should create successfully', () => {
    expect(app).toBeTruthy();
  });

  it('should have a greeting', () => {
    app.connectedCallback();

    const h1 = app.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1!.innerHTML).toContain(
      'Welcome @nas-net/connectpoc'
    );
  });
});
