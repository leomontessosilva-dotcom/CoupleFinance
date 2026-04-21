import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [mode, setMode]   = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo]   = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setInfo('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setError(
        msg.includes('Invalid login') ? 'E-mail ou senha incorretos.' :
        msg.includes('already registered') ? 'E-mail já cadastrado. Faça login.' :
        msg.includes('Password should be') ? 'A senha deve ter pelo menos 6 caracteres.' :
        msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Background gradient blobs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '30%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '20%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(213,25,122,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(109,40,217,0.28)',
          }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'white' }}>
              cf
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '2rem',
            fontWeight: 300,
            letterSpacing: '-0.03em',
            color: 'var(--text-1)',
            marginBottom: 6,
          }}>
            CoupleFinance
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Finanças do casal, em um só lugar.
          </p>
        </div>

        {/* Card */}
        <div className="surface" style={{ padding: 32 }}>

          {/* Mode toggle */}
          <div className="tab-bar" style={{ marginBottom: 24 }}>
            <button
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); setInfo(''); }}
            >
              Entrar
            </button>
            <button
              className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handle}>
            <div style={{ marginBottom: 16 }}>
              <label className="f-label">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="voces@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="f-label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)',
                  }}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error / Info */}
            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--red-bg)',
                border: '1px solid rgba(200,35,26,0.15)',
                borderRadius: 8,
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 500 }}>{error}</p>
              </div>
            )}
            {info && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--green-bg)',
                border: '1px solid rgba(4,120,87,0.15)',
                borderRadius: 8,
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14 }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Aguarde...</>
                : <>{mode === 'login' ? 'Entrar' : 'Criar conta'} <ArrowRight size={15} /></>
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', marginTop: 20 }}>
          Compartilhe o e-mail e senha com sua parceira(o) para acesso em todos os dispositivos.
        </p>

      </div>
    </div>
  );
}
