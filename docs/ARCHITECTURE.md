# PipelineOS Architecture

## Overview

PipelineOS is a modular monorepo designed for scalability, maintainability, and clear separation of concerns.

## System Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────┐
│    Nginx    │  ← Reverse Proxy, SSL, Rate Limiting
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│   API    │   │  Worker  │   │   Web    │
│(Express) │   │ (BullMQ) │   │ (React)  │
└────┬─────┘   └────┬─────┘   └──────────┘
     │              │
     ├──────────────┤
     │              │
     ▼              ▼
┌─────────────────────┐
│    PostgreSQL       │  ← Primary Data Store
└─────────────────────┘

┌─────────────────────┐
│      Redis          │  ← Job Queue, Cache
└─────────────────────┘

┌─────────────────────┐
│  File Storage       │  ← Blueprints, PDFs
└─────────────────────┘
```

## Applications

### API (`apps/api`)
- **Purpose**: REST API server
- **Tech**: Express.js, Node.js
- **Port**: 5000
- **Responsibilities**:
  - HTTP request handling
  - Authentication & authorization
  - Business logic coordination
  - Database operations
  - File uploads

### Worker (`apps/worker`)
- **Purpose**: Background job processing
- **Tech**: BullMQ, Node.js
- **Responsibilities**:
  - Blueprint analysis (AI vision)
  - Bid generation
  - Email/SMS sending
  - Scheduled tasks (cron)
  - Report generation

### Web (`apps/web`)
- **Purpose**: Frontend dashboard
- **Tech**: React, Vite
- **Port**: 3000 (dev)
- **Responsibilities**:
  - User interface
  - Data visualization
  - Real-time updates
  - File upload interface

### Vision (`apps/vision`) - Optional
- **Purpose**: Specialized AI vision processing
- **Tech**: Python, FastAPI
- **Responsibilities**:
  - Advanced image processing
  - Custom ML models
  - Fixture detection algorithms

## Packages

### Contracts (`packages/contracts`)
- **Purpose**: Shared API schemas and validation
- **Exports**:
  - Zod schemas
  - TypeScript types
  - Validation functions

### Database (`packages/db`)
- **Purpose**: Database schema and migrations
- **Contents**:
  - SQL migration files
  - Seed data
  - Migration runner

### AI Core (`packages/ai-core`)
- **Purpose**: AI provider abstraction
- **Features**:
  - Multi-provider support (Anthropic, OpenAI, Gemini)
  - Unified interface
  - Safety & redaction
  - Prompt management

### Shared (`packages/shared`)
- **Purpose**: Common utilities
- **Exports**:
  - Constants
  - Formatters
  - Validators
  - Helpers

## Data Flow

### Blueprint Upload & Analysis

```
1. User uploads blueprint via Web UI
   ↓
2. Web → API: POST /api/blueprints/upload
   ↓
3. API saves file to storage
   ↓
4. API creates database record (status: pending)
   ↓
5. API queues job: blueprint.analyze
   ↓
6. Worker picks up job from queue
   ↓
7. Worker calls AI Core → Claude Vision API
   ↓
8. AI analyzes blueprint, returns fixtures
   ↓
9. Worker saves results to database
   ↓
10. Worker updates status: completed
    ↓
11. Web polls API, shows results
```

### Bid Generation

```
1. User requests bid for blueprint
   ↓
2. Worker retrieves fixture data
   ↓
3. Pricing Engine calculates costs
   ↓
4. PDF Service generates proposal
   ↓
5. Email Service sends to customer
   ↓
6. Database records bid & email
```

## Domain Modules

Each domain module follows clean architecture:

```
modules/blueprints/
├── blueprints.controller.js    # HTTP handlers
├── blueprints.service.js       # Business logic
├── blueprints.repo.js          # Data access
├── blueprints.validators.js    # Input validation
└── blueprints.events.js        # Event emitters
```

**Layers**:
1. **Controller**: Request/response handling
2. **Service**: Business logic
3. **Repository**: Database queries
4. **Validators**: Schema validation
5. **Events**: Publish domain events

**Rules**:
- Controllers call Services
- Services call Repositories
- No circular dependencies
- Events for cross-module communication

## Platform Services

### Observability
- **Logger**: Winston (structured logging)
- **Metrics**: Prometheus (future)
- **Tracing**: Correlation IDs

### Auth
- **JWT**: Token-based auth
- **RBAC**: Role-based access
- **Sessions**: Redis-backed

### Middleware
- **Error Handler**: Centralized error handling
- **Request ID**: Correlation tracking
- **Rate Limit**: Token bucket algorithm
- **Sanitization**: Input cleaning

## Database Schema

See `docs/DATABASE.md` for full schema documentation.

**Key Tables**:
- `blueprints` - Uploaded blueprint metadata
- `blueprint_fixtures` - Detected fixtures
- `leads` - Customer inquiries
- `bids` - Generated proposals
- `responses` - Auto-responses sent

## Security

### API Security
- Helmet.js for security headers
- Rate limiting (10 req/sec per IP)
- Input validation (Joi/Zod)
- SQL injection protection (parameterized queries)
- CORS configuration
- File upload limits (50MB)

### Authentication
- JWT tokens (15min expiry)
- Refresh tokens (7 day expiry)
- Password hashing (bcrypt)
- RBAC permissions

### Secrets Management
- Environment variables
- No secrets in code
- `.env` files gitignored

## Scalability

### Horizontal Scaling
- API: Stateless, can run multiple instances
- Worker: Multiple workers process queue
- Database: Read replicas (future)
- Redis: Cluster mode (future)

### Caching Strategy
- Redis for session data
- HTTP caching headers
- Database query result cache (future)

### Performance Optimizations
- Connection pooling (PostgreSQL)
- Image compression (blueprints)
- Lazy loading (frontend)
- Index optimization (database)

## Monitoring

### Health Checks
- `GET /api/health` - API status
- Database connectivity
- Redis connectivity
- AI provider status

### Logs
- Structured JSON logs
- Log levels: error, warn, info, debug
- Correlation IDs for request tracing
- Centralized log aggregation (future)

### Alerts (Future)
- API downtime
- Queue backlog
- Database errors
- High error rate

## Deployment

### Development
```bash
npm run dev  # All services
```

### Production
- **PM2**: Process manager for Node apps
- **Docker**: Containerized deployment
- **Nginx**: Reverse proxy, SSL termination

### CI/CD
- GitHub Actions
- Automated testing
- Security scanning
- Deployment to production

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Queue | BullMQ, Redis |
| Database | PostgreSQL 15 |
| AI | Claude (Anthropic) |
| Deployment | Docker, PM2 |
| Proxy | Nginx |
| Monorepo | npm workspaces, Turbo |

## Future Enhancements

- [ ] Real-time notifications (WebSockets)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] GraphQL API option
- [ ] Kubernetes deployment
- [ ] Microservices migration (if needed)
