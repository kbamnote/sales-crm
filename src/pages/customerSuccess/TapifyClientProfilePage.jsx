/**
 * One Tapify customer: account and app status, what their Tapify presence is
 * producing, every feature with when/how often it was used, and the account
 * manager's notes, the activity timeline and inquiries in full.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customerSuccessApi } from '../../api';
import { useApp } from '../../context/AppContext';
import {
  HealthBadge, ago, dateTime, dateOnly, whatsappUrl, telUrl, errorText, ContactForm, NudgeForm,
  SOURCES, eventLabel, assetLabel, num,
} from './shared';

const NOTE_ICON = { note: '📝', call: '📞', whatsapp: '💬', notification: '🔔', follow_up: '⏰', assignment: '👤' };
const SOURCE_LABEL = { card: ['Digital card', 'bbl'], website: ['Website', 'bbp'], website_form: ['Website form', 'bbc'] };

const humanAction = (e) => {
  // A tap carries the button's own caption in detail — "Tapped Save changes"
  // says far more than the slug the action column holds.
  if (e.kind === 'tap') return `Tapped “${e.detail || String(e.action || '').replace(/_/g, ' ')}”`;
  // An unmapped screen is filed under "Other screens"; its real name is the
  // only thing that identifies it, so show that instead of a bare "Opened".
  if (e.kind === 'open') return e.feature === 'other' && e.detail ? `Opened ${e.detail}` : 'Opened';
  if (e.action === 'app_open') return 'Opened the app';
  if (e.action === 'login') return 'Logged in';
  const a = String(e.action || '').replace(/_/g, ' ');
  return a.charAt(0).toUpperCase() + a.slice(1);
};
const platformIcon = (p) => ({ android: '🤖', ios: '🍎', web: '🖥️' }[p] || '');

export default function TapifyClientProfilePage() {
  const { id } = useParams();
  const { toast, openModal, closeModal } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // "What they did" opens first: it is the question a manager has before a call.
  const [tab, setTab] = useState('activity');

  const load = useCallback(async () => {
    try {
      const r = await customerSuccessApi.client(id);
      setData(r.data);
    } catch (e) {
      toast(errorText(e, 'Could not load this client'));
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  if (loading) return <div className="card">Loading…</div>;
  if (!data) return <div className="card">Client not available. <Link to="/customer-success/clients">Back to clients</Link></div>;

  const { client, nudges, live, liveError, notes, catalog } = data;

  const logContact = (type) => openModal(
    <ContactForm client={client} initialType={type} onCancel={closeModal}
      onSave={async (payload) => {
        try {
          await customerSuccessApi.addNote(client.tapifyUserId, payload);
          toast(payload.followUpAt ? 'Saved — reminder set' : 'Saved');
          closeModal(); load();
        } catch (e) { toast(errorText(e, 'Could not save')); }
      }} />,
  );

  const sendNudge = () => openModal(
    <NudgeForm client={client} catalog={catalog} onCancel={closeModal}
      onSend={async (payload) => {
        try {
          const r = await customerSuccessApi.notify(client.tapifyUserId, payload);
          toast(r.data.pushed ? 'Sent to their phone' : 'Saved to their in-app notifications (no app/push on their phone)');
          closeModal(); load();
        } catch (e) { toast(errorText(e, 'Could not send')); }
      }} />,
  );

  const toggleFollowUp = async (note) => {
    try {
      await customerSuccessApi.setFollowUpDone(note._id, !note.followUpDone);
      load();
    } catch (e) { toast(errorText(e, 'Could not update')); }
  };

  const openFollowUps = notes.filter((n) => n.followUpAt && !n.followUpDone);
  const r = live?.results || {};
  const sum = (...keys) => keys.reduce((acc, k) => ({
    total: acc.total + (r[k]?.total || 0), last30d: acc.last30d + (r[k]?.last30d || 0),
  }), { total: 0, last30d: 0 });
  const results = [
    ['Inquiries', sum('cardInquiries', 'websiteInquiries', 'websiteForms'), 'var(--A)'],
    ['Appointments', sum('cardAppointments', 'websiteAppointments'), 'var(--C)'],
    ['Orders', sum('storeOrders', 'websiteOrders'), 'var(--G)'],
  ];
  const appUsage = client.usage?.app;

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <Link to="/customer-success/clients" style={{ fontSize: 12, color: 'var(--mu)' }}>← Tapify clients</Link>
      </div>

      {/* ── header ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{client.name || `Customer #${client.tapifyUserId}`}</h2>
              <HealthBadge health={client.health} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
              {client.phone || 'No phone'} · {client.email || 'No email'} · Tapify ID {client.tapifyUserId}
            </div>
            <div style={{ fontSize: 12, marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span>Signed up <b>{dateOnly(client.signedUpAt)}</b></span>
              <span>Last seen <b>{ago(client.lastSeenAt)}</b></span>
              <span>
                App{' '}
                {client.app.installed
                  ? <b>installed ({client.app.platform === 'ios' ? 'iPhone' : client.app.platform === 'android' ? 'Android' : 'phone'})</b>
                  : <b style={{ color: 'var(--R)' }}>not installed</b>}
              </span>
              {appUsage && <span>Opened the app <b>{appUsage.openCount}×</b></span>}
              <span>Manager <b>{client.assignedTo?.name || 'Unassigned'}</b>{client.assignedTo && client.autoAssigned ? ' (auto)' : ''}</span>
              {client.lastContactAt && <span>Last contacted <b>{ago(client.lastContactAt)}</b></span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {client.phone && (
              <>
                <a className="btn btn-sm" href={telUrl(client.phone)} onClick={() => logContact('call')}>📞 Call</a>
                <a className="btn btn-sm btn-g" href={whatsappUrl(client.phone)} target="_blank" rel="noreferrer" onClick={() => logContact('whatsapp')}>💬 WhatsApp</a>
              </>
            )}
            <button className="btn btn-sm" onClick={() => logContact('note')}>📝 Log</button>
            <button className="btn btn-sm btn-p" onClick={sendNudge}>🔔 Send nudge</button>
          </div>
        </div>

        {nudges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {nudges.map((n) => (
              <span key={n.code} className={`badge ${n.priority >= 50 ? 'bbr' : n.priority >= 20 ? 'bba' : 'bbgr'}`}>{n.label}</span>
            ))}
          </div>
        )}
        {openFollowUps.length > 0 && (
          <div className="card2" style={{ marginTop: 10, fontSize: 12 }}>
            ⏰ Next follow-up: <b>{dateTime(openFollowUps.sort((a, b) => new Date(a.followUpAt) - new Date(b.followUpAt))[0].followUpAt)}</b>
          </div>
        )}
      </div>

      {liveError && (
        <div className="card2" style={{ marginBottom: 12, color: 'var(--A)', fontSize: 12 }}>
          {liveError} Showing the last synced summary.
        </div>
      )}

      {/* ── results + presence ── */}
      <div className="g3" style={{ marginBottom: 12 }}>
        {results.map(([label, v, color]) => (
          <div key={label} className="stat" style={{ '--cl': color, cursor: 'default' }}>
            <div className="sl">{label} (last 30 days)</div>
            <div className="sv">{live ? v.last30d : '—'}</div>
            <div className="ss">{live ? `${v.total} all time` : 'unavailable'}</div>
          </div>
        ))}
      </div>

      {live && (
        <div className="g3" style={{ marginBottom: 12 }}>
          <Presence title="Digital cards" empty="No digital card"
            items={(live.vcards || []).map((v) => ({
              key: v.id, name: v.name, url: v.url,
              meta: `${v.views} views${v.active ? '' : ' · inactive'}`,
              // What to write to their NFC card, so taps are counted as taps.
              copy: v.nfcUrl ? { label: 'Copy NFC link', value: v.nfcUrl } : null,
            }))} />
          <Presence title="Websites" empty="No website yet"
            items={(live.sites || []).map((s) => ({ key: s.id, name: s.name, url: s.published ? s.url : null, meta: s.published ? `Published · ${s.views30d ?? '—'} views (30d)` : 'Not published' }))} />
          <Presence title="WhatsApp stores" empty="No store"
            items={(live.stores || []).map((s) => ({ key: s.id, name: s.name, url: s.url, meta: `${s.orders} orders · ${s.views} views` }))}
            footer={live.subscription
              ? `Plan: ${live.subscription.plan} (${live.subscription.status})${live.subscription.expiresOn ? `, expires ${dateOnly(live.subscription.expiresOn)}` : ''}`
              : 'No plan on record'} />
        </div>
      )}

      {/* ── audience ── */}
      <Audience client={client} live={live} />

      {/* ── features ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-hdr"><h3>Features</h3></div>
        <FeatureTable catalog={catalog} usage={client.usage} />
      </div>

      {/* ── tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[['activity', 'What they did'], ['notes', `Notes & follow-ups (${notes.length})`], ['timeline', 'Every event'], ['inquiries', `Inquiries (${client.inquiries?.total || 0})`]].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${tab === k ? 'btn-p' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'notes' && (
        <div className="card">
          {!notes.length ? (
            <div style={{ color: 'var(--mu)', fontSize: 12 }}>Nothing logged yet.</div>
          ) : notes.map((n) => (
            <div key={n._id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16 }}>{NOTE_ICON[n.type] || '📝'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>{n.authorName} · {dateTime(n.createdAt)}</div>
                {n.text && <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{n.text}</div>}
                {n.meta && n.type === 'notification' && (
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>{n.meta.pushed ? 'Delivered to their phone' : 'In-app only'}</div>
                )}
                {n.followUpAt && (
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={n.followUpDone} onChange={() => toggleFollowUp(n)} />
                    <span style={{ textDecoration: n.followUpDone ? 'line-through' : 'none', color: !n.followUpDone && new Date(n.followUpAt) < new Date() ? 'var(--R)' : 'inherit' }}>
                      Follow up {dateTime(n.followUpAt)}
                    </span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'activity' && <ActivityReport tapifyUserId={client.tapifyUserId} clientName={client.name} />}
      {tab === 'timeline' && <Timeline tapifyUserId={client.tapifyUserId} catalog={catalog} />}
      {tab === 'inquiries' && <Inquiries tapifyUserId={client.tapifyUserId} />}
    </div>
  );
}

/**
 * What the customer's own audience did: how many people opened their card or
 * website, how they got there (NFC tap, QR scan, a shared link), what they
 * tapped afterwards, and what came of it.
 *
 * Headline numbers come from the synced snapshot so they show even when Tapify
 * is unreachable; the breakdowns and the day-by-day chart come from the live
 * fetch (live.engagement).
 */
function Audience({ client, live }) {
  const e = client.engagement || {};
  const detail = live?.engagement || client.engagementDetail || null;
  const nothing = !(e.views || e.scans || e.taps || e.leads);

  const cards = [
    ['Card opened', e.cardViews30d, 'times this month', 'var(--A)'],
    ['Website visited', e.siteViews30d, 'times this month', 'var(--C)'],
    ['Scanned (QR / review card)', e.scans30d, 'times this month', 'var(--P)'],
    ['Called / WhatsApped', e.taps30d, 'taps this month', 'var(--G)'],
  ];

  const bySource = Object.entries(detail?.bySource || {})
    .map(([key, v]) => ({ key, total: v.total || 0, d30: v.d30 || 0 }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  const byAsset = Object.entries(detail?.byAsset || {})
    .map(([key, v]) => ({ key, total: v.total || {}, d30: v.d30 || {} }))
    .filter((a) => Object.values(a.total).some((n) => n > 0));

  const taps = Object.entries(detail?.byEvent || {})
    .filter(([k]) => k.startsWith('tap_'))
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-hdr">
        <h3>Their customers</h3>
        <span style={{ fontSize: 11, color: 'var(--mu)' }}>
          {e.lastAt ? `Last visitor ${ago(e.lastAt)}` : 'No visitors recorded yet'}
        </span>
      </div>

      {nothing ? (
        <div style={{ fontSize: 12, color: 'var(--mu)' }}>
          Nobody has opened this customer's card, website or QR codes yet — or they were set up
          before tracking started. Worth asking how they are sharing it.
        </div>
      ) : (
        <>
          <div className="g4" style={{ marginBottom: 12 }}>
            {cards.map(([label, value, sub, color]) => (
              <div key={label} className="stat" style={{ '--cl': color, cursor: 'default' }}>
                <div className="sl">{label}</div>
                <div className="sv">{num(value)}</div>
                <div className="ss">{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span><b>{num(e.people30d)}</b> different people this month</span>
            <span><b>{num(e.views)}</b> opens all time</span>
            <span><b>{num(e.leads30d)}</b> enquiries/bookings/orders this month</span>
            {e.nfcTaps > 0 && <span><b>{num(e.nfcTaps)}</b> NFC card taps all time</span>}
            {e.reviewScans > 0 && <span><b>{num(e.reviewScans)}</b> review-card scans all time</span>}
          </div>

          <div className="g3">
            <Breakdown title="How they arrived" empty="Not recorded yet"
              rows={bySource.map((s) => ({
                key: s.key,
                label: `${SOURCES[s.key]?.icon || '•'} ${SOURCES[s.key]?.label || s.key}`,
                value: num(s.total),
                meta: `${num(s.d30)} this month`,
              }))} />

            <Breakdown title="Where" empty="Nothing yet"
              rows={byAsset.map((a) => ({
                key: a.key,
                label: assetLabel(a.key),
                value: num((a.total.views || 0) + (a.total.scans || 0)),
                meta: `${num((a.d30.views || 0) + (a.d30.scans || 0))} this month`
                  + ((a.total.leads || 0) ? ` · ${num(a.total.leads)} enquiries` : '')
                  + ((a.total.reviews || 0) ? ` · ${num(a.total.reviews)} reviews` : ''),
              }))} />

            <Breakdown title="What they tapped" empty="No taps recorded yet"
              rows={taps.map((t) => ({
                key: t.key,
                label: eventLabel(t.key),
                value: num(t.total),
                meta: `${num(t.d30)} this month`,
              }))} />
          </div>

          {!!(detail?.daily || []).length && <DailyChart days={detail.daily} />}
          {!!(detail?.recent || []).length && <RecentVisits rows={detail.recent} />}
        </>
      )}
    </div>
  );
}

function Breakdown({ title, rows, empty }) {
  return (
    <div className="card2">
      <div className="sl" style={{ marginBottom: 8 }}>{title}</div>
      {!rows.length ? <div style={{ fontSize: 12, color: 'var(--mu)' }}>{empty}</div> : rows.map((r) => (
        <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 12 }}>
            {r.label}
            <div style={{ fontSize: 10, color: 'var(--mu)' }}>{r.meta}</div>
          </div>
          <b style={{ fontSize: 13 }}>{r.value}</b>
        </div>
      ))}
    </div>
  );
}

/** Last 30 days as bars — enough to see "it stopped" or "it took off". */
function DailyChart({ days }) {
  const recent = days.slice(-30);
  const peak = Math.max(1, ...recent.map((d) => (d.views || 0) + (d.scans || 0)));
  return (
    <div style={{ marginTop: 14 }}>
      <div className="sl" style={{ marginBottom: 6 }}>Visitors, last 30 days</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64 }}>
        {recent.map((d) => {
          const total = (d.views || 0) + (d.scans || 0);
          return (
            <div key={d.day} title={`${dateOnly(d.day)} — ${total} visits, ${d.leads || 0} enquiries`}
              style={{
                flex: 1, minWidth: 3, borderRadius: '3px 3px 0 0',
                height: `${Math.max(2, (total / peak) * 100)}%`,
                background: d.leads ? 'var(--G)' : 'var(--A)', opacity: total ? 1 : 0.25,
              }} />
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: 'var(--mu)', marginTop: 4 }}>
        Green = a day that brought an enquiry, booking or order.
      </div>
    </div>
  );
}

/** The last few visits, in order — what a manager can read out on a call. */
function RecentVisits({ rows }) {
  const [open, setOpen] = useState(false);
  const shown = open ? rows : rows.slice(0, 6);
  return (
    <div style={{ marginTop: 14 }}>
      <div className="sl" style={{ marginBottom: 6 }}>Recent visits</div>
      <div className="tw">
        <table>
          <thead><tr><th>When</th><th>What happened</th><th>Where</th><th>How they arrived</th><th>Device</th></tr></thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={`${r.at}-${i}`}>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }} title={dateTime(r.at)}>{ago(r.at)}</td>
                <td style={{ fontSize: 12 }}>
                  {eventLabel(r.event)}{r.label ? ` · ${r.label}` : ''}
                  {r.repeat && <span className="badge bbgr" style={{ marginLeft: 6 }}>been before</span>}
                </td>
                <td style={{ fontSize: 12 }}>{assetLabel(r.assetType)}</td>
                <td style={{ fontSize: 12 }}>{SOURCES[r.source]?.short || r.source}</td>
                <td style={{ fontSize: 12 }}>{[r.os, r.device].filter(Boolean).join(' · ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 6 && (
        <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setOpen(!open)}>
          {open ? 'Show less' : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

function Presence({ title, items, empty, footer }) {
  return (
    <div className="card">
      <div className="sl" style={{ marginBottom: 8 }}>{title}</div>
      {!items.length ? <div style={{ fontSize: 12, color: 'var(--mu)' }}>{empty}</div> : items.map((i) => (
        <div key={i.key} style={{ marginBottom: 6 }}>
          {i.url
            ? <a href={i.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600 }}>{i.name} ↗</a>
            : <span style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</span>}
          <div style={{ fontSize: 11, color: 'var(--mu)' }}>{i.meta}</div>
          {i.copy && (
            <button
              className="btn btn-sm" style={{ marginTop: 4, fontSize: 10, padding: '2px 8px' }}
              onClick={() => navigator.clipboard?.writeText(i.copy.value)}
              title={i.copy.value}
            >
              {i.copy.label}
            </button>
          )}
        </div>
      ))}
      {footer && <div style={{ fontSize: 11, color: 'var(--mu)', borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 6 }}>{footer}</div>}
    </div>
  );
}

function FeatureTable({ catalog, usage }) {
  const features = (catalog || []).filter((f) => f.key !== 'app');
  if (!features.length) return <div style={{ fontSize: 12, color: 'var(--mu)' }}>Feature list unavailable right now.</div>;
  const rows = features.map((f) => ({ ...f, u: (usage || {})[f.key] }));
  const used = rows.filter((x) => x.u?.useCount || x.u?.tapCount || x.u?.openCount).length;

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 8 }}>
        Using <b style={{ color: 'var(--tx)' }}>{used}</b> of {rows.length} features.
        {' '}Working in it = they save or publish things here · Trying it = they press things but change nothing
        {' '}· Just looked = opened the screen only.
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr><th>Feature</th><th>Status</th><th>First seen</th><th>Last seen</th><th>Times used</th><th>Taps</th><th>Times opened</th><th>Last 30 days</th></tr>
          </thead>
          <tbody>
            {rows.map(({ key, label, group, u }) => {
              const status = u?.useCount
                ? ['Working in it', 'bbg']
                : u?.tapCount
                  ? ['Trying it', 'bba']
                  : u?.openCount ? ['Just looked', 'bba'] : ['Never opened', 'bbgr'];
              return (
                <tr key={key}>
                  <td><b style={{ fontSize: 12 }}>{label}</b><div style={{ fontSize: 10, color: 'var(--mu)' }}>{group}</div></td>
                  <td><span className={`badge ${status[1]}`}>{status[0]}</span></td>
                  <td style={{ fontSize: 12 }}>{dateTime(u?.firstUsedAt || u?.firstTappedAt || u?.firstOpenedAt)}</td>
                  <td style={{ fontSize: 12 }}>{dateTime(u?.lastUsedAt || u?.lastTappedAt || u?.lastOpenedAt)}</td>
                  <td style={{ fontSize: 12 }}>{u?.useCount || 0}</td>
                  <td style={{ fontSize: 12 }}>{u?.tapCount || 0}</td>
                  <td style={{ fontSize: 12 }}>{u?.openCount || 0}</td>
                  <td style={{ fontSize: 12 }}>{u ? `${u.uses30d || 0} used · ${u.taps30d || 0} taps · ${u.opens30d || 0} opened` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * "What they did" — the activity a manager can actually read: one block per day
 * in plain sentences, under a summary of the chosen window. Every word comes
 * from Tapify (ActivityNarrator), so this page and the CRM mobile app describe
 * the same day the same way; nothing is phrased here.
 */
const PERIODS = [[1, 'Today'], [7, 'This week'], [30, 'This month']];

function ActivityReport({ tapifyUserId, clientName }) {
  const { toast } = useApp();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Everything that happened, with the time against each line, is the default:
  // it is what a manager reads before a call. The short version is one click
  // away for when they only want the gist.
  const [summaryView, setSummaryView] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    customerSuccessApi.activity(tapifyUserId, days)
      .then((r) => { if (alive) setData(r.data); })
      .catch((e) => { if (alive) toast(errorText(e, 'Could not load activity')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tapifyUserId, days, toast]);

  // A report is usually wanted somewhere else — a WhatsApp message to the
  // client, or a line in a review meeting — so it can be lifted as text.
  const copyReport = () => {
    if (!data) return;
    const period = PERIODS.find(([d]) => d === days)?.[1] || `${days} days`;
    const text = [
      `${clientName} — ${period.toLowerCase()}`,
      data.summary?.headline || '',
      ...(data.summary?.lines || []).map((l) => `- ${l}`),
      '',
      // Copies whichever view is on screen, so the manager pastes what they read.
      ...(data.days || []).flatMap((d) => [
        `${d.label} (${d.from}–${d.to}) — ${d.headline}`,
        ...(summaryView
          ? d.lines.map((l) => `   • ${l}`)
          : (d.entries || []).map((e) => `   ${e.at.padEnd(9)} ${e.text}`)),
        '',
      ]),
    ].join('\n');
    navigator.clipboard?.writeText(text).then(
      () => toast('Report copied'),
      () => toast('Could not copy the report')
    );
  };

  const s = data?.summary;

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        {PERIODS.map(([d, label]) => (
          <button key={d} className={`btn btn-sm ${days === d ? 'btn-p' : ''}`} onClick={() => setDays(d)}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className={`btn btn-sm ${summaryView ? 'btn-p' : ''}`} onClick={() => setSummaryView((v) => !v)}>
          {summaryView ? 'Show every step' : 'Summary'}
        </button>
        <button className="btn btn-sm" onClick={copyReport} disabled={!data}>Copy report</button>
      </div>

      {loading && <div style={{ fontSize: 12, color: 'var(--mu)' }}>Loading…</div>}

      {!loading && s && summaryView && (
        <div style={{ background: 'var(--bg2, rgba(0,0,0,.03))', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.headline}</div>
          {(s.lines || []).map((l, i) => (
            <div key={i} style={{ fontSize: 12.5, color: 'var(--mu)' }}>{l}</div>
          ))}
        </div>
      )}

      {!loading && !(data?.days || []).length && (
        <div style={{ fontSize: 13, color: 'var(--mu)' }}>
          Nothing recorded in this period. If they told you they have been using the app,
          check they are on the latest version — older versions do not report activity.
        </div>
      )}

      {(data?.days || []).map((d) => (
        <div key={d.date} style={{ borderLeft: '3px solid var(--P, #3b82f6)', paddingLeft: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 14 }}>{d.label}</b>
            <span style={{ fontSize: 11, color: 'var(--mu)' }}>
              {d.from}–{d.to} · {d.platform}
            </span>
          </div>
          <div style={{ fontSize: 13, margin: '2px 0 6px' }}>{d.headline}</div>

          {summaryView ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {d.lines.map((l, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.6 }}>{l}</li>
              ))}
            </ul>
          ) : (
            <div>
              {(d.entries || []).map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.9 }}>
                  <span style={{ width: 66, flexShrink: 0, color: 'var(--mu)', fontVariantNumeric: 'tabular-nums' }}>{e.at}</span>
                  <span>{e.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Timeline({ tapifyUserId, catalog }) {
  const { toast } = useApp();
  const [events, setEvents] = useState([]);
  const [next, setNext] = useState(null);
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async (beforeId, append) => {
    setLoading(true);
    try {
      const r = await customerSuccessApi.timeline(tapifyUserId, { limit: 50, ...(beforeId ? { before_id: beforeId } : {}), ...(feature ? { feature } : {}) });
      setEvents((prev) => (append ? [...prev, ...(r.data.events || [])] : (r.data.events || [])));
      setNext(r.data.nextBeforeId);
    } catch (e) {
      toast(errorText(e, 'Could not load activity'));
    } finally {
      setLoading(false);
    }
  }, [tapifyUserId, feature, toast]);

  useEffect(() => { fetchPage(0, false); }, [fetchPage]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--mu)' }}>Last 12 months · newest first</div>
        <select className="btn btn-sm" value={feature} onChange={(e) => setFeature(e.target.value)}>
          <option value="">All features</option>
          {(catalog || []).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>
      {!events.length && !loading && <div style={{ fontSize: 12, color: 'var(--mu)' }}>No activity recorded yet.</div>}
      {events.map((e) => (
        <div key={e.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
          <div style={{ width: 150, color: 'var(--mu)' }}>{dateTime(e.at)}</div>
          <div style={{ flex: 1 }}><b>{humanAction(e)}</b> {e.kind !== 'session' && <span>· {e.featureLabel}</span>}</div>
          <div title={e.platform}>{platformIcon(e.platform)}</div>
        </div>
      ))}
      {next && <button className="btn btn-sm" style={{ marginTop: 8 }} disabled={loading} onClick={() => fetchPage(next, true)}>Load older</button>}
      {loading && <div style={{ fontSize: 12, marginTop: 8 }}>Loading…</div>}
    </div>
  );
}

function Inquiries({ tapifyUserId }) {
  const { toast } = useApp();
  const [items, setItems] = useState(null);

  useEffect(() => {
    customerSuccessApi.inquiries(tapifyUserId)
      .then((r) => setItems(r.data.inquiries || []))
      .catch((e) => { setItems([]); toast(errorText(e, 'Could not load inquiries')); });
  }, [tapifyUserId, toast]);

  if (!items) return <div className="card">Loading…</div>;
  if (!items.length) return <div className="card" style={{ color: 'var(--mu)', fontSize: 12 }}>No inquiries yet.</div>;

  return (
    <div className="g2">
      {items.map((i) => {
        const [label, badge] = SOURCE_LABEL[i.source] || [i.source, 'bbgr'];
        const extra = i.fields ? Object.entries(i.fields).filter(([k, v]) => typeof v !== 'object' && ![i.name, i.phone, i.email, i.message].includes(String(v))) : [];
        return (
          <div key={`${i.source}-${i.id}`} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <b>{i.name || 'Unnamed'}</b>{!i.read && <span className="badge bba" style={{ marginLeft: 6 }}>Unread</span>}
                <div style={{ fontSize: 11, color: 'var(--mu)' }}>{dateTime(i.at)} · {i.sourceName}</div>
              </div>
              <span className={`badge ${badge}`}>{label}</span>
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              {i.phone && <div>📞 <a href={telUrl(i.phone)}>{i.phone}</a> · <a href={whatsappUrl(i.phone)} target="_blank" rel="noreferrer">WhatsApp</a></div>}
              {i.email && <div>✉️ {i.email}</div>}
              {i.subject && <div><b>{i.subject}</b></div>}
              {i.message && <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{i.message}</div>}
              {extra.map(([k, v]) => <div key={k} style={{ color: 'var(--mu)' }}>{k}: {String(v)}</div>)}
              {i.page && <div style={{ color: 'var(--mu)', fontSize: 11 }}>From page: {i.page}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
