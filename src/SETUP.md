# 🚀 Setup Guide - City Plan Generator

This guide will get you up and running with the complete, production-ready city plan generator in minutes.

## 📋 Prerequisites

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Git** - For cloning the repository

## ⚡ Quick Start (Development)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd src

# 2. Install dependencies and setup
pnpm run setup

# 3. Start development server
pnpm dev

# 4. Open your browser
open http://localhost:5173
```

That's it! The application is now running with:
- ✅ Real map layers with live OSM data
- ✅ Complete plan generation (DXF, SVG, PDF)
- ✅ Dual language support (German/English)
- ✅ Anonymous analytics
- ✅ Dark mode support

## 🐋 Quick Start (Production with Docker)

```bash
# 1. Clone and setup
git clone <your-repo-url>
cd src

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings (optional)

# 3. Start with Docker Compose
pnpm run docker:dev

# 4. Verify everything is working
pnpm run verify

# 5. View logs
pnpm run docker:logs
```

The application will be available at `http://localhost:3000`.

## 🛠 Manual Production Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (optional)
nano .env
```

Example `.env`:
```env
NODE_ENV=production
PORT=3000

# Enable minimal analytics
ENABLE_ANALYTICS=true

# Optional: Use real elevation data
HEIGHT_API_KEY=your_opentopodata_key
```

### 2. Build for Production

```bash
# Install dependencies
pnpm install

# Compile translations
pnpm run paraglide:compile

# Build application
pnpm build

# Start production server
pnpm start
```

### 3. Verify Production Setup

```bash
# Run comprehensive verification
pnpm run verify
```

This will test:
- ✅ File structure and dependencies
- ✅ API endpoints (health, analytics, height data)
- ✅ Main application page
- ✅ Performance benchmarks
- ✅ Data directory permissions

## 🌐 Features Overview

### Plan Generation
- **Real OSM Data**: Downloads live data from Overpass API
- **Web Workers**: Non-blocking plan generation in browser
- **Multiple Formats**: Export as DXF, SVG, and PDF
- **Contour Lines**: Real elevation data with fallback
- **Progress Tracking**: Real-time updates during generation

### Map Interface
- **Interactive Layers**: Toggle buildings, green spaces, water, etc.
- **Live Data**: Real-time OSM data visualization
- **Location Search**: Search any location worldwide
- **State Persistence**: Remembers map position and settings

### Privacy & Analytics
- **Maximum Anonymity**: Only tracks download counts
- **No Personal Data**: Zero user tracking or identification
- **GDPR Compliant**: Explicit consent with detailed explanations
- **File-based Storage**: Simple, concurrent-safe analytics

## 🔧 Available Scripts

### Development
```bash
pnpm dev              # Start development server
pnpm check            # Type checking
pnpm lint             # Code linting
pnpm format           # Code formatting
pnpm test             # Run tests
```

### Production
```bash
pnpm build            # Build for production
pnpm start            # Start production server
pnpm preview          # Preview production build
pnpm verify           # Verify production setup
```

### Docker
```bash
pnpm docker:build     # Build Docker image
pnpm docker:run       # Run Docker container
pnpm docker:dev       # Start with docker-compose
pnpm docker:logs      # View application logs
```

### Setup & Maintenance
```bash
pnpm setup            # Install deps + compile translations
pnpm paraglide:compile # Compile translation files
```

## 📁 Project Structure

```
src/
├── 🎯 Main Application
│   ├── src/routes/+page.svelte      # Main UI component
│   ├── src/routes/+layout.svelte    # Layout with i18n
│   └── src/lib/utils/               # Core utilities
│
├── 🌐 API Endpoints
│   ├── src/routes/api/health/       # Health monitoring
│   ├── src/routes/api/analytics/    # Anonymous tracking
│   └── src/routes/api/heights/      # Elevation data
│
├── ⚙️ Client-Side Processing
│   ├── static/js/osm/               # Web workers & OSM processing
│   └── static/js/conrec/            # Contour generation
│
├── 🌍 Internationalization
│   ├── messages/                    # Translation source files
│   ├── project.inlang/              # ParaglideJS config
│   └── src/paraglide/               # Generated translation code
│
└── 🚀 Production
    ├── Dockerfile                   # Container definition
    ├── docker-compose.yml           # Multi-service setup
    └── scripts/verify-production.js # Production verification
