#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synapse_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson, Material
from cognition.models import AssessmentSession

User = get_user_model()

def seed():
    # Ensure users exist (from create_demo_users)
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    
    student = User.objects.filter(role='student').first()
    if not student:
        student = User.objects.create_user('student', 'student@example.com', 'student123', role='student')

    # Create a Course
    course, _ = Course.objects.get_or_create(
        title="Introdução ao Ensino Híbrido",
        defaults={
            'description': "Fundamentos e práticas do ensino híbrido no século XXI.",
            'is_published': True,
            'level': 'beginner'
        }
    )

    # Create a Module
    module, _ = Module.objects.get_or_create(
        course=course,
        title="Módulo 1: Conceitos Básicos",
        defaults={'order': 1}
    )

    # Create some Lessons
    lesson1, _ = Lesson.objects.get_or_create(
        module=module,
        title="O que é Ensino Híbrido?",
        defaults={'lesson_type': 'video', 'order': 1, 'duration_minutes': 15}
    )

    lesson2, _ = Lesson.objects.get_or_create(
        module=module,
        title="Modelos de Rotação",
        defaults={'lesson_type': 'text', 'order': 2, 'duration_minutes': 30}
    )

    # Create Materials
    Material.objects.get_or_create(lesson=lesson1, name="Slides da Aula 1")
    Material.objects.get_or_create(lesson=lesson2, name="Guia de Leitura: Rotação")

    # Create a Cognition Session
    AssessmentSession.objects.get_or_create(
        user=student,
        lesson=lesson1,
        defaults={'status': 'active'}
    )

    print("Seed completed successfully!")
    print(f"Courses: {Course.objects.count()}")
    print(f"Materials: {Material.objects.count()}")
    print(f"Sessions: {AssessmentSession.objects.count()}")

if __name__ == "__main__":
    seed()
