import type Phaser from 'phaser';

export interface TextInputConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  maxLength: number;
  placeholder?: string;
  initialValue?: string;
  onSubmit?: (value: string) => void;
}

export interface TextInputHandle {
  container: Phaser.GameObjects.Container;
  getValue: () => string;
  setValue: (v: string) => void;
  destroy: () => void;
}

const INPUT_HEIGHT = 44;
const BG_COLOR = 0x0f3460;
const BORDER_COLOR = 0xe94560;

export function createTextInput(config: TextInputConfig): TextInputHandle {
  const {
    scene,
    x,
    y,
    width,
    maxLength,
    placeholder = '',
    initialValue = '',
    onSubmit,
  } = config;

  let value = initialValue.slice(0, maxLength);
  let cursorVisible = true;

  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  bg.fillStyle(BG_COLOR, 1);
  bg.fillRoundedRect(-width / 2, -INPUT_HEIGHT / 2, width, INPUT_HEIGHT, 6);
  bg.lineStyle(2, BORDER_COLOR);
  bg.strokeRoundedRect(-width / 2, -INPUT_HEIGHT / 2, width, INPUT_HEIGHT, 6);

  const displayText = scene.add.text(-width / 2 + 12, 0, '', {
    fontSize: '20px',
    fontFamily: 'monospace',
    color: '#ffffff',
  }).setOrigin(0, 0.5);

  const placeholderText = scene.add.text(-width / 2 + 12, 0, placeholder, {
    fontSize: '20px',
    fontFamily: 'monospace',
    color: '#666688',
  }).setOrigin(0, 0.5);

  container.add([bg, placeholderText, displayText]);

  const updateDisplay = (): void => {
    const cursor = cursorVisible ? '|' : '';
    displayText.setText(value + cursor);
    placeholderText.setVisible(value.length === 0 && !cursorVisible);
  };

  const blinkTimer = scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
      cursorVisible = !cursorVisible;
      updateDisplay();
    },
  });

  const keyHandler = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      onSubmit?.(value);
    } else if (event.key === 'Backspace') {
      value = value.slice(0, -1);
      updateDisplay();
    } else if (event.key.length === 1 && value.length < maxLength) {
      value += event.key;
      updateDisplay();
    }
  };

  scene.input.keyboard?.on('keydown', keyHandler);

  updateDisplay();

  return {
    container,
    getValue: () => value,
    setValue: (v: string) => {
      value = v.slice(0, maxLength);
      updateDisplay();
    },
    destroy: () => {
      blinkTimer.destroy();
      scene.input.keyboard?.off('keydown', keyHandler);
      container.destroy();
    },
  };
}
