# CineSync Duo - Real-Time Watch Party Application

A premium real-time watch party application that allows two users to create and join virtual rooms to watch videos together from multiple sources. Features synchronized video playback, real-time chat, voice calling, and WebSocket-based communication.

## ✨ Features

- **Universal Video Support**: YouTube, streaming platforms (beenar.net, streamtape, mixdrop, etc.), and direct video files
- **Real-Time Synchronization**: Perfectly synced video playback between all participants
- **Voice Calling**: WebRTC-based voice communication with mute/deafen controls
- **Live Chat**: Real-time messaging with emoji reactions
- **Premium UI**: Modern glassmorphism design with smooth animations
- **Mobile Responsive**: Optimized for all device sizes
- **Room Management**: Secure room codes with host/guest roles

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database (optional - uses in-memory storage by default)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cinesync-duo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your database URL if using PostgreSQL
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5000`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database (optional - defaults to in-memory storage)
DATABASE_URL=postgresql://username:password@localhost:5432/cinesync

# Node Environment
NODE_ENV=development
```

## 📦 Deployment

### Railway Deployment

The application is pre-configured for Railway deployment:

1. Connect your GitHub repository to Railway
2. The build process will automatically use the Railway configuration
3. Set environment variables in Railway dashboard if needed

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🛠 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## 🏗 Architecture

- **Frontend**: React with TypeScript, Vite build tool
- **Backend**: Express.js with WebSocket support
- **Database**: PostgreSQL with Drizzle ORM (optional)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: WebSockets for video sync and chat

## 📱 Usage

1. **Create a Room**: Click "Create Room" to generate a unique room code
2. **Join a Room**: Enter a room code to join an existing session
3. **Load Video**: Paste any supported video URL to start watching
4. **Chat & Voice**: Use the side panel for messaging and voice calls
5. **Sync Controls**: Host controls playback, guests automatically sync

## 🎥 Supported Video Sources

- **YouTube**: Direct YouTube video URLs
- **Streaming Platforms**: beenar.net, streamtape, mixdrop, doodstream, upstream, fembed
- **Direct Videos**: MP4, WebM, OGG, and other HTML5 video formats

## 🔒 Security

- Room codes are cryptographically secure
- Client/server separation with input validation
- No sensitive data stored in local storage
- WebRTC peer-to-peer voice communication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🐛 Issues

Report bugs and feature requests on the GitHub issues page.

---

Built with ❤️ for seamless watch parties