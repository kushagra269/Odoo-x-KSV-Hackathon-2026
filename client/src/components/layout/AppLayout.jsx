import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/helpers';

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard'       },
  { to: '/vendors',         label: 'Vendors'         },
  { to: '/rfqs',            label: "RFQ's"           },
  { to: '/quotations',      label: 'Quotations'      },
  { to: '/approvals',       label: 'Approvals'       },
  { to: '/purchase-orders', label: 'Purchase Orders' },
  { to: '/invoices',        label: 'Invoices'        },
  { to: '/reports',         label: 'Reports'         },
  { to: '/activity',        label: 'Activity'        },
];

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoText}>VendorBridge</span>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              — {label}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom of sidebar */}
        <div style={styles.sidebarFooter}>
          <div style={styles.avatar}>{getInitials(`${user?.first_name} ${user?.last_name}`)}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.first_name} {user?.last_name}</span>
            <span style={styles.userRole}>{user?.role?.replace('_', ' ')}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">✕</button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div style={styles.main}>
        {/* TopBar */}
        <header style={styles.topbar}>
          <span style={styles.topbarBrand}>VendorBridge</span>
          <div style={styles.topbarRight}>
            <span style={styles.topbarUser}>{user?.first_name?.toUpperCase()} {user?.last_name?.toUpperCase()}</span>
            <div style={styles.avatarSm}>{getInitials(`${user?.first_name} ${user?.last_name}`)}</div>
          </div>
        </header>

        {/* Page content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-base)',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  logo: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--border)',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '0.02em',
  },
  nav: {
    flex: 1,
    padding: '12px 0',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'block',
    padding: '10px 20px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    fontWeight: 400,
    textDecoration: 'none',
    transition: 'all var(--transition)',
    borderRadius: 0,
    borderLeft: '3px solid transparent',
  },
  navItemActive: {
    color: 'var(--accent)',
    backgroundColor: 'var(--accent-muted)',
    borderLeftColor: 'var(--accent)',
    fontWeight: 600,
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '4px',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    height: 'var(--topbar-height)',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
  },
  topbarBrand: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    letterSpacing: '0.02em',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  topbarUser: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.08em',
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
  },
};
