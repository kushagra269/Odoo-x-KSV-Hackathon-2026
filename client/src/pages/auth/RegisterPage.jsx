import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import styles from './Auth.module.css';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least 1 uppercase letter')
    .regex(/[0-9]/, 'At least 1 number')
    .regex(/[^A-Za-z0-9]/, 'At least 1 special character'),
  phone: z.string().optional(),
  country: z.string().optional(),
  role: z.enum(['procurement_officer', 'vendor', 'manager', 'admin']),
  additional_info: z.string().optional(),
});

const ROLES = [
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'procurement_officer' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      await authApi.register(data);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>VendorBridge</span>
        </div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join your organization's procurement platform</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>First name</label>
              <input {...register('first_name')} placeholder="Harshal" className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`} />
              {errors.first_name && <span className={styles.error}>{errors.first_name.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Last name</label>
              <input {...register('last_name')} placeholder="Patel" className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`} />
              {errors.last_name && <span className={styles.error}>{errors.last_name.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input {...register('email')} type="email" placeholder="you@company.com" className={`${styles.input} ${errors.email ? styles.inputError : ''}`} />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input {...register('password')} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" className={`${styles.input} ${errors.password ? styles.inputError : ''}`} />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Phone <span className={styles.optional}>(optional)</span></label>
              <input {...register('phone')} placeholder="+91 98765 43210" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Country <span className={styles.optional}>(optional)</span></label>
              <input {...register('country')} placeholder="India" className={styles.input} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <select {...register('role')} className={`${styles.input} ${styles.select} ${errors.role ? styles.inputError : ''}`}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <span className={styles.error}>{errors.role.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Additional info <span className={styles.optional}>(optional)</span></label>
            <textarea {...register('additional_info')} placeholder="Department, designation, notes..." className={`${styles.input} ${styles.textarea}`} rows={3} />
          </div>

          {serverError && <div className={styles.serverError}>{serverError}</div>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
