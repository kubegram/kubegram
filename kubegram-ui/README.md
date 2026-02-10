# Kubegram UI v2

A modern web application built with **Bun**, **React 19**, **Vite**, **TypeScript**, **TailwindCSS 4**, and **shadcn/ui**.

## ✨ Features

- ⚡️ **Ultra-fast development** with Bun runtime and Vite HMR
- 🎨 **Beautiful UI components** from shadcn/ui built on Radix UI
- 🎭 **Dark mode support** with CSS variables theming
- 📦 **Type-safe** with TypeScript 5.9
- 🎯 **Modern styling** with TailwindCSS 4
- 🔧 **React Compiler** enabled for optimized performance
- 🏗️ **Production-ready** build configuration

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.3.1 ([Install Bun](https://bun.sh))
- **Node.js** >= 18 (for compatibility)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd kubegram-ui-v2

# Install dependencies
bun install
```

### GitHub Packages Setup (for @kubegram private packages)

This project uses private packages from GitHub Packages. Set up authentication:

1. Create a GitHub Personal Access Token with `read:packages` and `repo` scopes:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `read:packages`

2. Add the token to your environment:
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export NODE_AUTH_TOKEN=your_github_token_here
   
   # Reload your shell
   source ~/.zshrc
   ```

3. The `.npmrc` file is already configured to use this token.

### Development

```bash
# Start development server (http://localhost:5173)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

## 📁 Project Structure

```
kubegram-ui-v2/
├── src/
│   ├── components/        # React components
│   │   └── ui/           # shadcn/ui components
│   │       └── button.tsx
│   ├── lib/              # Utility functions
│   │   └── utils.ts      # cn() helper for class merging
│   ├── assets/           # Static assets (images, icons, etc.)
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles and CSS variables
├── public/               # Public static files
├── components.json       # shadcn/ui configuration
├── .npmrc               # NPM configuration for GitHub Packages
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # App-specific TypeScript config
├── vite.config.ts       # Vite configuration
└── README.md            # This file
```

## 🎨 Using shadcn/ui Components

### Adding New Components

Install components using the shadcn/ui CLI:

```bash
# Example: Add a Card component
npx shadcn@latest add card

# Example: Add a Dialog component
npx shadcn@latest add dialog
```

Components will be added to `src/components/ui/` and can be imported using the `@/` alias:

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <Button variant="default">Click me</Button>
    </Card>
  )
}
```

### Available Button Variants

The Button component comes with multiple variants:

```tsx
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">📍</Button>
```

### Buttons with Icons

Using Lucide React icons:

```tsx
import { Heart, Trash2 } from 'lucide-react'

<Button variant="outline">
  <Heart className="w-4 h-4" />
  Like
</Button>

<Button variant="destructive" size="icon">
  <Trash2 className="w-4 h-4" />
</Button>
```

## 🎨 Theming

The application uses CSS variables for theming, supporting both light and dark modes.

### Customizing Colors

Edit `src/index.css` to customize the color palette:

```css
:root {
  --primary: 0 0% 9%;
  --secondary: 0 0% 96.1%;
  /* ... other variables */
}

.dark {
  --primary: 0 0% 98%;
  --secondary: 0 0% 14.9%;
  /* ... other variables */
}
```

Color values are in HSL format: `hue saturation% lightness%`

## 🔧 Configuration

### Path Aliases

The project uses `@/` as an alias for the `src/` directory:

```tsx
// Instead of this:
import { Button } from '../../components/ui/button'

// Use this:
import { Button } from '@/components/ui/button'
```

Configured in:
- `tsconfig.app.json` - TypeScript compiler
- `vite.config.ts` - Vite bundler

### TypeScript

- **Strict mode** enabled for type safety
- **React 19** types included
- **Path aliases** configured for clean imports

### Vite

- **React plugin** with React Compiler enabled
- **TailwindCSS plugin** for CSS processing
- **Path resolution** for `@/` alias
- **HMR** (Hot Module Replacement) enabled

## 📦 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.3.1 | JavaScript runtime & package manager |
| **React** | 19.2.0 | UI framework |
| **Vite** | 7.2.4 | Build tool & dev server |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |
| **TailwindCSS** | 4.1.18 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Primitive components |
| **Lucide React** | 0.562.0 | Icon library |

## 🔨 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server at http://localhost:5173 |
| `bun run build` | Build optimized production bundle in `dist/` |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint on codebase |

## 📝 Best Practices

### Component Organization

- **UI components** go in `src/components/ui/` (managed by shadcn)
- **Feature components** go in `src/components/` (your custom components)
- **Utilities** go in `src/lib/`

### Styling

- Use **Tailwind classes** for styling
- Use `cn()` helper from `@/lib/utils` to merge classes conditionally:
  ```tsx
  import { cn } from '@/lib/utils'
  
  <div className={cn("base-class", condition && "conditional-class")} />
  ```

### Type Safety

- Define prop types using TypeScript interfaces
- Use `React.FC` or explicit function typing
- Leverage shadcn's exported types for component variants

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `bun run lint` to check for issues
4. Run `bun run build` to verify the build
5. Submit a pull request

## 📄 License

[Your License Here]

## 🔗 Resources

- [Bun Documentation](https://bun.sh/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)
