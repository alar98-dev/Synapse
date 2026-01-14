import json
import logging
import os
import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger('cognition.llm_client')

DEFAULT_OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
DEFAULT_TIMEOUTS = {
    'ollama': 30,
    'openai': 15,
    'gemini': 15,
    'mock': 1,
}


class LLMError(Exception):
    def __init__(self, message: str, *, retryable: bool = False, code: Optional[str] = None):
        super().__init__(message)
        self.retryable = retryable
        self.code = code


class Telemetry:
    def __init__(self):
        self.logger = logger

    def emit(self, event: str, **context: Any) -> None:
        """Bridge to centralized telemetry SDK (resilient)."""
        payload = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            **context,
        }
        try:
            from telemetry import sdk as telemetry_sdk
            # prefix LLM events for sampling rules
            telemetry_sdk.emit(f"llm.{event}", payload)
        except Exception:
            # Fallback to logger if telemetry SDK unavailable
            try:
                self.logger.info(json.dumps({'event': event, **payload}))
            except Exception:
                pass


@dataclass
class RetryPolicy:
    max_attempts: int = 3
    base_sleep: float = 1.0

    def backoff(self, attempt: int) -> float:
        jitter = random.uniform(0, 0.2)
        factor = 2 ** (attempt - 1)
        return self.base_sleep * factor + jitter


class CircuitBreakerState:
    CLOSED = 'closed'
    OPEN = 'open'
    HALF_OPEN = 'half-open'


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, cooldown: float = 60.0):
        self._state: Dict[str, Dict[str, Any]] = {}
        self.failure_threshold = failure_threshold
        self.cooldown = cooldown

    def allow_request(self, key: str) -> bool:
        state = self._state.get(key)
        if not state:
            self._state[key] = {
                'state': CircuitBreakerState.CLOSED,
                'failures': 0,
                'opened_at': None,
            }
            return True

        if state['state'] == CircuitBreakerState.OPEN:
            if time.time() - (state['opened_at'] or 0) > self.cooldown:
                state['state'] = CircuitBreakerState.HALF_OPEN
                return True
            return False

        return True

    def record_success(self, key: str) -> None:
        state = self._state.setdefault(key, {
            'state': CircuitBreakerState.CLOSED,
            'failures': 0,
            'opened_at': None,
        })
        state['state'] = CircuitBreakerState.CLOSED
        state['failures'] = 0
        state['opened_at'] = None

    def record_failure(self, key: str) -> None:
        state = self._state.setdefault(key, {
            'state': CircuitBreakerState.CLOSED,
            'failures': 0,
            'opened_at': None,
        })
        state['failures'] += 1
        if state['failures'] >= self.failure_threshold:
            state['state'] = CircuitBreakerState.OPEN
            state['opened_at'] = time.time()
        elif state['state'] == CircuitBreakerState.HALF_OPEN:
            state['state'] = CircuitBreakerState.OPEN
            state['opened_at'] = time.time()
