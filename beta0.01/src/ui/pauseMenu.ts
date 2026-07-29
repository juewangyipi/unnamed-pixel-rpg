import type { SettingsStore } from "../systems/settings.ts";

export type PauseMenuActions = {
  onResume: () => void;
  onSettingsChanged: () => void;
};

type Page = "main" | "settings" | "sound" | "controls";

/**
 * 暂停菜单：继续 / 设置 / 声音 / 操作指南。
 * 打开时由 Game 冻结逻辑更新。
 */
export class PauseMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private readonly titleEl: HTMLElement;
  private open = false;
  private page: Page = "main";
  private actions: PauseMenuActions | null = null;
  private settings: SettingsStore | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "pause-menu";
    this.root.hidden = true;

    const backdrop = document.createElement("div");
    backdrop.className = "pause-backdrop";

    const panel = document.createElement("div");
    panel.className = "pause-panel pixel-frame";

    this.titleEl = document.createElement("div");
    this.titleEl.className = "inv-title";
    this.titleEl.textContent = "◆ 暂停 ◆";

    this.body = document.createElement("div");
    this.body.className = "panel-body pause-body";

    panel.append(this.titleEl, this.body);
    this.root.append(backdrop, panel);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setActions(actions: PauseMenuActions): void {
    this.actions = actions;
  }

  bindSettings(settings: SettingsStore): void {
    this.settings = settings;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
    if (open) {
      this.page = "main";
      this.renderPage();
    }
  }

  /** 外部 Esc：在子页返回主页，在主页则关闭 */
  handleEscape(): "closed" | "back" | "none" {
    if (!this.open) return "none";
    if (this.page !== "main") {
      this.page = "main";
      this.renderPage();
      return "back";
    }
    this.actions?.onResume();
    return "closed";
  }

  private renderPage(): void {
    this.body.replaceChildren();
    switch (this.page) {
      case "main":
        this.titleEl.textContent = "◆ 暂停 ◆";
        this.renderMain();
        break;
      case "settings":
        this.titleEl.textContent = "◆ 设置 ◆";
        this.renderSettings();
        break;
      case "sound":
        this.titleEl.textContent = "◆ 声音 ◆";
        this.renderSound();
        break;
      case "controls":
        this.titleEl.textContent = "◆ 操作指南 ◆";
        this.renderControls();
        break;
    }
  }

  private renderMain(): void {
    this.body.appendChild(
      menuBtn("继续游戏", () => this.actions?.onResume()),
    );
    this.body.appendChild(
      menuBtn("设置", () => {
        this.page = "settings";
        this.renderPage();
      }),
    );
    this.body.appendChild(
      menuBtn("声音设置", () => {
        this.page = "sound";
        this.renderPage();
      }),
    );
    this.body.appendChild(
      menuBtn("操作指南", () => {
        this.page = "controls";
        this.renderPage();
      }),
    );
    this.body.appendChild(
      el("div", "inv-hint", "Esc 返回 / 继续"),
    );
  }

  private renderSettings(): void {
    const s = this.settings;
    if (!s) return;

    this.body.appendChild(
      el("div", "panel-muted", "通用选项（自动保存到本地）"),
    );

    this.body.appendChild(
      toggleRow(
        "显示获得提示",
        s.raw.showToasts,
        (v) => {
          s.setShowToasts(v);
          this.actions?.onSettingsChanged();
          this.renderPage();
        },
      ),
    );
    this.body.appendChild(
      toggleRow(
        "自动存档",
        s.raw.autosave,
        (v) => {
          s.setAutosave(v);
          this.actions?.onSettingsChanged();
          this.renderPage();
        },
      ),
    );

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(
      menuBtn("返回", () => {
        this.page = "main";
        this.renderPage();
      }, "ghost"),
    );
  }

  private renderSound(): void {
    const s = this.settings;
    if (!s) return;

    this.body.appendChild(
      el("div", "panel-muted", "音量暂先存档；接入音频后生效"),
    );

    this.body.appendChild(
      toggleRow("静音", s.raw.muted, (v) => {
        s.setMuted(v);
        this.actions?.onSettingsChanged();
        this.renderPage();
      }),
    );

    this.body.appendChild(
      sliderRow("主音量", s.raw.masterVolume, (v) => {
        s.setMasterVolume(v);
        this.actions?.onSettingsChanged();
      }),
    );
    this.body.appendChild(
      sliderRow("音效", s.raw.sfxVolume, (v) => {
        s.setSfxVolume(v);
        this.actions?.onSettingsChanged();
      }),
    );
    this.body.appendChild(
      sliderRow("音乐", s.raw.musicVolume, (v) => {
        s.setMusicVolume(v);
        this.actions?.onSettingsChanged();
      }),
    );

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(
      menuBtn("恢复默认音量", () => {
        s.resetAudio();
        this.actions?.onSettingsChanged();
        this.renderPage();
      }),
    );
    this.body.appendChild(
      menuBtn("返回", () => {
        this.page = "main";
        this.renderPage();
      }, "ghost"),
    );
  }

  private renderControls(): void {
    const lines = [
      ["移动", "W A S D / 方向键"],
      ["互动 / 采集", "E / 空格（点一下持续）"],
      ["背包", "B / I"],
      ["技能面板", "R"],
      ["暂停菜单", "Esc（无面板时）"],
      ["关闭面板", "Esc / E（部分）"],
      ["商店·卖 1 个", "左键（背包/仓库）"],
      ["商店·卖全部", "右键（背包/仓库）"],
      ["烹饪份数", "拖动滑条"],
      ["篝火", "E 点燃 / 熄灭"],
      ["采矿", "村子往左 · 点 E 持续采"],
    ];

    for (const [k, v] of lines) {
      const row = document.createElement("div");
      row.className = "controls-row";
      const key = document.createElement("span");
      key.className = "controls-key";
      key.textContent = k;
      const val = document.createElement("span");
      val.className = "controls-val";
      val.textContent = v;
      row.append(key, val);
      this.body.appendChild(row);
    }

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(
      menuBtn("返回", () => {
        this.page = "main";
        this.renderPage();
      }, "ghost"),
    );
  }
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
}

function menuBtn(
  label: string,
  onClick: () => void,
  variant: "normal" | "ghost" = "normal",
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = variant === "ghost" ? "panel-btn ghost" : "panel-btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

function toggleRow(
  label: string,
  value: boolean,
  onChange: (v: boolean) => void,
): HTMLElement {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "panel-btn settings-toggle";
  row.textContent = `${label}：${value ? "开" : "关"}`;
  row.addEventListener("click", () => onChange(!value));
  return row;
}

function sliderRow(
  label: string,
  value01: number,
  onChange: (v: number) => void,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "settings-slider-block";

  const head = document.createElement("div");
  head.className = "settings-slider-label";
  const pct = Math.round(value01 * 100);
  head.textContent = `${label}  ${pct}%`;

  const input = document.createElement("input");
  input.type = "range";
  input.className = "cook-slider";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = String(pct);
  input.addEventListener("input", () => {
    const v = Number(input.value) / 100;
    head.textContent = `${label}  ${Math.round(v * 100)}%`;
    onChange(v);
  });

  wrap.append(head, input);
  return wrap;
}
