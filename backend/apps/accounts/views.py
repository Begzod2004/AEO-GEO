"""Auth endpoints: register, login, refresh, logout, me, accept-invite,
forgot/reset password."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts import tokens
from apps.accounts.invites import read_invite_token
from apps.common.audit import record
from apps.common.throttling import AuthRateThrottle
from apps.accounts.serializers import (
    LoginSerializer,
    RedisTokenRefreshSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def perform_create(self, serializer):
        user = serializer.save()
        record("user.register", user=user)


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]


class RefreshView(TokenRefreshView):
    serializer_class = RedisTokenRefreshSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]


class LogoutView(APIView):
    """Revoke a refresh token so it can no longer be used to refresh."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw = request.data.get("refresh")
        if not raw:
            return Response(
                {"detail": "refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            refresh = RefreshToken(raw)
        except TokenError:
            return Response(
                {"detail": "invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tokens.revoke_refresh(refresh["user_id"], refresh["jti"])
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AcceptInviteView(APIView):
    """Activate an invited account: set a password using the invite token.

    The invited user + membership already exist (created at invite time); this
    just lets them choose a password so they can log in. One-time: once a usable
    password is set, the token no longer works.
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        token = request.data.get("token")
        password = request.data.get("password")
        if not token or not password:
            return Response(
                {"detail": "token and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uid = read_invite_token(token)
        user = User.objects.filter(id=uid).first() if uid is not None else None
        if user is None:
            return Response(
                {"detail": "invalid or expired invite token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.has_usable_password():
            return Response(
                {"detail": "invite has already been accepted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password, user)
        except ValidationError as exc:
            return Response({"password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save(update_fields=["password"])
        record("user.accept_invite", user=user)
        return Response(
            {"email": user.email, "detail": "invite accepted"},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    """Request a password-reset link. Always answers 200 so account existence
    is never leaked; the mail goes out only when the account exists."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"detail": "email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is not None:
            # Django's generator: expires (PASSWORD_RESET_TIMEOUT) and becomes
            # invalid the moment the password changes — true one-time links.
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password?uid={user.id}&token={token}"
            send_mail(
                "Reset your AEO.GEO password",
                "Someone requested a password reset for this account.\n\n"
                f"Set a new password here (valid for 1 hour): {link}\n\n"
                "If this wasn't you, you can ignore this email.",
                None,
                [user.email],
                fail_silently=True,
            )
            record("user.password_reset_requested", user=user)

        return Response(
            {"detail": "If that account exists, we've emailed a reset link."}
        )


class ResetPasswordView(APIView):
    """Set a new password using the emailed uid+token pair."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")
        if not uid or not token or not password:
            return Response(
                {"detail": "uid, token and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(id=uid, is_active=True).first()
        if user is None or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "invalid or expired reset link"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password, user)
        except ValidationError as exc:
            return Response(
                {"password": exc.messages}, status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save(update_fields=["password"])
        record("user.password_reset_completed", user=user)
        return Response({"detail": "password updated"})
