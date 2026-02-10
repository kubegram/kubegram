import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Context } from 'hono';

const publicDir = join(process.cwd(), 'public');

export async function renderSSR(c: Context): Promise<Response> {
  // Check if index.html exists in public directory
  const indexPath = join(publicDir, 'index.html');

  if (!existsSync(indexPath)) {
    // Return a basic HTML page if the React build doesn't exist yet
    const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kubegram</title>
</head>
<body>
  <div id="root">
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1>Kubegram Server</h1>
        <p>React build not found. Please run <code>bun run copy-ui</code> to copy the UI files.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return c.html(fallbackHtml);
  }

  // Read and serve the index.html from the React build
  const html = readFileSync(indexPath, 'utf-8');

  return c.html(html);
}
