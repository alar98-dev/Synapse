import { test, expect } from '@playwright/test';

test('submission flow: S1a sent, streaming logs, retry, request review', async ({ page }) => {
  await page.route('**/api/lessons/456/submissions/', route => route.fulfill({ status: 200, body: JSON.stringify([]) }));
  await page.goto('/lessons/456');

  await expect(page.locator('[data-cy=btn-submit]')).toBeDisabled();
  await page.fill('[data-cy=code-editor]', 'print("ok")');
  await expect(page.locator('[data-cy=btn-submit]')).toBeEnabled();

  // intercept telemetry S1a
  let s1aSent = false;
  await page.route('**/telemetry/events', async route => {
    const post = route.request();
    const body = JSON.parse(post.postData() || '{}');
    if (body.event === 'S1a') {
      s1aSent = true;
      expect(body.lesson_id).toBe('lesson-456');
      expect(body.submission_id).toBeDefined();
    }
    await route.fulfill({ status: 201 });
  });

  // create submission
  await page.route('**/api/submissions/', route => route.fulfill({ status: 201, body: JSON.stringify({ submission_id: 'submission-789', status: 'queued' }) }));
  // stream logs endpoint stub
  await page.route('**/api/submissions/submission-789/stream', route => route.fulfill({ status: 200, body: 'data: {"event":"log","text":"Running tests..."}\n\n' }));
  // status becomes failed
  await page.route('**/api/submissions/submission-789/status', route => route.fulfill({ status: 200, body: JSON.stringify({ status: 'failed', result_summary: '1 test failed' }) }));

  await page.click('[data-cy=btn-submit]');
  await expect(page.locator('[data-cy=submission-spinner]')).toBeVisible();
  await expect(page.locator('[data-cy=stream-logs]')).toContainText('Running tests');
  await expect(page.locator('[data-cy=toast-error]')).toContainText('Falha na execução');

  // retry
  await page.route('**/api/submissions/submission-789/retry', route => route.fulfill({ status: 200, body: JSON.stringify({ submission_id: 'submission-789', status: 'queued' }) }));
  await page.click('[data-cy=btn-retry]');
  await expect(page.locator('[data-cy=toast-success]')).toContainText('Re-submitted');

  // request review
  await page.route('**/api/reviews/', (route) => {
    const req = route.request();
    const body = JSON.parse(req.postData() || '{}');
    expect(body.submission_id).toBe('submission-789');
    route.fulfill({ status: 201, body: JSON.stringify({ ticket_id: 'ticket-111' }) });
  });
  await page.click('[data-cy=btn-request-review]');
  await expect(page.locator('[data-cy=toast-success]')).toContainText('Pedido de revisão criado');

  expect(s1aSent).toBeTruthy();
});
