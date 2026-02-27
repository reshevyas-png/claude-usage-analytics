import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModelData {
  model: string;
  cost: number;
  requests: number;
}

const MODEL_COLORS: Record<string, string> = {
  'opus': '#8B5CF6',
  'sonnet': '#F59E0B',
  'haiku': '#38BDF8',
};

function getModelColor(model: string): string {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (model.toLowerCase().includes(key)) return color;
  }
  return '#10B981';
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export default function ModelBreakdown({ data }: { data: ModelData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    shortModel: d.model.replace('claude-', '').replace(/-\d{8,}$/, ''),
    color: getModelColor(d.model),
  }));

  return (
    <div className="glass-card p-6 animate-fade-slide-up" style={{ animationDelay: '700ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold">Cost by Model</h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formatted} layout="vertical">
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.15)"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
            tick={{ fill: 'rgba(255,255,255,0.25)' }}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortModel"
            stroke="rgba(255,255,255,0.15)"
            fontSize={11}
            fontFamily="JetBrains Mono, monospace"
            tick={{ fill: 'rgba(255,255,255,0.55)' }}
            width={100}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}
            itemStyle={{ color: '#F5F5F7', fontSize: 12 }}
            formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(4)}`, 'Cost']}
          />
          <Bar dataKey="cost" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {formatted.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
