# City Plan Generator (SWZPLN / OpenCityPlans)

A modern web application for generating Schwarzpläne (black plans) and city plans from OpenStreetMap data. Built with SvelteKit, Tailwind CSS, and ParaglideJS for internationalization.

## Features

- 🗺️ **Interactive Map**: Powered by Leaflet with OpenStreetMap tiles
- 🌍 **Multi-language Support**: German and English using ParaglideJS
- 🌙 **Dark Mode**: Automatic dark mode based on time or manual toggle
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Multiple Export Formats**: DXF, SVG, and PDF
- 🔧 **Layer Control**: Toggle different map layers (buildings, green spaces, water, etc.)
- 🔍 **Location Search**: Search for any location using Nominatim API
- 🍪 **Privacy-First**: Minimal data collection with explicit consent
- ⚡ **Modern Stack**: Built with Svelte 5, Tailwind CSS 4, and TypeScript

## Technology Stack

- **Framework**: SvelteKit 2.x
- **Styling**: Tailwind CSS 4.x
- **Internationalization**: ParaglideJS
- **Maps**: Leaflet
- **Icons**: Lucide Svelte
- **Language**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte      # Main layout with i18n setup
│   │   └── +page.svelte        # Main application page
│   ├── lib/
│   │   └── utils/
│   │       ├── mapUtils.ts     # Map utility functions
│   │       └── planGenerator.ts # Plan generation logic
│   ├── paraglide/              # Generated i18n files
│   └── app.css                 # Global styles
├── messages/
│   ├── de.json                 # German translations
│   └── en.json                 # English translations
├── static/                     # Static assets
└── project.inlang/             # Inlang configuration
```

## Features Overview

### Map Functionality
- Interactive Leaflet map with OpenStreetMap tiles
- Location search using Nominatim API
- Position persistence in localStorage
- Zoom level validation for plan generation

### Plan Generation
- Support for DXF, SVG, and PDF formats
- Layer-based filtering (buildings, green spaces, water, etc.)
- Progress tracking with visual feedback
- Web Worker-based processing (ready for integration)
- Error handling and user feedback

### Internationalization
- German (SWZPLN) and English (OpenCityPlans) support
- Domain-based language detection
- Browser language fallback
- All UI elements fully translated

### Dark Mode
- Automatic dark mode based on time (7 PM - 7 AM)
- Manual toggle with persistence
- Tailwind CSS dark mode classes
- Leaflet control styling for dark theme

### Privacy & Data Protection
- Explicit privacy consent before map loading
- Minimal data collection
- Essential cookies only
- Transparent data usage information

## Configuration

### Environment Variables

The application works without environment variables for development. For production, you may want to configure:

- API endpoints for plan generation
- Analytics tracking (optional)
- Error reporting (optional)

### Tailwind CSS

The project uses Tailwind CSS 4.x with custom configuration in `tailwind.config.js`:

- Dark mode support
- Custom color palette
- Animation utilities
- Font configuration

### Internationalization

Translations are managed using ParaglideJS:

1. Edit messages in `messages/de.json` and `messages/en.json`
2. Run compilation: `npx @inlang/paraglide-js compile --project ./project.inlang`
3. Import and use translations in Svelte components

## Deployment

The application can be deployed to any Node.js hosting platform:

1. Build the application: `pnpm build`
2. Deploy the `build` directory
3. Configure your server to handle SvelteKit routing

### Recommended Platforms

- Vercel
- Netlify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](../LICENSE) file for details.

## Acknowledgments

- Original SWZPLN project by Timo Bilhöfer
- The MoM Studio for support
- OpenStreetMap contributors
- Leaflet.js community
- Svelte and SvelteKit teams
