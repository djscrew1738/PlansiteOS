# PipelineOS

AI-powered plumbing blueprint analysis and project management system built for CTL Plumbing LLC.

## Overview

PipelineOS uses Claude Vision AI to automatically analyze plumbing blueprints, detect fixtures, extract measurements, and generate accurate project bids. The system streamlines the quoting process from hours to minutes while improving accuracy and consistency.

## Features

- **AI Blueprint Analysis** - Upload blueprints (PNG, JPG, PDF) and get automatic fixture detection
- **Fixture Detection** - Identifies toilets, sinks, showers, water heaters, and more
- **Room Mapping** - Understands room layouts and fixture placement
- **Measurement Extraction** - Pulls dimensions and specifications from blueprints
- **Project Management** - Track blueprints, leads, and bids in one place
- **Modern UI** - Clean, responsive interface with real-time updates

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **PostgreSQL** - Database
- **Claude Vision API** - AI blueprint analysis
- **Winston** - Structured logging
- **AsyncLocalStorage** - Request correlation IDs

### Frontend
- **React 18** - UI framework
- **Vite** - Fast development server & build tool
- **TailwindCSS** - Utility-first styling
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Infrastructure
- **Turbo** - Monorepo build orchestration
- **PM2** - Production process management
- **Nginx** - Reverse proxy & SSL termination
- **Docker** - Containerized PostgreSQL

## Project Structure

```
pipelineos/
├── apps/
│   ├── api/           # Backend API server
│   │   └── src/
│   │       ├── modules/      # Business logic (blueprints, leads, bids)
│   │       ├── platform/     # Cross-cutting concerns (config, observability, middleware)
│   │       └── routes/       # API endpoints
│   └── web/           # React frontend
│       └── src/
│           ├── components/   # React components
│           ├── pages/        # Page components
│           ├── api/          # API client
│           └── styles/       # Global styles
├── infra/
│   ├── docker/        # Docker Compose configs
│   ├── nginx/         # Nginx configurations
│   └── pm2/           # PM2 ecosystem files
├── storage/
│   └── uploads/       # Blueprint uploads
└── package.json       # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Anthropic API key (for Claude Vision)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pipelineos
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/pipelineos
ANTHROPIC_API_KEY=sk-ant-...
PORT=5000
NODE_ENV=development
DOMAIN_URL=https://ctlplumbingllc.com
```

4. Set up the database:
```bash
# Using Docker
cd infra/docker/compose
docker-compose -f docker-compose.dev.yml up -d postgres

# Or install PostgreSQL locally and create database
createdb pipelineos
```

5. Run database migrations:
```bash
cd apps/api
npm run migrate
```

### Development

Start all services in development mode:

```bash
# From project root
npm run dev
```

Or start services individually:

```bash
# API server (port 5000)
npm run api:dev

# Web app (port 3000)
npm run web:dev
```

The API will be available at `http://localhost:5000`  
The web UI will be available at `http://localhost:3000`

### Building for Production

```bash
# Build all apps
npm run build

# Or build individually
cd apps/api && npm run build
cd apps/web && npm run build
```

## Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start services
pm2 start infra/pm2/ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs
```

### Using Docker

```bash
cd infra/docker/compose
docker-compose up -d
```

### Nginx Setup

Copy the nginx configuration:

```bash
sudo cp infra/nginx/sites-available/pipelineos.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/pipelineos.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## API Documentation

### Endpoints

#### Health Check
```
GET /api/health
```

#### Blueprints
```
POST   /api/v1/blueprints/upload    # Upload & analyze blueprint
GET    /api/v1/blueprints           # List all blueprints
GET    /api/v1/blueprints/:id       # Get blueprint details
DELETE /api/v1/blueprints/:id       # Delete blueprint
```

#### Leads
```
POST   /api/v1/leads                # Create lead
GET    /api/v1/leads                # List leads
GET    /api/v1/leads/:id            # Get lead details
PUT    /api/v1/leads/:id            # Update lead
DELETE /api/v1/leads/:id            # Delete lead
```

## Architecture

### Clean Architecture

The API follows clean architecture principles:

- **Modules** - Business logic organized by domain (blueprints, leads, bids)
- **Platform** - Cross-cutting concerns (config, logging, middleware)
- **Routes** - HTTP layer (request/response handling)

### Key Patterns

- **Circuit Breaker** - Protects external API calls (Claude Vision)
- **Transaction Manager** - Handles database transactions
- **Correlation IDs** - Request tracing across services
- **Structured Logging** - JSON logs with context

## License

Proprietary - CTL Plumbing LLC

## Support

For issues and questions, contact the development team.
