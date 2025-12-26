# Virtual Casino Fun

An educational virtual casino simulation built with React, TypeScript, and Vite.

## Project Description

Virtual Casino Fun is a virtual casino simulation designed for educational purposes to understand casino game mechanics and their underlying systems. The project demonstrates how casino games work, including random number generation, game logic, and player interaction patterns. It uses seeded random number generation (Mulberry32 algorithm) for reproducible and auditable results, making it suitable for studying game mechanics and probability.

## Features

- **Four Casino Games:**
  - **Slots** - Slot machine game with near-miss mechanics
  - **Dice** - Multiplier-based dice rolling game
  - **Roulette** - European-style roulette wheel
  - **Blackjack** - Card game with card counting capabilities

- **Seeded Random Number Generation** - Uses Mulberry32 algorithm for reproducible results
- **Achievement System** - Progress tracking with unlockable achievements
- **Daily Bonus System** - Daily rewards for returning players
- **Admin Panel** - Game configuration and management interface
- **Persistent State** - LocalStorage-based state persistence
- **Responsive UI** - Modern interface built with shadcn/ui components

## ⚠️ Ethical Disclaimer

**IMPORTANT WARNING:** This project implements psychological manipulation techniques commonly used in real gambling establishments. These mechanics are included for educational purposes to demonstrate how casinos manipulate player psychology and encourage continued play.

**Specific Disclosures:**

- **Near-Miss Mechanics:** Approximately 18% of losing spins in the slot machine game display "almost winning" combinations (e.g., two matching symbols with a third just missing). This is intentionally designed to create the illusion of being close to winning, which encourages players to continue betting.

- **Variable Payout Delays:** The game implements differential timing for wins and losses:
  - Wins are delayed by 300ms
  - Losses are processed after 100ms
  
  This timing difference is designed to encourage rapid re-betting by making losses feel faster and wins feel more rewarding, creating a psychological incentive to continue playing.

**Educational Purpose:** These mechanics are included to provide transparency about how gambling systems work and to serve as a learning resource for understanding the psychological techniques used in the gambling industry.

**Recommendation:** Any fork or derivative of this project should either remove these psychological manipulation mechanics or clearly disclose them to users. Users should be aware that these techniques are designed to encourage continued play and can contribute to problematic gambling behaviors.

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Navigation and routing
- **Context API** - State management

## Setup Instructions

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd virtual-casino-fun
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```
   or
   ```sh
   bun install
   ```

3. **Run development server**
   ```sh
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or the port shown in the terminal).

4. **Build for production**
   ```sh
   npm run build
   ```

5. **Preview production build**
   ```sh
   npm run preview
   ```

## Project Structure

- `src/pages/` - Game pages (Slots, Dice, Roulette, Blackjack, Admin)
- `src/lib/` - Core game logic, RNG, achievements
- `src/context/` - Casino state management
- `src/components/` - Reusable UI components

## License

All Rights Reserved

## Contributing

This is a personal/educational project and not accepting contributions.
