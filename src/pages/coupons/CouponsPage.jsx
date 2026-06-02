import { useState, useEffect } from 'react';
import { couponsApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { fd } from '../../utils/helpers';

export default function CouponsPage() {
  const { toast, openModal, closeModal } = useApp();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await couponsApi.list();
      setCoupons(r.data);
    } catch (e) {
      toast('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponsApi.delete(id);
      toast('Deleted');
      load();
    } catch (e) { toast('Delete failed'); }
  };

  const onAdd = () => openModal(
    <CouponForm
      onSave={async (data) => {
        await couponsApi.create(data);
        toast('✅ Coupon created!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  const onEdit = (coupon) => openModal(
    <CouponForm
      coupon={coupon}
      onSave={async (data) => {
        await couponsApi.update(coupon._id, data);
        toast('✅ Updated!');
        closeModal();
        load();
      }}
      onCancel={closeModal}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-p btn-sm" onClick={onAdd}>+ Create Coupon</button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Discount</th><th>Type</th>
              <th>Min Deal</th><th>Expires At</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14 }}>Loading...</td></tr>
              : coupons.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 14, color: 'var(--mu)' }}>No coupons found</td></tr>
                : coupons.map(c => (
                  <tr key={c._id}>
                    <td><strong style={{ fontFamily: 'monospace', fontSize: 14 }}>{c.code}</strong></td>
                    <td>{c.discount}</td>
                    <td>{c.type}</td>
                    <td>{c.minDeal ? `₹${c.minDeal}` : '-'}</td>
                    <td>{c.expiresAt ? fd(c.expiresAt) : 'Never'}</td>
                    <td>
                      <span className={`badge ${c.active ? 'bbg' : 'bbr'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-xs btn-p" onClick={() => onEdit(c)}>Edit</button>
                      <button className="btn btn-xs btn-r" onClick={() => handleDelete(c._id)}>×</button>
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

// ───────────────────────────────────────────
function CouponForm({ coupon, onSave, onCancel }) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    discount: coupon?.discount || '',
    type: coupon?.type || 'percent',
    minDeal: coupon?.minDeal || '',
    active: coupon?.active !== undefined ? coupon.active : true,
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().substring(0, 10) : ''
  });
  
  const set = (k, v) => setForm({ ...form, [k]: v });
  
  const submit = (e) => {
    e.preventDefault();
    onSave({ 
      ...form, 
      code: form.code.toUpperCase(),
      discount: Number(form.discount),
      minDeal: form.minDeal ? Number(form.minDeal) : 0
    });
  };

  return (
    <form onSubmit={submit} style={{ padding: 18 }}>
      <h3 style={{ marginBottom: 14 }}>{coupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
      <div className="g2" style={{ gap: 10 }}>
        <Input label="Code *" value={form.code} onChange={v => set('code', v.toUpperCase())} required placeholder="e.g. FESTIVE20" />
        <Input label="Discount *" type="number" value={form.discount} onChange={v => set('discount', v)} required />
        <Select label="Type" value={form.type} onChange={v => set('type', v)}
          options={[['percent', 'Percent (%)'], ['flat', 'Flat Amount']]} />
        <Input label="Min Deal Value" type="number" value={form.minDeal} onChange={v => set('minDeal', v)} />
        <Input label="Expires At" type="date" value={form.expiresAt} onChange={v => set('expiresAt', v)} />
        <Select label="Status" value={form.active ? 'true' : 'false'} onChange={v => set('active', v === 'true')}
          options={[['true', 'Active'], ['false', 'Inactive']]} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-p btn-sm">Save</button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="fg">
      <label style={{ fontSize: 11, color: 'var(--mu)', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
