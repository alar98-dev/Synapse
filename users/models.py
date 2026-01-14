from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # extensible custom user model
    bio = models.TextField(blank=True, null=True)
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('monitor', 'Monitor'),
        ('staff', 'Staff'),
    ]
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return self.username
