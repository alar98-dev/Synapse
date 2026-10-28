from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from typing import Dict, List


class RBACService:
    """Configures and manages standard RBAC groups and permission sets for Synapse."""

    GROUPS = {
        'Administrators': [
            # All permissions or managed via is_superuser / is_staff
        ],
        'Instructors': [
            ('courses', 'course', ['add_course', 'change_course', 'view_course']),
            ('courses', 'module', ['add_module', 'change_module', 'delete_module', 'view_module']),
            ('courses', 'lesson', ['add_lesson', 'change_lesson', 'delete_lesson', 'view_lesson']),
            ('courses', 'cohort', ['add_cohort', 'change_cohort', 'view_cohort']),
            ('submissions', 'problem', ['add_problem', 'change_problem', 'view_problem']),
            ('submissions', 'submission', ['view_submission']),
        ],
        'Students': [
            ('courses', 'course', ['view_course']),
            ('courses', 'module', ['view_module']),
            ('courses', 'lesson', ['view_lesson']),
            ('courses', 'enrollment', ['add_enrollment', 'view_enrollment']),
            ('submissions', 'problem', ['view_problem']),
            ('submissions', 'submission', ['add_submission', 'view_submission']),
        ],
        'Auditors': [
            ('core', 'auditentry', ['view_auditentry']),
            ('submissions', 'submissionlog', ['view_submissionlog']),
            ('payments', 'paymentlog', ['view_paymentlog']),
            ('courses', 'course', ['view_course']),
            ('submissions', 'submission', ['view_submission']),
        ]
    }

    @classmethod
    def setup_default_groups(cls) -> Dict[str, int]:
        """Creates standard groups and assigns their canonical permissions.

        Returns a summary dictionary of group names and assigned permissions count.
        """
        summary = {}

        for group_name, perms_spec in cls.GROUPS.items():
            group, _ = Group.objects.get_or_create(name=group_name)
            assigned_count = 0

            for app_label, model_name, codenames in perms_spec:
                try:
                    ct = ContentType.objects.get(app_label=app_label, model=model_name)
                    for codename in codenames:
                        perm = Permission.objects.filter(content_type=ct, codename=codename).first()
                        if perm:
                            group.permissions.add(perm)
                            assigned_count += 1
                except ContentType.DoesNotExist:
                    continue

            summary[group_name] = assigned_count

        return summary
