import { useState, useEffect } from 'react';
import { payrollApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { curMonth, fd, fmt, openPdf, roleLabel } from '../../utils/helpers';

const EMPTY_STRUCT = {
  employeeCode: '', department: '', designation: '', dateOfJoining: '',
  location: 'Nagpur', monthlyCTC: 0, bankAccountNo: '', aadharNo: '', panNo: '',
  basicSalary: 0, hra: 0, otherAllowance: 0, pfDeduction: 0,
};

export default function PayrollPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('employees');
  const tabs = [
    { id: 'employees', label: 'Employees' },
    { id: 'payslips', label: 'Payslips' },
    { id: 'spend', label: 'Salary Spend' },
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 16px' }}>Payroll</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-p' : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'employees' && <EmployeesTab isHR={['admin', 'hr'].includes(user?.role)} />}
      {tab === 'payslips' && <PayslipsTab isHR={['admin', 'hr'].includes(user?.role)} />}
      {tab === 'spend' && <SpendTab />}
    </div>
  );
}

/* ─────────────── EMPLOYEES ─────────────── */

function EmployeesTab({ isHR }) {
  const { toast, openModal, closeModal } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHR) { setLoading(false); return; }
    payrollApi.employees().then(r => setUsers(r.data)).catch(() => toast('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  if (!isHR) return <p className="tw">Only Admin / HR can manage payroll.</p>;
  if (loading) return <p className="tw">Loading...</p>;
  if (!users.length) return <p className="tw">No employees found.</p>;

  const openStructure = async (u) => {
    try {
      const r = await payrollApi.getStructure(u._id);
      closeModal();
      openModal('Salary Structure — ' + u.name, <StructureForm user={u} initial={r.data} toast={toast} onSaved={() => { closeModal(); toast('Structure saved'); }} />);
    } catch { toast('Failed to load structure'); }
  };

  return (
    <div className="card" style={{ padding: 16, overflowX: 'auto' }}>
      <table className="tw" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--mu)' }}>
            <th style={{ padding: '6px 8px' }}>Name</th>
            <th style={{ padding: '6px 8px' }}>Role</th>
            <th style={{ padding: '6px 8px' }}>Department</th>
            <th style={{ padding: '6px 8px' }}>Designation</th>
            <th style={{ padding: '6px 8px' }}>Emp Code</th>
            <th style={{ padding: '6px 8px' }}>Structure</th>
            <th style={{ padding: '6px 8px' }}></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} style={{ borderTop: '1px solid var(--border)', fontSize: 13 }}>
              <td style={{ padding: '8px' }}><strong>{u.name}</strong></td>
              <td style={{ padding: '8px' }}>{roleLabel[u.role] || u.role}</td>
              <td style={{ padding: '8px' }}>{u.department || '-'}</td>
              <td style={{ padding: '8px' }}>{u.designation || '-'}</td>
              <td style={{ padding: '8px' }}>{u.employeeId || '-'}</td>
              <td style={{ padding: '8px' }}>
                {u.hasStructure
                  ? <span className="badge bbg">Set</span>
                  : <span className="badge bbr">Not set</span>}
              </td>
              <td style={{ padding: '8px' }}>
                <button className="btn btn-sm" onClick={() => openStructure(u)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StructureForm({ user, initial, toast, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_STRUCT, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await payrollApi.saveStructure(user._id, {
        ...form,
        monthlyCTC: +form.monthlyCTC || 0, basicSalary: +form.basicSalary || 0,
        hra: +form.hra || 0, otherAllowance: +form.otherAllowance || 0, pfDeduction: +form.pfDeduction || 0,
      });
      onSaved();
    } catch (e) {
      toast(e?.response?.data?.error || 'Failed to save');
      setSaving(false);
    }
  };

  const F = ({ label, k, type = 'text' }) => (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--mu)' }}>{label}</span>
      <input type={type} value={form[k] ?? ''} onChange={set(k)} className="inp" style={{ width: '100%', marginTop: 4 }} />
    </label>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
      <F label="Employee Code" k="employeeCode" />
      <F label="Department" k="department" />
      <F label="Designation" k="designation" />
      <F label="Date of Joining" k="dateOfJoining" type="date" />
      <F label="Location" k="location" />
      <F label="Monthly CTC (₹)" k="monthlyCTC" type="number" />
      <F label="Bank Account No." k="bankAccountNo" />
      <F label="Aadhaar No." k="aadharNo" />
      <F label="PAN No." k="panNo" />
      <F label="Basic Salary (₹)" k="basicSalary" type="number" />
      <F label="HRA (₹)" k="hra" type="number" />
      <F label="Other Allowance (₹)" k="otherAllowance" type="number" />
      <F label="PF Deduction (₹)" k="pfDeduction" type="number" />
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-p" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Structure'}</button>
      </div>
    </div>
  );
}

/* ─────────────── PAYSLIPS ─────────────── */

