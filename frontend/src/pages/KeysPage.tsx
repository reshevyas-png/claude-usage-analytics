import { useEffect, useState } from 'react';
import { createKey, listKeys, deleteKey } from '../lib/api';
import { getColorForLabel } from '../lib/colors';

export default function KeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [label, setLabel] = useState('');
  const [newProxyKey, setNewProxyKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadKeys = () => listKeys().then(setKeys).catch(console.error);

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNewProxyKey(null);
    try {
      const res = await createKey(anthropicKey, label || undefined);
      setNewProxyKey(res.proxy_key);
      setAnthropicKey('');
      setLabel('');
      loadKeys();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    await deleteKey(id);
    loadKeys();
  };

  const INPUT_STYLE = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none transition-colors";
  const INPUT_BG = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold tracking-tight">API Keys</h1>

      {/* Create key form */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-2 text-[15px]">Create Proxy Key</h3>
        <p className="text-[rgba(255,255,255,0.55)] text-sm mb-4">
          Enter your Anthropic API key. It will be encrypted and stored securely.
          You'll receive a proxy key to use instead.
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="password"
            placeholder="sk-ant-..."
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            className={INPUT_STYLE}
            style={INPUT_BG}
            required
          />
          <input
            type="text"
            placeholder="Label (e.g., legal, sales, engineering)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={INPUT_STYLE}
            style={INPUT_BG}
          />
          {error && <p className="text-[#F43F5E] text-sm">{error}</p>}
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-black transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            Create Key
          </button>
        </form>

        {newProxyKey && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <p className="text-[#10B981] text-sm font-semibold mb-1">Your proxy key (copy it now — it won't be shown again):</p>
            <code className="text-[#6EE7B7] text-sm font-mono-num break-all">{newProxyKey}</code>
          </div>
        )}
      </div>

      {/* Keys table */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 text-[15px]">Your Keys</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.07)]">
                <th className="text-left py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Prefix</th>
                <th className="text-left py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Label</th>
                <th className="text-left py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Created</th>
                <th className="text-right py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => {
                const colors = getColorForLabel(k.label, i);
                return (
                  <tr
                    key={k.id}
                    className="border-b border-[rgba(255,255,255,0.03)] transition-colors"
                    style={{ borderLeft: `3px solid ${colors.fill}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-3 px-3 font-mono-num text-xs text-[rgba(255,255,255,0.55)]">{k.key_prefix}...</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                        <span className="text-[13px]" style={{ color: colors.text }}>{k.label || '-'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[rgba(255,255,255,0.55)] text-[13px]">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="text-[#F43F5E] hover:text-[#FDA4AF] text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[rgba(255,255,255,0.25)]">
                    No keys yet. Create one above to start proxying.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage instructions */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-3 text-[15px]">How to use</h3>
        <p className="text-[rgba(255,255,255,0.55)] text-sm mb-3">Replace your Anthropic base URL with your proxy URL:</p>
        <pre className="p-4 rounded-xl text-sm font-mono-num overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[rgba(255,255,255,0.35)]"># Python</span>{'\n'}
          <span className="text-[#F59E0B]">client</span> = anthropic.Anthropic({'\n'}
          {'    '}api_key=<span className="text-[#10B981]">"cua-your-proxy-key"</span>,{'\n'}
          {'    '}base_url=<span className="text-[#10B981]">"http://localhost:8000"</span>{'\n'}
          ){'\n\n'}
          <span className="text-[rgba(255,255,255,0.35)]"># curl</span>{'\n'}
          curl -X POST http://localhost:8000/v1/messages \{'\n'}
          {'  '}-H <span className="text-[#10B981]">"x-api-key: cua-your-proxy-key"</span> \{'\n'}
          {'  '}-H <span className="text-[#10B981]">"content-type: application/json"</span> \{'\n'}
          {'  '}-H <span className="text-[#10B981]">"anthropic-version: 2023-06-01"</span> \{'\n'}
          {'  '}-d <span className="text-[#10B981]">'{`{"model":"claude-sonnet-4-6","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}`}'</span>
        </pre>
      </div>
    </div>
  );
}
