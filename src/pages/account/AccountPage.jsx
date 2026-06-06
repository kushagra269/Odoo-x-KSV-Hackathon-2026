import { useNavigate } from "react-router-dom";
import { Bell, KeyRound, LogOut, Upload } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";

export function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const pushToast = useUiStore((state) => state.pushToast);

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Account</h2>
          <p>Manage your profile, login security, and personal notification preferences.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            clearAuth();
            navigate("/login");
          }}
        >
          <LogOut size={16} />
          Logout
        </Button>
      </section>

      <div className="two-column">
        <SurfaceCard className="page-stack">
          <div className="account-hero">
            <div className="account-hero__avatar">{fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
            <div>
              <h3>{fullName}</h3>
              <p>{user?.role?.replaceAll("_", " ")}</p>
            </div>
          </div>

          <div className="two-column">
            <Field label="First name" defaultValue={user?.first_name} />
            <Field label="Last name" defaultValue={user?.last_name} />
            <Field label="Email address" defaultValue={user?.email} />
            <Field label="Phone number" defaultValue={user?.phone} />
            <Field label="Country" defaultValue={user?.country} />
            <Field label="Organization" defaultValue={user?.organization} />
          </div>

          <div className="page-actions page-actions--inline">
            <Button
              variant="secondary"
              onClick={() =>
                pushToast({
                  tone: "info",
                  title: "Photo upload",
                  description: "Profile image upload is ready for your backend or storage API.",
                })
              }
            >
              <Upload size={16} />
              Upload Photo
            </Button>
            <Button
              onClick={() =>
                pushToast({
                  tone: "success",
                  title: "Profile saved",
                  description: "Your account changes have been staged successfully.",
                })
              }
            >
              Save Profile
            </Button>
          </div>
        </SurfaceCard>

        <div className="page-stack">
          <SurfaceCard className="page-stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Security</p>
                <h3>Login & access</h3>
              </div>
            </div>
            <div className="settings-list">
              <article className="settings-list__item">
                <div>
                  <strong>Password policy</strong>
                  <p>Last updated 14 days ago</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    pushToast({
                      tone: "info",
                      title: "Password reset flow",
                      description: "This button is ready to trigger the backend password reset API.",
                    })
                  }
                >
                  <KeyRound size={16} />
                  Change Password
                </Button>
              </article>
              <article className="settings-list__item">
                <div>
                  <strong>2-step verification</strong>
                  <p>Recommended for procurement approvals</p>
                </div>
                <Button
                  onClick={() =>
                    pushToast({
                      tone: "success",
                      title: "2-step verification enabled",
                      description: "Frontend flow completed. Connect this to OTP or authenticator APIs later.",
                    })
                  }
                >
                  Enable
                </Button>
              </article>
            </div>
          </SurfaceCard>

          <SurfaceCard className="page-stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Notifications</p>
                <h3>How you hear from the system</h3>
              </div>
            </div>
            <div className="settings-list">
              {[
                "Approval pending alerts",
                "Invoice due reminders",
                "New RFQ activity digest",
              ].map((label) => (
                <article className="settings-list__item" key={label}>
                  <div>
                    <strong>{label}</strong>
                    <p>Receive important updates in real time</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      pushToast({
                        tone: "success",
                        title: "Preference updated",
                        description: `${label} has been toggled successfully.`,
                      })
                    }
                  >
                    <Bell size={16} />
                    Toggle
                  </Button>
                </article>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
