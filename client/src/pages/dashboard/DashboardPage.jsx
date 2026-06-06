import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';

const DashboardPage = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authApi.logout();
    localStorage.removeItem('refresh_token');
    clearAuth();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', color: 'var(--text-primary)' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>
        Welcome, {user?.first_name} í±‹
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Role: {user?.role} Â· {user?.email}
      </p>
      <button
        onClick={handleLogout}
        style={{
          background: 'var(--danger)', color: '#fff', border: 'none',
          borderRadius: '6px', padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
