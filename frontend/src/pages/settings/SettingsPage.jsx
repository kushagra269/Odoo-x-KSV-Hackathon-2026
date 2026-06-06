import { useState } from "react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useUiStore } from "../../store/uiStore";

const initialMembers = [
  { id: "usr-001", name: "Harshal Patel", role: "Procurement Officer", email: "harshal@vendorbridge.demo", status: "active" },
  { id: "usr-002", name: "Rahul Mehta", role: "Manager", email: "rahul@vendorbridge.demo", status: "active" },
  { id: "usr-003", name: "Priya Shah", role: "Finance Approver", email: "priya@vendorbridge.demo", status: "active" },
  { id: "usr-004", name: "Aarav Soni", role: "Vendor Admin", email: "aarav@vendorbridge.demo", status: "pending" },
];

export function SettingsPage() {
  const pushToast = useUiStore((state) => state.pushToast);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Manager" });
  const [members, setMembers] = useState(initialMembers);

  const inviteMember = () => {
    if (!invite.name || !invite.email) {
      pushToast({
        tone: "danger",
        title: "Invite incomplete",
        description: "Please add the teammate name and email before sending the invite.",
      });
      return;
    }

    setMembers((current) => [
      {
        id: `usr-${Date.now()}`,
        name: invite.name,
        email: invite.email,
        role: invite.role,
        status: "pending",
      },
      ...current,
    ]);

    setInvite({ name: "", email: "", role: "Manager" });
    pushToast({
      tone: "success",
      title: "Invite sent",
      description: "The new team account has been staged and is ready for backend onboarding flows.",
    });
  };

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Settings & Team Management</h2>
          <p>Manage teammates, role permissions, workspace policies, and approval ownership.</p>
        </div>
        <Button onClick={inviteMember}>
          <UserPlus size={16} />
          Invite Team Member
        </Button>
      </section>

      <div className="two-column">
        <SurfaceCard className="page-stack">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">Workspace access</p>
              <h3>Team accounts</h3>
            </div>
          </div>
          <div className="settings-list">
            {members.map((member) => (
              <article className="settings-list__item settings-list__item--team" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.email} · {member.role}</p>
                </div>
                <div className="page-actions page-actions--inline">
                  <StatusBadge status={member.status}>{member.status}</StatusBadge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      pushToast({
                        tone: "info",
                        title: "Role editor opened",
                        description: `Role management for ${member.name} is ready for backend integration.`,
                      })
                    }
                  >
                    Edit Role
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      pushToast({
                        tone: member.status === "pending" ? "success" : "warning",
                        title: member.status === "pending" ? "Invite resent" : "Access updated",
                        description:
                          member.status === "pending"
                            ? `A new invite link has been sent to ${member.email}.`
                            : `${member.name}'s account controls have been updated.`,
                      })
                    }
                  >
                    {member.status === "pending" ? "Resend Invite" : "Manage"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <div className="page-stack">
          <SurfaceCard className="page-stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Add account</p>
                <h3>Invite new teammate</h3>
              </div>
            </div>
            <Field label="Full name" value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} />
            <Field label="Email address" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
            <Field label="Role" as="select" value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })}>
              <option>Manager</option>
              <option>Procurement Officer</option>
              <option>Finance Approver</option>
              <option>Vendor Admin</option>
            </Field>
            <Button onClick={inviteMember}>Send Invite</Button>
          </SurfaceCard>

          <SurfaceCard className="page-stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Policy controls</p>
                <h3>Workspace rules</h3>
              </div>
            </div>
            <div className="settings-list">
              {[
                { icon: ShieldCheck, label: "Approval limits", copy: "Require finance sign-off for purchases above 2 lakh." },
                { icon: Users, label: "Vendor onboarding rules", copy: "Block RFQ access until GST and bank documents are verified." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article className="settings-list__item" key={item.label}>
                    <div className="settings-list__icon">
                      <Icon size={16} />
                    </div>
                    <div className="settings-list__copy">
                      <strong>{item.label}</strong>
                      <p>{item.copy}</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        pushToast({
                          tone: "success",
                          title: "Rule updated",
                          description: `${item.label} has been saved in the frontend settings flow.`,
                        })
                      }
                    >
                      Update
                    </Button>
                  </article>
                );
              })}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
