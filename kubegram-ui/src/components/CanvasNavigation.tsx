import React from 'react';

interface CanvasNavigationProps {
  showBackToContent: boolean;
  onBackToContent: () => void;
}

/**
 * CanvasNavigation Component
 *
 * Renders the back-to-content button when the user has navigated far from the main content.
 * This provides a quick way to return to the center of the canvas.
 */
const CanvasNavigation: React.FC<CanvasNavigationProps> = ({
  showBackToContent,
  onBackToContent,
}) => {
  if (!showBackToContent) {
    return null;
  }

  return (
    <div className="absolute top-20 right-4 z-50">
      <button
        onClick={onBackToContent}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg border transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
        title="Back to Content"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        Back to Content
      </button>
    </div>
  );
};

export default CanvasNavigation;
