import type { Skills } from "../systems/skills.ts";
import {
  SKILLS,
  xpToNextLevel,
  type SkillId,
} from "../data/skills.ts";

/**
 * 技能面板：各技能等级 + 经验进度条。
 * 由 R 键开关。
 */
export class SkillsPanel {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "skills-panel";
    this.root.className = "side-panel pixel-frame skills-panel";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 技能 ◆";

    this.body = document.createElement("div");
    this.body.className = "panel-body skills-body";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "panel-btn ghost";
    closeBtn.textContent = "Esc 关闭";
    closeBtn.addEventListener("click", () => this.setOpen(false));

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "R / Esc 关闭 · 每级动作 −0.1s";

    this.root.append(title, this.body, closeBtn, hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  refresh(skills: Skills): void {
    this.body.replaceChildren();

    const ids = Object.keys(SKILLS) as SkillId[];
    for (const id of ids) {
      const def = SKILLS[id];
      const st = skills.get(id);
      const need = xpToNextLevel(st.level);
      const ratio = need > 0 ? Math.min(1, st.xp / need) : 0;

      const row = document.createElement("div");
      row.className = "skill-row";

      const head = document.createElement("div");
      head.className = "skill-row-head";
      const name = document.createElement("span");
      name.className = "skill-name";
      name.textContent = def.name;
      const lv = document.createElement("span");
      lv.className = "skill-level";
      lv.textContent = `Lv ${st.level}`;
      head.append(name, lv);

      const track = document.createElement("div");
      track.className = "skill-xp-track";
      const fill = document.createElement("div");
      fill.className = "skill-xp-fill";
      fill.style.width = `${Math.round(ratio * 100)}%`;
      track.appendChild(fill);

      const meta = document.createElement("div");
      meta.className = "skill-xp-meta";
      meta.textContent = `经验 ${st.xp} / ${need}`;

      row.append(head, track, meta);
      this.body.appendChild(row);
    }
  }
}
