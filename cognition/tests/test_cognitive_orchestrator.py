import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson
from cognition.models import AssessmentSession, EvaluationTurn, CognitiveReport
from cognition.engine import CognitiveOrchestrator

User = get_user_model()


class CognitiveAssessmentTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='student_cog', email='cog@example.com', password='pass')
        self.course = Course.objects.create(title='Cognitive Systems', owner=self.user)
        self.module = Module.objects.create(course=self.course, title='Module 1')
        self.lesson = Lesson.objects.create(
            module=self.module,
            title='Socratic Reasoning',
            lesson_type='assessment',
            content='Understanding distributed consensus and quorum mechanics.'
        )
        self.session = AssessmentSession.objects.create(
            user=self.user,
            lesson=self.lesson,
            status='active'
        )

    def test_orchestrator_logs_turns_and_responds(self):
        orchestrator = CognitiveOrchestrator(self.session)
        response_text = orchestrator.process_student_response("Consensus requires a majority quorum to guarantee consistency.")
        self.assertTrue(len(response_text) > 0)

        # Turns should exist for both student and llm
        turns = EvaluationTurn.objects.filter(session=self.session)
        self.assertEqual(turns.count(), 2)
        self.assertEqual(turns[0].speaker, 'student')
        self.assertEqual(turns[1].speaker, 'llm')

    def test_orchestrator_escalates_on_frustration(self):
        orchestrator = CognitiveOrchestrator(self.session)
        inference = {
            'needs_human': True,
            'frustration_level': 0.9,
            'summary': 'Student is stuck and confused.',
        }
        orchestrator._escalate_to_human(inference)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, 'escalated')
        self.assertTrue(self.session.needs_human_intervention)

    def test_orchestrator_finalizes_on_convergence(self):
        orchestrator = CognitiveOrchestrator(self.session)
        inference = {
            'converged': True,
            'score': 0.95,
            'summary': 'Student mastered quorum consensus.',
            'dimensions': {'conceptual': 0.95, 'causal': 0.90, 'transfer': 0.92}
        }
        orchestrator._finalize_assessment(inference)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, 'converged')
        self.assertTrue(hasattr(self.session, 'report'))
        self.assertEqual(self.session.report.score, 0.95)

    def test_api_respond_endpoint(self):
        self.client.login(username='student_cog', password='pass')
        payload = {'content': 'A Paxos proposer requires acceptance from a majority of acceptors.'}
        resp = self.client.post(
            f'/api/v1/cognition/sessions/{self.session.id}/respond/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('llm_response', data)
        self.assertIn('session_status', data)
