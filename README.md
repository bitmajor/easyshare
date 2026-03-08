# EasyShare TV

A fullstack Next.js App Router application for a TV/mobile resource sharing system. It allows a TV to display an auto-refreshing QR code, which users can scan with their phone to pair and immediately push temporary or permanent links to the TV screen in real-time.

## Features

- **TV Auto-Registration**: TVs securely register themselves and receive a long-lived session cookie.
- **Dynamic QR Pairing**: A QR code with a 3-minute expiry refreshes automatically.
- **Mobile Management**: Scanning the QR grants a 30-minute manager session for that specific TV display.
- **Real-time Link Pushing**: Managers can add and remove links, with configurable auto-expiry (1 min, 5 mins, 30 mins, or non-expiring).
- **Responsive Modern UI**: Built with Tailwind CSS and Lucide React icons, featuring a sleek dark-mode interface.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`)
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react`
- **QR Codes**: `qrcode.react`
- **Time/Dates**: `date-fns`

## Architecture Notes

### Database Schema
1. **`devices`**: Tracks TV instances using a long-lived secure token.
2. **`pair_tokens`**: Short-lived (3 mins) codes hashed and stored, shown on the TV as QR codes.
3. **`manager_sessions`**: Medium-lived (30 mins) sessions for a mobile user to manage a specific TV safely.
4. **`links`**: URLs shared to the TV. Includes title, URL, and a calculated `expires_at` timestamp.

### Security
- **Hashes**: All tokens are generated cleanly but ONLY stored as SHA-256 hashes in the database.
- **Auth Guards**: Middleware ensures `/manage` paths require a valid, non-expired manager session cookie.

### Data Flow (Polling)
- The TV client polls `/api/tv/links` every 3 seconds to fetch active, non-expired links.
- When expired links pass their `expires_at` threshold, the API naturally filters them out. Soft-deletion is used for manual removals.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file containing your Neon Database connection URL:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

3. **Run Migrations**:
   Run the migration script to configure your database schema automatically:
   ```bash
   npx tsx src/scripts/migrate.ts
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Usage**:
   - Open `http://localhost:3000` to view the TV display simulator.
   - Use your phone (or a new incognito window) to scan the QR code or visit the `http://localhost:3000/pair/...` URL.
   - Push links from the management dashboard and watch them appear instantly on the TV screen.
