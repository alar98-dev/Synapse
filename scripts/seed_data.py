#!/usr/bin/env python3
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synapse_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson, Material, Cohort, Enrollment
from submissions.models import Problem
from cognition.models import AssessmentSession
from courses.services.polaris_client import PolarisClient
import datetime

User = get_user_model()


def seed():
    print("Iniciando povoamento estruturado do Synapse...")

    # 1. Usuários Base
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin', 'admin@synapse.com', 'admin123')

    instructor = User.objects.filter(username='instructor').first()
    if not instructor:
        instructor = User.objects.create_user('instructor', 'instructor@synapse.com', 'Instructor2026!', role='teacher', is_staff=True)

    student = User.objects.filter(username='student').first()
    if not student:
        student = User.objects.create_user('student', 'student@synapse.com', 'Student2026!', role='student')

    polaris = PolarisClient()
    polaris_available = polaris.check_health()
    print(f"Polaris Health Check: {'ONLINE (127.0.0.1:8080)' if polaris_available else 'OFFLINE (usando fallbacks limpos)'}")

    # 2. Definição da Grade de Cursos (20% Gratuito / 80% Premium)
    course_definitions = [
        # Trilha 1: Fundamentos (Gratuitos)
        {
            "title": "Lógica & Algoritmos Práticos",
            "description": "Domínio de estruturas de dados essenciais, arrays, hash maps e análise assintótica com Python.",
            "level": "beginner",
            "price": 0.00,
            "modules": [
                {
                    "title": "Módulo 1: Estruturas Lineares",
                    "lessons": [
                        {"title": "Vetores Dinâmicos e Complexidade O(1)", "type": "video", "duration": 15},
                        {"title": "Hash Tables e Tratamento de Colisões", "type": "text", "duration": 20},
                    ],
                    "problem": {
                        "title": "Busca em Vetor Ordenado",
                        "slug": "busca-vetor-ordenado",
                        "description": "Implemente busca binária eficiente com complexidade O(log n).",
                        "initial_code": "def binary_search(arr, target):\n    # Implemente aqui\n    pass\n",
                        "test_template": "{student_code}\nassert binary_search([1, 3, 5, 7, 9], 5) == 2\nassert binary_search([1, 3, 5], 2) == -1\nprint('Tests passed successfully!')\n",
                    }
                }
            ]
        },
        {
            "title": "Clean Code & Princípios SOLID",
            "description": "Escreva código legível, testável e manutenível aplicando os 5 princípios SOLID na prática.",
            "level": "beginner",
            "price": 0.00,
            "modules": [
                {
                    "title": "Módulo 1: Responsabilidade Única & Inversão de Dependências",
                    "lessons": [
                        {"title": "Identificando e Refatorando Fat Classes", "type": "video", "duration": 25},
                        {"title": "Desacoplamento com Interfaces e Protocolos", "type": "text", "duration": 20},
                    ],
                    "problem": {
                        "title": "Refatoração de Notificador (SRP)",
                        "slug": "refatoracao-notificador-srp",
                        "description": "Desacople a lógica de envio de mensagens do cálculo de faturas.",
                        "initial_code": "class InvoiceNotifier:\n    def send_notification(self, user, message):\n        return f'Notified {user}: {message}'\n",
                        "test_template": "{student_code}\nnotifier = InvoiceNotifier()\nassert 'Notified alice' in notifier.send_notification('alice', 'Fatura pronta')\nprint('Tests passed!')\n",
                    }
                }
            ]
        },
        # Trilha 2: Arquitetura & DDD (Premium)
        {
            "title": "Domain-Driven Design (DDD) na Prática",
            "description": "Modelagem de Bounded Contexts, Aggregates, Entidades, Value Objects e Domain Services.",
            "level": "intermediate",
            "price": 49.90,
            "modules": [
                {
                    "title": "Módulo 1: Bounded Contexts & Linguagem Ubíqua",
                    "lessons": [
                        {"title": "Isolando Domínio de Infraestrutura", "type": "video", "duration": 30},
                        {"title": "Aggregates e Invariantes Transacionais", "type": "text", "duration": 25},
                    ],
                    "problem": {
                        "title": "Validação de Invariante de Matrícula",
                        "slug": "validacao-invariante-matricula",
                        "description": "Garanta que uma turma não exceda sua capacidade máxima ao matricular.",
                        "initial_code": "def can_enroll(current_students, capacity):\n    return current_students < capacity\n",
                        "test_template": "{student_code}\nassert can_enroll(10, 20) is True\nassert can_enroll(20, 20) is False\nprint('Invariant validation passed!')\n",
                    }
                }
            ]
        },
        {
            "title": "Microsserviços e Event-Driven APIs",
            "description": "Comunicação assíncrona, filas, circuit breakers e idempotência em arquiteturas distribuídas.",
            "level": "advanced",
            "price": 59.90,
            "modules": [
                {
                    "title": "Módulo 1: Padrões de Resiliência",
                    "lessons": [
                        {"title": "Implementação de Circuit Breaker com Backoff", "type": "video", "duration": 35},
                    ]
                }
            ]
        },
        # Trilha 3: Alta Performance & Cognição (Premium)
        {
            "title": "Concorrência Segura & Memória Zero-Copy",
            "description": "IPC via shared memory (/dev/shm), estruturas lock-free, atomicidade e concorrência extrema.",
            "level": "advanced",
            "price": 79.90,
            "modules": [
                {
                    "title": "Módulo 1: Buffers Circulares & Atomicidade",
                    "lessons": [
                        {"title": "Topologia Zero-Copy em /dev/shm", "type": "video", "duration": 40},
                    ]
                }
            ]
        },
        {
            "title": "Engenharia de IA & Avaliação Socrática",
            "description": "Desenvolva agentes pedagógicos com diagnóstico cognitivo, sondagem socrática e relatórios de raciocínio.",
            "level": "advanced",
            "price": 69.90,
            "modules": [
                {
                    "title": "Módulo 1: Diálogos Socráticos Adaptativos",
                    "lessons": [
                        {"title": "Sondagem Causal e Deteção de Erros", "type": "assessment", "duration": 45},
                    ]
                }
            ]
        },
    ]

    # 3. Povoamento no Banco
    today = datetime.date.today()
    for c_def in course_definitions:
        course, c_created = Course.objects.get_or_create(
            title=c_def["title"],
            defaults={
                "description": c_def["description"],
                "level": c_def["level"],
                "price": c_def["price"],
                "owner": instructor,
                "is_published": True,
            }
        )
        status_str = "CRIADO" if c_created else "EXISTENTE"
        print(f"Curso [{status_str}]: {course.title} (Preço: R$ {course.price})")

        # Turma padrão
        cohort, _ = Cohort.objects.get_or_create(
            course=course,
            title="Turma Alfa 2026",
            defaults={
                "start_date": today,
                "end_date": today + datetime.timedelta(days=90),
                "capacity": 50,
                "enrollment_open": True,
            }
        )

        for m_idx, m_def in enumerate(c_def.get("modules", []), start=1):
            module, _ = Module.objects.get_or_create(
                course=course,
                title=m_def["title"],
                defaults={"order": m_idx}
            )

            for l_idx, l_def in enumerate(m_def.get("lessons", []), start=1):
                lesson, _ = Lesson.objects.get_or_create(
                    module=module,
                    title=l_def["title"],
                    defaults={
                        "lesson_type": l_def.get("type", "video"),
                        "duration_minutes": l_def.get("duration", 20),
                        "order": l_idx,
                        "content": f"Conteúdo didático para {l_def['title']}. Metodologia prática ativa."
                    }
                )

                if l_def.get("type") == "assessment":
                    AssessmentSession.objects.get_or_create(
                        user=student,
                        lesson=lesson,
                        defaults={"status": "active"}
                    )

            # Problema de Sandbox associado ao módulo
            prob_def = m_def.get("problem")
            if prob_def:
                problem, p_created = Problem.objects.get_or_create(
                    slug=prob_def["slug"],
                    defaults={
                        "title": prob_def["title"],
                        "description": prob_def["description"],
                        "course": course,
                        "owner": instructor,
                        "initial_code": prob_def["initial_code"],
                        "test_template": prob_def["test_template"],
                    }
                )
                if p_created:
                    print(f"  -> Desafio Sandbox criado: {problem.title}")

    # Matricular aluno de demonstração no curso gratuito
    free_course = Course.objects.filter(price=0.00).first()
    if free_course:
        Enrollment.objects.get_or_create(
            user=student,
            course=free_course,
            defaults={"is_active": True}
        )

    print("\n--- Povoamento Concluído com Sucesso ---")
    print(f"Total de Cursos: {Course.objects.count()}")
    print(f"Total de Módulos: {Module.objects.count()}")
    print(f"Total de Lições: {Lesson.objects.count()}")
    print(f"Total de Desafios Sandbox: {Problem.objects.count()}")
    print(f"Total de Sessões Cognitivas: {AssessmentSession.objects.count()}")


if __name__ == "__main__":
    seed()
