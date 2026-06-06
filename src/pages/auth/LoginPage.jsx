import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";

const schema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(6, "Password is required"),
});

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const pushToast = useUiStore((state) => state.pushToast);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "harshal@vendorbridge.demo",
      password: "demo1234",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken);
      pushToast({
        tone: "success",
        title: "Welcome back",
        description: "You are now inside the VendorBridge workspace.",
      });
      navigate("/dashboard");
    },
    onError: () => {
      pushToast({
        tone: "danger",
        title: "Login failed",
        description: "Please recheck your credentials and try again.",
      });
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-page__hero">
        <p className="auth-page__eyebrow">Odoo Hackathon Frontend</p>
        <h1>Make procurement feel precise, confident, and unmistakably premium.</h1>
      </div>

      <div className="auth-card">
        <div className="auth-card__photo">
          <div className="auth-card__photo-ring">
            <span>VB</span>
          </div>
        </div>

        <div className="auth-card__header">
          <h2>Welcome back</h2>
          <p>Use your work account to enter the procurement workspace.</p>
        </div>

        <form onSubmit={handleSubmit((values) => loginMutation.mutate(values))} className="auth-card__form">
          <Field label="Email address" placeholder="name@company.com" error={errors.email?.message} {...register("email")} />
          <Field label="Password" type="password" placeholder="Enter your password" error={errors.password?.message} {...register("password")} />

          <div className="auth-card__row">
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              <span>Keep me signed in</span>
            </label>
            <button
              className="text-button"
              type="button"
              onClick={() =>
                pushToast({
                  tone: "info",
                  title: "Reset flow ready",
                  description: "Connect this action to your backend forgot-password endpoint when available.",
                })
              }
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="auth-card__switch">
          New here? <Link to="/register">Create your account</Link>
        </p>
      </div>
    </div>
  );
}
