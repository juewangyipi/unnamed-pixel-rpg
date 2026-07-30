import type { Inventory } from "../systems/inventory.ts";
import type { Wallet } from "../systems/wallet.ts";
import type { Shop } from "../systems/shop.ts";
import { CONFIG } from "../core/config.ts";
import { getItem, SHOP_BUY_ITEM_IDS, type ItemId } from "../data/items.ts";
import { getBuyPrice } from "../data/prices.ts";

export type ShopActions = {
  onExpandBag: () => void;
  onExpandWarehouse: () => void;
  /** 购买货架商品 1 个 */
  onBuyItem: (itemId: ItemId) => void;
  onClose: () => void;
};

/**
 * 商店：货架购买（盖鲁姆草等）+ 扩容。
 * 打开时联动背包/仓库卖物资。
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
    hint.textContent = "货架可买 · 背包/仓左键卖1右键卖全 · Esc/E 关";

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
        `背包 ${bag.usedSlots()}/${bag.capacity} · 仓库 ${warehouse.usedSlots()}/${warehouse.capacity}`,
      ),
    );

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(el("div", "panel-sub", "▸ 货架（购买）"));

    for (const id of SHOP_BUY_ITEM_IDS) {
      const def = getItem(id);
      const price = getBuyPrice(id);
      if (price <= 0) continue;
      const canAfford = wallet.gold >= price;
      const canFit = bag.canFit(id, 1);
      let label = `购买 ${def.name}（${price} 金）`;
      if (!canAfford) label = `${def.name} · 金币不足（需 ${price}）`;
      else if (!canFit) label = `${def.name} · 背包已满`;

      const b = btn(label, () => this.actions?.onBuyItem(id));
      if (!canAfford || !canFit) b.disabled = true;
      this.body.appendChild(b);

      this.body.appendChild(
        el("div", "panel-muted", `${def.name} · 制药原材料 · ${price} 金/个`),
      );
    }

    if (SHOP_BUY_ITEM_IDS.length === 0) {
      this.body.appendChild(el("div", "panel-muted", "暂无在售商品"));
    }

    this.body.appendChild(el("div", "panel-divider", ""));
    this.body.appendChild(el("div", "panel-sub", "▸ 扩容"));

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
  b.addEventListener("click", () => onClick());
  return b;
}
