"""Accounts: custom email-based User and the global Role enum.

A user's role is NEVER stored here — roles are per-organization and live on
``organizations.Membership``. One user can belong to many organizations with a
different role in each.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    ORG_OWNER = "org_owner", "Organization Owner"
    ORG_ADMIN = "org_admin", "Organization Admin"
    MARKETING_MANAGER = "marketing_manager", "Marketing Manager"
    AEO_SPECIALIST = "aeo_specialist", "SEO/AEO Specialist"
    CONTENT_MANAGER = "content_manager", "Content Manager"
    WRITER = "writer", "Writer"
    DEVELOPER = "developer", "Developer"
    BILLING_MANAGER = "billing_manager", "Billing Manager"
    VIEWER = "viewer", "Viewer"

    @classmethod
    def management_roles(cls):
        """Roles allowed to administer an organization (invite, settings)."""
        return [cls.ORG_OWNER, cls.ORG_ADMIN]


class UserManager(BaseUserManager):
    """Manager for the email-as-username User model."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    # Email replaces username as the unique login identifier.
    username = None
    email = models.EmailField("email address", unique=True)
    full_name = models.CharField(max_length=255, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
