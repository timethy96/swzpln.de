# Deployment Guide - City Plan Generator

This guide covers deploying the modernized SWZPLN/OpenCityPlans application to production.

## 🚀 Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- Domain name pointed to your server
- SSL certificates (optional but recommended)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd src

# Copy environment configuration
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Configure Environment

Update `.env` with your production settings:

```env
NODE_ENV=production
PORT=3000

# Domains
PRIMARY_DOMAIN=swzpln.de
ENGLISH_DOMAIN=opencityplans.com

# Enable analytics
ENABLE_ANALYTICS=true

# Add your API keys if using external services
HEIGHT_API_KEY=your_key_here
GOOGLE_ANALYTICS_ID=your_ga_id
```

### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Check health
curl http://localhost:3000/api/health
```

## 🛠 Manual Deployment

### Prerequisites

- Node.js 20+
- pnpm
- Process manager (PM2 recommended)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Application

```bash
# Compile translations
npx @inlang/paraglide-js compile --project ./project.inlang

# Build for production
pnpm build
```

### 3. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'city-plan-generator',
    script: 'build/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## 🌐 Platform-Specific Deployments

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Railway

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically build and deploy

### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure build settings:
   - Build Command: `pnpm build`
   - Run Command: `node build`
3. Set environment variables
4. Deploy

### AWS (with Docker)

```bash
# Build and tag image
docker build -t city-plan-generator .
docker tag city-plan-generator:latest your-ecr-repo/city-plan-generator:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-ecr-repo
docker push your-ecr-repo/city-plan-generator:latest

# Deploy to ECS or Elastic Beanstalk
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | No | Application port | `3000` |
| `PRIMARY_DOMAIN` | No | Primary domain for language detection | `swzpln.de` |
| `ENGLISH_DOMAIN` | No | English domain | `opencityplans.com` |
| `ENABLE_ANALYTICS` | No | Enable usage analytics | `true` |
| `HEIGHT_API_KEY` | No | External height data API key | - |
| `GOOGLE_ANALYTICS_ID` | No | Google Analytics tracking ID | - |

### Nginx Configuration (Optional)

Create `nginx.conf` for reverse proxy:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name swzpln.de opencityplans.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name swzpln.de opencityplans.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 📊 Monitoring

### Health Checks

The application provides health check endpoints:

```bash
# Basic health check
curl http://localhost:3000/api/health

# Analytics status
curl http://localhost:3000/api/analytics/count
```

### Logging

Logs are available through:

- Docker: `docker-compose logs -f app`
- PM2: `pm2 logs city-plan-generator`
- Files: `./logs/` directory

### Monitoring Services

Consider integrating with:

- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Analytics**: Google Analytics, Mixpanel
- **Performance**: New Relic, DataDog

## 🔒 Security

### SSL/TLS

Always use HTTPS in production:

```bash
# Get free SSL certificate with Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d swzpln.de -d opencityplans.com
```

### Security Headers

Configure security headers in your reverse proxy:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### Rate Limiting

The application includes built-in rate limiting. Configure in `.env`:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚨 Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep NODE_ENV
```

**Map layers not loading**
```bash
# Check Overpass API status
curl https://overpass.private.coffee/api/status

# Test height data API
curl "http://localhost:3000/api/heights?north=52&west=13&south=51&east=14"
```

**Plan generation fails**
```bash
# Check web worker files
ls -la static/js/osm/

# Verify browser console for errors
```

### Performance Optimization

1. **Enable compression** in reverse proxy
2. **Use CDN** for static assets
3. **Configure caching** headers
4. **Monitor memory usage** and scale horizontally

### Database Migration (Optional)

If adding database support:

```sql
-- Create analytics table
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    client_ip INET,
    metadata JSONB
);

-- Create indexes
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX idx_analytics_type ON analytics(type);
```

## 📝 Maintenance

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build app
docker-compose up -d app

# Or with PM2
pnpm build
pm2 restart city-plan-generator
```

### Backup

Important data to backup:
- Environment configuration (`.env`)
- SSL certificates
- Analytics database (if using)
- Application logs

### Scaling

For high traffic:

1. **Horizontal scaling**: Run multiple instances behind load balancer
2. **Database**: Move analytics to external database
3. **Caching**: Use Redis for session/response caching
4. **CDN**: Serve static assets from CDN

## 📞 Support

For deployment issues:

1. Check the [README.md](./README.md) for development setup
2. Review application logs
3. Test health check endpoints
4. Verify external API connectivity

The application is designed to be resilient and will gracefully handle:
- Overpass API failures (automatic fallback)
- Height data API failures (contours disabled)
- Analytics failures (non-blocking)

For production support, monitor the health check endpoint and set up alerts for any service degradation.