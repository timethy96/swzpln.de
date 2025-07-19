# City Plan Generator (SWZPLN/OpenCityPlans)

A modern, production-ready web application for generating architectural city plans (Schwarzpläne) from OpenStreetMap data. Built with the latest web technologies while preserving all original functionality.

![City Plan Generator](./static/favicon.svg)

## 🌟 Features

### ✅ **Complete Plan Generation**
- **Real OSM Data**: Direct integration with Overpass API for live map data
- **Multiple Formats**: Export as DXF, SVG, and PDF formats
- **Client-Side Processing**: Uses Web Workers for non-blocking plan generation
- **Real Contour Lines**: Elevation data from OpenTopoData API with Conrec library
- **Layer Support**: Buildings, green spaces, water, forest, roads, railways, farmland
- **Progress Tracking**: Real-time progress updates during generation

### ✅ **Interactive Map Interface**
- **Live Map Layers**: Real-time visualization of OSM data layers
- **Location Search**: Powered by Nominatim API with autocomplete
- **Layer Toggle**: Interactive control of visible map layers
- **Map State Persistence**: Saves position and zoom level
- **Responsive Design**: Mobile-optimized touch interface

### ✅ **Modern Technology Stack**
- **Svelte 5** + SvelteKit 2 - Latest version with modern reactivity
- **Tailwind CSS 4** - Latest utility-first CSS framework
- **TypeScript** - Full type safety throughout the application
- **ParaglideJS** - Compile-time internationalization
- **Leaflet** - Interactive map library with dynamic imports
- **Web Workers** - Client-side plan generation with real libraries

### ✅ **Internationalization (i18n)**
- **Dual Language**: German and English support
- **Domain-Based Language Detection**: swzpln.de (German) / opencityplans.com (English)
- **Compile-Time Optimization**: ParaglideJS for optimized translations
- **Dark Mode**: System preference detection with manual toggle

### ✅ **Privacy & Analytics**
- **Maximum Anonymity**: Only tracks download counts (no personal data)
- **GDPR Compliant**: Privacy consent with detailed explanations
- **Minimal Analytics**: Simple file-based counter with concurrent safety
- **No Tracking**: No cookies, session data, or user identification

### ✅ **Production Ready**
- **Docker Support**: Complete containerization with multi-stage builds
- **Health Monitoring**: API endpoints for uptime and status checks
- **Error Handling**: Comprehensive error recovery and user feedback
- **Rate Limiting**: Built-in protection against abuse
- **Security**: Modern security headers and HTTPS support

## 🚀 Quick Start

### Development

```bash
# Clone the repository
git clone <your-repo-url>
cd src

# Install dependencies
pnpm install

# Compile translations
pnpm run paraglide:compile

# Start development server
pnpm dev
```

### Production Deployment

```bash
# Using Docker Compose (Recommended)
cp .env.example .env
# Edit .env with your settings
docker-compose up -d

# Manual deployment
pnpm build
pnpm preview
```

## 🏗 Architecture

### Frontend Stack
- **Svelte 5**: Component framework with modern reactivity
- **SvelteKit**: Full-stack framework with SSR support  
- **Tailwind CSS**: Utility-first styling with custom design system
- **TypeScript**: Type safety and enhanced developer experience
- **Vite**: Fast build tool with optimized bundling

### Backend Services
- **SvelteKit API Routes**: Server-side functionality
- **Height Data API**: Elevation data with real and mock sources
- **Analytics API**: Anonymous download tracking
- **Health Check API**: Monitoring and uptime tracking

### Data Sources
- **Overpass API**: Live OpenStreetMap data with fallback servers
- **OpenTopoData**: Real elevation data for contour generation
- **Nominatim**: Location search and geocoding

### Client-Side Processing
- **Web Workers**: Non-blocking plan generation
- **Conrec Library**: Real contour line generation
- **Real-Time Progress**: Live updates during processing
- **File Generation**: DXF, SVG, PDF export capabilities

## 📁 Project Structure

```
src/
├── src/                          # SvelteKit application
│   ├── routes/                   # Pages and API routes
│   │   ├── +layout.svelte       # Main layout with i18n & dark mode
│   │   ├── +page.svelte         # Main application page
│   │   └── api/                 # Server-side API endpoints
│   │       ├── analytics/       # Anonymous download tracking
│   │       ├── heights/         # Elevation data API
│   │       └── health/          # Health check endpoint
│   ├── lib/                     # Shared utilities
│   │   └── utils/               # Core functionality
│   │       ├── mapUtils.ts      # Map operations & state
│   │       ├── planGenerator.ts # Plan generation logic
│   │       └── mapLayers.ts     # Live map layer rendering
│   └── paraglide/               # Generated i18n files
├── static/                      # Static assets
│   ├── js/                      # JavaScript libraries
│   │   ├── conrec/             # Contour generation library
│   │   └── osm/                # OSM processing & web workers
│   └── *.svg                   # Icons and images
├── messages/                    # Translation source files
├── project.inlang/             # ParaglideJS configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # Production container
└── DEPLOYMENT.md               # Deployment guide
```

