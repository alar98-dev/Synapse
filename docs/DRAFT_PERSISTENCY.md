# Draft Persistency Mechanism

This document describes how the Synapse platform handles user code persistence (drafts) across reloads and sessions.

## Overview
To prevent data loss during long-running AI sessions or complex coding challenges, Synapse implements a client-side persistency layer using the Browser's `localStorage` API.

## Implementation Details

### 1. AI Center Persistence
The AI Center saves the current buffer in real-time.
- **Keys**: `synapse_draft_ai_last`
- **Behavior**: Every keystroke updates the stored value. On initialization, if the session is new but a previous draft exists, the system automatically restores the last known state.

### 2. Lesson / Challenge Persistence
Coding challenges are scoped uniquely to avoid cross-contamination between different lessons.
- **Keys**: `synapse_lesson_draft_{lesson_id}`
- **Behavior**:
    - When a lesson loads, the system checks for `synapse_lesson_draft_{lesson_id}`.
    - If found, it overrides the `initial_code` provided by the backend.
    - This allows students to refresh the page or return later without losing progress on specific problems.

## User Experience (UX) Impact
- **Resilience**: Protects against browser crashes, accidental tabs closing, and session timeouts.
- **Seamless Flow**: The user "picks up where they left off" instantly.
- **No Manual Save**: The process is invisible and automatic.

## Future Roadmap
- **Server-Side Sync**: Move drafts to the backend (Database) to enable across-device persistence.
- **Versioning**: Maintain a history of drafts (undo/redo across sessions).
