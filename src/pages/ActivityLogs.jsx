import { useEffect, useRef, useState } from 'react';
import { History, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emptyFilters = { username: '', actor_id: '', action: '', role: '', outcome: '', start: '', end: '' };
const roles = ['admin', 'city_health_officer', 'sanitization_inspector', 'barangay_official', 'resident'];
const label = (value) => value?.replaceAll('_', ' ') || '—';
const date = (value) => new Date(value).toLocaleString();
const inputClass = 'w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';

export default function ActivityLogs() {
  const { token, API_URL } = useAuth();
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const detailsDialog = useRef(null);
  const filterTimer = useRef(null);
  const pageSize = 25;

  useEffect(() => () => clearTimeout(filterTimer.current), []);

  useEffect(() => {
    const dialog = detailsDialog.current;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (filters.start && filters.end && new Date(filters.start) > new Date(filters.end)) {
          throw new Error('From must be before Until. Adjust the date range.');
        }
        const params = new URLSearchParams({ page, page_size: pageSize });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, key === 'start' || key === 'end' ? new Date(value).toISOString() : value);
        });
        const response = await fetch(`${API_URL}/activity-logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Could not load activity logs.');
        if (!controller.signal.aborted) setData(result);
      } catch (err) {
        if (!controller.signal.aborted && err.name !== 'AbortError') { setError(err.message); setData({ items: [], total: 0 }); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [API_URL, token, filters, page, refresh]);

  const applyFilters = (next) => {
    clearTimeout(filterTimer.current);
    setFilters({ ...next });
    setPage(1);
    setSelected(null);
  };
  const update = (key) => (event) => {
    const next = { ...draft, [key]: event.target.value };
    setDraft(next);
    clearTimeout(filterTimer.current);
    if (['username', 'actor_id'].includes(key)) {
      filterTimer.current = setTimeout(() => applyFilters(next), 350);
    } else {
      applyFilters(next);
    }
  };
  const pages = Math.max(1, Math.ceil(data.total / pageSize));
  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><History className="text-blue-600" />Activity Logs</h1>
          <p className="mt-2 text-sm text-slate-500">Add, update, and delete activity across admin, staff, and resident accounts.</p>
          <p className="mt-1 text-xs text-slate-500">Times shown in your local timezone. Records begin after audit logging is enabled.</p>
        </div>
        <button onClick={() => setRefresh((n) => n + 1)} disabled={loading} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); applyFilters(draft); }} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[['username', 'Username', 'Search verified username'], ['actor_id', 'User ID', 'Exact user ID']].map(([key, title, placeholder]) => (
            <label key={key} className="text-xs font-semibold text-slate-600">{title}<input className={inputClass} value={draft[key]} onChange={update(key)} placeholder={placeholder} maxLength={key === 'actor_id' ? 128 : 100} /></label>
          ))}
          <label className="text-xs font-semibold text-slate-600">Action<select className={inputClass} value={draft.action} onChange={update('action')}><option value="">All actions</option><option value="add">Add</option><option value="update">Update</option><option value="delete">Delete</option></select></label>
          <label className="text-xs font-semibold text-slate-600">Role<select className={inputClass} value={draft.role} onChange={update('role')}><option value="">All roles</option>{roles.map((role) => <option key={role} value={role}>{label(role)}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Result<select className={inputClass} value={draft.outcome} onChange={update('outcome')}><option value="">All results</option><option value="success">Success</option><option value="denied">Denied</option><option value="failure">Failure</option></select></label>
          <label className="text-xs font-semibold text-slate-600">From<input type="datetime-local" className={inputClass} value={draft.start} onChange={update('start')} max={draft.end || undefined} /></label>
          <label className="text-xs font-semibold text-slate-600">Until<input type="datetime-local" className={inputClass} value={draft.end} onChange={update('end')} min={draft.start || undefined} /></label>
        </div>
      </form>

      {error && <div role="alert" className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" aria-busy={loading}>
        <div className="px-5 py-4 border-b border-slate-100 text-sm text-slate-600" aria-live="polite">{loading ? 'Loading activity…' : error ? 'Unable to load records' : `${data.total.toLocaleString()} matching records`}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>{['Time', 'User', 'Action / target', 'Result', 'Details'].map((title) => <th key={title} className="px-5 py-3 font-semibold">{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && !error && data.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">{date(item.occurred_at)}</td>
                  <td className="px-5 py-4"><div className="font-semibold text-slate-900">{item.actor_username || (item.actor_id ? 'Identified account' : 'Unauthenticated')}</div><div className="text-xs text-slate-500 capitalize mt-1">{label(item.actor_role)}</div><div className="text-xs text-slate-400 font-mono mt-1 break-all">{item.actor_id || (item.attempted_username ? `Attempted: ${item.attempted_username} (unverified)` : 'No verified user ID')}</div></td>
                  <td className="px-5 py-4"><div className="font-medium capitalize">{label(item.action)}</div><div className="font-mono text-xs text-slate-500 mt-1">{item.method} {item.route}</div>{Object.entries(item.target || {}).map(([key, value]) => <div key={key} className="text-xs text-slate-500 break-all">{key}: {value}</div>)}</td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${item.outcome === 'success' ? 'bg-emerald-50 text-emerald-700' : item.outcome === 'denied' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{item.outcome} · {item.status_code}</span></td>
                  <td className="px-5 py-4"><button onClick={() => setSelected(item)} className="text-blue-600 font-medium" aria-haspopup="dialog" aria-controls="activity-details-dialog">Inspect</button></td>
                </tr>
              ))}
              {!loading && !error && data.items.length === 0 && <tr><td colSpan={5} className="py-16 px-5 text-center text-slate-500">No activity matches these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-slate-100 text-sm text-slate-600">
          <span>Page {page} of {pages} · {pageSize} per page</span>
          <div className="flex gap-2"><button aria-label="Previous page" disabled={loading || page <= 1} onClick={() => { setPage(page - 1); setSelected(null); }} className="border rounded-lg p-2 disabled:opacity-30"><ChevronLeft size={18} /></button><button aria-label="Next page" disabled={loading || error || page >= pages} onClick={() => { setPage(page + 1); setSelected(null); }} className="border rounded-lg p-2 disabled:opacity-30"><ChevronRight size={18} /></button></div>
        </div>
      </div>
      <dialog
        ref={detailsDialog}
        id="activity-details-dialog"
        aria-labelledby="activity-details-title"
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            setSelected(null);
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="activity-details-title" className="text-lg font-semibold">Activity details</h2>
          <button type="button" onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600">Close</button>
        </div>
        {selected && <div className="space-y-5 p-5 sm:p-6">
          {[
            ['User', [
              ['Username', selected.actor_username || (selected.actor_id ? 'Not recorded' : 'Unauthenticated')],
              ['User ID', selected.actor_id || 'No verified user ID'],
              ['Role', selected.actor_role ? label(selected.actor_role) : 'Not recorded'],
            ]],
            ['Action and result', [
              ['Operation', label(selected.operation)],
              ['Action', label(selected.action)],
              ['Result', label(selected.outcome)],
              ['HTTP method', selected.method],
              ['HTTP status code', selected.status_code],
              ['Route', selected.route],
              ...Object.entries(selected.target || {}).map(([key, value]) => [`Target: ${label(key)}`, String(value)]),
              ...(Object.keys(selected.target || {}).length ? [] : [['Target IDs', 'No specific target ID recorded']]),
            ]],
            ['Time and request', [
              ['Occurred (local time)', selected.occurred_at ? date(selected.occurred_at) : 'Not recorded'],
              ['Stored (local time)', selected.recorded_at ? date(selected.recorded_at) : 'Not recorded'],
              ['Occurred (UTC)', selected.occurred_at || 'Not recorded'],
              ['Stored (UTC)', selected.recorded_at || 'Not recorded'],
              ['Request ID', selected.id],
              ['Duration', selected.duration_ms != null ? `${selected.duration_ms} ms` : 'Not recorded'],
            ]],
          ].map(([title, fields]) => (
            <section key={title} className="space-y-3">
              <h3 className="border-b border-slate-100 pb-2 text-sm font-semibold text-slate-900">{title}</h3>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {fields.map(([key, value]) => (
                  <div key={key} className={key === 'Route' ? 'sm:col-span-2' : ''}>
                    <dt className="text-xs text-slate-500">{key}</dt>
                    <dd className="mt-1 break-all text-sm leading-relaxed text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          {selected.attempted_username && <section className="space-y-2 rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold">Sign-in attempt</h3>
            <dl className="text-sm"><dt className="text-xs text-slate-500">Username entered at sign-in</dt><dd className="mt-1 break-all">{selected.attempted_username}</dd></dl>
            <p className="text-xs leading-relaxed text-slate-500">This is the username typed into the sign-in form. It does not by itself verify who made the request. The User section above shows the account identified by the server, if available.</p>
          </section>}
        </div>}
      </dialog>
    </div>
  );
}
