import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

/**
 * Application Entry Point
 *
 * This is the main entry point for the CloudNest UI React application.
 * It initializes the React application and renders the root App component
 * within React's StrictMode for better development experience.
 *
 * The application is mounted to the DOM element with id 'root'.
 */
// Add dark class to document element for dark theme
document.documentElement.classList.add('dark');

// Preview mode: inject mock adapter and seed localStorage before React mounts
if (import.meta.env.VITE_PREVIEW_MODE === 'true') {
  await import('./preview/previewSetup');
}

console.log('🎬 Application starting...');
console.log('🔍 Root element found:', !!document.getElementById('root'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

console.log('✅ Application rendered');
