from django.core.management.base import BaseCommand
from users.services.rbac_service import RBACService


class Command(BaseCommand):
    help = 'Provisions default RBAC groups and permissions (Administrators, Instructors, Students, Auditors)'

    def handle(self, *args, **options):
        self.stdout.write("Configuring RBAC groups and permissions...")
        summary = RBACService.setup_default_groups()
        for group, count in summary.items():
            self.stdout.write(self.style.SUCCESS(f"Group '{group}': {count} permissions assigned."))
        self.stdout.write(self.style.SUCCESS("RBAC provisioning completed successfully."))
