import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@smartseason.com');
      setPassword('admin123');
    } else {
      setEmail('james@smartseason.com');
      setPassword('agent123');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.logoWrap}>
            <span className={styles.logoEmoji}>🌿</span>
          </div>
          <h1 className={styles.headline}>
            Every field,<br />
            <em>monitored.</em>
          </h1>
          <p className={styles.sub}>
            Track crop progress, coordinate field agents,
            and make smarter harvest decisions — all in one place.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNum}>4</div>
              <div className={styles.statLabel}>Crop stages</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statNum}>Live</div>
              <div className={styles.statLabel}>Field updates</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statNum}>2</div>
              <div className={styles.statLabel}>User roles</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSub}>Access your field monitoring dashboard</p>
          </div>

          <div className={styles.demoButtons}>
            <span className={styles.demoLabel}>Quick demo:</span>
            <button type="button" className={styles.demoBtn} onClick={() => fillDemo('admin')}>
              Admin
            </button>
            <button type="button" className={styles.demoBtn} onClick={() => fillDemo('agent')}>
              Agent
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
