export type CombatPanelMode = "start" | "stop";

export type CombatPanelActions = {
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * 鸡舍战斗面板：开始战斗 / 停止战斗确认。
 */
export class CombatPanel {
  private readonly root: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;
  private mode: CombatPanelMode = "start";
  private actions: CombatPanelActions | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "combat-panel";
    this.root.className = "side-panel pixel-frame";
    this.root.hidden = true;

    this.titleEl = document.createElement("div");
    this.titleEl.className = "inv-title";
    this.titleEl.textContent = "◆ 鸡舍 ◆";

    this.body = document.createElement("div");
    this.body.className = "panel-body";

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "Esc 关闭";

    this.root.append(this.titleEl, this.body, hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  get currentMode(): CombatPanelMode {
    return this.mode;
  }

  setActions(actions: CombatPanelActions): void {
    this.actions = actions;
  }

  openStart(): void {
    this.mode = "start";
    this.titleEl.textContent = "◆ 鸡舍 ◆";
    this.setOpen(true);
    this.render();
  }

  openStop(): void {
    this.mode = "stop";
    this.titleEl.textContent = "◆ 停止战斗？ ◆";
    this.setOpen(true);
    this.render();
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  private render(): void {
    this.body.replaceChildren();
    if (this.mode === "start") {
      this.body.appendChild(
        el(
          "div",
          "panel-muted",
          "进入战斗后将自动追鸡攻击。鸡不会反击。按 E 可停止。",
        ),
      );
      this.body.appendChild(
        el("div", "panel-muted", "鸡 5 HP · 攻击力 2 · 上限 6 只 · 死后 5s 刷新"),
      );
      this.body.appendChild(el("div", "panel-divider", ""));
      this.body.appendChild(
        btn("开始战斗", () => this.actions?.onConfirm()),
      );
      this.body.appendChild(
        btn("取消", () => this.actions?.onCancel(), "ghost"),
      );
    } else {
      this.body.appendChild(
        el("div", "panel-muted", "停止后将结束自动战斗，可自由离开鸡舍地图。"),
      );
      this.body.appendChild(el("div", "panel-divider", ""));
      this.body.appendChild(
        btn("停止战斗", () => this.actions?.onConfirm()),
      );
      this.body.appendChild(
        btn("继续战斗", () => this.actions?.onCancel(), "ghost"),
      );
    }
  }
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
}

function btn(
  label: string,
  onClick: () => void,
  variant: "normal" | "ghost" = "normal",
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = variant === "ghost" ? "panel-btn ghost" : "panel-btn";
  b.textContent = label;
  b.addEventListener("click", () => onClick());
  return b;
}
