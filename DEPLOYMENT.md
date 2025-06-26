# Deployment Guide for CineSync Duo

## Quick Deployment Options

### 1. Replit Deployment (Recommended for beginners)
1. Import project to Replit
2. Set environment variables in Secrets tab
3. Click Deploy button
4. Your app will be live at `yourapp.replit.app`

### 2. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add environment variables
```

### 3. Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### 4. Heroku Deployment
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### 5. Docker Deployment
```dockerfile
# Dockerfile (create this file)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t cinesync-duo .
docker run -p 5000:5000 -e DATABASE_URL=your_db_url cinesync-duo
```

## Environment Variables Setup

### Required Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
PORT=5000
```

### Optional Variables
```env
# WebRTC STUN servers (for better voice call connectivity)
STUN_SERVER_1=stun:stun.l.google.com:19302
STUN_SERVER_2=stun:stun1.l.google.com:19302
```

## Database Setup

### PostgreSQL Setup
1. Create a PostgreSQL database
2. Copy the connection URL
3. Set `DATABASE_URL` environment variable
4. Run migrations: `npm run db:push`

### Popular Database Providers
- **Neon**: Free PostgreSQL with generous limits
- **Supabase**: Free tier with real-time features
- **Railway**: Built-in PostgreSQL
- **Heroku Postgres**: Reliable with free tier

## Post-Deployment Checklist

### ✅ Functionality Tests
- [ ] Room creation works
- [ ] Room joining works
- [ ] Video loading and sync works
- [ ] Chat messaging works
- [ ] Voice calls connect properly
- [ ] Mobile responsiveness works

### ✅ Performance Checks
- [ ] Page loads under 3 seconds
- [ ] WebSocket connection is stable
- [ ] Video sync latency is acceptable
- [ ] Voice call quality is clear

### ✅ Security
- [ ] Environment variables are secure
- [ ] Database connections are encrypted
- [ ] No sensitive data in client-side code

## Troubleshooting Common Issues

### Voice Calls Not Working
- Check WebRTC STUN server configuration
- Verify both users have microphone permissions
- Test with users on same network first

### Video Sync Issues
- Verify WebSocket connection is stable
- Check if video URLs are accessible from deployment server
- Test with different video sources

### Database Connection Errors
- Verify DATABASE_URL format and credentials
- Check if database allows external connections
- Ensure SSL mode is configured correctly

### Build Failures
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility (requires 18+)
- Verify all environment variables are set

## Scaling Considerations

### For High Traffic
- Use a load balancer for multiple instances
- Implement Redis for session storage
- Use CDN for static assets
- Consider database connection pooling

### WebSocket Scaling
- Use sticky sessions with load balancer
- Consider Redis adapter for Socket.IO scaling
- Monitor WebSocket connection limits

## Monitoring and Maintenance

### Health Checks
- Monitor server response times
- Track WebSocket connection stability
- Monitor database performance

### Regular Maintenance
- Update dependencies monthly
- Monitor security vulnerabilities
- Backup database regularly
- Check logs for errors

## Support

For deployment issues:
1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Test locally first with same configuration
4. Check provider-specific documentation

## Custom Domain Setup

### Vercel
```bash
vercel domains add yourdomain.com
```

### Heroku
```bash
heroku domains:add yourdomain.com
```

### Railway
Use Railway dashboard to add custom domain

Remember to update DNS records to point to your deployment platform.