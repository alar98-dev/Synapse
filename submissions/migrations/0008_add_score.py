from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0007_merge_0002_0006'),
    ]

    operations = [
        migrations.AddField(
            model_name='submission',
            name='score',
            field=models.FloatField(default=0.0, help_text='Calculated score (0-100)'),
            preserve_default=False,
        ),
    ]
