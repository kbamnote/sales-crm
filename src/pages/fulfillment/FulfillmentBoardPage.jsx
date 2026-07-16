import { useEffect, useState } from 'react';
import { fulfillmentApi } from '../../api';

const BRAND = '#153e3f';

const STAGES = [
  { key: 'data_collection', title: 'Data Collection' },
  { key: 'social_media', title: 'Social Media' },
  { key: 'website', title: 'Website' },
  { key: 'kit_check', title: 'Kit Check' },
  { key: 'qc', title: 'QC' },
  { key: 'delivery', title: 'Delivery' },
  { key: 'feedback', title: 'Feedback' },
];
const STAGE_TITLE = Object.fromEntries(STAGES.map((s) => [s.key, s.title]));

const daysAgo = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const agoLabel = (d) => {
  const n = daysAgo(d);
  return n <= 0 ? 'today' : n === 1 ? '1 day ago' : `${n} days ago`;
};

export default function FulfillmentBoardPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fulfillmentApi.list(),
        fulfillmentApi.stats().catch(() => ({ data: null })),
      ]);
      setOrders(listRes.data || []);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = STAGES.map((s) => ({
    ...s,
    orders: orders.filter((o) => o.status !== 'completed' && o.currentStage === s.key),
  }));
  const doneOrders = orders.filter((o) => o.status === 'completed');

  return (
    <div style={{ padding: 4 }}>
      <div style={s.headRow}>
        <h2 style={{ margin: 0, color: BRAND }}>Order Tracking</h2>
        <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={s.statsRow}>
          <Stat label="Total" value={stats.total} />
          <Stat label="In Progress" value={stats.inProgress} color="#2563EB" />
          <Stat label="Completed" value={stats.completed} color="#059669" />
          <Stat label="Stalled (3+ days)" value={stats.stalled} color={stats.stalled ? '#DC2626' : '#64748B'} />
        </div>
      )}

      {loading ? (
        <p style={{ color: '#667' }}>Loading…</p>
      ) : (
        <div style={s.board}>
          {columns.map((col) => (
            <div key={col.key} style={s.column}>
              <div style={s.colHead}>
                <span>{col.title}</span>
                <span style={s.colCount}>{col.orders.length}</span>
              </div>
              {col.orders.length === 0 ? (
                <div style={s.emptyCol}>—</div>
              ) : (
                col.orders.map((o) => {
                  const stale = daysAgo(o.updatedAt) >= 3;
                  return (
                    <div key={o._id} style={{ ...s.card, ...(stale ? s.cardStale : {}) }} onClick={() => setSelected(o)}>
                      <div style={s.cardName}>{o.clientName || 'Client'}</div>
                      <div style={s.cardMeta}>
                        <span>{agoLabel(o.updatedAt)}</span>
                        {stale && <span style={s.staleTag}>Stalled</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))}

          {/* Completed column */}
          <div style={{ ...s.column, background: '#F0FDF4' }}>
            <div style={{ ...s.colHead, color: '#059669' }}>
              <span>Completed</span>
              <span style={{ ...s.colCount, background: '#D1FAE5', color: '#059669' }}>{doneOrders.length}</span>
            </div>
            {doneOrders.length === 0 ? <div style={s.emptyCol}>—</div> : doneOrders.map((o) => (
              <div key={o._id} style={{ ...s.card, borderLeft: '3px solid #10B981' }} onClick={() => setSelected(o)}>
                <div style={s.cardName}>{o.clientName || 'Client'}</div>
                <div style={s.cardMeta}><span>Done {agoLabel(o.updatedAt)}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Stat({ label, value, color = BRAND }) {
  return (
    <div style={s.stat}>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function OrderModal({ order, onClose }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h3 style={{ margin: 0, color: BRAND }}>{order.clientName || 'Client'}</h3>
            {order.customerPhone && <div style={{ fontSize: 13, color: '#667' }}>{order.customerPhone}</div>}
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto' }}>
          {order.stages.map((st) => {
            const total = st.checklist.length;
            const done = st.checklist.filter((c) => c.done).length;
            const dot = st.status === 'completed' ? '#10B981' : st.status === 'skipped' ? '#94A3B8'
              : st.key === order.currentStage ? BRAND : '#CBD5E1';
            return (
              <div key={st.key} style={s.stageRow}>
                <span style={{ ...s.dot, background: dot }} />
                <div style={{ flex: 1 }}>
                  <div style={s.stageTitle}>
                    {STAGE_TITLE[st.key] || st.key}
                    <span style={s.stageRole}>{st.ownerRole.replace('_', ' ')}</span>
                  </div>
                  <div style={s.stageMeta}>
                    {st.status === 'skipped' ? 'Skipped' : `${done}/${total} done`}
                    {st.completedByName ? ` · ${st.completedByName}` : ''}
                  </div>
                </div>
              </div>
            );
          })}

          {order.website?.previewUrl && (
            <div style={s.infoBox}>
              <b>Website:</b> <a href={order.website.previewUrl} target="_blank" rel="noreferrer">{order.website.previewUrl}</a>
              {' · '}<span style={{ textTransform: 'capitalize' }}>{order.website.approvalStatus}</span>
            </div>
          )}
          {order.feedback?.submittedAt && (
            <div style={s.infoBox}>
              <b>Feedback:</b> {order.feedback.rating}/5{order.feedback.kitExplained ? ' · Kit explained' : ''}
              {order.feedback.notes ? ` · "${order.feedback.notes}"` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  headRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  refreshBtn: { border: '1px solid #d5dbe0', background: '#fff', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13 },
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 },
  stat: { background: '#fff', border: '1px solid #e6eaee', borderRadius: 12, padding: '12px 18px', minWidth: 120 },
  statValue: { fontSize: 26, fontWeight: 800 },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  board: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' },
  column: { flex: '0 0 210px', background: '#f4f6f8', borderRadius: 12, padding: 10, minHeight: 120 },
  colHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 13, color: '#334', marginBottom: 10 },
  colCount: { background: '#e2e8f0', borderRadius: 999, padding: '1px 9px', fontSize: 12 },
  emptyCol: { color: '#aab', fontSize: 13, textAlign: 'center', padding: '10px 0' },
  card: { background: '#fff', borderRadius: 10, padding: 11, marginBottom: 8, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '3px solid transparent' },
  cardStale: { borderLeft: '3px solid #DC2626' },
  cardName: { fontWeight: 700, fontSize: 14, color: '#223' },
  cardMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, fontSize: 11, color: '#778' },
  staleTag: { background: '#FEE2E2', color: '#DC2626', borderRadius: 6, padding: '1px 6px', fontWeight: 700 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid #eef1f2' },
  closeBtn: { border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 15 },
  stageRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #f4f6f8' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3, flex: '0 0 auto' },
  stageTitle: { fontWeight: 700, fontSize: 14, color: '#223', display: 'flex', justifyContent: 'space-between' },
  stageRole: { fontWeight: 500, fontSize: 11, color: '#8a94a0', textTransform: 'capitalize' },
  stageMeta: { fontSize: 12, color: '#667', marginTop: 2 },
  infoBox: { background: '#f8fafc', borderRadius: 10, padding: 10, marginTop: 12, fontSize: 13, color: '#334', wordBreak: 'break-word' },
};
