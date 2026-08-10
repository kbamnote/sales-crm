/**
 * Bulk WhatsApp modal — select an approved name-only template and send to a
 * list of recipients. Port of salesCrmApp/src/components/BulkWhatsAppModal.js.
 *
 * recipients: [{ _id, name, phone }]
 * entity: 'lead' (default) | 'client' — stamped on each sent message.
 */
import { useState, useEffect, useMemo } from 'react';
import { whatsappApi } from '../api';
import { useApp } from '../context/AppContext';

const WA_GREEN = '#25D366';
const SAMPLE_NAME = 'Rahul';

// Only NAME-ONLY templates are offered for bulk ({{1}} = recipient's own name).
const NAME_ONLY = {
  welcome: {
    label: 'Welcome',
    preview: (name) => `Hi ${name}, welcome to Tapify! We're glad to have you on board. Let us know how we can help.`
  },
  follow_up: {
    label: 'Follow up',
    preview: (name) => `Hi ${name}, just following up on our earlier conversation. Do let us know if you have any questions.`
  }
};

export default function BulkWhatsAppModal({ visible, onClose, recipients = [], entity = 'lead' }) {
  const { toast } = useApp();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selected, setSelected] = useState(null); // template name
  const [sending, setSending] = useState(false);

  const count = recipients.length;

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoadingTemplates(true);
    setSelected(null);
    whatsappApi.templates()
      .then((rows) => { if (!cancelled) setTemplates(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setTemplates([]); })
      .finally(() => { if (!cancelled) setLoadingTemplates(false); });
    return () => { cancelled = true; };
  }, [visible]);

  const statusByName = useMemo(() => {
    const map = {};
    templates.forEach((t) => { if (t && t.name) map[t.name] = t.status; });
    return map;
  }, [templates]);

  const isApproved = (name) => statusByName[name] === 'APPROVED';

  const bulkTemplates = useMemo(
    () => Object.keys(NAME_ONLY).filter((name) => isApproved(name)),
    [statusByName]
  );

  const otherApproved = useMemo(
    () => templates
      .filter((t) => t && t.status === 'APPROVED' && !NAME_ONLY[t.name])
      .map((t) => t.name),
    [templates]
  );

  const previewBody = useMemo(() => {
    if (!selected || !NAME_ONLY[selected]) return '';
    return NAME_ONLY[selected].preview(SAMPLE_NAME);
  }, [selected]);

  const canSend = !sending && count > 0 && !!selected;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const payload = {
        recipients: recipients.map((r) => ({
          phone: r.phone,
          name: r.name,
          entity,
          entityId: r._id
        })),
        templateName: selected
      };
      const res = await whatsappApi.sendBulk(payload);
      const queued = res?.queued ?? 0;
      const sent = res?.sent ?? 0;
      const failed = res?.failed ?? 0;
      toast(`✅ WhatsApp: sent ${sent}, queued ${queued}, failed ${failed}`);
      onClose && onClose();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Could not send the campaign.';
      toast('Send failed: ' + msg);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: 480, maxHeight: '88vh',
          borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20,
          overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,.2)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 20, background: WA_GREEN,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>WA</div>
            <div>
              <strong style={{ fontSize: 16 }}>Bulk WhatsApp</strong>
              <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                {count} recipient{count === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--mu)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 8 }}>
          Choose a template
        </div>

        {loadingTemplates && <div style={{ color: 'var(--mu)', fontSize: 13, marginBottom: 8 }}>Loading templates…</div>}

        {!loadingTemplates && bulkTemplates.length === 0 && (
          <div style={{ color: 'var(--mu)', fontSize: 13, marginBottom: 8 }}>
            No approved name-only templates are available for bulk sending yet.
          </div>
        )}

        {bulkTemplates.map((name) => {
          const meta = NAME_ONLY[name];
          const active = selected === name;
          return (
            <div
              key={name}
              onClick={() => setSelected(name)}
              style={{
                padding: '12px', borderRadius: 8, border: '1.5px solid',
                borderColor: active ? WA_GREEN : 'var(--border)',
                background: active ? '#F0FDF4' : 'transparent',
                marginBottom: 8, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{active ? '🔘' : '⚪'}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>{meta.label}</strong>
                  <div style={{ fontSize: 12, color: 'var(--mu)' }}>Personalised with each recipient's name</div>
                </div>
              </div>
            </div>
          );
        })}

        {otherApproved.map((name) => (
          <div key={name} style={{ opacity: 0.55, padding: '12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>⚪</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14 }}>{name}</strong>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>Needs extra details — not available for bulk</div>
              </div>
            </div>
          </div>
        ))}

        {selected && (
          <div style={{
            marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 8, padding: 12
          }}>
            <div style={{ fontSize: 11, color: '#065F46', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 6 }}>
              Preview (sample name)
            </div>
            <div style={{ fontSize: 13 }}>{previewBody}</div>
          </div>
        )}

        <button
          className="btn"
          style={{
            width: '100%', marginTop: 16, background: WA_GREEN, color: '#fff',
            border: 'none', opacity: canSend ? 1 : 0.5, minHeight: 44, cursor: canSend ? 'pointer' : 'not-allowed'
          }}
          onClick={handleSend}
          disabled={!canSend}
        >
          {sending ? 'Sending…' : `Send to ${count}`}
        </button>
      </div>
    </div>
  );
}