## 🔧 Configuration

### Environment Variables

Create `.env` from `.env.example`:

```env
NODE_ENV=production
PORT=3000

# Domain configuration for language detection
PRIMARY_DOMAIN=swzpln.de
ENGLISH_DOMAIN=opencityplans.com

# Enable minimal analytics
ENABLE_ANALYTICS=true

# Optional: Real elevation data API key
HEIGHT_API_KEY=your_opentopodata_key
```

### Layer Configuration

The application supports these map layers:

- **Buildings**: OSM building footprints (black)
- **Green**: Parks, meadows, allotments (green)
- **Water**: Rivers, lakes, waterways (blue)
- **Forest**: Forest and wood areas (dark green)
- **Land**: Farmland and agricultural areas (yellow)
- **Roads**: Streets and highways (gray)
- **Rails**: Railway lines (light gray, dashed)
- **Contours**: Elevation contour lines (light gray)

## 🌐 API Reference

### Height Data API

```bash
# Get elevation data for an area
POST /api/heights
Content-Type: application/json

{
  "north": 52.52,
  "west": 13.38,
  "south": 52.50,
  "east": 13.42,
  "resolution": 50
}
```

### Analytics API

```bash
# Track a download (anonymous)
POST /api/analytics/count
Content-Type: application/json

{
  "format": "svg"
}

# Get download statistics
GET /api/analytics/count
```

### Health Check

```bash
# Check application health
GET /api/health
```

## 🎯 Plan Generation Process

1. **Data Download**: Fetch live OSM data via Overpass API
2. **Height Data**: Get elevation data from OpenTopoData (with fallback)
3. **Layer Processing**: Filter and categorize OSM elements by type
4. **Coordinate Conversion**: Convert geographic coordinates to local projection
5. **Contour Generation**: Create elevation contours using Conrec library
6. **Format Generation**: Export as DXF, SVG, or PDF
7. **File Download**: Automatic download with analytics tracking

## 🚀 Performance

- **Client-Side Processing**: No server load for plan generation
- **Concurrent Workers**: Non-blocking UI during processing
- **Optimized Bundles**: Tree-shaking and code splitting
- **Lazy Loading**: Dynamic imports for large libraries
- **Caching**: Map state and layer data persistence
- **Compression**: Gzip and Brotli support

## 🔒 Security & Privacy

### Privacy Features
- **No Personal Data**: Zero collection of user information
- **No Cookies**: Session-less operation
- **Anonymous Analytics**: Only download counts tracked
- **GDPR Compliant**: Explicit consent with detailed privacy policy
- **Local Storage Only**: Map preferences stored locally

### Security Measures
- **Content Security Policy**: XSS protection
- **HTTPS Only**: Secure transport layer
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Sanitized user inputs
- **Error Handling**: No information leakage

## 📊 Monitoring

### Health Checks
```bash
# Application status
curl https://your-domain.com/api/health

# Download statistics
curl https://your-domain.com/api/analytics/count
```

### Logging
- **Structured Logs**: JSON format for easy parsing
- **Error Tracking**: Comprehensive error capture
- **Performance Metrics**: Response times and success rates
- **Analytics**: Anonymous usage statistics

## 🛠 Development

### Scripts

```bash
pnpm dev              # Development server
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm check            # Type checking
pnpm lint             # ESLint
pnpm format           # Prettier formatting
pnpm test             # Run tests
```

### Contributing

1. **Code Quality**: TypeScript, ESLint, Prettier
2. **Testing**: Unit tests with Vitest
3. **Documentation**: Comprehensive comments and README
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Performance**: Bundle analysis and optimization

## 🌍 Deployment

### Production Platforms

- **Docker**: Complete containerization with docker-compose
- **Vercel**: Automatic deployments from Git
- **Railway**: Simple container deployment
- **DigitalOcean**: App Platform or Droplet deployment
- **AWS**: ECS, Elastic Beanstalk, or EC2

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Scaling

- **Horizontal**: Multiple instances behind load balancer
- **Caching**: Redis for API responses and sessions
- **CDN**: Static asset distribution
- **Database**: PostgreSQL for persistent analytics

## 📈 Analytics & Usage

The application implements **privacy-first analytics**:

- ✅ **Download counts only** - No user tracking
- ✅ **Anonymous data** - No IP addresses or user agents
- ✅ **Minimal storage** - Simple file-based counter
- ✅ **GDPR compliant** - No personal data collection
- ✅ **Concurrent safe** - File locking for simultaneous users

## 🤝 Credits

- **Original SWZPLN**: Foundation and concept
- **OpenStreetMap**: Map data and community
- **Svelte Team**: Modern reactive framework
- **Tailwind CSS**: Utility-first styling
- **Leaflet**: Interactive mapping
- **Conrec**: Contour generation library
- **OpenTopoData**: Elevation data service

## 📄 License

[License information from original project]

---

**Built with ❤️ using modern web technologies while preserving the original vision of accessible, privacy-respecting city plan generation.**
