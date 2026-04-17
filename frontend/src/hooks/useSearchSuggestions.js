import { useState, useEffect, useRef } from 'react';
import { getProductSuggestions } from '../services/productService';

/**
 * Custom hook that returns debounced autocomplete suggestions for a search query.
 *
 * Debouncing prevents a request on every keystroke; instead, a request is only
 * sent when the user pauses typing for {@code delay} milliseconds. Queries shorter
 * than 2 characters skip the network entirely.
 *
 * All state updates happen inside the async timer callback (not the effect body),
 * so the hook satisfies the React "avoid synchronous setState in effects" rule.
 *
 * This hook calls GET /api/products/suggestions — a lightweight endpoint separate
 * from the main product catalogue fetch — so suggestions never trigger a grid reload.
 *
 * @param {string} query - the current value of the search input
 * @param {number} [delay=300] - debounce delay in milliseconds
 * @returns {{ suggestions: string[] }}
 */
export default function useSearchSuggestions(query, delay = 300) {
  const [suggestionState, setSuggestionState] = useState({ query: '', items: [] });
  // Monotonic id to identify the latest outstanding request. Incrementing
  // on every query change lets us ignore out-of-order responses.
  const latestRequestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    // Do not fetch for very short queries — results would be too broad
    if (trimmed.length < 2) return;

    // Mark a new logical request. We capture the id for this timer so that
    // when the network response arrives we can ignore it if a newer query
    // was issued in the meantime.
    const requestId = ++latestRequestId.current;
    let disposed = false;

    const timer = setTimeout(() => {
      getProductSuggestions(trimmed)
        .then((results) => {
          // Only apply results when this response matches the most recent
          // request id — otherwise it's stale and must be ignored.
          if (!disposed && requestId === latestRequestId.current) {
            setSuggestionState({ query: trimmed, items: results });
          }
        })
        .catch(() => {
          if (!disposed && requestId === latestRequestId.current) {
            setSuggestionState({ query: trimmed, items: [] });
          }
        });
    }, delay);

    // Cancel the pending timer when the query changes before the delay fires.
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [query, delay]);

  const trimmed = query.trim();
  const suggestions =
    trimmed.length >= 2 && suggestionState.query === trimmed ? suggestionState.items : [];

  return { suggestions };
}
