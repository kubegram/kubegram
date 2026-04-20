import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { checkAuthStatus } from '@/store/slices/oauth/oauthThunks';
import { fetchEncryptionConfig, encryptPassword, type EncryptionConfig } from '@/lib/auth/encryption';
import type { AppDispatch } from '@/store';

// Use relative URL in development to leverage Vite proxy (avoids CORS)
// Use full URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8090');

// Tokens match src/auth/ui.tsx
const c = {
  cardBg: '#18181b',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  border: '#27272a',
  inputBg: '#27272a',
  hoverBg: '#3f3f46',
  primaryBg: '#ffffff',
  primaryText: '#000000',
};

interface PasswordLoginFormProps {
  onSuccess: () => void;
}

export const PasswordLoginForm: React.FC<PasswordLoginFormProps> = ({ onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [encryptionConfig, setEncryptionConfig] = useState<EncryptionConfig>({
    encryptionEnabled: false,
    publicKeyPem: null,
  });

  useEffect(() => {
    fetchEncryptionConfig().then(setEncryptionConfig).catch(() => {});
  }, []);

  async function buildCredentials() {
    if (encryptionConfig.encryptionEnabled && encryptionConfig.publicKeyPem) {
      return { email, encryptedPassword: await encryptPassword(password, encryptionConfig.publicKeyPem) };
    }
    return { email, password };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = await buildCredentials();
      const endpoint = mode === 'login'
        ? '/api/public/v1/auth/password/login'
        : '/api/public/v1/auth/password/register';

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).error || 'Authentication failed');
        return;
      }

      await dispatch(checkAuthStatus());
      const redirectTo = localStorage.getItem('oauth_redirect_path') || '/';
      localStorage.removeItem('oauth_redirect_path');
      if (redirectTo !== window.location.pathname) {
        window.location.href = redirectTo;
      } else {
        onSuccess();
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    paddingRight: '2.75rem',
    backgroundColor: c.inputBg,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    color: c.textPrimary,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      {/* Logo — matches ui.tsx */}
      <img src="/logo.png" alt="Kubegram" style={{ width: '25%', height: 'auto', objectFit: 'contain' }} />

      <p style={{ color: c.textSecondary, fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
        {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
          style={inputStyle}
        />

        {/* Password */}
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary,
              display: 'flex', alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{error}</p>
        )}

        {/* Primary button — matches ui.tsx continue-btn */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#d4d4d4' : c.primaryBg,
            color: c.primaryText,
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            transition: 'opacity 0.2s',
          }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {/* Toggle between login and register */}
      <p style={{ color: c.textSecondary, fontSize: '0.8rem', margin: 0 }}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: c.textPrimary, textDecoration: 'underline', fontSize: '0.8rem',
            fontFamily: 'inherit',
          }}
        >
          {mode === 'login' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};
