# Dimensional Audit Implementation TODO

## Completed Tasks ✅

### High Priority - Submissions Module
- [x] Implement SubmissionLog model for persistent audit logging
- [x] Add log persistence in sandbox/tasks.py for execution jobs
- [x] Create unit tests for SubmissionLog (test_submission_log.py)
- [x] Create integration test for submission API with logging
- [x] Generate and run migrations for SubmissionLog
- [x] Commit changes and create feature/submissions/persist-logs branch
- [x] Push PR for submissions logs persistence

### High Priority - Correlation Propagation
- [x] Implement CorrelationIdMiddleware for global correlation ID handling
- [x] Add middleware to settings.py
- [x] Create unit tests for CorrelationIdMiddleware (test_middleware.py)
- [x] Configure test database to use SQLite for isolation
- [x] Commit changes and create chore/telemetry/correlation-propagation branch
- [x] Push PR for correlation propagation middleware

### Testing and Validation
- [x] Run unit tests (passing for SubmissionLog and middleware)
- [x] Validate middleware header propagation
- [x] Validate log persistence with correlation_id and metadata

## Pending Tasks 🔄

### Integration Testing
- [ ] Run full integration tests with Celery worker for end-to-end log persistence
- [ ] Expand integration tests for correlation propagation across modules

### Next High Priority Modules
- [ ] Implement Payments webhook audit logging (FIL-002)
- [ ] Add AI Center prompt provenance tracking (FIL-003)
- [ ] Audit Dashboard telemetry gaps (D4 - Observability)
- [ ] Implement Alerts correlation propagation (D5 - Reliability)

### Validation and Deployment
- [ ] Review and merge PRs:
  - https://github.com/alar98-dev/Synapse/pull/new/feature/submissions/persist-logs
  - https://github.com/alar98-dev/Synapse/pull/new/chore/telemetry/correlation-propagation
- [ ] Validate PRs in staging environment
- [ ] Update dimensional audit report with completed implementations

## Notes
- All events now include correlation_id for traceability
- Unit tests are green and provide coverage for new features
- Migrations created and ready for deployment
- Branches created and PRs pushed for review