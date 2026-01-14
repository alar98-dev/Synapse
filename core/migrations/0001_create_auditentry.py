# Generated migration to create AuditEntry model for INT-001
from django.db import migrations, models
import uuid

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AuditEntry',
            fields=[
                ('audit_id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('actor_id', models.CharField(blank=True, max_length=255, null=True)),
                ('entity_type', models.CharField(max_length=255)),
                ('entity_id', models.CharField(blank=True, max_length=255, null=True)),
                ('action', models.CharField(max_length=255)),
                ('details', models.JSONField(blank=True, default=dict)),
                ('correlation_id', models.CharField(db_index=True, max_length=255)),
                ('timestamp', models.DateTimeField()),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ]
