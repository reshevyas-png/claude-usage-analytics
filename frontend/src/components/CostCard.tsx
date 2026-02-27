interface CostCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accentColor?: string;
  delay?: number;
}

export default function CostCard({ label, value, sublabel, accentColor = '#F59E0B', delay = 0 }: CostCardProps) {
  return (
    <div
      className="glass-card glass-card-interactive p-5 cursor-pointer animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[12px] font-medium tracking-wider uppercase text-[rgba(255,255,255,0.35)] mb-2">{label}</p>
      <p className="text-[28px] font-bold font-mono-num tracking-tight" style={{ color: '#F5F5F7' }}>{value}</p>
      {sublabel && <p className="text-[rgba(255,255,255,0.35)] text-xs mt-1">{sublabel}</p>}
      {/* Sparkline-like accent bar */}
      <div className="mt-3 h-[3px] rounded-full" style={{ background: `linear-gradient(90deg, ${accentColor}40, ${accentColor})`, width: '60%' }} />
    </div>
  );
}
