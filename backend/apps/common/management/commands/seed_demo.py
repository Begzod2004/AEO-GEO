"""One command to set up local review accounts:

    python manage.py seed_demo

Creates a superuser (admin@aeo.geo) for the Django admin, and a populated demo
account (demo@aeo.geo) whose organization already has a processed document, a
crawl, generated schema, prompts, a scan and computed dashboard scores — so the
dashboard is full on first login. Idempotent: safe to re-run.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.accounts.models import Role
from apps.ai_monitoring.tasks import generate_prompts, run_ai_scan
from apps.ai_optimization.models import SchemaMarkup
from apps.ai_optimization.tasks import generate_schema_task
from apps.dashboard.tasks import compute_score_snapshot
from apps.knowledge_base.models import Document
from apps.knowledge_base.tasks import process_document_task
from apps.organizations.models import Domain, Membership, Organization
from apps.website_manager.models import CrawlResult
from apps.website_manager.tasks import crawl_domain_task

User = get_user_model()

ADMIN_EMAIL, ADMIN_PASSWORD = "admin@aeo.geo", "AeoAdmin2026!"
DEMO_EMAIL, DEMO_PASSWORD = "demo@aeo.geo", "Signals2026!"


class Command(BaseCommand):
    help = "Create a superuser and a populated demo account for local review."

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={"full_name": "Admin", "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password(ADMIN_PASSWORD)
            admin.save()
        self.stdout.write(f"superuser {ADMIN_EMAIL} {'created' if created else 'exists'}")

        demo, created = User.objects.get_or_create(
            email=DEMO_EMAIL, defaults={"full_name": "Demo User"}
        )
        if created:
            demo.set_password(DEMO_PASSWORD)
            demo.save()

        if demo.memberships.exists():
            self.stdout.write("demo account already populated")
            return

        org = Organization.objects.create(name="Demo Co", slug="demo-co", industry="AI SaaS")
        Membership.objects.create(user=demo, organization=org, role=Role.ORG_OWNER)
        dom = Domain.objects.create(organization=org, url="https://example.com", is_primary=True)

        doc = Document.objects.create(
            organization=org, source_type="text", title="About Demo Co",
            raw_text=("Demo Co builds AI visibility tools and offers analytics products "
                      "and services for brands. Customers get started with a free scan."),
        )
        process_document_task(doc.id)
        crawl_domain_task(CrawlResult.objects.create(domain=dom).id)
        for schema_type in ("faq", "organization"):
            generate_schema_task(
                SchemaMarkup.objects.create(organization=org, schema_type=schema_type).id
            )
        generate_prompts(org)
        run_ai_scan(org.id)
        compute_score_snapshot(org.id)

        self.stdout.write(self.style.SUCCESS(
            f"demo {DEMO_EMAIL} populated (org, document, crawl, schema, scan, scores)"
        ))
