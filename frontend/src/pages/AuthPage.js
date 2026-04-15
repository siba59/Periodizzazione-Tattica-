import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Inserisci il tuo nome'); setLoading(false); return; }
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') setError(detail);
      else if (Array.isArray(detail)) setError(detail.map(e => e.msg || JSON.stringify(e)).join(' '));
      else setError('Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050505' }}>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-gold-gradient mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Periodizzazione Tattica
          </h1>
          <p className="text-sm" style={{ color: '#A1A1AA' }}>
            {isLogin ? 'Accedi al tuo percorso' : 'Inizia il tuo viaggio'}
          </p>
        </div>

        <div className="card-dark rounded-xl p-8">
          <div className="flex mb-8 border-b" style={{ borderColor: '#27272A' }}>
            <button
              data-testid="auth-tab-login"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${isLogin ? 'border-b-2' : ''}`}
              style={{ color: isLogin ? '#D4AF37' : '#71717A', borderColor: isLogin ? '#D4AF37' : 'transparent' }}
            >
              Accedi
            </button>
            <button
              data-testid="auth-tab-register"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${!isLogin ? 'border-b-2' : ''}`}
              style={{ color: !isLogin ? '#D4AF37' : '#71717A', borderColor: !isLogin ? '#D4AF37' : 'transparent' }}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs mb-1.5" style={{ color: '#A1A1AA' }}>Nome</label>
                <input
                  data-testid="auth-name-input"
                  type="text"
                  className="input-dark"
                  placeholder="Il tuo nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#A1A1AA' }}>Email</label>
              <input
                data-testid="auth-email-input"
                type="email"
                className="input-dark"
                placeholder="email@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#A1A1AA' }}>Password</label>
              <div className="relative">
                <input
                  data-testid="auth-password-input"
                  type={showPass ? 'text' : 'password'}
                  className="input-dark pr-10"
                  placeholder="La tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#71717A' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div data-testid="auth-error" className="text-sm p-3 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <button
              data-testid="auth-submit-button"
              type="submit"
              disabled={loading}
              className="btn-gold w-full flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  {isLogin ? 'Accedi' : 'Registrati'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#71717A' }}>
          "Chi capisce solo di calcio, non capisce niente di calcio"
        </p>
      </div>
    </div>
  );
}
