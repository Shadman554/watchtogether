# CineSync Duo - Watch Party Application

A real-time watch party application that allows two users to create and join virtual rooms to watch videos together from multiple sources with synchronized playback, real-time chat, and voice communication.

## Features

- **Universal Video Support**: YouTube, streaming platforms (beenar.net, streamtape, mixdrop, doodstream, etc.), and direct video files
- **Real-time Synchronization**: Perfectly synced video playback across all participants
- **Voice Chat**: WebRTC-based voice communication with mute/deafen controls
- **Real-time Chat**: Instant messaging with emoji reactions
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Room-based Sessions**: Simple room codes for easy joining

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Real-time**: WebSockets for synchronization and chat
- **Voice**: WebRTC for peer-to-peer voice communication

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use Neon for cloud database)

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

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database URL:
```
DATABASE_URL=your_postgresql_connection_string
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Creating a Room
1. Visit the homepage
2. Click "Create New Room"
3. Share the generated room code with your friend

### Joining a Room
1. Visit the homepage
2. Enter the room code in "Join Room"
3. Click "Join Room"

### Loading Videos
- Use the "Load Video" button in the bottom toolbar
- Paste any supported video URL
- Supported platforms: YouTube, beenar.net, streamtape, mixdrop, doodstream, and direct video files

### Voice Chat
- Click the phone icon to start/end voice chat
- Use mute/deafen controls when voice chat is active
- Voice chat uses WebRTC for direct peer-to-peer connection

### Chat
- Click the message icon to open chat panel
- Send text messages or use emoji reactions
- Chat is synced in real-time across all participants

## Deployment

### Replit Deployment
This application is optimized for Replit deployment:

1. Import your repository to Replit
2. Set up your `DATABASE_URL` in Replit Secrets
3. Run `npm run db:push` in the Shell
4. The application will automatically start

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" for production builds

## Architecture

- **Frontend**: Single-page React application with client-side routing
- **Backend**: Express server handling API routes and WebSocket connections
- **Database**: PostgreSQL with rooms and messages tables
- **Real-time**: WebSocket connections for video sync and chat
- **Storage**: Supports both in-memory and database storage

## API Endpoints

- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:code` - Get room information
- WebSocket connection for real-time features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both desktop and mobile
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue in the GitHub repository.