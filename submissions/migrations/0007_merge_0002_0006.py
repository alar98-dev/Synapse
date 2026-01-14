# Manual merge migration to resolve conflicting branches 0002_add_correlationid and 0006_problem_initial_code_problem_public_tests
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('submissions', '0006_problem_initial_code_problem_public_tests'),
        ('submissions', '0002_add_correlationid'),
    ]

    operations = [
    ]
