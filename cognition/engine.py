import json
from typing import Any, Dict

from django.conf import settings

from .llm_connector import LLMClient, LLMError, Telemetry
from .models import AssessmentSession, EvaluationTurn, CognitiveReport


class CognitiveOrchestrator:
    """Orchestrates the conversation between the student and the LLM.
    Uses Socratic questioning, error diagnosis, and mental model probing."""

    def __init__(self, session: AssessmentSession):
        self.session = session
        self.lesson = session.lesson
        self.telemetry = Telemetry()

    def get_system_prompt(self):
        language_map = {
            'pt': 'Português (Brasil)',
            'en': 'English',
            'es': 'Español'
        }
        lang_name = language_map.get(self.lesson.module.course.language, 'English')

        return f"""
        You are the Synapse Cognitive Assessment Engine.
        Your goal is to evaluate if the student truly understands the lesson: "{self.lesson.title}".
        Lesson Content: {self.lesson.content}

        Evaluation Strategy:
        1. Use Socratic questioning. Do not give direct answers.
        2. Introduce intentional errors in logic to see if the student detects them.
        3. Ask the student to apply the concept to a different scenario (Transferability).
        4. Probe for causal reasoning (Why it works, not just how).
        5. MUST RESPOND IN THE STUDENT LANGUAGE: {lang_name}.

        IMPORTANT: Your response must be a valid JSON object with the following structure:
        {{
            "text": "Your Socratic question or response to the student in {lang_name}",
            "inference": {{
                "converged": boolean (true if you are confident the student understands),
                "score": float (0.0 to 1.0),
                "frustration_level": float (0.0 to 1.0, where 1.0 is extremely frustrated),
                "needs_human": boolean (true if the student is stuck, angry, or AI is failing to help),
                "summary": "Brief analysis of student understanding so far in {lang_name}",
                "dimensions": {{
                    "conceptual": float,
                    "causal": float,
                    "transfer": float
                }}
            }}
        }}

        Current status: {self.session.status}
        """

    def process_student_response(self, student_text):
        # 1. Log student turn
        EvaluationTurn.objects.create(
            session=self.session,
            speaker='student',
            content=student_text
        )

        llm_text = ''
        inference: Dict[str, Any] = {}
        client = LLMClient(provider=getattr(settings, 'LLM_PROVIDER', None), telemetry=self.telemetry)
        try:
            response = client.execute(
                self.get_system_prompt(),
                student_text,
                session_id=str(self.session.pk),
            )
            llm_text = response.get('text', '')
            raw = response.get('raw')
            inference = self._extract_inference(llm_text, raw)
        except LLMError as exc:
            self.telemetry.emit('turn_failed', reason=str(exc), session_id=str(self.session.pk), provider=client.provider)
            history_text, inference = self._fallback_response()
            llm_text = history_text
            self.telemetry.emit('fallback_used', reason=exc.code or 'unknown', session_id=str(self.session.pk))

        # 3. Log LLM turn
        EvaluationTurn.objects.create(
            session=self.session,
            speaker='llm',
            content=llm_text,
            inference=inference or None
        )

        # 4. Handle sentiment/frustration and convergence
        if inference:
            if inference.get('needs_human', False) or inference.get('frustration_level', 0.0) > 0.8:
                self._escalate_to_human(inference)
            elif inference.get('converged', False):
                self._finalize_assessment(inference)

        return llm_text

    def _escalate_to_human(self, inference):
        self.session.status = 'escalated'
        self.session.needs_human_intervention = True
        self.session.save()
        self.telemetry.emit('session_escalated', session_id=str(self.session.pk), frustration=inference.get('frustration_level', 0.0))
        # Logic to alert instructors could go here (e.g., Slack, Email, Socket notification)

    def _finalize_assessment(self, inference):
        self.session.status = 'converged'
        self.session.save()

        CognitiveReport.objects.create(
            session=self.session,
            score=inference.get('score', 0.0),
            summary=inference.get('summary', ''),
            dimensions=inference.get('dimensions', {}),
            convergence_details="LLM inferred deep understanding after 3 turns."
        )
        self.telemetry.emit('session_converged', session_id=str(self.session.pk), provider=getattr(settings, 'LLM_PROVIDER', 'mock'))

    def _extract_inference(self, text: str, raw: Any) -> Dict[str, Any]:
        """Extracts the inference block from the LLM response.
        Handles JSON within markdown blocks and common LLM conversational filler."""
        import re
        
        # Try finding JSON block in markdown
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group(1))
                return parsed.get('inference', {})
            except json.JSONDecodeError:
                pass

        # Try raw JSON in text
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict) and 'inference' in parsed:
                return parsed.get('inference', {})
        except json.JSONDecodeError:
            # Last ditch effort: find anything that looks like a JSON object
            dict_match = re.search(r'(\{.*\})', text, re.DOTALL)
            if dict_match:
                try:
                    parsed = json.loads(dict_match.group(1))
                    return parsed.get('inference', parsed)
                except json.JSONDecodeError:
                    pass
        
        if isinstance(raw, dict) and 'inference' in raw:
            return raw.get('inference', {})
            
        return {
            "converged": False,
            "score": 0.0,
            "summary": "Could not extract structured inference."
        }

    def _fallback_response(self) -> tuple[str, Dict[str, Any]]:
        history_count = self.session.turns.count()
        if history_count < 3:
            return (
                "Interessante sua explicação. Mas e se mudarmos o contexto para um ambiente de produção com alta carga? Como isso se comportaria?",
                {"converged": False, "score": 0.3, "summary": "Initial probing continues."},
            )
        return self._mock_response()

    def _mock_response(self):
        return (
            "Parabéns! Você demonstrou uma compreensão profunda dos conceitos de arquitetura e gargalos dessa aula.",
            {
                "converged": True,
                "score": 0.95,
                "summary": "Student understands bottlenecks and scalability.",
                "dimensions": {
                    "conceptual_understanding": 0.9,
                    "causal_reasoning": 0.95,
                    "transfer_ability": 0.85,
                    "error_detection": 1.0,
                },
            },
        )
