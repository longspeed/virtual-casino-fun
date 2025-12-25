/**
 * Audio System
 * Handles sound effects and background music
 */

class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private volume: number = 0.5;
  private musicVolume: number = 0.3;

  constructor() {
    // Initialize with Web Audio API for low-latency playback
    this.loadSounds();
  }

  private loadSounds() {
    // Create audio elements for different sound effects
    // Note: In a real implementation, you would load actual audio files
    // For now, we'll use Web Audio API to generate sounds
    
    // Win sounds (escalating)
    this.createSound('win-small', this.generateTone(440, 0.1, 'sine'));
    this.createSound('win-medium', this.generateTone(523, 0.15, 'sine'));
    this.createSound('win-big', this.generateTone(659, 0.2, 'sine'));
    this.createSound('win-jackpot', this.generateTone(880, 0.3, 'sine'));
    
    // Loss sound
    this.createSound('loss', this.generateTone(220, 0.1, 'sawtooth'));
    
    // Button click
    this.createSound('click', this.generateTone(800, 0.05, 'square'));
    
    // Spin/roll sounds
    this.createSound('spin', this.generateTone(300, 0.2, 'sawtooth'));
    this.createSound('roll', this.generateTone(400, 0.15, 'sawtooth'));
    
    // Card deal
    this.createSound('card-deal', this.generateTone(600, 0.08, 'sine'));
    
    // Achievement unlock
    this.createSound('achievement', this.generateTone(880, 0.25, 'sine'));
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType): string {
    // Generate a data URL for a simple tone
    // In production, use actual audio files
    return `data:audio/wav;base64,`; // Placeholder
  }

  private createSound(name: string, src: string) {
    const audio = new Audio();
    audio.src = src;
    audio.volume = this.volume;
    audio.preload = 'auto';
    this.sounds.set(name, audio);
  }

  playSound(name: string, volume: number = 1) {
    if (!this.soundEnabled) return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      const audio = sound.cloneNode() as HTMLAudioElement;
      audio.volume = this.volume * volume;
      audio.play().catch(() => {
        // Ignore errors (e.g., user hasn't interacted with page)
      });
    }
  }

  playWinSound(amount: number, bet: number) {
    const multiplier = amount / bet;
    if (multiplier >= 100) {
      this.playSound('win-jackpot', 1);
    } else if (multiplier >= 10) {
      this.playSound('win-big', 0.9);
    } else if (multiplier >= 3) {
      this.playSound('win-medium', 0.8);
    } else {
      this.playSound('win-small', 0.7);
    }
  }

  playLossSound() {
    this.playSound('loss', 0.5);
  }

  playClickSound() {
    this.playSound('click', 0.3);
  }

  playSpinSound() {
    this.playSound('spin', 0.4);
  }

  playRollSound() {
    this.playSound('roll', 0.4);
  }

  playCardDealSound() {
    this.playSound('card-deal', 0.5);
  }

  playAchievementSound() {
    this.playSound('achievement', 1);
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled && this.backgroundMusic) {
      this.backgroundMusic.play().catch(() => {});
    } else if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }
}

export const audioManager = new AudioManager();

