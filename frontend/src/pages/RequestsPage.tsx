import { useEffect, useState } from 'react';
import { getRequestLogs, listKeys } from '../lib/api';
import { getColorForLabel } from '../lib/colors';

// Map model names to colors
function getModelColor(model: string): { bg: string; text: string } {
  if (model.includes('opus'))   return { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA' };
  if (model.includes('sonnet')) return { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24' };
  if (model.includes('haiku'))  return { bg: 'rgba(56,189,248,0.12)', text: '#7DD3FC' };
  return { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.55)' };
}

export default function RequestsPage() {
  const [logs, setLogs] = useState<any>({ data: [], total: 0, page: 1, limit: 50 });
  const [page, setPage] = useState(1);
  const [keyMap, setKeyMap] = useState<Record<string, { label: string | null; index: number }>>({});

  // Load key labels for color coding
  useEffect(() => {
    listKeys().then((keys) => {
      const map: Record<string, { label: string | null; index: number }> = {};
      keys.forEach((k: any, i: number) => { map[k.id] = { label: k.label, index: i }; });
      setKeyMap(map);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    getRequestLogs(page).then(setLogs).catch(console.error);
  }, [page]);

  const totalPages = Math.ceil(logs.total / logs.limit);

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold tracking-tight">Request Logs</h1>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.07)]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Key</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Model</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Input</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Output</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Cost</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Latency</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.map((log: any) => {
                const keyInfo = keyMap[log.api_key_id];
                const keyColors = keyInfo ? getColorForLabel(keyInfo.label, keyInfo.index) : null;
                const modelColors = getModelColor(log.model);
                return (
                  <tr
                    key={log.id}
                    className="border-b border-[rgba(255,255,255,0.03)] transition-colors"
                    style={keyColors ? { borderLeft: `3px solid ${keyColors.fill}` } : undefined}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.55)] font-mono-num whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {keyColors ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: keyColors.dot }} />
                          <span className="text-[12px]" style={{ color: keyColors.text }}>{keyInfo!.label || 'key'}</span>
                        </span>
                      ) : (
                        <span className="text-[12px] text-[rgba(255,255,255,0.35)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono-num"
                        style={{ background: modelColors.bg, color: modelColors.text }}
                      >
                        {log.model.replace('claude-', '')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-[12px] text-[rgba(255,255,255,0.55)]">
                      {log.input_tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-[12px] text-[rgba(255,255,255,0.55)]">
                      {log.output_tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-[13px]">
                      ${log.cost_usd.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-[12px] text-[rgba(255,255,255,0.55)]">
                      {log.latency_ms}ms
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={log.status_code === 200
                          ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                          : { background: 'rgba(244,63,94,0.12)', color: '#F43F5E' }
                        }
                      >
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                        {log.status_code}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {logs.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[rgba(255,255,255,0.25)]">
                    No requests logged yet. Route traffic through the proxy to see data here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.07)]">
            <span className="text-[rgba(255,255,255,0.35)] text-sm font-mono-num">
              {logs.total} total requests
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 text-[rgba(255,255,255,0.55)] hover:text-[#F5F5F7]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Prev
              </button>
              <span className="text-[rgba(255,255,255,0.35)] text-sm px-2 py-1.5 font-mono-num">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 text-[rgba(255,255,255,0.55)] hover:text-[#F5F5F7]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
