import { Link } from 'react-router-dom';

/**
 * Presentation Layer – Reusable breadcrumb row for customer storefront flows.
 * Accepts ordered items where intermediate items can be links.
 */
export default function Breadcrumbs({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-[#6f817b]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {isLast || !item.to ? (
                <span className={isLast ? 'font-medium text-[#163a2f]' : ''}>{item.label}</span>
              ) : (
                <Link to={item.to} className="hover:text-[#0d4a38] transition-colors">
                  {item.label}
                </Link>
              )}
              {!isLast && <span aria-hidden="true" className="text-[#a3b2ad]">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
