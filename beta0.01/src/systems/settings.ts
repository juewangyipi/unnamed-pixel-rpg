import { CONFIG } from "../core/config.ts";

export type GameSettings = {
  /** 主音量 0～1 */
  masterVolume: number;
  /** 音效 0～1 */
  sfxVolume: number;
  /** 音乐 0～1 */
  musicVolume: number;
  /** 总静音 */
  muted: boolean;
  /** 显示浮动伤害/获得提示（预留） */
  showToasts: boolean;
  /** 自动存档 */
  autosave: boolean;
};

const DEFAULTS: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 1,
  musicVolume: 0.6,
  muted: false,
  showToasts: true,
  autosave: true,
};

const STORAGE_KEY = `${CONFIG.saveKey}-settings`;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * 本地设置：声音等。改完自动写 localStorage。
 * 音量接口先存好，等有音频时直接读。
 */
export class SettingsStore {
  private data: GameSettings;

  constructor() {
    this.data = { ...DEFAULTS };
    this.load();
  }

  get raw(): Readonly<GameSettings> {
    return this.data;
  }

  /** 综合有效音量（静音时为 0） */
  effectiveMaster(): number {
    return this.data.muted ? 0 : this.data.masterVolume;
  }

  effectiveSfx(): number {
    return this.effectiveMaster() * this.data.sfxVolume;
  }

  effectiveMusic(): number {
    return this.effectiveMaster() * this.data.musicVolume;
  }

  setMasterVolume(v: number): void {
    this.data.masterVolume = clamp01(v);
    this.save();
  }

  setSfxVolume(v: number): void {
    this.data.sfxVolume = clamp01(v);
    this.save();
  }

  setMusicVolume(v: number): void {
    this.data.musicVolume = clamp01(v);
    this.save();
  }

  setMuted(m: boolean): void {
    this.data.muted = m;
    this.save();
  }

  setShowToasts(v: boolean): void {
    this.data.showToasts = v;
    this.save();
  }

  setAutosave(v: boolean): void {
    this.data.autosave = v;
    this.save();
  }

  resetAudio(): void {
    this.data.masterVolume = DEFAULTS.masterVolume;
    this.data.sfxVolume = DEFAULTS.sfxVolume;
    this.data.musicVolume = DEFAULTS.musicVolume;
    this.data.muted = DEFAULTS.muted;
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      this.data = {
        ...DEFAULTS,
        ...parsed,
        masterVolume: clamp01(parsed.masterVolume ?? DEFAULTS.masterVolume),
        sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULTS.sfxVolume),
        musicVolume: clamp01(parsed.musicVolume ?? DEFAULTS.musicVolume),
      };
    } catch {
      // ignore
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore
    }
  }
}
