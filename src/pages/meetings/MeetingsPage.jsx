/**
 * Meetings page — REFERENCE PATTERN for complex multi-action pages.
 * Ported from rMeetings + viewMeeting + completeMeetingFlow +
 * openDealCloseForm + openPaymentForm + saveDelayReschedule in V8.html.
 *
 * Shows: list with filters, schedule new, view/complete, deal close, payment, reschedule.
 */
import { useState, useEffect } from 'react';
import { meetingsApi, clientsApi, usersApi, couponsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { fd, fmt } from '../../utils/helpers';

export default function MeetingsPage() {
  const { user } = useAuth();
  const { brand, toast, openModal, closeModal } = useApp();
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [filter, setFilter] = useState({ status: '', salesId: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.salesId) params.salesId = filter.salesId;
      const r = await meetingsApi.list(params);
      setMeetings(r.data);
    } catch { toast('Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter.status, filter.salesId]);
  useEffect(() => {
    clientsApi.list().then(r => setClients(r.data)).catch(() => {});
    usersApi.list({ role: 'sales' }).then(r => setSalesUsers(r.data)).catch(() => {});
  }, []);

  const onSchedule = (clientId = '') => openModal(
    <MeetingForm
      clients={clients} salesUsers={salesUsers} defaultClientId={clientId} defaultSalesId={user._id}
      onSave={async (data) => {
        await meetingsApi.create(data);
        toast('✅ Meeting scheduled!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onComplete = (m) => openModal(
    <CompleteMeetingForm
      meeting={m}
      onSave={async (data) => {
        await meetingsApi.setOutcome(m._id, data);
        toast('✅ Meeting completed!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onCloseDeal = (m) => openModal(
    <DealCloseForm
      meeting={m}
      onSave={async (data) => {
        await meetingsApi.setOutcome(m._id, { ...data, outcome: 'closed' });
        toast('🎉 Deal closed!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onPayment = (m) => openModal(
    <PaymentForm
      meeting={m}
      onSave={async (data) => {
        await meetingsApi.payment(m._id, data);
        toast('💳 Payment recorded!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onReschedule = (m) => openModal(
    <RescheduleForm
      meeting={m}
      onSave={async (data) => {
        await meetingsApi.reschedule(m._id, data);
        toast('📅 Rescheduled!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-p btn-sm" onClick={() => onSchedule()}>+ Schedule Meeting</button>
        <select className="btn btn-sm" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
        {['admin', 'manager', 'bdo', 'team_leader'].includes(user.role) && (
          <select className="btn btn-sm" value={filter.salesId} onChange={e => setFilter({ ...filter, salesId: e.target.value })}>
            <option value="">All Sales</option>
            {salesUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Client</th><th>Sales</th><th>Type</th>
              <th>Status</th><th>Outcome</th><th>Deal</th><th>Payment</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : meetings.length === 0
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No meetings</td></tr>
                : meetings.map(m => (
                  <tr key={m._id}>
                    <td>{fd(m.date)} {m.time}</td>
                    <td><strong>{m.clientName}</strong></td>
                    <td>{m.salesName}</td>
                    <td>{m.type}</td>
                    <td><span className={`badge ${
                      m.status === 'completed' ? 'bbg' :
                      m.status === 'cancelled' ? 'bbr' :
                      m.status === 'in_progress' ? 'bba' : 'bbl'
                    }`}>{m.status}</span></td>
                    <td>{m.outcome || '-'}</td>
                    <td>{m.dealValue > 0 ? fmt(m.finalAmount || m.dealValue, brand.currency) : '-'}</td>
                    <td>
                      {m.outcome === 'closed' && (
                        <span className={`badge ${
                          m.paymentStatus === 'paid' ? 'bbg' :
                          m.paymentStatus === 'partial' ? 'bba' : 'bbr'
                        }`}>{m.paymentStatus || 'pending'}</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {m.status === 'scheduled' && (
                        <>
                          <button className="btn btn-xs btn-g" onClick={() => onComplete(m)}>Done</button>
                          <button className="btn btn-xs" onClick={() => onReschedule(m)}>↻</button>
                        </>
                      )}
                      {m.status === 'completed' && m.outcome !== 'closed' && (
                        <button className="btn btn-xs btn-p" onClick={() => onCloseDeal(m)}>Close Deal</button>
                      )}
                      {m.outcome === 'closed' && m.paymentStatus !== 'paid' && (
                        <button className="btn btn-xs btn-g" onClick={() => onPayment(m)}>💳 Pay</button>
                      )}
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

// ───── FORMS ─────
function MeetingForm({ clients, salesUsers, defaultClientId, defaultSalesId, onSave, onCancel }) {
  const [form, setForm] = useState({
    clientId: defaultClientId || '', salesId: defaultSalesId || '',
    date: new Date().toISOString().split('T')[0], time: '10:00',
    location: '', type: 'demo', notes: ''
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>Schedule Meeting</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Select label="Client *" value={form.clientId} onChange={v => set('clientId', v)} required
          options={[['', '-- Select --'], ...clients.map(c => [c._id, c.name])]} />
        <Select label="Sales *" value={form.salesId} onChange={v => set('salesId', v)} required
          options={[['', '-- Select --'], ...salesUsers.map(u => [u._id, u.name])]} />
        <Input label="Date *" type="date" value={form.date} onChange={v => set('date', v)} required />
        <Input label="Time *" type="time" value={form.time} onChange={v => set('time', v)} required />
        <Input label="Location" value={form.location} onChange={v => set('location', v)} />
        <Select label="Type" value={form.type} onChange={v => set('type', v)}
          options={[['demo','Demo'],['followup','Follow-up'],['negotiation','Negotiation'],['closing','Closing']]} />
      </div>
      <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
        placeholder="Notes..."
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 10 }} />
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function CompleteMeetingForm({ meeting, onSave, onCancel }) {
  const [outcome, setOutcome] = useState('interested');
  const [notes, setNotes] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ outcome, notes }); }} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 12 }}>Complete Meeting — {meeting.clientName}</h3>
      <Select label="Outcome" value={outcome} onChange={setOutcome}
        options={[
          ['interested', '👍 Interested'], ['not_interested', '👎 Not Interested'],
          ['reschedule', '↻ Reschedule'], ['no_show', '🚫 No Show']
        ]} />
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes..."
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 10 }} />
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function DealCloseForm({ meeting, onSave, onCancel }) {
  const { brand } = useApp();
  const [dealValue, setDealValue] = useState(meeting.dealValue || 0);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validating, setValidating] = useState(false);

  const finalAmount = Math.max(0, +dealValue - +discount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setValidating(true);
    try {
      const r = await couponsApi.validate(couponCode, +dealValue);
      if (r.data.valid) {
        setDiscount(r.data.discount);
      } else {
        setDiscount(0);
        alert(r.data.message);
      }
    } catch (e) { alert('Validation failed'); }
    finally { setValidating(false); }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ dealValue: +dealValue, coupon: couponCode, finalAmount }); }} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 12 }}>🎉 Close Deal — {meeting.clientName}</h3>
      <Input label="Deal Value *" type="number" value={dealValue} onChange={setDealValue} required />
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <Input label="Coupon Code" value={couponCode} onChange={setCouponCode} />
        <button type="button" className="btn btn-sm" onClick={applyCoupon} disabled={validating} style={{ alignSelf: 'flex-end' }}>
          {validating ? '...' : 'Apply'}
        </button>
      </div>
      <div style={{ marginTop: 14, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Deal Value:</span><strong>{fmt(dealValue, brand.currency)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--R)' }}>
          <span>Discount:</span><strong>-{fmt(discount, brand.currency)}</strong>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
          <strong>Final:</strong><strong style={{ color: 'var(--G)' }}>{fmt(finalAmount, brand.currency)}</strong>
        </div>
      </div>
      <FormActions onCancel={onCancel} saveLabel="Close Deal" />
    </form>
  );
}

function PaymentForm({ meeting, onSave, onCancel }) {
  const { brand } = useApp();
  const [form, setForm] = useState({ amount: '', mode: 'cash', txnId: '' });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const paid = (meeting.paymentHistory || []).reduce((s, p) => s + (p.amount || 0), 0);
  const due = (meeting.finalAmount || meeting.dealValue || 0) - paid;
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: +form.amount }); }} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 8 }}>💳 Record Payment</h3>
      <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12 }}>
        Total: {fmt(meeting.finalAmount || meeting.dealValue, brand.currency)} •
        Paid: {fmt(paid, brand.currency)} •
        Due: <strong>{fmt(due, brand.currency)}</strong>
      </div>
      <Input label="Amount *" type="number" value={form.amount} onChange={v => set('amount', v)} required />
      <Select label="Mode" value={form.mode} onChange={v => set('mode', v)}
        options={[['cash','Cash'],['upi','UPI'],['bank','Bank Transfer'],['card','Card'],['cheque','Cheque']]} />
      <Input label="Txn ID" value={form.txnId} onChange={v => set('txnId', v)} />
      <FormActions onCancel={onCancel} saveLabel="Record" />
    </form>
  );
}

function RescheduleForm({ meeting, onSave, onCancel }) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState(meeting.time || '');
  const [reason, setReason] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ newDate, newTime, reason }); }} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 12 }}>↻ Reschedule — {meeting.clientName}</h3>
      <Input label="New Date *" type="date" value={newDate} onChange={setNewDate} required />
      <Input label="New Time" type="time" value={newTime} onChange={setNewTime} />
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason..."
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, marginTop: 10 }} />
      <FormActions onCancel={onCancel} saveLabel="Reschedule" />
    </form>
  );
}

// Inputs
function Input({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div className="fg" style={{ marginTop: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }} />
    </div>
  );
}
function Select({ label, value, onChange, options, required }) {
  return (
    <div className="fg" style={{ marginTop: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
function FormActions({ onCancel, saveLabel = 'Save' }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
      <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
      <button type="submit" className="btn btn-p btn-sm">{saveLabel}</button>
    </div>
  );
}
