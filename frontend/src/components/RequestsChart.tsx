import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  date: string;
  cost: number;
  requests: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export default function RequestsChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="glass-card p-6 animate-fade-slide-up" style={{ animationDelay: '600ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold">Spend Over Time</h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="costGradientPrism" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.15)"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
            tick={{ fill: 'rgba(255,255,255,0.25)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.15)"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
            tick={{ fill: 'rgba(255,255,255,0.25)' }}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            itemStyle={{ color: '#F5F5F7', fontSize: 12 }}
            formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(4)}`, 'Cost']}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#8B5CF6"
            fill="url(#costGradientPrism)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#0A0B0F', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
