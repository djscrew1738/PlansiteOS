# PlansiteOS v2.0

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

---

## 🚀 Features

- **AI Blueprint Analysis** - Claude Sonnet 4 powered fixture counting
- **Smart Upload** - Drag-and-drop, camera capture, batch processing
- **Auto-Estimation** - DFW market pricing with complexity analysis
- **Mobile-First** - PWA-ready, touch-optimized, works offline
- **Production-Ready** - Docker, PM2, and cloud deployment ready

---

## 📸 Screenshots

### Upload Interface
Drag-and-drop blueprints or use camera on mobile

### AI Analysis
Automatic fixture counting with confidence scores

### Instant Estimates
Line-item breakdown with DFW pricing

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key (optional - falls back to mock data)

### Installation

```bash
# Clone repository
git clone https://github.com/djscrew1738/PlansiteOS.git
cd PlansiteOS

# Install dependencies
npm install

# Start development servers
npm run dev
```

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:5000

---

## 🔧 Configuration

### Environment Variables

Create `.env` in root directory:

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Server
PORT=5000
NODE_ENV=development

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/plansiteos

# DFW Pricing (per fixture)
PRICE_WATER_HEATER=450
PRICE_LAVATORY=175
PRICE_KITCHEN_SINK=225
PRICE_TOILET=150
PRICE_TUB=350
PRICE_SHOWER=400
```

---

## 📱 Mobile Installation

### Install as PWA on Android

1. Open Chrome on Android
2. Navigate to your PlansiteOS URL
3. Tap menu (⋮) → "Install app"
4. Use like a native app with camera access!

---

## 🏗️ Architecture

```
PlansiteOS/
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── utils/    # Helper functions
│   └── package.json
├── frontend/          # React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── docs/             # Documentation
├── scripts/          # Deployment scripts
└── storage/          # Uploaded files
```

---

## 🚢 Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start services
npm run build
pm2 start ecosystem.config.js

# Save configuration
pm2 save
pm2 startup
```

### Option 2: Docker

```bash
docker-compose up -d
```

### Option 3: Manual

```bash
# Backend
cd backend
npm install
npm start

# Frontend (separate terminal)
cd frontend
npm install
npm run build
npm start
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

---

## 📊 API Documentation

### Upload Blueprint

```bash
POST /api/blueprints/upload
Content-Type: multipart/form-data

{
  "blueprint": <file>
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "proj_123",
    "analysis": {
      "fixtures": { ... },
      "estimate": { ... }
    }
  }
}
```

Full API docs: [docs/API.md](docs/API.md)

---

## 💰 Cost Estimate

### Anthropic API
- ~$0.02-0.05 per blueprint analysis
- 100 blueprints/month = $2-5/month

### Hosting
- Self-hosted: Free
- VPS (DigitalOcean, Linode): $5-10/month
- Cloud (AWS, GCP): $10-20/month

---

## 🛠️ Built With

**Frontend:**
- React 18
- Vite
- TailwindCSS
- react-dropzone
- Lucide Icons

**Backend:**
- Express.js
- Multer
- Sharp
- Anthropic Claude API
- PostgreSQL (optional)

**DevOps:**
- Docker
- PM2
- GitHub Actions

---

## 📖 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Reference](docs/API.md)
- [Configuration](docs/CONFIGURATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

## 🤝 Contributing

This is a private project built for CTL Plumbing LLC, but feel free to fork and adapt for your own use!

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- Built with Anthropic Claude AI
- DFW plumbing industry standards
- Texas construction code compliance

---

## 📞 Support

For issues or questions:
- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Review existing GitHub issues
- Contact: CTL Plumbing LLC

---

**Built for Texas tradesmen, by Texas tradesmen** 🤠

---

## 🎯 Roadmap

- [x] AI blueprint analysis
- [x] Mobile PWA
- [x] Batch upload
- [x] Auto-estimation
- [ ] Database integration
- [ ] Multi-user support
- [ ] BidMaster integration
- [ ] Material supplier API
- [ ] Inspector notes tracking
- [ ] Project timeline management

---

**Ready to revolutionize your plumbing takeoffs!**
