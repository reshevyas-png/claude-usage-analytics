import { useEffect, useState } from 'react';
import { getSummary, getCostOverTime, getByModel, getByKey } from '../lib/api';
import CostCard from '../components/CostCard';
import RequestsChart from '../components/RequestsChart';
import ModelBreakdown from '../components/ModelBreakdown';
import TopUsersTable from '../components/TopUsersTable';

function HeroCard({ summary, period }: { summary: any; period: string }) {
  const totalCost = summary?.total_cost ?? 0;
  // Estimated savings: rough multiplier (enterprise value of automated work vs API cost)
  const estimatedSavings = totalCost * 5;
  const budgetCap = 12500; // Example budget
  const budgetPct = Math.min((totalCost / budgetCap) * 100, 100);

  return (
    <div className="hero-card glass-card rounded-[20px] p-7 mb-6 animate-fade-slide-up">
      <div className="flex items-center gap-1.5 mb-3">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"
          style={{ animation: 'pulse-dot 2s ease infinite' }}
        />
        <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#F59E0B]">
          ROI Insight
        </span>
      </div>
      <p className="text-[14px] text-[rgba(255,255,255,0.55)] mb-1">Your teams saved an estimated</p>
      <p className="font-mono-num text-[48px] font-bold tracking-tight leading-tight" style={{
        background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        ${estimatedSavings >= 1000 ? estimatedSavings.toLocaleString('en-US', { maximumFractionDigits: 0 }) : estimatedSavings.toFixed(2)}
      </p>
      <div className="flex items-center gap-4 mt-1">
        <span className="text-[13px] text-[rgba(255,255,255,0.55)]">
          in estimated labor costs this {period === '7d' ? 'week' : period === '30d' ? 'month' : 'quarter'}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[rgba(16,185,129,0.12)] text-[#10B981]">
          {'\u2191'} 23% vs prior
        </span>
      </div>

      {/* Budget bar */}
      <div className="mt-5">
        <div className="flex justify-between mb-2">
          <span className="text-[12px] text-[rgba(255,255,255,0.32)] font-medium">Monthly budget</span>
          <span className="text-[12px] text-[rgba(255,255,255,0.55)] font-semibold font-mono-num">
            ${totalCost >= 1000 ? `${(totalCost / 1000).toFixed(1)}K` : totalCost.toFixed(2)} / ${(budgetCap / 1000).toFixed(1)}K
          </span>
        </div>
        <div className="h-[6px] rounded-[3px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-[3px]"
            style={{
              background: budgetPct > 80
                ? 'linear-gradient(90deg, #F59E0B, #F43F5E)'
                : 'linear-gradient(90deg, #10B981, #F59E0B)',
              width: `${budgetPct}%`,
              animation: 'budgetGrow 1.5s ease-out 0.8s both',
              ['--budget-pct' as any]: `${budgetPct}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-[20px] p-7 h-[200px] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-5 h-[120px] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-4">
        <div className="glass-card p-6 h-[320px] animate-pulse" />
        <div className="glass-card p-6 h-[320px] animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [summary, setSummary] = useState<any>(null);
  const [costData, setCostData] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [keyData, setKeyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSummary(period),
      getCostOverTime(period),
      getByModel(period),
      getByKey(period),
    ])
      .then(([s, c, m, k]) => {
        setSummary(s);
        setCostData(c);
        setModelData(m);
        setKeyData(k);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                  period === p
                    ? 'bg-[#F59E0B] text-black rounded-md'
                    : 'text-[rgba(255,255,255,0.55)] hover:text-[#F5F5F7]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ background: 'linear-gradient(135deg, #8B5CF6, #38BDF8)' }}>
            RV
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <HeroCard summary={summary} period={period} />

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CostCard
            label="Total Spend"
            value={`$${summary.total_cost.toFixed(2)}`}
            sublabel={`${period} period`}
            accentColor="#F59E0B"
            delay={200}
          />
          <CostCard
            label="Total Requests"
            value={summary.total_requests.toLocaleString()}
            accentColor="#8B5CF6"
            delay={300}
          />
          <CostCard
            label="Avg Cost / Request"
            value={summary.total_requests > 0
              ? `$${(summary.total_cost / summary.total_requests).toFixed(4)}`
              : '$0.00'
            }
            accentColor="#38BDF8"
            delay={400}
          />
          <CostCard
            label="Avg Latency"
            value={`${summary.avg_latency_ms}ms`}
            accentColor="#10B981"
            delay={500}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-4">
        <RequestsChart data={costData} />
        <ModelBreakdown data={modelData} />
      </div>

      {/* Team Breakdown */}
      <TopUsersTable data={keyData} />
    </div>
  );
}
