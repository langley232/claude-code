# StatsAI Electron App

A cross-platform desktop application for StatsAI - Intelligent Analytics Platform, built with Electron and following Aura design principles.

## Features

### 🎨 Aura-Inspired Design System
- **Glass-morphism Effects**: Backdrop blur with semi-transparent backgrounds
- **Vibrant Gradients**: Multi-color gradients (indigo, purple, cyan, emerald)
- **Interactive Elements**: Floating animations, hover transforms, dynamic backgrounds
- **Modern Typography**: Bold headings with gradient text effects and dramatic scaling
- **Fluid Components**: Rounded corners (16px+), subtle shadows, hover lift effects

### 🚀 Application Features
- **Responsive Navigation**: Logo, nav links, theme toggle, CTA buttons
- **Hero Section**: 100vh height with large headline positioned at lower left
- **Interactive Background**: AI-themed abstract backgrounds with floating particles
- **Features Grid**: Component-style cards showcasing platform capabilities
- **Analytics Demo**: Interactive dashboard with animated metrics
- **Complete Footer**: Multi-column layout with links and social icons

### ⚡ Technical Implementation
- **Framework**: Electron 28.0.0
- **Styling**: Custom CSS following Aura design guidelines
- **Icons**: Lucide React for consistent iconography
- **Animations**: CSS keyframes with JavaScript interactions
- **Performance**: Optimized for smooth 60fps animations
- **Security**: CSP headers and secure Electron configuration

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
# Navigate to the project directory
cd statsai-electron

# Install dependencies
npm install

# Start the development version
npm run dev

# Or run the production version
npm start
```

### Building for Distribution

```bash
# Build for current platform
npm run build

# Build for distribution
npm run dist
```

## Project Structure

```
statsai-electron/
├── src/
│   ├── main.js          # Electron main process
│   ├── index.html       # Application UI
│   ├── styles.css       # Aura-inspired styling
│   └── script.js        # Interactive JavaScript
├── assets/              # Application icons and assets
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Design Guidelines

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Purple**: #8b5cf6
- **Cyan**: #06b6d4
- **Emerald**: #10b981
- **Background**: #0f172a (Dark slate)
- **Surface**: #1e293b (Slate)

### Key Design Elements
- **Border Radius**: 12px+ for buttons, 16px+ for cards
- **Animations**: 300ms ease transitions
- **Spacing**: 24px+ gaps between components
- **Typography**: Inter font family with gradient text effects
- **Shadows**: Multi-layer shadows with glow effects

## Features Breakdown

### Navigation
- Fixed position with backdrop blur
- Theme toggle (light/dark variants)
- Smooth scroll navigation
- Responsive design

### Hero Section
- 100vh full-screen section
- Large typography (8rem+ font size)
- Gradient text effects
- Interactive CTA button with ripple effects

### Interactive Background
- Animated gradient backgrounds
- Floating particle elements
- Parallax scrolling effects
- Mouse interaction responses

### Feature Cards
- Glass-morphism design
- Hover lift animations
- Gradient icons
- Staggered entrance animations

### Analytics Dashboard
- Live metric animations
- Pulse indicators
- Responsive grid layout
- Smooth counter animations

## Development

### Running in Development Mode
```bash
npm run dev
```
This starts Electron with developer tools open and hot reload capabilities.

### Performance Monitoring
The app includes built-in FPS monitoring and performance metrics visible in development mode.

### Security Features
- Content Security Policy (CSP)
- Disabled node integration in renderer
- Context isolation enabled
- External link handling
- Protocol registration

## Browser Compatibility
The app uses modern web technologies and is optimized for Chromium-based rendering in Electron.

## Contributing
Follow the Aura design guidelines specified in the main project CLAUDE.md file when making modifications.

## License
MIT License - see package.json for details