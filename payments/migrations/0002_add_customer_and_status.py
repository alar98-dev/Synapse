from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='customer_id',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='payment',
            name='status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('pending', 'Pending'),
                    ('completed', 'Completed'),
                    ('failed', 'Failed'),
                    ('refunded', 'Refunded'),
                    ('blocked', 'Blocked'),
                    ('canceled', 'Canceled'),
                ],
                default='pending',
            ),
        ),
    ]
