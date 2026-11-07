from django.db import migrations, models


def clear_gold_nav_color(apps, schema_editor):
    """Drop the gold bar every install was given by the old default.

    Only rows still carrying the exact old default are touched: anyone who
    picked a colour of their own keeps it, and an empty value means "follow the
    theme", which is what the bar does now.
    """
    UserPreference = apps.get_model('cookbook', 'UserPreference')
    UserPreference.objects.filter(nav_bg_color='#ddbf86').update(nav_bg_color='')
    Space = apps.get_model('cookbook', 'Space')
    Space.objects.filter(nav_bg_color='#ddbf86').update(nav_bg_color='')


class Migration(migrations.Migration):

    dependencies = [
        ('cookbook', '0243_auto_20261018_1149'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userpreference',
            name='nav_bg_color',
            field=models.CharField(blank=True, default='', max_length=8),
        ),
        migrations.RunPython(clear_gold_nav_color, migrations.RunPython.noop),
    ]
