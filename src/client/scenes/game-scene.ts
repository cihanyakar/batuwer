import Phaser from 'phaser';
import { type GameSocket, getSocket, sendInput } from '../network';
import { type Collectible, GAME_CONFIG, type GameState, type PlayerInput, type PlayerState } from '../../shared/types';

interface PlayerSprite {
  body: Phaser.GameObjects.Arc;
  nameLabel: Phaser.GameObjects.Text;
  scoreLabel: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private socket!: GameSocket;
  private players = new Map<string, PlayerSprite>();
  private collectibles = new Map<string, Phaser.GameObjects.Arc>();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private lastInput: PlayerInput = { left: false, right: false, up: false, down: false };

  constructor() {
    super({ key: 'GameScene' });
  }

  update(): void {
    const input: PlayerInput = {
      left: this.cursors.left.isDown || this.wasd.A.isDown,
      right: this.cursors.right.isDown || this.wasd.D.isDown,
      up: this.cursors.up.isDown || this.wasd.W.isDown,
      down: this.cursors.down.isDown || this.wasd.S.isDown,
    };

    if (
      input.left !== this.lastInput.left ||
      input.right !== this.lastInput.right ||
      input.up !== this.lastInput.up ||
      input.down !== this.lastInput.down
    ) {
      sendInput(input);
      this.lastInput = { ...input };
    }

    for (const sprite of this.players.values()) {
      const glow = sprite.body.getData('glow') as Phaser.GameObjects.Arc | undefined;
      if (glow !== undefined) {
        glow.setPosition(sprite.body.x, sprite.body.y);
      }
    }
  }

  create(): void {
    this.socket = getSocket();
    this.drawBackground();
    this.setupInput();
    this.setupSocketListeners();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();

    graphics.lineStyle(1, 0x16213e, 0.5);
    for (let x = 0; x <= GAME_CONFIG.WORLD_WIDTH; x += 40) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, GAME_CONFIG.WORLD_HEIGHT);
    }
    for (let y = 0; y <= GAME_CONFIG.WORLD_HEIGHT; y += 40) {
      graphics.moveTo(0, y);
      graphics.lineTo(GAME_CONFIG.WORLD_WIDTH, y);
    }
    graphics.strokePath();

    graphics.lineStyle(3, 0xe94560, 1);
    graphics.strokeRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
  }

  private setupInput(): void {
    const { keyboard } = this.input;
    if (keyboard === null) {
      throw new Error('Keyboard input not available');
    }
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  private setupSocketListeners(): void {
    this.socket.on('game:state', (state: GameState) => {
      for (const player of Object.values(state.players)) {
        this.addPlayerSprite(player);
      }
      for (const collectible of state.collectibles) {
        this.addCollectibleSprite(collectible);
      }
    });

    this.socket.on('player:joined', (player: PlayerState) => {
      this.addPlayerSprite(player);
    });

    this.socket.on('player:left', (playerId: string) => {
      this.removePlayerSprite(playerId);
    });

    this.socket.on('player:moved', ({ id, x, y }) => {
      const sprite = this.players.get(id);
      if (sprite !== undefined) {
        sprite.body.setPosition(x, y);
        sprite.nameLabel.setPosition(x, y - GAME_CONFIG.PLAYER_RADIUS - 20);
        sprite.scoreLabel.setPosition(x, y + GAME_CONFIG.PLAYER_RADIUS + 10);
      }
    });

    this.socket.on('player:scored', ({ id, score }) => {
      const sprite = this.players.get(id);
      if (sprite !== undefined) {
        sprite.scoreLabel.setText(String(score));
      }
      this.events.emit('score:update', { id, score });
    });

    this.socket.on('collectible:spawned', (collectible: Collectible) => {
      this.addCollectibleSprite(collectible);
    });

    this.socket.on('collectible:collected', (collectibleId: string) => {
      this.removeCollectibleSprite(collectibleId);
    });
  }

  private addPlayerSprite(player: PlayerState): void {
    if (this.players.has(player.id)) {
      return;
    }

    const body = this.add.circle(player.x, player.y, GAME_CONFIG.PLAYER_RADIUS, player.color);
    body.setStrokeStyle(2, 0xffffff, 0.8);

    const glow = this.add.circle(player.x, player.y, GAME_CONFIG.PLAYER_RADIUS + 4, player.color, 0.2);
    body.setData('glow', glow);

    const nameLabel = this.add.text(player.x, player.y - GAME_CONFIG.PLAYER_RADIUS - 20, player.name, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const scoreLabel = this.add.text(player.x, player.y + GAME_CONFIG.PLAYER_RADIUS + 10, String(player.score), {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.players.set(player.id, { body, nameLabel, scoreLabel });
  }

  private removePlayerSprite(playerId: string): void {
    const sprite = this.players.get(playerId);
    if (sprite !== undefined) {
      const glow = sprite.body.getData('glow') as Phaser.GameObjects.Arc | undefined;
      glow?.destroy();
      sprite.body.destroy();
      sprite.nameLabel.destroy();
      sprite.scoreLabel.destroy();
      this.players.delete(playerId);
    }
  }

  private addCollectibleSprite(collectible: Collectible): void {
    if (this.collectibles.has(collectible.id)) {
      return;
    }

    const colors = [0xffdd44, 0x44ffdd, 0xff44dd];
    const color = colors[collectible.value - 1] ?? 0xffdd44;

    const orb = this.add.circle(collectible.x, collectible.y, GAME_CONFIG.COLLECTIBLE_RADIUS, color);
    orb.setStrokeStyle(1, 0xffffff, 0.6);

    this.tweens.add({
      targets: orb,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.collectibles.set(collectible.id, orb);
  }

  private removeCollectibleSprite(collectibleId: string): void {
    const orb = this.collectibles.get(collectibleId);
    if (orb !== undefined) {
      this.tweens.add({
        targets: orb,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          orb.destroy();
        },
      });
      this.collectibles.delete(collectibleId);
    }
  }
}
