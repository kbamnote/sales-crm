/**
 * Today — the Customer Manager's call list: which Tapify customers to contact
 * and why, most important first. Admin can view any manager's list.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerSuccessApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { HealthBadge, ago, whatsappUrl, telUrl, errorText, ContactForm } from './shared';

export default function CustomerTodayPage() {
  const { toast, openModal, closeModal } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [managerId, setManagerId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customerSuccessApi.today({ limit: 100, ...(managerId ? { managerId } : {}) });
      setData(r.data);
    } catch (e) {
      toast(errorText(e, 'Could not load today\'s list'));
    } finally {
      setLoading(false);
    }
  }, [managerId, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (isAdmin) customerSuccessApi.managers().then((r) => setManagers(r.data.managers || [])).catch(() => {});
  }, [isAdmin]);

  const logContact = (item, type) => openModal(
    <ContactForm
      client={item}
      initialType={type}
      onCancel={closeModal}
      onSave={async (payload) => {
        try {
          await customerSuccessApi.addNote(item.tapifyUserId, payload);
          toast(payload.followUpAt ? 'Saved — reminder set' : 'Saved');
          closeModal();
          load();
        } catch (e) { toast(errorText(e, 'Could not save')); }
      }}
    />,
  );

  const s = data?.summary || {};
  const stats = [
    ['To contact today', s.toContact, 'var(--P)'],
    ['Follow-ups due', s.followUpsDue, 'var(--R)'],
    ['Never started', s.neverStarted, 'var(--mu)'],
    ['Unread inquiries', s.unreadInquiries, 'var(--A)'],
    ['Gone quiet', s.quiet, 'var(--R)'],
  ];

  return (
    <div>
      <div className="section-hdr">
        <div>
          <h3>Today's calls</h3>
          <div style={{ fontSize: 11, color: 'var(--mu)' }}>
            {isAdmin ? 'Tapify customers who need attention' : `${s.total ?? '…'} customers in your care`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <select className="btn btn-sm" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">All managers</option>
              <option value="unassigned">Unassigned</option>
              {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          )}
          <Link className="btn btn-sm" to="/customer-success/clients">All clients →</Link>
        </div>
      </div>

      <div className="g5" style={{ marginBottom: 14 }}>
        {stats.map(([label, value, color]) => (
          <div key={label} className="stat" style={{ '--cl': color }}>
            <div className="sl">{label}</div>
            <div className="sv">{loading ? '…' : (value ?? 0)}</div>
          </div>
        ))}
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Why now</th><th>Status</th><th>Last seen</th>
              {isAdmin && <th>Manager</th>}
              <th style={{ textAlign: 'right' }}>Contact</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>Loading…</td></tr>
            ) : !data?.items?.length ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--mu)' }}>
                Nobody needs a call right now. 🎉
              </td></tr>
            ) : data.items.map((c) => (
              <tr key={c.tapifyUserId}>
                <td>
                  <Link to={`/customer-success/clients/${c.tapifyUserId}`} style={{ fontWeight: 700, color: 'var(--tx)' }}>
                    {c.name || `Customer #${c.tapifyUserId}`}
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{c.phone || c.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.reason}</div>
                  {c.nudges.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {c.nudges.slice(1, 4).map((n) => (
                        <span key={n.code} className="badge bbgr">{n.label}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td><HealthBadge health={c.health} /></td>
                <td style={{ fontSize: 12 }}>{ago(c.lastSeenAt)}</td>
                {isAdmin && <td style={{ fontSize: 12 }}>{c.assignedTo?.name || <span style={{ color: 'var(--mu)' }}>Unassigned</span>}</td>}
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {c.phone && (
                      <>
                        <a className="btn btn-xs" href={telUrl(c.phone)} onClick={() => logContact(c, 'call')}>📞 Call</a>
                        <a className="btn btn-xs btn-g" href={whatsappUrl(c.phone)} target="_blank" rel="noreferrer"
                          onClick={() => logContact(c, 'whatsapp')}>💬 WhatsApp</a>
                      </>
                    )}
                    <button className="btn btn-xs btn-p" onClick={() => logContact(c, 'note')}>Log</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
