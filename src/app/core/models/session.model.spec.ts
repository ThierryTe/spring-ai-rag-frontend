import { DemoSessionDto, toSessionInfo } from './session.model';

describe('toSessionInfo', () => {
  const baseDto: DemoSessionDto = {
    sessionId: 'session-1',
    expiresAt: '2026-09-10T00:16:19.398',
    maxQuestions: 5,
    maxDocuments: 2,
    questionsUsed: 0,
    documentsUsed: 0,
  };

  it('treats a zone-less expiresAt string as UTC', () => {
    const info = toSessionInfo(baseDto);
    expect(info.expiresAt.toISOString()).toBe('2026-09-10T00:16:19.398Z');
  });

  it('leaves an expiresAt string that already has a Z suffix unchanged', () => {
    const info = toSessionInfo({ ...baseDto, expiresAt: '2026-09-10T00:16:19.398Z' });
    expect(info.expiresAt.toISOString()).toBe('2026-09-10T00:16:19.398Z');
  });

  it('leaves an expiresAt string with an explicit offset unchanged', () => {
    const info = toSessionInfo({ ...baseDto, expiresAt: '2026-09-10T02:16:19.398+02:00' });
    expect(info.expiresAt.toISOString()).toBe('2026-09-10T00:16:19.398Z');
  });
});
