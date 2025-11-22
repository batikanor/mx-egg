# Tactical Football 2D

A real-time tactical football simulation game built with Next.js, React, and TypeScript. Control your team's positioning using a 3x3 tactical grid while the AI controls all player movements.

## Features

- Real-time physics simulation
- Tactical command system with 9-sector grid
- Dynamic player positioning and AI
- Score tracking and match states
- Adjustable simulation speed
- Pause/resume functionality
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
```

Run production build locally:

```bash
npm start
```

## Deployment to Vercel

### Method 1: Deploy via Vercel CLI

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Deploy from your project directory:
```bash
vercel
```

3. Follow the prompts to link your project

4. For production deployment:
```bash
vercel --prod
```

### Method 2: Deploy via Vercel Dashboard

1. Push your code to GitHub:
```bash
git push origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "New Project"

4. Import your GitHub repository

5. Vercel will auto-detect Next.js settings

6. Click "Deploy"

Your app will be live in minutes!

### Method 3: Deploy via GitHub Integration

1. Connect your GitHub account to Vercel

2. Push code to your repository

3. Vercel will automatically deploy on every push to main

## Project Structure

```
football-2d/
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── TacticalFootball.tsx  # Main game component
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── vercel.json          # Vercel deployment configuration
```

## How to Play

1. The game starts automatically with both teams positioned on the field
2. Click any sector on the tactical grid to assign a player to defend/attack that zone
3. Assigned players (shown in amber) will move to and maintain position in their sector
4. Use the speed slider to adjust simulation speed
5. Pause/resume using the play/pause button
6. Goals trigger automatic reset sequences

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Runtime:** React 19

## Configuration

The game uses these configuration files:

- `vercel.json` - Vercel deployment settings
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS customization
- `tsconfig.json` - TypeScript compiler options

## Environment Variables

No environment variables required for basic deployment.

## License

ISC
