"""Auth endpoints: register, login, refresh, logout, me."""
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts import tokens
from apps.accounts.serializers import (
    LoginSerializer,
    RedisTokenRefreshSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    serializer_class = RedisTokenRefreshSerializer
    permission_classes = [AllowAny]


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
