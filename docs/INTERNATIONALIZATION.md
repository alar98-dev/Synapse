# Synapse Internationalization & Cognitive Analysis Guide

## Overview
Synapse is designed to handle multiple languages at both the Content level and the Cognitive Analysis level. The platform ensures that even when analysis is performed by global LLMs, student interaction and reporting remain in the target language.

## Supported Languages
The system currently maps the following language codes (defined in the `Course` model):
- `pt`: Português (Brasil)
- `en`: English
- `es`: Español

## LLM Cognitive Mapping
The `CognitiveOrchestrator` automatically translates its pedagogical intent into a localized system prompt.

### Prompt Localization
The `get_system_prompt()` method dynamically injects the target language name. This ensures that the LLM:
1. Formulates Socratic questions in the student's language.
2. Generates the `summary` in the student's language for instructor review.
3. Understands local nuances in the student's technical descriptions.

## Sentiment Analysis Fields
Regardless of the language used, the internal analysis fields remain standardized for cross-course evaluation:

| Field | Range | Description |
|-------|-------|-------------|
| `frustration_level` | 0.0 - 1.0 | Degree of student struggle or negative sentiment. |
| `score` | 0.0 - 1.0 | Estimated depth of conceptual understanding. |
| `conceptual` | 0.0 - 1.0 | Understanding of definitions and core theory. |
| `causal` | 0.0 - 1.0 | Understanding of "why" concepts interact. |
| `transfer` | 0.0 - 1.0 | Ability to apply concept to new scenarios. |

## Human Escalation Criteria
When `frustration_level > 0.8` OR `needs_human: true` is detected in any language, the session status changes to `escalated`. This triggers an immediate alert in the **Instructor Dashboard**.
