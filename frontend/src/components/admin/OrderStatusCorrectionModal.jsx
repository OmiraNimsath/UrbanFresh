import { useState } from 'react';

/**
 * Presentation Layer – Modal used to collect a correction reason for backward
 * order status updates.
 *
 * @param {boolean} isOpen whether the modal is visible
 * @param {string} fromStatus current order status
 * @param {string} toStatus target order status
 * @param {boolean} loading true while update request is in-flight
 * @param {(reason: string) => void} onConfirm callback with trimmed reason
 * @param {() => void} onCancel callback for closing the modal
 */
export default function OrderStatusCorrectionModal({
  isOpen,
  fromStatus,
  toStatus,
  loading,
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Correction reason is required for backward status updates.');
      return;
    }

    onConfirm(trimmedReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">Correction Reason Required</h2>
        <p className="mt-2 text-sm text-gray-600">
          Provide a reason for changing status from {fromStatus} to {toStatus}.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            value={reason}
            onChange={(event) => {
              if (error) {
                setError('');
              }
              setReason(event.target.value);
            }}
            maxLength={255}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            placeholder="Explain why this status needs to be corrected"
          />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Submit Reason'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}