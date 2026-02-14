import Phaser from 'phaser';
import { type GameSocket, getSocket } from '../network';
import { GAME_CONFIG, type GameState, type PlayerState } from '../../shared/types';

interface ScoreEntry {
  name: string;
  score: number;
}

export class HudScene extends Phaser.Scene {
  private socket!: GameSocket;
  private scores = new Map<string, ScoreEntry>();
  private scoreTexts: Phaser.GameObjects.Text[] = [];
  private headerText!: Phaser.GameObjects.Text;
  private panelBg!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'HudScene' });
  }

  create(): void {
    this.socket = getSocket();

    this.panelBg = this.add.graphics();
    this.drawPanel();

    this.headerText = this.add.text(GAME_CONFIG.WORLD_WIDTH - 190, 15, 'SCOREBOARD', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    });

    this.socket.on('game:state', (state: GameState) => {
      for (const [id, player] of Object.entries(state.players)) {
        this.scores.set(id, { name: player.name, score: player.score });
      }
      this.updateScoreboard();
    });

    this.socket.on('player:joined', (player: PlayerState) => {
      this.scores.set(player.id, { name: player.name, score: player.score });
      this.updateScoreboard();
    });

    this.socket.on('player:left', (playerId: string) => {
      this.scores.delete(playerId);
      this.updateScoreboard();
    });

    this.socket.on('player:scored', ({ id, score }) => {
      const entry = this.scores.get(id);
      if (entry !== undefined) {
        entry.score = score;
        this.updateScoreboard();
      }
    });
  }

  private drawPanel(): void {
    this.panelBg.clear();
    this.panelBg.fillStyle(0x0f3460, 0.85);
    this.panelBg.fillRoundedRect(GAME_CONFIG.WORLD_WIDTH - 200, 5, 195, 30 + this.scores.size * 24, 6);
  }

  private updateScoreboard(): void {
    for (const t of this.scoreTexts) {
      t.destroy();
    }
    this.scoreTexts = [];

    const sorted = [...this.scores.entries()].sort((a, b) => b[1].score - a[1].score);

    this.drawPanel();

    for (const [[, entry], i] of sorted.map((item, index) => [item, index] as const)) {
      const text = this.add.text(
        GAME_CONFIG.WORLD_WIDTH - 190,
        38 + i * 24,
        `${String(i + 1)}. ${entry.name}: ${String(entry.score)}`,
        {
          fontSize: '13px',
          fontFamily: 'monospace',
          color: i === 0 ? '#ffdd44' : '#ffffff',
        },
      );
      this.scoreTexts.push(text);
    }
  }
}
