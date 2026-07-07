"""Accounts serializers: registration, user view, and JWT login/refresh that
plug into the Redis-backed token registry."""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts import tokens

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "date_joined", "is_staff", "is_superuser")
        read_only_fields = ("id", "date_joined", "is_staff", "is_superuser")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    """Email/password login. Records the issued refresh jti in Redis and
    returns the user alongside the tokens."""

    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = RefreshToken(data["refresh"])
        tokens.store_refresh(self.user.id, refresh["jti"])
        data["user"] = UserSerializer(self.user).data
        return data


class RedisTokenRefreshSerializer(TokenRefreshSerializer):
    """Only issue a new access token if the refresh jti is still valid
    (i.e. not logged out) in Redis."""

    def validate(self, attrs):
        refresh = RefreshToken(attrs["refresh"])
        if not tokens.is_refresh_valid(refresh["user_id"], refresh["jti"]):
            raise InvalidToken("Refresh token has been revoked or expired.")
        return super().validate(attrs)
