import { useState, useEffect } from 'react';
import { leavesApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fd, fdt } from '../../utils/helpers';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual' },
  { value: 'sick', label: 'Sick' },
  { value: 'earned', label: 'Earned' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'other', label: 'Other' },
];

const STATUS_META = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
  approved: { label: 'Approved', color: '#10B981', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
};

export default function LeavePage() {
  const { user } = useAuth();
  const canReview = ['admin', 'hr'].includes(user?.role);
  const [tab, setTab] = useState(canReview ? 'requests' : 'apply');

  return (
    <div>
      <h3 style={{ margin: '0 0 16px' }}>Leave</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${tab === 'apply' ? 'btn-p' : ''}`} onClick={() => setTab('apply')}>Apply</button>
        <button className={`btn btn-sm ${tab === 'mine' ? 'btn-p' : ''}`} onClick={() => setTab('mine')}>My Requests</button>
        {canReview && <button className={`btn btn-sm ${tab === 'requests' ? 'btn-p' : ''}`} onClick={() => setTab('requests')}>All Requests</button>}
      </div>

      {tab === 'apply' && <ApplyForm />}
      {tab === 'mine' && <MyLeaves />}
      {tab === 'requests' && <ReviewRequests />}
    </div>
  );
}

function ApplyForm() {
  const { toast } = useApp();
  const [form, setForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.fromDate || !form.toDate || !form.reason.trim()) return toast('Fill all fields');
    setSaving(true);
    try {
      await leavesApi.apply(form);
      toast('Leave request submitted');
      setForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
    } catch (e) {
      toast(e?.response?.data?.error || 'Failed to apply');
    } finally { setSaving(false); }
  };

  return (
    <div className="card" style={{ padding: 18, maxWidth: 480 }}>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Leave Type</span>
        <select className="inp" style={{ width: '100%', marginTop: 4 }} value={form.leaveType}
          onChange={e => setForm({ ...form, leaveType: e.target.value })}>
          {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <label style={{ display: 'block' }}>
          <span style={{ fontSize: 12, color: 'var(--mu)' }}>From</span>
          <input type="date" className="inp" style={{ width: '100%', marginTop: 4 }} value={form.fromDate}
            onChange={e => setForm({ ...form, fromDate: e.target.value })} />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ fontSize: 12, color: 'var(--mu)' }}>To</span>
          <input type="date" className="inp" style={{ width: '100%', marginTop: 4 }} value={form.toDate}
            onChange={e => setForm({ ...form, toDate: e.target.value })} />
        </label>
      </div>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Reason</span>
        <textarea className="inp" rows={3} style={{ width: '100%', marginTop: 4 }} value={form.reason}
          onChange={e => setForm({ ...form, reason: e.target.value })} />
      </label>
      <button className="btn btn-p" onClick={submit} disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</button>
    </div>
  );
}

function MyLeaves() {
  const { toast } = useApp();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leavesApi.my().then(r => setLeaves(r.data || [])).catch(() => toast('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await leavesApi.cancel(id);
      setLeaves(leaves.map(l => l._id === id ? { ...l, status: 'cancelled' } : l));
      toast('Request cancelled');
    } catch { toast('Could not cancel'); }
  };

  if (loading) return <p className="tw">Loading...</p>;
  if (!leaves.length) return <p className="tw">No leave requests yet.</p>;

  return (
    <div className="card" style={{ padding: 16 }}>
      {leaves.map((l) => {
        const meta = STATUS_META[l.status] || STATUS_META.pending;
        return (
          <div key={l._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <strong>{LEAVE_TYPES.find(t => t.value === l.leaveType)?.label || l.leaveType} Leave</strong>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>{fd(l.fromDate)} → {fd(l.toDate)} · {l.days} day{l.days > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>Applied {fdt(l.createdAt)}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{l.reason}</div>
                {l.reviewNote && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>Note: {l.reviewNote}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className="badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                {l.status === 'pending' && (
                  <button className="btn btn-sm" onClick={() => cancel(l._id)}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewRequests() {
  const { toast } = useApp();
  const [status, setStatus] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null); // { id, note }

  useEffect(() => { load(); }, [status]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await leavesApi.list(status ? { status } : {});
      setLeaves(r.data || []);
    } catch { toast('Failed to load requests'); }
    finally { setLoading(false); }
  };

  const approve = async (id) => {
    try {
      await leavesApi.approve(id);
      toast('Approved');
      load();
    } catch { toast('Failed to approve'); }
  };

  const reject = async (id) => {
    const note = (rejecting?.id === id ? rejecting.note : '').trim();
    try {
      await leavesApi.reject(id, note);
      toast('Rejected');
      setRejecting(null);
      load();
    } catch { toast('Failed to reject'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
          <button key={s || 'all'} className={`btn btn-sm ${status === s ? 'btn-p' : ''}`} onClick={() => setStatus(s)}>
            {s ? STATUS_META[s].label : 'All'}
          </button>
        ))}
      </div>

      {loading ? <p className="tw">Loading...</p> : !leaves.length ? <p className="tw">No requests.</p> : (
        <div className="card" style={{ padding: 16 }}>
          {leaves.map((l) => {
            const meta = STATUS_META[l.status] || STATUS_META.pending;
            return (
              <div key={l._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{l.userName}</strong> <span style={{ color: 'var(--mu)', fontSize: 12 }}>· {l.role}</span>
                    <div style={{ fontSize: 12, color: 'var(--mu)' }}>{LEAVE_TYPES.find(t => t.value === l.leaveType)?.label || l.leaveType} · {fd(l.fromDate)} → {fd(l.toDate)} · {l.days} day{l.days > 1 ? 's' : ''}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{l.reason}</div>
                    {l.reviewedByName && <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>Reviewed by {l.reviewedByName}{l.reviewNote ? ` — ${l.reviewNote}` : ''}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className="badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    {l.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                        {rejecting?.id === l._id && (
                          <input className="inp" placeholder="Rejection note" value={rejecting.note}
                            onChange={e => setRejecting({ id: l._id, note: e.target.value })} style={{ maxWidth: 200 }} />
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" onClick={() => approve(l._id)}>✅ Approve</button>
                          {rejecting?.id === l._id
                            ? <button className="btn btn-sm btn-p" onClick={() => reject(l._id)}>Confirm</button>
                            : <button className="btn btn-sm" onClick={() => setRejecting({ id: l._id, note: '' })}>❌ Reject</button>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
