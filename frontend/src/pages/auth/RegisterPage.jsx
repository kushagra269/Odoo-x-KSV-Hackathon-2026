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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Phone is required"),
  role: z.enum(["procurement_officer", "vendor", "manager", "admin"]),
  country: z.string().min(2, "Country is required"),
  additional_info: z.string().min(10, "Add a little context about this user"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export function RegisterPage() {
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
      role: "procurement_officer",
      country: "India",
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken);
      pushToast({
        tone: "success",
        title: "Account ready",
        description: "Your new profile has been created successfully.",
      });
      navigate("/dashboard");
    },
  });

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__header">
          <h2>Create your VendorBridge profile</h2>
          <p>Set up a role-aware account that fits the procurement workflow from day one.</p>
        </div>

        <form onSubmit={handleSubmit((values) => registerMutation.mutate(values))} className="register-grid">
          <div className="profile-uploader">
            <div className="profile-uploader__avatar">Upload photo</div>
            <p>Optional profile photo for a friendlier approval chain.</p>
          </div>

          <Field label="First name" placeholder="Harshal" error={errors.first_name?.message} {...register("first_name")} />
          <Field label="Last name" placeholder="Patel" error={errors.last_name?.message} {...register("last_name")} />
          <Field label="Email address" placeholder="name@company.com" error={errors.email?.message} {...register("email")} />
          <Field label="Phone number" placeholder="+91 98989 45000" error={errors.phone?.message} {...register("phone")} />
          <Field label="Role" as="select" error={errors.role?.message} {...register("role")}>
            <option value="procurement_officer">Procurement Officer</option>
            <option value="vendor">Vendor</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Field>
          <Field label="Country" placeholder="India" error={errors.country?.message} {...register("country")} />
          <Field
            label="Additional information"
            textarea
            rows={5}
            placeholder="Add responsibility notes, approval scope, or onboarding remarks..."
            error={errors.additional_info?.message}
            className="register-grid__wide"
            {...register("additional_info")}
          />
          <Field
            label="Password"
            type="password"
            placeholder="Create a secure password"
            error={errors.password?.message}
            className="register-grid__wide"
            {...register("password")}
          />

          <div className="register-grid__footer">
            <Button type="submit" size="lg" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
            <p>
              Already have access? <Link to="/login">Back to login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
