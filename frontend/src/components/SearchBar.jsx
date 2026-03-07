import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSearchSuggestions from '../hooks/useSearchSuggestions';
import { formatPrice } from '../utils/priceUtils';

/**
 * Component Layer – Search input with a rich autocomplete suggestions dropdown.
 *
 * Each suggestion row shows a product thumbnail, name, and formatted price so the
 * user can confirm the right product before committing the search. Keyboard navigation
 * (↓ ↑ Enter Escape) is fully supported.
 *
 * The parent must keep inputValue and committedSearch as separate states so that
 * typing here never triggers the main product catalogue fetch.
 *
 * @param {Object}   props
 * @param {string}   props.value       - current typed value (controlled by parent)
 * @param {Function} props.onChange    - called with the new string on every keystroke
 * @param {Function} props.onCommit    - called with the committed string on form submit
 *                                       or suggestion selection; triggers the product fetch
 * @param {string}   [props.placeholder]
 */
export default function SearchBar({ value, onChange, onCommit, placeholder = 'Search products…' }) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const { suggestions } = useSearchSuggestions(value);
  const navigate = useNavigate();

  const showDropdown = open && suggestions.length > 0;

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setHighlightedIndex(-1);
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    }
  };

  // suggestion is now a ProductSuggestionResponse object {id, name, imageUrl, price, unit}
  const selectSuggestion = useCallback((suggestion) => {
    // Navigate directly to the product detail page on suggestion select
    // (avoid performing a listing search)
    setOpen(false);
    setHighlightedIndex(-1);
    navigate(`/products/${suggestion.id}`);
  }, [navigate]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setOpen(false);
    setHighlightedIndex(-1);
    onCommit(value);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) setOpen(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleFormSubmit} className="relative flex flex-1 gap-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        {/* Rich suggestions dropdown */}
        {showDropdown && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {suggestions.map((suggestion, idx) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                highlighted={idx === highlightedIndex}
                onMouseDown={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              />
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Private sub-component: one row in the suggestions dropdown
───────────────────────────────────────────────────────────────────────────── */

/**
 * Renders a single suggestion row: thumbnail on the left, product name and
 * formatted price on the right. Highlighted state applies a green tint.
 *
 * @param {Object}   props
 * @param {Object}   props.suggestion  - ProductSuggestionResponse {id, name, imageUrl, price, unit}
 * @param {boolean}  props.highlighted - whether this row is keyboard-focused
 * @param {Function} props.onMouseDown - selects this suggestion
 * @param {Function} props.onMouseEnter
 */
function SuggestionItem({ suggestion, highlighted, onMouseDown, onMouseEnter }) {
  return (
    <li
      role="option"
      aria-selected={highlighted}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
        highlighted ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-green-100 flex items-center justify-center">
        {suggestion.imageUrl ? (
          <img
            src={suggestion.imageUrl}
            alt={suggestion.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg">🥦</span>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={`text-sm font-medium truncate ${
            highlighted ? 'text-green-800' : 'text-gray-800'
          }`}
        >
          {suggestion.name}
        </span>
        <span className="text-xs text-green-600 font-semibold mt-0.5">
          {formatPrice(suggestion.price, suggestion.unit)}
        </span>
      </div>

      {/* Chevron hint */}
      <span className="text-gray-300 text-xs shrink-0">↵</span>
    </li>
  );
}
