import { DEFAULT_SETTINGS, type GameSettings } from '../shared/types';

let settings: GameSettings = { ...DEFAULT_SETTINGS };

export function getSettings(): GameSettings {
  return { ...settings };
}

export function updateSettings(partial: Partial<GameSettings>): void {
  settings = { ...settings, ...partial };
}
