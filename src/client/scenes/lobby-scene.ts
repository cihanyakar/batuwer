import Phaser from 'phaser';
import { connect, joinGame } from '../network';
import { GAME_CONFIG } from '../../shared/types';

export class LobbyScene extends Phaser.Scene {
  private nameChars: string[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private cursorBlink = true;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(): void {
    const cx = GAME_CONFIG.WORLD_WIDTH / 2;
    const cy = GAME_CONFIG.WORLD_HEIGHT / 2;

    // Title
    this.add.text(cx, cy - 160, 'BATUWER', {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 90, 'Multiplayer Arena', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#16213e',
    }).setOrigin(0.5);

    // Input box background (drawn with Phaser graphics)
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x0f3460, 1);
    inputBg.fillRoundedRect(cx - 200, cy - 30, 400, 50, 8);
    inputBg.lineStyle(2, 0xe94560);
    inputBg.strokeRoundedRect(cx - 200, cy - 30, 400, 50, 8);

    // Name label
    this.add.text(cx, cy - 55, 'Enter your name:', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Name text display
    this.nameText = this.add.text(cx - 185, cy - 15, '', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });

    // Blinking cursor
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.cursorBlink = !this.cursorBlink;
        this.updateNameDisplay();
      },
    });

    // Play button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xe94560, 1);
    btnBg.fillRoundedRect(cx - 100, cy + 50, 200, 50, 8);
    const btnZone = this.add.zone(cx, cy + 75, 200, 50).setInteractive({ useHandCursor: true });

    this.add.text(cx, cy + 75, 'PLAY', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff6b6b, 1);
      btnBg.fillRoundedRect(cx - 100, cy + 50, 200, 50, 8);
    });

    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xe94560, 1);
      btnBg.fillRoundedRect(cx - 100, cy + 50, 200, 50, 8);
    });

    btnZone.on('pointerdown', () => {
      this.startGame();
    });

    // Keyboard input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.startGame();
      } else if (event.key === 'Backspace') {
        this.nameChars.pop();
        this.updateNameDisplay();
      } else if (event.key.length === 1 && this.nameChars.length < 16) {
        this.nameChars.push(event.key);
        this.updateNameDisplay();
      }
    });

    // Instructions
    this.add.text(cx, cy + 150, 'Use WASD or Arrow keys to move', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#533483',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 175, 'Collect orbs to score points!', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#533483',
    }).setOrigin(0.5);
  }

  private updateNameDisplay(): void {
    const cursor = this.cursorBlink ? '|' : '';
    this.nameText.setText(this.nameChars.join('') + cursor);
  }

  private startGame(): void {
    const name = this.nameChars.join('').trim() !== '' ? this.nameChars.join('').trim() : 'Player';
    const gameSocket = connect();

    gameSocket.on('connect', () => {
      joinGame(name);
    });

    if (gameSocket.connected) {
      joinGame(name);
    }

    this.scene.start('GameScene', { socket: gameSocket, playerName: name });
    this.scene.start('HudScene', { socket: gameSocket });
  }
}
