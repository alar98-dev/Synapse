// cypress/e2e/submission.cy.js
// Fluxo principal: seleção/submit, S1a, streaming logs, falha e retry

describe('Lesson submission flow', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/lessons/456/submissions/', { body: [] });
    cy.visit('/lessons/456');
  });

  it('sends S1a on submit, shows streaming logs and supports retry and request review', () => {
    // submit button disabled until code present
    cy.get('[data-cy=btn-submit]').should('be.disabled');

    // type code into editor (simulate)
    cy.get('[data-cy=code-editor]').type('print("hello")');
    cy.get('[data-cy=btn-submit]').should('not.be.disabled');

    // intercept telemetry S1a
    cy.intercept('POST', '/telemetry/events', (req) => {
      if (req.body.event === 'S1a') {
        expect(req.body.submission_id).to.exist;
        expect(req.body.lesson_id).to.equal('lesson-456');
      }
      req.reply({ statusCode: 201 });
    }).as('telemetryS1a');

    // simulate enroll submission fail then success
    cy.intercept('POST', '/api/submissions/', (req) => {
      // first attempt -> start job (queued)
      req.reply({ statusCode: 201, body: { submission_id: 'submission-789', status: 'queued' } });
    }).as('createSubmission');

    // simulate streaming: the client opens /api/submissions/submission-789/stream
    cy.intercept('GET', '/api/submissions/submission-789/stream', (req) => {
      // respond with a short SSE-like stream (Cypress can't stream easily; we simulate sequence)
      req.reply({ statusCode: 200, body: 'data: {"event":"log","text":"Running tests..."}\n\n' });
    }).as('streamLogs');

    cy.get('[data-cy=btn-submit]').click();
    cy.wait('@telemetryS1a');
    cy.wait('@createSubmission');

    // spinner and history entry
    cy.get('[data-cy=submission-spinner]').should('be.visible');
    cy.get('[data-cy=submission-history]').should('contain', 'queued');

    // stream logs visible
    cy.wait('@streamLogs');
    cy.get('[data-cy=stream-logs]').should('contain', 'Running tests');

    // simulate failure on job finalization
    cy.intercept('GET', '/api/submissions/submission-789/status', { body: { status: 'failed', result_summary: '1 test failed' } }).as('statusFail');
    cy.wait('@statusFail');
    cy.get('[data-cy=toast-error]').should('contain', 'Falha na execução');

    // Retry flow
    cy.intercept('POST', '/api/submissions/submission-789/retry', { statusCode: 200, body: { submission_id: 'submission-789', status: 'queued' } }).as('retry');
    cy.get('[data-cy=btn-retry]').click();
    cy.wait('@retry');
    cy.get('[data-cy=toast-success]').should('contain', 'Re-submitted');

    // Request review CTA
    cy.intercept('POST', '/api/reviews/', (req) => {
      expect(req.body.submission_id).to.equal('submission-789');
      req.reply({ statusCode: 201, body: { ticket_id: 'ticket-111' } });
    }).as('requestReview');

    cy.get('[data-cy=btn-request-review]').click();
    cy.wait('@requestReview');
    cy.get('[data-cy=toast-success]').should('contain', 'Pedido de revisão criado');
  });
});
