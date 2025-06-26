# CineSync Duo - Watch Party Application

A premium real-time watch party application that allows two users to watch videos together in perfect synchronization. Features voice chat, universal video player support, and modern glassmorphism design.

## Features

- **Perfect Synchronization**: Millisecond-precise video sync between users
- **Universal Video Player**: Supports YouTube, streaming platforms, and direct video files
- **Real-time Voice Chat**: WebRTC-based voice communication
- **Live Chat**: Real-time messaging with emoji reactions
- **Premium UI/UX**: Modern glassmorphism design with smooth animations
- **Mobile Responsive**: Optimized for all screen sizes
- **Private Rooms**: Secure 6-digit room codes for privacy

## Supported Platforms

- YouTube videos
- Streaming platforms (beenar.net, streamtape, mixdrop, etc.)
- Direct video files (.mp4, .webm, .ogg)

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, WebSockets
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket communication for sync and chat
- **Voice**: WebRTC for peer-to-peer voice calls

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (optional - uses in-memory storage by default)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5000 in your browser

### Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (optional)
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5000)

## Railway Deployment

This application is configured for easy deployment on Railway:

1. Connect your GitHub repository to Railway
2. Add environment variables if using PostgreSQL
3. Deploy automatically with the included railway.json configuration

## Usage

1. **Create Room**: Host creates a room and receives a 6-digit code
2. **Join Room**: Guest enters the room code to join
3. **Load Video**: Host loads a video URL (YouTube, streaming sites, or direct links)
4. **Watch Together**: Both users watch in perfect synchronization
5. **Chat & Voice**: Communicate via text chat and voice calls

## Architecture

- Client-server architecture with WebSocket communication
- In-memory storage with optional PostgreSQL persistence
- Real-time synchronization with sub-second precision
- WebRTC for direct peer-to-peer voice communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details