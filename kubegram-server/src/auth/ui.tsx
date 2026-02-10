import React from 'react';

interface Provider {
  id: string;
  name: string;
}

interface ProviderSelectProps {
  providers: Provider[];
  basePath: string;
  logoUrl: string;
}

export const ProviderSelect: React.FC<ProviderSelectProps> = ({ providers, basePath, logoUrl }) => {
  const icons: Record<string, string> = {
    github: `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,
    google: `<svg height="20" width="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.56z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
    slack: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>`,
    gitlab: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor" style="color:#FC6D26"><path d="M23.275 12.28L12.41 23.144a1.71 1.71 0 0 1-2.414 0L.727 12.28a1.71 1.71 0 0 1 0-2.414l5.367-5.367c.7-.7 1.838-.7 2.538 0l2.583 2.583c.3.3.785.3 1.085 0l2.583-2.583a1.71 1.71 0 0 1 2.414 0l5.367 5.367a1.71 1.71 0 0 1 0 2.414zM12 0a1.71 1.71 0 0 1 1.207.502l5.366 5.367a1.71 1.71 0 0 1 0 2.414L12 14.885 5.428 8.283a1.71 1.71 0 0 1 0-2.414L10.793.502A1.71 1.71 0 0 1 12 0z"/></svg>`,
    discord: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor" style="color:#5865F2"><path d="M20.211 2.373a6.865 6.865 0 00-5.834 2.825 19.394 19.394 0 00-1.874 0 6.865 6.865 0 00-5.834-2.825c-3.003.011-5.746 2.08-6.19 5.093-.733 5.074 2.062 9.479 6.25 11.233 1.258.529 2.193.921 3.012 1.285.459.197.94.398 1.439.599.309.125.626.252.951.378.077.03-.198-.094-.12-.12a.669.669 0 00.12 0c.325-.126.642-.253.951-.378.499-.201.98-.402 1.439-.599.819-.364 1.754-.756 3.012-1.285 4.188-1.754 6.983-6.159 6.25-11.233-.444-3.013-3.187-5.082-6.19-5.093zM8.882 15.658c-1.373 0-2.5-1.121-2.5-2.5 0-1.379 1.127-2.5 2.5-2.5s2.5 1.121 2.5 2.5c.001 1.379-1.126 2.5-2.5 2.5zm6.236 0c-1.373 0-2.5-1.121-2.5-2.5 0-1.379 1.127-2.5 2.5-2.5s2.5 1.121 2.5 2.5c.001 1.379-1.126 2.5-2.5 2.5z"/></svg>`,
    okta: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>`,
    sso: `<svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`
  };

  const optionsHtml = providers.map(p => {
    const icon = icons[p.id] || '';
    return `
      <div class="dropdown-item" data-value="${p.id}">
        ${icon}
        <span>Continue with ${p.name}</span>
      </div>
    `;
  }).join('');

  const script = `
    const dropdown = document.getElementById('custom-dropdown');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const input = document.getElementById('provider-input');
    const btn = document.getElementById('continue-btn');
    const triggerText = trigger.querySelector('.text-val');
    const triggerIcon = trigger.querySelector('.icon-container');

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });

    // Add click listeners to items (event delegation for simplicity)
    const menu = dropdown.querySelector('.dropdown-menu');
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (item) {
        const value = item.dataset.value;
        const text = item.querySelector('span').textContent;
        const iconHtml = item.querySelector('svg') ? item.querySelector('svg').outerHTML : '';
        
        input.value = value;
        triggerText.textContent = text;
        triggerIcon.innerHTML = iconHtml;
        
        dropdown.classList.remove('open');
        btn.disabled = false;
      }
    });

    btn.addEventListener('click', () => {
      if (input.value) {
        const provider = input.value;
        const basePath = "${basePath}";
        window.location.href = basePath + '/' + provider + '/authorize';
      }
    });
  `;

  return (
    <html lang="en">
      <head>
        <title>Sign in to Kubegram</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
          :root {
            --bg-color: #09090b;
            --card-bg: #18181b;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --border-color: #27272a;
            --input-bg: #27272a;
            --hover-bg: #3f3f46;
            --primary-color: #ffffff;
            --primary-text: #000000;
            --font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: var(--font-family);
            -webkit-font-smoothing: antialiased;
          }
          .card {
            background: var(--card-bg);
            padding: 2.5rem;
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .logo-img {
            width: 25%;
            height: auto;
            object-fit: contain;
            margin: 0 auto;
            margin-bottom: 1rem;
          }
          .title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
          }
          .subtitle {
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-top: -1rem; 
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
          }
          
          /* Custom Dropdown Styles */
          .custom-dropdown {
            position: relative;
            width: 100%;
            text-align: left;
            user-select: none;
          }
          .dropdown-trigger {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.95rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
            transition: border-color 0.2s;
          }
          .dropdown-trigger:hover {
            border-color: var(--text-secondary);
          }
          .dropdown-trigger .selected-value {
             display: flex;
             align-items: center;
             gap: 0.75rem;
             width: 100%;
          }
          .dropdown-trigger .arrow {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-left: 0.5rem;
          }
          .dropdown-menu {
            position: absolute;
            top: calc(100% + 0.5rem);
            left: 0;
            width: 100%;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
            display: none;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          }
          .custom-dropdown.open .dropdown-menu {
            display: block;
          }
          .dropdown-item {
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: background-color 0.2s;
            color: var(--text-primary);
          }
          .dropdown-item:hover {
            background-color: var(--hover-bg);
          }
          .dropdown-item svg, .icon-container svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }

          .continue-btn {
            width: 100%;
            padding: 0.75rem;
            background-color: var(--primary-color);
            color: var(--primary-text);
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .continue-btn:hover {
            opacity: 0.9;
          }
          .continue-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}} />
      </head>
      <body>
        <div className="card">
          <img src={logoUrl} alt="Kubegram" className="logo-img" />
          <h1 className="title">Welcome to Kubegram</h1>
          <div className="subtitle">Select a provider to continue</div>

          <div className="form-group">
            <input type="hidden" id="provider-input" />
            <div className="custom-dropdown" id="custom-dropdown">
              <div className="dropdown-trigger">
                <div className="selected-value">
                  <div className="icon-container"></div>
                  <span className="text-val">Choose a provider...</span>
                </div>
                <span className="arrow">▼</span>
              </div>
              <div className="dropdown-menu" dangerouslySetInnerHTML={{ __html: optionsHtml }} />
            </div>
            <button id="continue-btn" className="continue-btn" disabled>Continue</button>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </body>
    </html>
  );
};
