import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getColorForLabel } from '../lib/colors';

interface KeyData {
  key_prefix: string;
  label: string | null;
  requests: number;
  cost: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export default function TopUsersTable({ data }: { data: KeyData[] }) {
  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
  const chartData = data.map((d, i) => {
    const colors = getColorForLabel(d.label, i);
    return {
      name: d.label || d.key_prefix,
      value: d.cost,
      color: colors.fill,
    };
  });

  return (
    <div className="glass-card p-6 animate-fade-slide-up" style={{ animationDelay: '800ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold">Cost by Team</h3>
      </div>

      {data.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-8 mb-6">
          {/* Donut chart */}
          <div className="w-full lg:w-[180px] flex-shrink-0 flex items-center justify-center">
            <div className="relative w-[160px] h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(4)}`, 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[11px] text-[rgba(255,255,255,0.35)] uppercase tracking-wider">Total</div>
                <div className="font-mono-num text-[18px] font-bold">
                  ${totalCost >= 1000 ? `${(totalCost / 1000).toFixed(1)}K` : totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Legend with progress bars */}
          <div className="flex-1 flex flex-col justify-center gap-2.5">
            {data.map((row, i) => {
              const pct = totalCost > 0 ? (row.cost / totalCost) * 100 : 0;
              const colors = getColorForLabel(row.label, i);
              return (
                <div key={row.key_prefix}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                      <span className="text-[13px] text-[rgba(255,255,255,0.55)]">{row.label || row.key_prefix}</span>
                    </div>
                    <span className="font-mono-num text-[12px] text-[rgba(255,255,255,0.55)]">
                      ${row.cost.toFixed(4)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: colors.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)]">
              <th className="text-left py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Key</th>
              <th className="text-left py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Label</th>
              <th className="text-right py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Requests</th>
              <th className="text-right py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">Cost</th>
              <th className="text-right py-2.5 text-[11px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider px-3">% of Spend</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const colors = getColorForLabel(row.label, i);
              return (
                <tr
                  key={row.key_prefix}
                  className="border-b border-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                  style={{ borderLeft: `3px solid ${colors.fill}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-3 px-3 font-mono-num text-xs text-[rgba(255,255,255,0.55)]">{row.key_prefix}...</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                      <span className="text-[13px]" style={{ color: colors.text }}>{row.label || '-'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-[rgba(255,255,255,0.55)]">{row.requests.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono-num">${row.cost.toFixed(4)}</td>
                  <td className="py-3 px-3 text-right font-mono-num text-[rgba(255,255,255,0.55)]">
                    {totalCost > 0 ? ((row.cost / totalCost) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[rgba(255,255,255,0.25)]">
                  No data yet. Route traffic through the proxy to see usage breakdown.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
