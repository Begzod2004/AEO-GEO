import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { OrgProvider } from "@/context/OrgContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute, PublicOnlyRoute, RequireOrg } from "@/routes/guards";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { WebsitePage } from "@/pages/WebsitePage";
import { SchemaPage } from "@/pages/SchemaPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <ToastProvider>
              <Routes>
                {/* Public auth routes */}
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Authenticated routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />

                  {/* Requires a selected organization */}
                  <Route element={<RequireOrg />}>
                    <Route element={<AppShell />}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/documents" element={<DocumentsPage />} />
                      <Route path="/website" element={<WebsitePage />} />
                      <Route path="/schema" element={<SchemaPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </ToastProvider>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
