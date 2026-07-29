import type { Inventory } from "../systems/inventory.ts";
import type { Wallet } from "../systems/wallet.ts";
import type { Shop } from "../systems/shop.ts";
import { CONFIG } from "../core/config.ts";

export type ShopActions = {
  onExpandBag: () => void;
  onExpandWarehouse: () => void;
  onClose: () => void;
};

/**
 * 商店：当前仅扩容服务。
 * 买卖货架暂缓；打开时由 Game 联动背包/仓库，在其上卖东西。
 */
export class ShopPanel {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;
  private actions: ShopActions | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "shop-panel";
    this.root.className = "side-panel pixel-frame shop-center";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "◆ 商店 ◆";

    this.body = document.createElement("div");
    this.body.className = "panel-body";

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "背包/仓：左键卖1 · 右键卖全 · Esc/E 关";

    this.root.append(title, this.body, hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setActions(actions: ShopActions): void {
    this.actions = actions;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
    document.body.classList.toggle("shop-open", open);
  }

  refresh(shop: Shop, wallet: Wallet, bag: Inventory, warehouse: Inventory): void {
    this.body.replaceChildren();

    this.body.appendChild(
      el("div", "panel-row strong", `金币: ${wallet.gold}`),
    );
    this.body.appendChild(
      el(
        "div",
        "panel-muted",
        "暂不出售商品。请在左右背包/仓库卖出物资。",
      ),
    );
    this.body.appendChild(
      el(
        "div",
        "panel-muted",
        `背包 ${bag.usedSlots()}/${bag.capacity} · 仓库 ${warehouse.usedSlots()}/${warehouse.capacity}`,
      ),
    );

    this.body.appendChild(el("div", "panel-divider", ""));

    this.body.appendChild(
      btn(
        `扩背包 +${CONFIG.expandSlots}（${shop.bagPrice()} 金）`,
        () => this.actions?.onExpandBag(),
      ),
    );
    this.body.appendChild(
      btn(
        `扩仓库 +${CONFIG.expandSlots}（${shop.warehousePrice()} 金）`,
        () => this.actions?.onExpandWarehouse(),
      ),
    );
    this.body.appendChild(
      btn("Esc 关闭", () => this.actions?.onClose(), "ghost"),
    );
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
  b.addEventListener("click", onClick);
  return b;
}
