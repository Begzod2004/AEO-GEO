import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/http";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName || undefined);
      // First run lands on onboarding to create an organization.
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(apiError(err, "Couldn't create your account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="eyebrow mb-2">Get started</p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-text">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">Start tracking how AI answers talk about your brand.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-control border border-poor/30 bg-poor/10 px-3.5 py-2.5 text-sm text-poor">
            {error}
          </div>
        )}
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ada Devlin"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          hint="Use 8+ characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
