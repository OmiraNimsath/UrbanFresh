/**
 * Lightweight vertical timeline list for delivery activities.
 */
export default function DeliveryStatusTimeline({ title = 'Activity Timeline', entries = [] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No timeline activity is available yet.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {entries.map((entry, index) => (
            <li key={`${entry.time || 'na'}-${entry.label}-${index}`} className="flex gap-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{entry.label}</p>
                {entry.description ? <p className="text-sm text-slate-600">{entry.description}</p> : null}
                <p className="text-xs text-slate-500">{formatDateTime(entry.time)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatDateTime(value) {
  if (!value) return 'Time unavailable';
  return new Date(value).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
