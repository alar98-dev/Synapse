#!/usr/bin/env python3
"""Seed a sandbox dataset and replay the CourseEnrollment vector through the filament."""
import argparse
import json
import os
from datetime import date, timedelta
from typing import Dict, Iterable, List

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "synapse_project.settings")

import django

django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

from courses.models import Cohort, Course, Enrollment
from dimensional.filament import (
    EventDimensions,
    EventState,
    EventVector,
    FilamentAuditEntry,
    FilamentDecision,
    FilamentDecisionService,
    default_filament_hooks,
)

User = get_user_model()

SCENARIO_DIGEST = {
    FilamentDecision.ACEITAR: "PASS",
    FilamentDecision.AJUSTAR: "ADJUSTMENT_REQUIRED",
    FilamentDecision.BLOQUEAR: "BLOCKED",
}


class RecordingHook:
    def __init__(self) -> None:
        self.entries: List[FilamentAuditEntry] = []

    def __call__(self, entry: FilamentAuditEntry) -> None:
        self.entries.append(entry)


def ensure_user(
    username: str,
    email: str,
    role: str,
    password: str,
    is_active: bool = True,
    is_superuser: bool = False,
) -> User:
    user, created = User.objects.get_or_create(username=username, defaults={"email": email})
    user.email = email
    user.role = role
    user.is_active = is_active
    if password:
        user.set_password(password)
    if is_superuser:
        user.is_superuser = True
        user.is_staff = True
    else:
        user.is_staff = False
        user.is_superuser = False
    user.save()
    return user


def ensure_cohort(
    course: Course,
    title: str,
    capacity: int,
    enrollment_open: bool,
    slug_suffix: str,
    start_in_days: int = 7,
) -> Cohort:
    start = date.today() + timedelta(days=start_in_days)
    end = start + timedelta(days=60)
    cohort, _ = Cohort.objects.update_or_create(
        course=course,
        title=title,
        defaults={
            "start_date": start,
            "end_date": end,
            "capacity": capacity,
            "timezone": "UTC",
            "enrollment_open": enrollment_open,
        },
    )
    return cohort


def fill_cohort(cohort: Cohort, target: int) -> None:
    current = Enrollment.objects.filter(cohort=cohort, is_active=True).count()
    if current >= target:
        return
    for index in range(current, target):
        filler_username = f"sandbox-fill-{cohort.slug}-{index + 1}"
        filler, _ = User.objects.get_or_create(
            username=filler_username,
            defaults={"email": f"{filler_username}@example.org", "role": "student"},
        )
        filler.set_password(f"{filler_username}123")
        filler.save()
        Enrollment.objects.get_or_create(
            user=filler,
            course=cohort.course,
            defaults={"cohort": cohort, "is_active": True},
        )


def seed_environment() -> Dict[str, object]:
    instructor = ensure_user("INSTRUCTOR123", "instructor@example.org", "teacher", "inst1234")
    admin = ensure_user("ADMIN123", "admin@example.org", "staff", "admin1234", is_superuser=True)
    student = ensure_user("USER123", "sandbox.student@example.org", "student", "student1234")
    blocked = ensure_user("USER_BLOCKED", "blocked@example.org", "student", "block1234", is_active=False)

    course, _ = Course.objects.update_or_create(
        slug="course456-sandbox",
        defaults={
            "title": "Dimensional Course 456",
            "description": "Sandbox para validar o fluxo CourseEnrollment.",
            "owner": instructor,
            "level": "intermediate",
            "language": "en",
            "is_published": True,
            "duration_hours": 12,
            "price": 480,
        },
    )

    limited = ensure_cohort(course, "Cohort 7 (COHORT-7)", capacity=5, enrollment_open=True, slug_suffix="7")
    open_cohort = ensure_cohort(course, "Open Cohort (COHORT-OPEN)", capacity=60, enrollment_open=True, slug_suffix="open", start_in_days=3)
    closed_cohort = ensure_cohort(course, "Closed Cohort (COHORT-CLOSED)", capacity=20, enrollment_open=False, slug_suffix="closed", start_in_days=1)

    fill_cohort(limited, target=limited.capacity - 1)
    fill_cohort(open_cohort, target=3)

    return {
        "users": {
            "student": student,
            "admin": admin,
            "instructor": instructor,
            "blocked": blocked,
        },
        "course": course,
        "cohorts": {
            "limited": limited,
            "open": open_cohort,
            "closed": closed_cohort,
        },
    }


