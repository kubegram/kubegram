# Setup Guide - Kubegram UI v2

This guide provides detailed setup instructions for developers working on the Kubegram UI v2 project.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Bun** (>= 1.3.1)
   ```bash
   # macOS/Linux
   curl -fsSL https://bun.sh/install | bash
   
   # Verify installation
   bun --version
   ```

2. **Node.js** (>= 18) - Optional but recommended for compatibility
   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   
   # Verify installation
   node --version
   ```

3. **Git**
   ```bash
   # Verify installation
   git --version
   ```

### GitHub Access

You'll need a GitHub Personal Access Token to install private `@kubegram` packages.

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kubegram-ui-v2
```

### 2. Configure GitHub Packages Authentication

The project uses private packages from GitHub Packages that require authentication.

#### Create a GitHub Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Kubegram UI Dev")
4. Set expiration (recommended: 90 days or longer for development)
5. Select the following scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `read:packages` - Download packages from GitHub Package Registry
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't be able to see it again!)

#### Set the Environment Variable

Add the token to your shell configuration:

**For zsh (macOS default):**
```bash
# Edit your ~/.zshrc file
nano ~/.zshrc

# Add this line at the end:
export NODE_AUTH_TOKEN=ghp_your_token_here

# Save and reload
source ~/.zshrc
```

**For bash:**
```bash
# Edit your ~/.bashrc or ~/.bash_profile
nano ~/.bashrc

# Add this line at the end:
export NODE_AUTH_TOKEN=ghp_your_token_here

# Save and reload
source ~/.bashrc
```

**Verify the token is set:**
```bash
echo $NODE_AUTH_TOKEN
# Should output your token
```

### 3. Install Dependencies

```bash
bun install
```

If you encounter a 401 error with `@kubegram/common-ts`:
1. Verify your token is set: `echo $NODE_AUTH_TOKEN`
2. Reload your shell: `source ~/.zshrc`
3. Try again: `bun install`

### 4. Verify Installation

```bash
# Check that the project builds successfully
bun run build

# Start the development server
bun run dev
```

Open http://localhost:5173 in your browser. You should see the Kubegram UI v2 application with:
- A header with the Kubegram UI v2 title
- An interactive counter
- Button component demos
- Tech stack overview

## Development Workflow

### Starting Development

```bash
# Start the dev server with hot reload
bun run dev
```

The development server will start at http://localhost:5173 with:
- **Hot Module Replacement (HMR)** - changes appear instantly
- **Fast Refresh** - preserves component state during updates
- **TypeScript checking** - type errors appear in the console

### Code Quality

```bash
# Run ESLint
bun run lint

# Build for production (verifies everything compiles)
bun run build
```

## Adding shadcn/ui Components

The project uses shadcn/ui for UI components. Components are installed on-demand.

### Installing Components

```bash
# Add a specific component
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add form
```

Components will be added to `src/components/ui/` and are automatically configured to work with your project's styling.

### Using Installed Components

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
    </Card>
  )
}
```

## Project Configuration Files

### `.npmrc`
Configures npm/bun to use GitHub Packages for `@kubegram` scoped packages.

```
@kubegram:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
registry=https://registry.npmjs.org/
```

### `components.json`
shadcn/ui configuration. Defines:
- Component installation paths
- Styling approach (CSS variables)
- Import aliases

### `tsconfig.app.json`
TypeScript configuration for the app, including:
- Path aliases (`@/` → `./src`)
- Strict type checking
- React JSX transform

### `vite.config.ts`
Vite build configuration:
- React plugin with React Compiler
- TailwindCSS plugin
- Path aliases for imports

## Environment Variables

The project uses these environment variables:

| Variable | Purpose | Required |
|----------|---------|----------|
| `NODE_AUTH_TOKEN` | GitHub Packages authentication | Yes |

Create a `.env.local` file if you need additional environment variables:

```bash
# .env.local (not committed to git)
VITE_API_URL=http://localhost:8090
```

Access in code:
```tsx
const apiUrl = import.meta.env.VITE_API_URL
```

## Troubleshooting

### Package Installation Fails with 401

**Problem:** `error: GET https://npm.pkg.github.com/@kubegram%2fcommon-ts - 401`

**Solution:**
1. Check your token is set: `echo $NODE_AUTH_TOKEN`
2. Verify the token has `read:packages` and `repo` scopes
3. Reload your shell: `source ~/.zshrc`
4. Try installing again: `bun install`

### Port 5173 Already in Use

**Problem:** `Error: Port 5173 is already in use`

**Solution:**
```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
bun run dev -- --port 3000
```

### TypeScript Errors

**Problem:** Type errors in editor or during build

**Solution:**
1. Restart your TypeScript server in your editor
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

### Build Fails

**Problem:** Build fails with TailwindCSS errors

**Solution:**
1. Ensure `@tailwindcss/vite` is installed: `bun add -D @tailwindcss/vite`
2. Check `src/index.css` has the correct imports
3. Clear Vite cache: `rm -rf node_modules/.vite`

## Next Steps

- Read the [README.md](./README.md) for usage documentation
- Explore the [shadcn/ui docs](https://ui.shadcn.com) for available components
- Check out the example `App.tsx` to see component usage
- Start building your features!

## Getting Help

- Check the project's GitHub Issues
- Review shadcn/ui documentation: https://ui.shadcn.com
- Consult Bun documentation: https://bun.sh/docs
- Ask the team in your project's communication channel
