import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const links = [
  { to: '/preview/canvas', label: 'Canvas' },
  { to: '/preview/code-view', label: 'Code View' },
  { to: '/preview/compare-view', label: 'Compare View' },
  { to: '/preview/plan-view', label: 'Plan View' },
];

export default function PreviewBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black text-xs px-4 py-1 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-bold tracking-wide">PREVIEW MODE</span>
        <span className="text-amber-800">|</span>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`hover:underline ${location.pathname === to ? 'font-bold underline' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="hover:bg-amber-600/20 p-0.5 rounded cursor-pointer transition-colors"
        aria-label="Close preview banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