```

## 🔍 Testing the Application

### 1. Basic Functionality Test

1. **Open the application** in your browser
2. **Accept privacy consent** to enable map
3. **Search for a location** (try "Berlin, Germany")
4. **Zoom in** to at least level 13
5. **Enable some layers** (buildings, green, water)
6. **Generate a plan** by clicking DXF, SVG, or PDF
7. **Watch the progress** and download the generated file

### 2. API Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test analytics
curl http://localhost:3000/api/analytics/count

# Test height data
curl -X POST http://localhost:3000/api/heights \
  -H "Content-Type: application/json" \
  -d '{"north":52.52,"west":13.38,"south":52.50,"east":13.42,"resolution":20}'
```

### 3. Performance Testing

The verification script includes performance benchmarks:

```bash
pnpm run verify
```

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check Node.js version
node --version  # Should be 20+

# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Map layers not loading**
```bash
# Check if zoom level is sufficient (13+)
# Verify browser console for errors
# Test Overpass API availability:
curl https://overpass.private.coffee/api/status
```

**Plan generation fails**
```bash
# Check browser console for errors
# Verify web worker files exist:
ls -la static/js/osm/
ls -la static/js/conrec/
```

**Docker issues**
```bash
# Check Docker logs
docker-compose logs app

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Development Issues

**TypeScript errors**
```bash
pnpm check
```

**Translation errors**
```bash
pnpm run paraglide:compile
```

**Build errors**
```bash
# Clear Vite cache
rm -rf .svelte-kit
pnpm build
```

## 🌍 Deployment Options

### 1. Simple VPS Deployment

```bash
# On your server
git clone <your-repo>
cd src
cp .env.example .env
# Edit .env as needed

pnpm run setup
pnpm build
pm2 start build/index.js --name city-plan-generator
```

### 2. Docker Deployment

```bash
# Single container
docker build -t city-plan-generator .
docker run -p 3000:3000 city-plan-generator

# With docker-compose (recommended)
docker-compose up -d
```

### 3. Platform Deployments

- **Vercel**: Connect GitHub repo, set build command to `pnpm build`
- **Railway**: Connect GitHub repo, auto-deploys from pushes
- **DigitalOcean**: Use App Platform with Node.js runtime
- **AWS**: Deploy to ECS, Elastic Beanstalk, or EC2

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed platform-specific instructions.

## 📊 Monitoring & Analytics

### Health Monitoring

```bash
# Check application health
curl http://localhost:3000/api/health

# Response includes:
# - Application status
# - Uptime information
# - External API status
# - Memory usage
```

### Analytics Dashboard

```bash
# View download statistics
curl http://localhost:3000/api/analytics/count

# Response includes:
# - Total download count
# - Last update timestamp
```

### Log Monitoring

```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs city-plan-generator

# Application logs are structured JSON for easy parsing
```

## 🚀 What's Next?

Your city plan generator is now production-ready! Here's what you can do:

### Immediate Use
- ✅ **Generate Plans**: Create DXF, SVG, and PDF city plans
- ✅ **Share with Users**: Deploy and share your application
- ✅ **Monitor Usage**: Track downloads with built-in analytics

### Optional Enhancements
- 🔧 **Custom Styling**: Modify colors and layer styles in the web worker
- 🗃️ **Database Analytics**: Replace file-based analytics with PostgreSQL
- 🌐 **CDN Integration**: Serve static assets from a CDN
- 🔐 **SSL Certificate**: Add HTTPS with Let's Encrypt

### Advanced Features
- 📱 **Mobile App**: Convert to Progressive Web App (PWA)
- 🎨 **Custom Themes**: Add more color schemes and styles
- 📊 **Advanced Analytics**: Add more detailed usage tracking
- 🌍 **More Languages**: Add support for additional languages

## 🤝 Support

If you encounter any issues:

1. **Check the logs** for error messages
2. **Run the verification script**: `pnpm run verify`
3. **Check the troubleshooting section** above
4. **Review the deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

The application is designed to be resilient and will gracefully handle:
- ❌ Overpass API failures (automatic fallback)
- ❌ Height data API failures (contours disabled)
- ❌ Analytics failures (non-blocking)

---

**🎉 Congratulations! You now have a complete, production-ready city plan generator with real OSM data processing, multiple export formats, and privacy-first analytics.**