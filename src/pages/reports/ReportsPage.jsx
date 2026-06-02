import { useState, useEffect } from 'react';
import { reportsApi } from '../../api';
import { useApp } from '../../context/AppContext';

export default function ReportsPage() {
  const { toast } = useApp();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await reportsApi.overview();
      setOverview(r.data);
    } catch (e) {
      toast('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading reports...</div>;
  if (!overview) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--mu)' }}>No report data available</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Overview Reports</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
        <StatCard title="Total Revenue" value={`₹${overview.revenue?.toLocaleString() || 0}`} />
        <StatCard title="Total Deals" value={overview.deals || 0} />
        <StatCard title="Active Clients" value={overview.clients || 0} />
        <StatCard title="New Leads" value={overview.leads || 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Conversion Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FunnelBar label="Leads" value={overview.funnel?.leads || 0} max={overview.funnel?.leads || 1} color="var(--mu)" />
            <FunnelBar label="Clients" value={overview.funnel?.clients || 0} max={overview.funnel?.leads || 1} color="var(--p)" />
            <FunnelBar label="Deals" value={overview.funnel?.deals || 0} max={overview.funnel?.leads || 1} color="green" />
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Sales Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(overview.topSales || []).length === 0 ? (
              <div style={{ color: 'var(--mu)', fontSize: 13 }}>No sales data</div>
            ) : (
              overview.topSales.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{s.name}</span>
                  <strong>₹{s.revenue?.toLocaleString()}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="card" style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span>{label}</span>
        <span>{value} ({pct.toFixed(1)}%)</span>
      </div>
      <div style={{ background: 'var(--border)', height: 24, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 0.5s ease' }}></div>
      </div>
    </div>
  );
}
