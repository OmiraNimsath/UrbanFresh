/**
 * Returns a user-friendly API error message from common backend response shapes.
 * Falls back to a safe generic message when no meaningful detail is available.
 */
export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const statusCode = error?.response?.status;
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData.trim();
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message.trim();
  }

  if (responseData?.errors && typeof responseData.errors === 'object') {
    const firstErrorValue = Object.values(responseData.errors)[0];

    if (typeof firstErrorValue === 'string' && firstErrorValue.trim()) {
      return firstErrorValue.trim();
    }

    if (Array.isArray(firstErrorValue) && typeof firstErrorValue[0] === 'string' && firstErrorValue[0].trim()) {
      return firstErrorValue[0].trim();
    }
  }

  if (!error?.response && (error?.message === 'Network Error' || statusCode === 0)) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return fallbackMessage;
}
