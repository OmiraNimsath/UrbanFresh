/**
 * Reusable confirmation modal for critical admin delivery actions.
 */
export default function DeliveryStatusConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  intent = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  const confirmClass =
    intent === 'primary'
      ? 'bg-[#0d4a38] hover:bg-[#083a2c]'
      : intent === 'success'
        ? 'bg-[#0d4a38] hover:bg-[#083a2c]'
        : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d4a38]/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="border-b border-[#e4ebe8] px-6 py-5">
          <h2 className="text-base font-semibold text-[#163a2f]">{title}</h2>
          <p className="mt-1.5 text-sm text-[#4a6960]">{message}</p>
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#d3ddd9] bg-white px-4 py-2 text-sm font-medium text-[#3f5f54] transition hover:bg-[#eef4f1] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
