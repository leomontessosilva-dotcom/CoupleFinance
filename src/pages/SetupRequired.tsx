import { ExternalLink, Database, CheckCircle } from 'lucide-react';

export default function SetupRequired() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div style={{
          width: 48, height: 48, background: 'var(--amber-bg)',
          border: '1px solid rgba(180,83,9,0.2)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Database size={22} color="var(--amber)" />
        </div>

        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 300, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Configuração do banco de dados
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 28 }}>
          As tabelas do Supabase ainda não foram criadas. Siga os passos abaixo para concluir a configuração (leva menos de 2 minutos).
        </p>

        <div className="surface" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-1)' }}>
            Passos:
          </h3>
          {[
            { step: 1, text: 'Acesse o Supabase Dashboard' },
            { step: 2, text: 'Clique em "SQL Editor" no menu lateral' },
            { step: 3, text: 'Clique em "+ New Query"' },
            { step: 4, text: 'Cole o conteúdo do arquivo supabase/migration.sql' },
            { step: 5, text: 'Clique em "Run" e recarregue esta página' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}>
                {step}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}

          <a
            href="https://supabase.com/dashboard/project/izxykullxlkyryebfxvf/sql/new"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ display: 'inline-flex', marginTop: 16, textDecoration: 'none' }}
          >
            Abrir SQL Editor <ExternalLink size={14} />
          </a>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <CheckCircle size={14} /> Já rodei — recarregar
        </button>
      </div>
    </div>
  );
}
