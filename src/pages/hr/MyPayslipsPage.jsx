import { useState, useEffect } from 'react';
import { payrollApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fmt, openPdf } from '../../utils/helpers';

export default function MyPayslipsPage() {
  const { toast } = useApp();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    payrollApi.listPayslips()
      .then(r => setSlips(r.data || []))
      .catch(() => toast('Failed to load payslips'))
      .finally(() => setLoading(false));
  }, []);

  const view = async (id) => {
    setBusy(id);
    try {
      const r = await payrollApi.payslipPdf(id);
      openPdf(r.data, 'Payslip.pdf');
    } catch { toast('Failed to generate PDF'); }
    finally { setBusy(null); }
  };

  if (loading) return <p className="tw" style={{ padding: 40, textAlign: 'center' }}>Loading...</p>;

  return (
    <div>
      <h3 style={{ margin: '0 0 16px' }}>My Payslips</h3>
      {!slips.length ? (
        <p className="tw">No payslips yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {slips.map((s) => (
            <div key={s._id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--mu)' }}>{s.monthLabel || s.month}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>{fmt(s.netPayable)}</div>
                  <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                    Gross {fmt(s.grossEarnings)} · Deductions {fmt(s.totalDeductions)}
                  </div>
                </div>
                <button className="btn btn-p btn-sm" onClick={() => view(s._id)} disabled={busy === s._id}>
                  {busy === s._id ? '…' : '📄 PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
