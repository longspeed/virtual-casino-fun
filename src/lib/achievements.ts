/**
 * Achievement System
 * Tracks player achievements and progress
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'wins' | 'bets' | 'streaks' | 'milestones' | 'special';
  requirement: number;
  reward?: number; // Optional credit reward
}

export const ACHIEVEMENTS: Achievement[] = [
  // Win Achievements
  {
    id: 'first-win',
    name: 'First Win',
    description: 'Win your first game',
    icon: '🎉',
    category: 'wins',
    requirement: 1,
    reward: 100,
  },
  {
    id: 'lucky-7',
    name: 'Lucky 7',
    description: 'Get three 7s in slots',
    icon: '7️⃣',
    category: 'wins',
    requirement: 1,
    reward: 500,
  },
  {
    id: 'jackpot-hunter',
    name: 'Jackpot Hunter',
    description: 'Hit the diamond jackpot in slots',
    icon: '💎',
    category: 'wins',
    requirement: 1,
    reward: 1000,
  },
  {
    id: 'big-win',
    name: 'Big Winner',
    description: 'Win 10,000 credits in a single game',
    icon: '💰',
    category: 'wins',
    requirement: 1,
    reward: 2000,
  },
  
  // Bet Achievements
  {
    id: 'high-roller',
    name: 'High Roller',
    description: 'Place a bet of 5,000 or more',
    icon: '🎰',
    category: 'bets',
    requirement: 1,
    reward: 500,
  },
  {
    id: 'veteran',
    name: 'Veteran Player',
    description: 'Play 100 games',
    icon: '🏆',
    category: 'bets',
    requirement: 100,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Play 500 games',
    icon: '⭐',
    category: 'bets',
    requirement: 500,
  },
  
  // Streak Achievements
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    description: 'Win 5 games in a row',
    icon: '🔥',
    category: 'streaks',
    requirement: 5,
    reward: 1000,
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: 'Win 10 games in a row',
    icon: '🔥🔥',
    category: 'streaks',
    requirement: 10,
    reward: 5000,
  },
  
  // Milestone Achievements
  {
    id: 'balance-10k',
    name: 'Ten Thousandaire',
    description: 'Reach 10,000 credits',
    icon: '💵',
    category: 'milestones',
    requirement: 1,
  },
  {
    id: 'balance-50k',
    name: 'Fifty Thousandaire',
    description: 'Reach 50,000 credits',
    icon: '💴',
    category: 'milestones',
    requirement: 1,
  },
  {
    id: 'balance-100k',
    name: 'Hundred Thousandaire',
    description: 'Reach 100,000 credits',
    icon: '💶',
    category: 'milestones',
    requirement: 1,
    reward: 5000,
  },
  
  // Special Achievements
  {
    id: 'blackjack-master',
    name: 'Blackjack Master',
    description: 'Win 10 blackjack games',
    icon: '🃏',
    category: 'special',
    requirement: 10,
    reward: 1500,
  },
  {
    id: 'roulette-king',
    name: 'Roulette King',
    description: 'Win 10 roulette games',
    icon: '🎲',
    category: 'special',
    requirement: 10,
    reward: 1500,
  },
];

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export function checkAchievements(
  progress: AchievementProgress[],
  stats: {
    totalWins: number;
    totalGames: number;
    currentBalance: number;
    currentStreak: number;
    biggestWin: number;
    biggestBet: number;
    gameWins: Record<string, number>;
    specialEvents: Record<string, number>;
  }
): AchievementProgress[] {
  const updated = [...progress];
  
  for (const achievement of ACHIEVEMENTS) {
    const existing = updated.find(p => p.achievementId === achievement.id);
    let currentProgress = existing?.progress || 0;
    let unlocked = existing?.unlocked || false;
    
    if (unlocked) continue;
    
    switch (achievement.category) {
      case 'wins':
        if (achievement.id === 'first-win') {
          currentProgress = stats.totalWins >= 1 ? 1 : 0;
        } else if (achievement.id === 'big-win') {
          currentProgress = stats.biggestWin >= 10000 ? 1 : 0;
        } else {
          currentProgress = stats.specialEvents[achievement.id] || 0;
        }
        break;
      case 'bets':
        if (achievement.id === 'high-roller') {
          currentProgress = stats.biggestBet >= 5000 ? 1 : 0;
        } else if (achievement.id === 'veteran') {
          currentProgress = Math.min(stats.totalGames, 100);
        } else if (achievement.id === 'dedicated') {
          currentProgress = Math.min(stats.totalGames, 500);
        }
        break;
      case 'streaks':
        currentProgress = Math.min(stats.currentStreak, achievement.requirement);
        break;
      case 'milestones':
        if (achievement.id === 'balance-10k') {
          currentProgress = stats.currentBalance >= 10000 ? 1 : 0;
        } else if (achievement.id === 'balance-50k') {
          currentProgress = stats.currentBalance >= 50000 ? 1 : 0;
        } else if (achievement.id === 'balance-100k') {
          currentProgress = stats.currentBalance >= 100000 ? 1 : 0;
        }
        break;
      case 'special':
        if (achievement.id === 'blackjack-master') {
          currentProgress = Math.min(stats.gameWins.blackjack || 0, 10);
        } else if (achievement.id === 'roulette-king') {
          currentProgress = Math.min(stats.gameWins.roulette || 0, 10);
        }
        break;
    }
    
    if (currentProgress >= achievement.requirement && !unlocked) {
      unlocked = true;
    }
    
    if (existing) {
      existing.progress = currentProgress;
      existing.unlocked = unlocked;
      if (unlocked && !existing.unlockedAt) {
        existing.unlockedAt = new Date();
      }
    } else {
      updated.push({
        achievementId: achievement.id,
        progress: currentProgress,
        unlocked,
        unlockedAt: unlocked ? new Date() : undefined,
      });
    }
  }
  
  return updated;
}

