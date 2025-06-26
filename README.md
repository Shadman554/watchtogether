# CineSync Duo - Real-Time Watch Party Application

A modern, responsive watch party application that allows two users to watch videos together in perfect synchronization with real-time chat and voice communication.

![CineSync Duo](https://img.shields.io/badge/CineSync%20Duo-v1.0-purple)
![Built with React](https://img.shields.io/badge/Built%20with-React-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-green)
![Mobile Responsive](https://img.shields.io/badge/Mobile-Responsive-orange)

## ✨ Features

### 🎬 Universal Video Support
- **YouTube Integration**: Full support for YouTube videos with synchronized playback
- **Streaming Platforms**: Support for beenar.net, streamtape, mixdrop, doodstream, upstream, fembed
- **Direct Video Files**: .mp4, .webm, .ogg, and other standard video formats
- **Real-time Sync**: Advanced synchronization with sub-second precision

### 💬 Communication
- **Real-time Chat**: Instant messaging with emoji reactions
- **Voice Calls**: WebRTC-powered voice communication with echo cancellation
- **Mute/Deafen Controls**: Full audio control for optimal experience

### 📱 Mobile-First Design
- **Fully Responsive**: Optimized layouts for phones, tablets, and desktops
- **Touch-Friendly Controls**: Mobile-optimized interface elements
- **Adaptive UI**: Context-aware control panels that adapt to screen size

### 🚀 Performance
- **WebSocket Communication**: Real-time bidirectional communication
- **Optimized Sync**: Smart synchronization with configurable tolerance
- **Low Latency**: Sub-second response times for controls and chat

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Wouter** for routing
- **TanStack Query** for state management
- **WebRTC** for peer-to-peer voice communication

### Backend
- **Express.js** server
- **WebSocket** for real-time communication
- **PostgreSQL** with Drizzle ORM
- **TypeScript** throughout

### Infrastructure
- **Vite** for build tooling
- **Node.js** runtime
- **Hot Module Replacement** for development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cinesync-duo.git
   cd cinesync-duo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## 📖 Usage

### Creating a Room
1. Open the application
2. Enter your username
3. Click "Create Room"
4. Share the generated room code with your friend

### Joining a Room
1. Open the application
2. Enter your username
3. Enter the room code shared by your friend
4. Click "Join Room"

### Loading Videos
1. Click the "Load Video" button
2. Paste any supported video URL:
   - YouTube: `https://youtube.com/watch?v=...`
   - Streaming sites: `https://beenar.net/...`
   - Direct files: `https://example.com/video.mp4`
3. The video will automatically sync to all users

### Voice Communication
1. Click the phone icon to enable voice chat
2. Allow microphone permissions
3. Both users will be connected automatically
4. Use mute/deafen controls as needed

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cinesync_duo

# Server
NODE_ENV=production
PORT=5000

# Optional WebRTC Configuration
STUN_SERVER_1=stun:stun.l.google.com:19302
STUN_SERVER_2=stun:stun1.l.google.com:19302
```

### Video Sync Settings
- **Direct Video Tolerance**: 1 second
- **YouTube Tolerance**: 0.5 seconds
- **Heartbeat Interval**: 1.5 seconds

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   React Client  │
│   (Host/Guest)  │    │   (Host/Guest)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────┬───────────────┘
                 │ WebSocket
                 │
┌────────────────▼────────────────┐
│         Express Server          │
│  ┌─────────────────────────────┐│
│  │      WebSocket Server       ││
│  │   (Room Management &        ││
│  │    Real-time Sync)          ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │       REST API              ││
│  │   (Room CRUD Operations)    ││
│  └─────────────────────────────┘│
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│        PostgreSQL Database      │
│  ┌─────────────────────────────┐│
│  │         Drizzle ORM         ││
│  │    (Schema & Migrations)    ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 API Reference

### WebSocket Events

#### Client → Server
- `join_room`: Join a room with user credentials
- `sync`: Send video synchronization data
- `playback_control`: Send playback control commands
- `chat`: Send chat messages
- `webrtc_signal`: WebRTC signaling for voice calls

#### Server → Client
- `joined_room`: Room join confirmation with user list
- `user_join`/`user_disconnect`: User presence updates
- `sync`: Receive synchronization data
- `playback_control`: Receive playback commands
- `chat`: Receive chat messages
- `webrtc_signal`: WebRTC signaling relay

### REST Endpoints

- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:code` - Get room information

## 🐛 Troubleshooting

### Voice Call Issues
- Ensure microphone permissions are granted
- Check firewall settings for WebRTC
- Try refreshing the page if connection fails

### Video Sync Issues
- Verify both users have stable internet connections
- Check if the video URL is accessible from both locations
- Try loading a different video source

### Mobile Issues
- Use a modern mobile browser (Chrome, Safari, Firefox)
- Ensure JavaScript is enabled
- Try landscape orientation for better experience

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and modern web technologies
- Uses WebRTC for peer-to-peer communication
- Inspired by the need for synchronized viewing experiences
- Thanks to the open-source community for amazing tools

---

**Made with ❤️ for shared viewing experiences**