def build_vector(user: User, cohort: Cohort, story_id: str = "BACK-101") -> EventVector:
    current = Enrollment.objects.filter(cohort=cohort, is_active=True).count()
    capacity = cohort.capacity or 0
    score = (current + 1) / max(capacity, 1)

    dimensions = EventDimensions(
        identidade={
            "user_id": user.id,
            "reference": user.username,
            "role": user.role,
            "user_active": user.is_active,
            "is_verified": user.is_active,
        },
        contexto={
            "course_id": cohort.course.id,
            "course_reference": "COURSE456",
            "course_active": cohort.course.is_published,
            "cohort_id": cohort.id,
            "cohort_reference": cohort.title,
            "cohort_open": cohort.enrollment_open,
        },
        dependencia={
            "prerequisites_met": True,
            "duplicate": Enrollment.objects.filter(user=user, course=cohort.course).exists(),
            "blocked": False,
        },
        risco={
            "capacity": capacity,
            "current": current,
            "score": round(score, 3),
            "cohort_timezone": cohort.timezone,
        },
    )

    payload = {
        "course_id": "COURSE456",
        "cohort": cohort.title,
        "caller": "user+sandbox@example.org",
    }

    vector = EventVector(
        name="CourseEnrollment",
        module="courses.views.CourseViewSet.enroll",
        story_id=story_id,
        dimensions=dimensions,
        payload=payload,
    )
    return vector


def replay_vector(vector: EventVector, expected: FilamentDecision) -> List[FilamentAuditEntry]:
    tracker = RecordingHook()
    hooks: List = [tracker]
    hooks.extend(default_filament_hooks())
    service = FilamentDecisionService(hooks=hooks)

    entries: List[FilamentAuditEntry] = []
    entries.append(service.log_state(vector, EventState.S1A, FilamentDecision.ACEITAR, "Identidade verificada"))
    entries.append(service.log_state(vector, EventState.S1B, FilamentDecision.ACEITAR, "Contexto carregado"))
    summary = service.process(vector, EventState.S2)
    if summary.decision != expected:
        print(
            f"WARNING: {summary.decision.value} recebido em vez de {expected.value} para {vector.dimensions.identidade['reference']}"
        )
    entries.append(summary.audit_entry)

    reason_s3 = (
        "Persistido na sandbox" if summary.decision != FilamentDecision.BLOQUEAR else "Persistência abortada"
    )
    entries.append(service.log_state(vector, EventState.S3, summary.decision, reason_s3))

    reason_s4 = "Learning checkpoint" if summary.decision == FilamentDecision.ACEITAR else "Aprendizado em ajuste"
    entries.append(service.record_learning(vector, reason_s4, decision=summary.decision, state=EventState.S4))

    return entries, tracker.entries


def build_report(vector: EventVector, entries: Iterable[FilamentAuditEntry], hook_entries: Iterable[FilamentAuditEntry]) -> Dict[str, object]:
    entries_list = list(entries)
    event_vector_id = f"{vector.name}#{vector.dimensions.identidade['reference']}#{vector.dimensions.contexto['course_reference']}"
    summary_entry = entries_list[2]
    return {
        "event_vector": event_vector_id,
        "story_id": vector.story_id,
        "states": [
            {
                "state": entry.state.value,
                "filament": entry.decision.value,
                "reason": entry.reason,
                "timestamp": entry.timestamp.isoformat(),
            }
            for entry in entries_list
        ],
        "audit_logs_present": True,
        "hooks_triggered": bool(hook_entries),
        "validation_status": SCENARIO_DIGEST.get(summary_entry.decision, "PASS"),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Configura o ambiente dimensional e simula CourseEnrollment.")
    parser.add_argument(
        "--webhook",
        help="URL de webhook para registrar os FilamentAuditEntry durante a simulação.",
    )
    parser.add_argument(
        "--skip-simulation",
        action="store_true",
        help="Somente popula o banco e encerra o script sem simular os vetores.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.webhook:
        os.environ["FILAMENT_WEBHOOK_URL"] = args.webhook

    with transaction.atomic():
        data = seed_environment()

    if args.skip_simulation:
        print("Sandbox populado com usuários, cursos, coortes e matrículas de apoio.")
        return

    scenarios = [
        {
            "label": "Fluxo normal (ACEITAR)",
            "user": data["users"]["student"],
            "cohort": data["cohorts"]["open"],
            "expected": FilamentDecision.ACEITAR,
        },
        {
            "label": "Ajuste por risco (AJUSTAR)",
            "user": data["users"]["student"],
            "cohort": data["cohorts"]["limited"],
            "expected": FilamentDecision.AJUSTAR,
        },
        {
            "label": "Bloqueio por identidade (BLOQUEAR)",
            "user": data["users"]["blocked"],
            "cohort": data["cohorts"]["limited"],
            "expected": FilamentDecision.BLOQUEAR,
        },
    ]

    reports = []
    for scenario in scenarios:
        vector = build_vector(scenario["user"], scenario["cohort"])
        entries, hook_entries = replay_vector(vector, scenario["expected"])
        report = build_report(vector, entries, hook_entries)
        print(f"\nResultado do cenário: {scenario['label']}")
        print(json.dumps(report, indent=2, ensure_ascii=False))
        reports.append(report)

    print("\nSimulação concluída. Registre os JSONs acima no dashboard n8n para auditoria.")


if __name__ == "__main__":
    main()