class LLMConnector:
    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or os.getenv('LLM_PROVIDER', 'mock')
        self.ollama_host = os.getenv('OLLAMA_HOST', DEFAULT_OLLAMA_HOST)
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.gemini_endpoint = os.getenv('GEMINI_ENDPOINT')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.2,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        provider = self.provider
        timeout = timeout or DEFAULT_TIMEOUTS.get(provider, 15)
        if provider == 'ollama':
            return self._ollama_request(system_prompt, user_prompt, model=model or 'llama2', temperature=temperature, timeout=timeout)
        if provider == 'openai':
            return self._openai_request(system_prompt, user_prompt, model=model or 'gpt-4o-mini', temperature=temperature, timeout=timeout)
        if provider == 'gemini':
            return self._gemini_request(system_prompt, user_prompt, model=model or 'gemini-pro', temperature=temperature, timeout=timeout)
        return self._mock_response(system_prompt, user_prompt)

    def _ollama_request(self, system_prompt: str, user_prompt: str, model: str, temperature: float, timeout: float) -> Dict[str, Any]:
        url = f"{self.ollama_host}/api/generate"
        payload = {
            'model': model,
            'prompt': f"{system_prompt}\n\nUser: {user_prompt}",
            'temperature': temperature,
            'max_length': 1024,
        }
        try:
            response = requests.post(url, json=payload, timeout=timeout)
            response.raise_for_status()
        except requests.Timeout as exc:
            raise LLMError('Ollama timeout', retryable=True, code='timeout') from exc
        except requests.RequestException as exc:
            raise LLMError('Ollama request error', retryable=True, code='network') from exc
        data = response.json()
        return {'text': data.get('text', json.dumps(data)), 'raw': data}

    def _openai_request(self, system_prompt: str, user_prompt: str, model: str, temperature: float, timeout: float) -> Dict[str, Any]:
        if not self.openai_api_key:
            raise LLMError('OPENAI_API_KEY not configured', retryable=False, code='config_openai')
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'Authorization': f"Bearer {self.openai_api_key}",
            'Content-Type': 'application/json',
        }
        payload = {
            'model': model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt},
            ],
            'temperature': temperature,
            'max_tokens': 1024,
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=timeout)
            response.raise_for_status()
        except requests.Timeout as exc:
            raise LLMError('OpenAI timeout', retryable=True, code='timeout') from exc
        except requests.RequestException as exc:
            raise LLMError('OpenAI request error', retryable=True, code='network') from exc
        data = response.json()
        choices = data.get('choices') or []
        text = ''
        if choices:
            text = choices[0].get('message', {}).get('content', '')
        return {'text': text, 'raw': data}

    def _gemini_request(self, system_prompt: str, user_prompt: str, model: str, temperature: float, timeout: float) -> Dict[str, Any]:
        if not self.gemini_endpoint or not self.gemini_api_key:
            raise LLMError('Gemini config missing', retryable=False, code='config_gemini')
        headers = {
            'Authorization': f"Bearer {self.gemini_api_key}",
            'Content-Type': 'application/json',
        }
        payload = {
            'model': model,
            'system': system_prompt,
            'prompt': user_prompt,
            'temperature': temperature,
        }
        try:
            response = requests.post(self.gemini_endpoint, headers=headers, json=payload, timeout=timeout)
            response.raise_for_status()
        except requests.Timeout as exc:
            raise LLMError('Gemini timeout', retryable=True, code='timeout') from exc
        except requests.RequestException as exc:
            raise LLMError('Gemini request error', retryable=True, code='network') from exc
        data = response.json()
        text = data.get('text') or json.dumps(data)
        return {'text': text, 'raw': data}

    def _mock_response(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        return {
            'text': 'Parabéns! Você demonstrou compreensão, mas responda: como priorizaria recursos sob alta carga?',
            'raw': {'mock': True},
        }


class LLMClient:
    def __init__(self, provider: Optional[str] = None, telemetry: Optional[Telemetry] = None):
        self.provider = provider or os.getenv('LLM_PROVIDER', 'mock')
        self.connector = LLMConnector(provider=self.provider)
        self.telemetry = telemetry or Telemetry()
        self.retry_policy = RetryPolicy()
        self.circuit_breaker = CircuitBreaker()

    def _emit_breaker_event(self, event: str, attempt: int, session_id: Optional[str], **extras: Any) -> None:
        payload = {
            'provider': self.provider,
            'session_id': session_id,
            'stage': 'breaker',
            'attempt': attempt,
            **extras,
        }
        self.telemetry.emit(event, **payload)

    def execute(
        self,
        system_prompt: str,
        user_prompt: str,
        session_id: Optional[str] = None,
        model: Optional[str] = None,
        stage: str = 'request',
    ) -> Dict[str, Any]:
        context = {'provider': self.provider, 'session_id': session_id, 'stage': stage}
        prev_state = self.circuit_breaker._state.get(self.provider, {}).get('state')
        allowed = self.circuit_breaker.allow_request(self.provider)
        if not allowed:
            self._emit_breaker_event('provider_circuit_open', attempt=0, session_id=session_id)
            self._emit_breaker_event('provider_blocked', attempt=0, session_id=session_id)
            raise LLMError('Circuit breaker open', retryable=False, code='circuit_open')

        new_state = self.circuit_breaker._state[self.provider]['state']
        half_open_trial = bool(prev_state == CircuitBreakerState.OPEN and new_state == CircuitBreakerState.HALF_OPEN)
        if half_open_trial:
            self._emit_breaker_event('provider_half_open', attempt=0, session_id=session_id)

        attempt = 0
        while attempt < self.retry_policy.max_attempts:
            attempt += 1
            context['attempt'] = attempt
            try:
                timeout = DEFAULT_TIMEOUTS.get(self.provider, 15)
                response = self.connector.generate(system_prompt, user_prompt, model=model, timeout=timeout)
                self._validate_response(response, context)
                self.circuit_breaker.record_success(self.provider)
                if half_open_trial:
                    self._emit_breaker_event('provider_recovered', attempt=attempt, session_id=session_id)
                self.telemetry.emit('turn_success', **context)
                return response
            except LLMError as exc:
                self.circuit_breaker.record_failure(self.provider)
                self.telemetry.emit('turn_failed', reason=str(exc), **context)
                if exc.code == 'timeout':
                    self.telemetry.emit('provider_timeout', **context)
                if half_open_trial:
                    self._emit_breaker_event('provider_reopen', attempt=attempt, session_id=session_id, reason=exc.code)
                    raise
                if not exc.retryable or attempt >= self.retry_policy.max_attempts:
                    self.telemetry.emit('fallback_used', reason=exc.code, **context)
                    raise
                sleep = self.retry_policy.backoff(attempt)
                time.sleep(sleep)
        raise LLMError('LLM request failed after retries', retryable=False, code='retry_exhausted')

    def _validate_response(self, response: Dict[str, Any], context: Dict[str, Any]) -> None:
        text = response.get('text', '')
        if not isinstance(text, str) or len(text.strip()) < 10:
            self.telemetry.emit('invalid_llm_response', reason='empty_or_short', **context)
            raise LLMError('Invalid response text', retryable=False, code='invalid_text')
        degenerate_signals = ['claro', 'entendi', 'ok', 'perfeito']
        lower = text.strip().lower()
        if any(lower == signal for signal in degenerate_signals):
            self.telemetry.emit('invalid_llm_response', reason='degenerate', **context)
            raise LLMError('Degenerate response', retryable=False, code='degenerate')
        raw = response.get('raw')
        if not isinstance(raw, (dict, str)):
            self.telemetry.emit('invalid_llm_response', reason='bad_raw', **context)
            raise LLMError('Raw payload missing', retryable=False, code='bad_raw')
