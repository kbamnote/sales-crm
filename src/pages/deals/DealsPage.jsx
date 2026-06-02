import { useState, useEffect } from 'react';
import { dealsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function DealsPage() {
  const { toast } = useApp();
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rDeals, rStats] = await Promise.all([
        dealsApi.list(),
        dealsApi.stats(new Date().toISOString().substring(0, 7)) // Current month stats
      ]);
      setDeals(rDeals.data);
      setStats(rStats.data);
    } catch (e) {
      toast('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {stats && (
          <>
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Total Revenue</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>₹{stats.totalRevenue?.toLocaleString() || 0}</div>
            </div>
            <div className="card" style={{ flex: 1, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>Deals Closed</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.totalDeals || 0}</div>
            </div>
          </>
        )}
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Client</th><th>Sales Person</th><th>Date</th>
              <th>Value</th><th>Final Amount</th><th>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : deals.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No deals found</td></tr>
                : deals.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.clientName || 'Unknown'}</strong></td>
                    <td>{d.salesName || '-'}</td>
                    <td>{fd(d.date)}</td>
                    <td>₹{d.dealValue?.toLocaleString()}</td>
                    <td>₹{d.finalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        d.paymentStatus === 'paid' ? 'bbg' : 
                        d.paymentStatus === 'partial' ? 'bba' : 'bbl'
                      }`}>
                        {d.paymentStatus || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
