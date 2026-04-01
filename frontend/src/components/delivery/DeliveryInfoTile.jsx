/**
 * Reusable info tile for delivery detail metadata sections.
 */
export default function DeliveryInfoTile({ label, value, valueClassName = '' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-900 sm:text-base ${valueClassName}`}>{value}</p>
    </div>
  );
}
