# Kubegram Server v2

A modern Bun-based server with Server-Side Rendering (SSR) for React and API routes.

## Features

- 🚀 **Bun Runtime** - Fast, modern JavaScript runtime
- ⚛️ **React SSR** - Server-side rendering support
- 🛣️ **API Routes** - RESTful API endpoints
- 🔒 **CORS Configuration** - Environment-specific CORS settings
- 🌐 **Static File Serving** - Efficient asset delivery
- 🔥 **Hot Reloading** - Development mode with auto-reload

## Prerequisites

- [Bun](https://bun.sh) installed (v1.0.0 or higher)
- React app built in `../kubegram-ui-v2/dist`

## Installation

```bash
# Install dependencies
bun install
```

## Configuration

### Environment Variables

The server uses environment-specific configuration:

**Development (.env.development)**
```env
PORT=8090
NODE_ENV=development
CORS_ORIGIN=http://localhost
```

**Production (.env.production)**
```env
PORT=8090
NODE_ENV=production
CORS_ORIGIN=https://api.kubegram.local
```

Update `CORS_ORIGIN` in `.env.production` to match your backend API host.

## Usage

### Development Mode

Start the development server with hot reloading:

```bash
bun run dev
```

The server will:
- Run on `http://localhost:8090`
- Allow CORS from any localhost origin
- Auto-reload on file changes

### Production Mode

1. **Copy React build files:**
   ```bash
   bun run copy-ui
   ```
   
   This script copies the built React app from `../kubegram-ui-v2/dist` to `./public`

2. **Start production server:**
   ```bash
   bun run start
   ```

The server will:
- Run on `http://localhost:8090`
- Serve static files from `./public`
- Apply strict CORS policy (backend API host only)

## API Endpoints

### Health Check
```
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "message": "Hello World",
  "timestamp": "2026-01-20T18:59:39Z"
}
```

## Project Structure

```
kubegram-server-v2/
├── src/
│   ├── config/
│   │   └── env.ts           # Environment configuration
│   ├── middleware/
│   │   └── cors.ts          # CORS middleware
│   ├── routes/
│   │   └── api.ts           # API route handlers
│   ├── ssr/
│   │   └── render.tsx       # SSR rendering logic
│   └── index.ts             # Server entry point
├── scripts/
│   └── copy-ui.sh           # UI build copy script
├── public/                  # Static files (generated)
├── .env.development         # Dev environment config
├── .env.production          # Prod environment config
├── package.json
├── tsconfig.json
└── README.md
```

## CORS Policy

### Development
- Allows requests from any `localhost` or `127.0.0.1` origin
- Useful for local testing with various ports

### Production
- Only allows requests from the configured `CORS_ORIGIN`
- Set this to your backend API host for security

## CI/CD Integration

For GitHub Actions, create a workflow that:
1. Builds the React app
2. Copies build files to the server directory
3. Deploys the server

Example workflow step:
```yaml
- name: Copy UI Build
  run: |
    cd kubegram-server-v2
    bun run copy-ui
```

## Troubleshooting

### React build not found
If you see "React build not found" in the browser:
1. Ensure the React app is built: `cd ../kubegram-ui-v2 && npm run build`
2. Run the copy script: `bun run copy-ui`
3. Restart the server

### CORS errors
- **Development**: Check that your client is running on localhost
- **Production**: Verify `CORS_ORIGIN` in `.env.production` matches your backend host

### Port already in use
If port 8090 is already in use, update `PORT` in your `.env` files

## License

MIT
