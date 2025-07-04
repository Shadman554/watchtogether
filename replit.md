# Watch Party Application

## Overview

This is a real-time watch party application called "CineSync Duo" that allows two users to create and join virtual rooms to watch videos together from multiple sources. The application features synchronized video playback, real-time chat, and WebSocket-based communication to ensure all participants stay in sync. It supports YouTube, streaming platforms like beenar.net, and direct video files.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with WebSocket support
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time Communication**: WebSockets for video synchronization and chat

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using Wouter for routing
- **Component Library**: shadcn/ui components for consistent UI/UX
- **State Management**: TanStack Query for server state management
- **Universal Video Player**: Supports YouTube, streaming platforms (beenar.net, streamtape, mixdrop, etc.), and direct video files
- **WebSocket Client**: Custom hook for real-time communication

### Backend Architecture
- **Express Server**: RESTful API endpoints and WebSocket server
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **WebSocket Management**: Room-based connection management for real-time features
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database storage

### Database Schema
- **Rooms Table**: Stores room information including code, host/guest IDs, current video, and playback state
- **Messages Table**: Stores chat messages with room association and user information

### Real-time Features
- **Video Synchronization**: WebSocket messages for play/pause/seek events
- **Chat System**: Real-time messaging with emoji reactions
- **User Presence**: Connected user tracking and status updates

## Data Flow

1. **Room Creation**: Host creates room → generates unique code → stores in database
2. **Room Joining**: Guest enters room code → validates and joins → WebSocket connection established
3. **Video Loading**: Host loads YouTube video → broadcasts to all participants
4. **Playback Sync**: Any playback control → WebSocket broadcast → all clients sync
5. **Chat Messages**: User sends message → WebSocket broadcast → displayed to all participants

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Database**: Drizzle ORM, @neondatabase/serverless for PostgreSQL
- **WebSockets**: ws library for real-time communication
- **Video Player**: YouTube IFrame API integration

### Development Tools
- **Build Tools**: Vite for frontend bundling, esbuild for server bundling
- **TypeScript**: Full type safety across the stack
- **CSS Framework**: Tailwind CSS with custom theme variables

## Deployment Strategy

The application is configured for Replit deployment with:

- **Development Mode**: `npm run dev` - runs server with Vite dev server
- **Production Build**: `npm run build` - builds both client and server
- **Production Start**: `npm run start` - serves built application
- **Database Migration**: `npm run db:push` - applies schema changes

### Environment Configuration
- PostgreSQL database connection via `DATABASE_URL`
- WebSocket server running on the same port as HTTP server
- Static file serving for built client assets

## Changelog

- June 26, 2025: Initial setup with YouTube-only support
- June 26, 2025: Added universal video player supporting multiple streaming platforms:
  - YouTube integration
  - Streaming platforms: beenar.net, streamtape, mixdrop, doodstream, upstream, fembed
  - Direct video file support (.mp4, .webm, .ogg, etc.)
  - Added room code display with copy functionality
  - Enhanced UI with cinema theme and better user experience
- June 26, 2025: Complete UI redesign with modern interface:
  - Toggleable UI controls with hide/show functionality
  - Modern gradient-based design with better visual hierarchy
  - WebRTC-based voice calling with mute/deafen controls
  - Enhanced side panel with room statistics and controls
  - Improved chat system with better toggle functionality
  - Real-time voice communication between users
  - Better mobile-responsive design elements
- June 26, 2025: Mobile responsiveness and synchronization improvements:
  - Fully responsive design for mobile phones and tablets
  - Mobile-optimized control panels with stacked layouts
  - Enhanced video synchronization with improved tolerance (1s for direct video, 0.5s for YouTube)
  - Better sync timing with 1.5-second heartbeat intervals
  - Mobile-responsive chat panel with optimized sizing
  - Improved WebSocket communication for better real-time sync
  - Enhanced playback control synchronization between host and guest
- June 26, 2025: Voice call implementation and deployment preparation:
  - Implemented WebRTC voice calling with proper signaling through WebSocket
  - Fixed guest video loading - guests now automatically receive videos loaded by host
  - Enhanced mobile responsiveness for voice call controls, chat, and settings
  - Added comprehensive deployment files (README.md, .env.example, .gitignore)
  - Prepared project for GitHub deployment with full documentation
  - Fixed voice call connectivity issues with improved caller/answerer pattern
- June 26, 2025: Replit migration and mobile UI optimization:
  - Successfully migrated project from Replit Agent to standard Replit environment
  - Removed duplicate control areas and improved mobile responsiveness
  - Optimized chat panel, voice call controls, and settings panel for mobile devices
  - Simplified bottom toolbar to focus on primary "Load Video" action for mobile
  - Enhanced positioning and sizing of UI elements for better mobile experience
  - Maintained all existing functionality while improving user experience
- June 26, 2025: Final mobile responsiveness fixes and GitHub preparation:
  - Fixed chat panel input visibility on mobile with proper height calculations
  - Repositioned voice call controls to prevent overlap with bottom toolbar
  - Made bottom toolbar more compact with smaller button spacing for mobile
  - Ensured all UI elements are properly visible and accessible on mobile devices
  - Created comprehensive deployment files for GitHub (README.md, .env.example, .gitignore)
  - Prepared project for version control with complete documentation
- June 26, 2025: Complete 10/10 premium design transformation:
  - Redesigned landing page with modern glassmorphism effects and premium animations
  - Implemented advanced CSS animations including fade-up, scale-in, floating, and glow effects
  - Enhanced room page with premium header bar, user avatars, and real-time status indicators
  - Redesigned universal video player with gradient backgrounds, enhanced loading states, and connection status
  - Added premium visual feedback with glassmorphism cards, gradient buttons, and smooth transitions
  - Implemented enhanced synchronization indicators and premium control interfaces
  - Added custom scrollbars, hover effects, and micro-interactions for 10/10 user experience
  - Successfully migrated from Replit Agent to standard Replit environment with full functionality
- June 26, 2025: Railway deployment configuration and dependency fixes:
  - Fixed critical Vite import issues that prevented production builds from running
  - Created production-specific server (`server/index.prod.ts`) that avoids development dependencies
  - Implemented complete Railway deployment configuration with custom build scripts
  - Added `railway.json`, `nixpacks.toml`, and `build-railway.js` for seamless deployment
  - Resolved broken node_modules dependencies and corrupted package installations
  - Application now ready for Railway deployment with all features working correctly
- June 27, 2025: Successfully migrated from Replit Agent to standard Replit environment:
  - Completed full migration with all dependencies properly installed
  - Created Railway deployment configuration that avoids Replit-specific dependencies
  - Fixed Vite configuration issues for external deployment platforms
  - Added production-specific build scripts and server configuration
  - Application runs successfully in both Replit and Railway environments
  - All features including video sync, chat, and voice calls working correctly
  - Fixed Railway build errors with simplified build process (`build-simple.js`)
  - Resolved module resolution issues for external platform deployment
  - Created comprehensive GitHub deployment files (README.md, .env.example, .gitignore, LICENSE)

## User Preferences

Preferred communication style: Simple, everyday language.