function PayslipsTab({ isHR }) {
  const { toast } = useApp();
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      payrollApi.listPayslips().then(r => r.data),
      isHR ? payrollApi.employees().then(r => r.data).catch(() => []) : Promise.resolve([]),
    ]).then(([s, e]) => { setSlips(s); setEmployees(e); })
      .catch(() => toast('Failed to load payslips'))
      .finally(() => setLoading(false));
  }, []);

  const viewPdf = async (id) => {
    try {
      const r = await payrollApi.payslipPdf(id);
      openPdf(r.data);
    } catch { toast('Failed to generate PDF'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this payslip?')) return;
    try {
      await payrollApi.deletePayslip(id);
      setSlips(slips.filter(s => s._id !== id));
      toast('Payslip deleted');
    } catch { toast('Failed to delete'); }
  };

  if (loading) return <p className="tw">Loading...</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      {isHR && <GeneratePayslipCard employees={employees} onCreated={(slip) => setSlips([slip, ...slips])} toast={toast} />}
      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ margin: '0 0 12px' }}>{isHR ? 'All Payslips' : 'My Payslips'}</h4>
        {!slips.length ? <p className="tw">No payslips yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {slips.map((s) => (
              <li key={s._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <strong>{s.employeeName}</strong>
                    <div style={{ fontSize: 12, color: 'var(--mu)' }}>{s.monthLabel || s.month}</div>
                    <div style={{ fontSize: 13 }}>{fmt(s.netPayable)} <span style={{ color: 'var(--mu)', fontSize: 11 }}>net</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => viewPdf(s._id)}>📄 PDF</button>
                    {isHR && <button className="btn btn-sm" onClick={() => del(s._id)}>🗑️</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GeneratePayslipCard({ employees, onCreated, toast }) {
  const [userId, setUserId] = useState('');
  const [month, setMonth] = useState(curMonth());
  const [bonus, setBonus] = useState(0);
  const [otherDed, setOtherDed] = useState(0);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!userId || !month) return toast('Select employee and month');
    setGenerating(true);
    try {
      const r = await payrollApi.createPayslip({ userId, month, bonusIncentives: +bonus || 0, otherDeduction: +otherDed || 0 });
      toast('Payslip generated');
      onCreated(r.data);
      setGenerating(false);
    } catch (e) {
      toast(e?.response?.data?.error || 'Failed to generate');
      setGenerating(false);
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h4 style={{ margin: '0 0 12px' }}>Generate Payslip</h4>
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Employee</span>
        <select className="inp" style={{ width: '100%', marginTop: 4 }} value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="">Select employee…</option>
          {employees.map((u) => (
            <option key={u._id} value={u._id}>{u.name} {u.hasStructure ? '' : '(no structure)'}</option>
          ))}
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Month</span>
        <input type="month" className="inp" style={{ width: '100%', marginTop: 4 }} value={month} onChange={e => setMonth(e.target.value)} />
      </label>
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Bonus / Incentives (₹)</span>
        <input type="number" className="inp" style={{ width: '100%', marginTop: 4 }} value={bonus} onChange={e => setBonus(e.target.value)} />
      </label>
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--mu)' }}>Other Deduction (₹)</span>
        <input type="number" className="inp" style={{ width: '100%', marginTop: 4 }} value={otherDed} onChange={e => setOtherDed(e.target.value)} />
      </label>
      <button className="btn btn-p" onClick={generate} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
      <p style={{ fontSize: 11, color: 'var(--mu)', marginTop: 8 }}>Uses the employee's salary structure. Adjust via the Employees tab.</p>
    </div>
  );
}

/* ─────────────── SALARY SPEND ─────────────── */

function SpendTab() {
  const { toast } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payrollApi.salarySpend({ year: new Date().getFullYear() })
      .then(r => setRows(r.data || []))
      .catch(() => toast('Failed to load salary spend'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="tw">Loading...</p>;
  if (!rows.length) return <p className="tw">No payslips generated yet this year.</p>;

  const totalNet = rows.reduce((s, r) => s + (r.netTotal || 0), 0);

  return (
    <div className="card" style={{ padding: 16, overflowX: 'auto' }}>
      <table className="tw" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--mu)' }}>
            <th style={{ padding: '6px 8px' }}>Month</th>
            <th style={{ padding: '6px 8px' }}>Payslips</th>
            <th style={{ padding: '6px 8px' }}>Gross</th>
            <th style={{ padding: '6px 8px' }}>Net Paid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} style={{ borderTop: '1px solid var(--border)', fontSize: 13 }}>
              <td style={{ padding: '8px' }}><strong>{monthLabel(r._id)}</strong></td>
              <td style={{ padding: '8px' }}>{r.count}</td>
              <td style={{ padding: '8px' }}>{fmt(r.grossTotal)}</td>
              <td style={{ padding: '8px' }}>{fmt(r.netTotal)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--p)', fontSize: 14 }}>
            <td style={{ padding: '8px' }}><strong>Total</strong></td>
            <td style={{ padding: '8px' }}>{rows.reduce((s, r) => s + r.count, 0)}</td>
            <td style={{ padding: '8px' }}>{fmt(rows.reduce((s, r) => s + (r.grossTotal || 0), 0))}</td>
            <td style={{ padding: '8px' }}><strong>{fmt(totalNet)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function monthLabel(m) {
  if (!m) return m;
  try {
    return new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch { return m; }
}
