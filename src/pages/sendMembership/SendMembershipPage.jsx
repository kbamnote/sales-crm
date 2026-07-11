import { useState } from 'react';
import { membershipApi } from '../../api';
import { useApp } from '../../context/AppContext';

export default function SendMembershipPage() {
  const { toast } = useApp();
  const [form, setForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    customerName: '',
    customerEmail: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerEmail || !form.date) {
      toast('Date and Customer Email are required');
      return;
    }

    setLoading(true);
    try {
      const res = await membershipApi.send(form);
      if (res.data.success) {
        toast('✅ Membership PDF generated and sent successfully!');
        setForm({
          date: new Date().toISOString().substring(0, 10),
          customerName: '',
          customerEmail: ''
        });
      } else {
        toast('Failed to send email: ' + res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast('Error sending email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <div className="card" style={{ padding: 24, borderRadius: 12, background: 'var(--surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: 20, color: 'var(--p)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🏅</span> Send Titanium Club Membership
        </h2>
        
        <p style={{ color: 'var(--mu)', marginBottom: 24, fontSize: 14 }}>
          Fill out the details below to generate and email a Titanium Club Membership PDF to your customer.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="fg">
            <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Membership Date *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
            />
          </div>

          <div className="fg">
            <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Customer Name
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={e => set('customerName', e.target.value)}
              placeholder="e.g. John Doe"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
            />
          </div>

          <div className="fg">
            <label style={{ fontSize: 12, color: 'var(--mu)', display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Customer Email Address *
            </label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={e => set('customerEmail', e.target.value)}
              required
              placeholder="customer@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <button 
              type="submit" 
              className="btn btn-p" 
              style={{ width: '100%', padding: 12, fontSize: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Generate & Send Email 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
