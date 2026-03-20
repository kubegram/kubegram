import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Helper to generate docs manifest
function generateDocsManifest() {
  const docsDir = path.resolve(__dirname, 'public/docs');
  const manifestPath = path.resolve(__dirname, 'src/config/docs-manifest.json');

  if (!fs.existsSync(docsDir)) {
    console.warn('Docs directory not found:', docsDir);
    return;
  }

  const getTitle = (filePath: string, fileName: string): string => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Try to find title in frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const titleMatch = frontmatterMatch[1].match(/title:\s*(.*)/);
        if (titleMatch) return titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }
      // Try to find first H1
      const h1Match = content.match(/^#\s+(.*)/m);
      if (h1Match) return h1Match[1].trim();
    } catch (e) {
      // ignore
    }
    // Fallback to filename converted to Title Case
    return fileName.replace(/-/g, ' ').replace(/\.md$/, '').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getFileOrder = (filePath: string): number | undefined => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const match = content.match(/<!--\s*order:\s*(\d+)\s*-->/);
      if (match) return parseInt(match[1], 10);
    } catch (e) {
      // ignore
    }
    return undefined;
  };

  const getDirOrder = (dirPath: string): number | undefined => {
    try {
      const metaPath = path.join(dirPath, '_meta.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (typeof meta.order === 'number') return meta.order;
      }
    } catch (e) {
      // ignore
    }
    return undefined;
  };

  const sortByOrder = (items: any[]): any[] => {
    return [...items].sort((a, b) => {
      const aHasOrder = a.order !== undefined;
      const bHasOrder = b.order !== undefined;
      if (aHasOrder && bHasOrder) return a.order - b.order;
      if (aHasOrder) return -1;
      if (bHasOrder) return 1;
      // fallback: directories before files, then alphabetical
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.title.localeCompare(b.title);
    });
  };

  const traverse = (dir: string, rootPath: string = '/docs'): any[] => {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    const mapped = items
      .filter(item =>
        !item.name.startsWith('.') &&
        item.name !== '_meta.json' &&
        (item.isDirectory() || item.name.endsWith('.md'))
      )
      .map(item => {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.join(rootPath, item.name);

        if (item.isDirectory()) {
          const children = traverse(fullPath, relativePath);
          return {
            title: item.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            path: relativePath,
            children,
            isDirectory: true,
            order: getDirOrder(fullPath)
          };
        } else {
          const routePath = relativePath.replace(/\.md$/, '');
          return {
            title: getTitle(fullPath, item.name),
            path: routePath,
            isDirectory: false,
            order: getFileOrder(fullPath)
          };
        }
      });

    return sortByOrder(mapped);
  };

  const manifest = traverse(docsDir);

  // Ensure src/config exists
  const configDir = path.dirname(manifestPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Docs manifest generated at:', manifestPath);
}

// Custom plugin
const docsManifestPlugin = () => {
  return {
    name: 'generate-docs-manifest',
    buildStart() {
      generateDocsManifest();
    },
    handleHotUpdate({ file, server }: any) {
      if (file.includes('/public/docs/') && file.endsWith('.md')) {
        generateDocsManifest();
        server.ws.send({
          type: 'full-reload',
        });
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    docsManifestPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
