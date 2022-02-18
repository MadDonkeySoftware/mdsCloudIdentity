import { getMailer } from '../get-mailer';

describe('getMailer test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns a configured object', async () => {
    // Act
    const result = await getMailer();

    // Assert
    expect(result).toBeTruthy();
  });
});
