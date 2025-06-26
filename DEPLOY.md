# Railway Deployment Guide

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Manual Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: CineSync Duo watch party app"
git remote add origin https://github.com/yourusername/cinesync-duo.git
git push -u origin main
```

### 2. Deploy on Railway

1. Visit [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your CineSync Duo repository
6. Railway will automatically detect the Node.js project and deploy

### 3. Environment Variables (Optional)

For PostgreSQL database support:
- Railway can automatically provision a PostgreSQL addon
- Or set `DATABASE_URL` manually if using external database

### 4. Custom Domain (Optional)

1. Go to your Railway project dashboard
2. Click on "Settings" 
3. Add your custom domain in the "Domains" section

## Deployment Configuration

The application includes:
- `railway.json` - Railway-specific configuration
- `nixpacks.toml` - Nixpacks build configuration
- `build-railway.js` - Custom build script for Railway deployment
- `Dockerfile` - Container configuration 
- Build and start scripts in `package.json`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Auto-set by Railway |
| `PORT` | Server port | Auto-set by Railway |
| `DATABASE_URL` | PostgreSQL connection | Optional (uses in-memory if not set) |

## Post-Deployment

After successful deployment:
1. Your app will be available at `https://your-app-name.railway.app`
2. Test creating and joining rooms
3. Verify video synchronization works
4. Test voice chat functionality

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (requires Node 20+)

### Runtime Issues
- Check Railway logs for error messages
- Ensure environment variables are set correctly
- Verify database connection if using PostgreSQL

### WebSocket Issues
- Railway supports WebSockets by default
- No additional configuration needed for real-time features

## Scaling

Railway automatically handles:
- Load balancing
- SSL certificates
- Health checks
- Automatic restarts on failure

For high traffic, consider:
- Adding a PostgreSQL database for persistence
- Implementing Redis for session management
- Setting up monitoring and alerts