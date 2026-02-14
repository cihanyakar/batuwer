import type Phaser from 'phaser';

export interface ButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  color?: number;
  hoverColor?: number;
  fontSize?: string;
  disabled?: boolean;
}

const DEFAULT_COLOR = 0xe94560;
const DEFAULT_HOVER_COLOR = 0xff6b6b;
const DISABLED_COLOR = 0x555555;

export function createButton(config: ButtonConfig): Phaser.GameObjects.Container {
  const {
    scene,
    x,
    y,
    width,
    height,
    label,
    onClick,
    color = DEFAULT_COLOR,
    hoverColor = DEFAULT_HOVER_COLOR,
    fontSize = '24px',
    disabled = false,
  } = config;

  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const drawBg = (fillColor: number): void => {
    bg.clear();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
  };

  drawBg(disabled ? DISABLED_COLOR : color);

  const text = scene.add.text(0, 0, label, {
    fontSize,
    fontFamily: 'monospace',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: !disabled });

  if (!disabled) {
    container.on('pointerover', () => {
      drawBg(hoverColor);
    });

    container.on('pointerout', () => {
      drawBg(color);
    });

    container.on('pointerdown', () => {
      onClick();
    });
  }

  return container;
}
