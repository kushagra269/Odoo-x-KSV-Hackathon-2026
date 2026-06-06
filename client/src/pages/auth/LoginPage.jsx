import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import styles from './Auth.module.css';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await authApi.login(data);
      const { access_token, refresh_token, user } = res.data.data;
      localStorage.setItem('refresh_token', refresh_token);
      setAuth(user, access_token);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>VendorBridge</span>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your procurement dashboard</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@company.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              autoComplete="email"
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              autoComplete="current-password"
            />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          {serverError && <div className={styles.serverError}>{serverError}</div>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
