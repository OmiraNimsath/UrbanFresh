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
    <form onSubmit={handleFormSubmit} className="relative flex w-full flex-1 gap-2">
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
          className="h-10 w-full rounded-lg border border-[#dce3de] bg-white px-3 text-sm text-[#1b2d25] placeholder:text-[#8a9690] focus:outline-none focus:ring-2 focus:ring-[#9ac8b1]"
        />

        {/* Rich suggestions dropdown */}
        {showDropdown && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[#dce3de] bg-white shadow-xl"
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
        className="h-10 rounded-lg bg-[#0f5b3f] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0a4831]"
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
      className={`flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors ${
        highlighted ? 'bg-[#ebf4ef]' : 'hover:bg-[#f4f7f5]'
      }`}
    >
      {/* Thumbnail */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#e8f0eb]">
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
          className={`truncate text-sm font-medium ${
            highlighted ? 'text-[#1f5a42]' : 'text-[#22352d]'
          }`}
        >
          {suggestion.name}
        </span>
        <span className="mt-0.5 text-xs font-semibold text-[#2f7757]">
          {formatPrice(suggestion.price, suggestion.unit)}
        </span>
      </div>

      {/* Chevron hint */}
      <span className="shrink-0 text-xs text-[#9aa8a1]">↵</span>
    </li>
  );
}
