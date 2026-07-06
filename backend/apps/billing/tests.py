from django.test import TestCase

from apps.billing.models import Subscription
from apps.organizations.models import Organization


class SubscriptionModelTests(TestCase):
    def test_create_subscription_defaults(self):
        org = Organization.objects.create(name="Acme", slug="acme-bill")
        sub = Subscription.objects.create(organization=org, provider="payme")
        self.assertEqual(sub.plan, Organization.Plan.STARTER)
        self.assertEqual(sub.status, Subscription.Status.TRIALING)
        self.assertEqual(org.subscription, sub)  # OneToOne reverse accessor
