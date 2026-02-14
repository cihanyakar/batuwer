import Phaser from 'phaser';
import { GAME_CONFIG } from '../../shared/types';
import { getSettings, updateSettings } from '../settings-store';
import { createButton } from '../ui/button';
import { type TextInputHandle, createTextInput } from '../ui/text-input';

const SLIDER_WIDTH = 300;
const SLIDER_HEIGHT = 8;
const HANDLE_RADIUS = 12;
const SLIDER_BG_COLOR = 0x16213e;
const SLIDER_FILL_COLOR = 0xe94560;
const HANDLE_COLOR = 0xffffff;

export class SettingsScene extends Phaser.Scene {
  private nameInput: TextInputHandle | null = null;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const cx = GAME_CONFIG.WORLD_WIDTH / 2;
    const settings = getSettings();

    this.add.text(cx, 60, 'SETTINGS', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Player name
    this.add.text(cx, 140, 'Player Name', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.nameInput = createTextInput({
      scene: this,
      x: cx,
      y: 180,
      width: 350,
      maxLength: 16,
      placeholder: 'Enter name...',
      initialValue: settings.playerName,
    });

    // Music volume
    this.add.text(cx, 250, 'Music Volume', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.createSlider(cx, 290, settings.musicVolume, (val) => {
      updateSettings({ musicVolume: val });
    });

    // SFX volume
    this.add.text(cx, 360, 'SFX Volume', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.createSlider(cx, 400, settings.sfxVolume, (val) => {
      updateSettings({ sfxVolume: val });
    });

    // Back button
    createButton({
      scene: this,
      x: cx,
      y: 500,
      width: 200,
      height: 50,
      label: 'BACK',
      onClick: () => {
        this.saveAndGoBack();
      },
    });
  }

  private saveAndGoBack(): void {
    if (this.nameInput !== null) {
      const name = this.nameInput.getValue().trim();
      updateSettings({ playerName: name !== '' ? name : 'Player' });
      this.nameInput.destroy();
      this.nameInput = null;
    }
    this.scene.start('MainMenuScene');
  }

  private createSlider(
    cx: number,
    y: number,
    initialValue: number,
    onChange: (value: number) => void,
  ): void {
    const sliderX = cx - SLIDER_WIDTH / 2;

    // Background track
    const trackBg = this.add.graphics();
    trackBg.fillStyle(SLIDER_BG_COLOR, 1);
    trackBg.fillRoundedRect(sliderX, y - SLIDER_HEIGHT / 2, SLIDER_WIDTH, SLIDER_HEIGHT, 4);

    // Fill track
    const trackFill = this.add.graphics();

    // Value label
    const valueLabel = this.add.text(cx + SLIDER_WIDTH / 2 + 30, y, String(initialValue), {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Handle
    const handleX = sliderX + (initialValue / 100) * SLIDER_WIDTH;
    const handle = this.add.circle(handleX, y, HANDLE_RADIUS, HANDLE_COLOR);
    handle.setInteractive({ useHandCursor: true, draggable: true });

    const updateFill = (hx: number): void => {
      trackFill.clear();
      trackFill.fillStyle(SLIDER_FILL_COLOR, 1);
      const fillWidth = hx - sliderX;
      trackFill.fillRoundedRect(sliderX, y - SLIDER_HEIGHT / 2, fillWidth, SLIDER_HEIGHT, 4);
    };

    updateFill(handleX);

    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
      if (gameObject !== handle) {
        return;
      }
      const clampedX = Math.max(sliderX, Math.min(sliderX + SLIDER_WIDTH, dragX));
      handle.setX(clampedX);
      updateFill(clampedX);

      const val = Math.round(((clampedX - sliderX) / SLIDER_WIDTH) * 100);
      valueLabel.setText(String(val));
      onChange(val);
    });
  }
}
