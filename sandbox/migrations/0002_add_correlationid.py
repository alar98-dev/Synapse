# Migration to add correlation_id to ExecutionJob
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('sandbox', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='executionjob',
            name='correlation_id',
            field=models.CharField(db_index=True, max_length=255, null=True, blank=True),
        ),
    ]
