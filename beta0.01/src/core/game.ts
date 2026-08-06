import {
  CONFIG,
  viewHeightPx,
  viewWidthPx,
} from "./config.ts";
import { Input } from "./input.ts";
import { Player, type Facing } from "../entities/player.ts";
import { World } from "../world/world.ts";
import { renderChunkBackground } from "../world/renderChunk.ts";
import { Inventory } from "../systems/inventory.ts";
import { Skills } from "../systems/skills.ts";
import { InteractionSystem, type Toast } from "../systems/interaction.ts";
import { InteractableStore } from "../systems/interactableStore.ts";
import { FacilityStore } from "../systems/facilityStore.ts";
import { findFacilityFocus } from "../systems/facilityInteraction.ts";
import {
  CampfireSystem,
  isNearCampfire,
} from "../systems/campfire.ts";
import { CookingSystem } from "../systems/cooking.ts";
import { AlchemySystem } from "../systems/alchemy.ts";
import { BuffSystem } from "../systems/buffs.ts";
import { Wallet } from "../systems/wallet.ts";
import { Shop } from "../systems/shop.ts";
import { TimeOfDay } from "../systems/timeOfDay.ts";
import { applyOfflineProgress } from "../systems/offline.ts";
import { drawInteractables } from "../world/drawInteractables.ts";
import { drawFacilities } from "../world/drawFacilities.ts";
import { InventoryPanel } from "../ui/inventoryPanel.ts";
import { ShopPanel } from "../ui/shopPanel.ts";
import { WarehousePanel } from "../ui/warehousePanel.ts";
import { CookPanel } from "../ui/cookPanel.ts";
import { AlchemyPanel } from "../ui/alchemyPanel.ts";
import { CombatPanel } from "../ui/combatPanel.ts";
import { SkillsPanel } from "../ui/skillsPanel.ts";
import { FarmPanel } from "../ui/farmPanel.ts";
import { PauseMenu } from "../ui/pauseMenu.ts";
import { SettingsStore } from "../systems/settings.ts";
import { FarmStore } from "../systems/farmStore.ts";
import { CoopCombatSystem } from "../systems/coopCombat.ts";
import {
  FarmInteraction,
  findFarmFocus,
} from "../systems/farmInteraction.ts";
import { GATHER, type InteractKind } from "../entities/interactable.ts";
import { farmPhase, type FarmPlot } from "../entities/farmPlot.ts";
import { getCrop } from "../data/crops.ts";
import type { Facility } from "../entities/facility.ts";
import { loadSave, writeSave, type SavePointData } from "../save/saveGame.ts";
import { getItem, type ItemId } from "../data/items.ts";
import { getFoodHeal, isEdible } from "../data/foods.ts";
import { getPotionEffect, isDrinkable } from "../data/potions.ts";
import { drawShadow, drawSprite, type SpriteName } from "../assets/sprites.ts";
import { drawPlayerFrame } from "../assets/playerAnim.ts";
import { drawFarmPlots } from "../world/drawFarmPlots.ts";
import { drawChickens } from "../world/drawChickens.ts";

/**
 * 核心循环：移动 · 切屏 · 采集 · 背包 · 商店仓库 · 昼夜 · 暂停菜单 · 存档
 */
export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly hud: HTMLElement;
  private readonly input = new Input();
  private readonly world = new World();
  private readonly player: Player;
  private inventory: Inventory;
  private warehouse: Inventory;
  private readonly skills = new Skills();
  private readonly wallet: Wallet;
  private readonly shop = new Shop();
  private readonly time = new TimeOfDay();
  private readonly settings = new SettingsStore();
  private readonly interaction = new InteractionSystem();
  private readonly interactables = new InteractableStore();
  private readonly facilities = new FacilityStore();
  private readonly campfire = new CampfireSystem();
  private readonly cooking = new CookingSystem();
  private readonly alchemy = new AlchemySystem();
  private readonly buffs = new BuffSystem();
  private readonly invPanel: InventoryPanel;
  private readonly shopPanel: ShopPanel;
  private readonly warehousePanel: WarehousePanel;
  private readonly cookPanel: CookPanel;
  private readonly alchemyPanel: AlchemyPanel;
  private readonly combatPanel: CombatPanel;
  private readonly skillsPanel: SkillsPanel;
  private readonly farmPanel: FarmPanel;
  private readonly pauseMenu: PauseMenu;
  private readonly farms = new FarmStore();
  private readonly farmIx = new FarmInteraction();
  private readonly coopCombat = new CoopCombatSystem();

  private hp: number = CONFIG.maxHp;
  private savePoint: SavePointData;
  private lastGatherKind: InteractKind | null = null;
  private bagDirty = false;
  private cookUiAcc = 0;
  private alchemyUiAcc = 0;
  private paused = false;

  private lastTs = 0;
  private raf = 0;
  private running = false;
  private transitionFlash = 0;
  private autosaveAcc = 0;
  private toasts: Toast[] = [];
  private focusGatherId: string | null = null;
  private focusFacility: Facility | null = null;
  private focusFarm: FarmPlot | null = null;
  private activeFarm: FarmPlot | null = null;
  private activeInteract = null as ReturnType<
    InteractionSystem["update"]
  >["active"];
  /** 昼夜遮罩离屏层：用于篝火挖光 */
  private lightLayer: HTMLCanvasElement | null = null;
  private lightLayerCtx: CanvasRenderingContext2D | null = null;
  private readonly onBeforeUnload: () => void;

  constructor(canvas: HTMLCanvasElement, hud: HTMLElement, app: HTMLElement) {
    this.canvas = canvas;
    this.hud = hud;
    this.invPanel = new InventoryPanel(app);
    this.shopPanel = new ShopPanel(app);
    this.warehousePanel = new WarehousePanel(app);
    this.cookPanel = new CookPanel(app);
    this.alchemyPanel = new AlchemyPanel(app);
    this.combatPanel = new CombatPanel(app);
    this.skillsPanel = new SkillsPanel(app);
    this.farmPanel = new FarmPanel(app);
    this.pauseMenu = new PauseMenu(app);
    this.pauseMenu.bindSettings(this.settings);
    this.pauseMenu.setActions({
      onResume: () => this.resumeGame(),
      onSettingsChanged: () => {
        /* 音量等已写入 localStorage */
      },
    });

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    this.ctx = ctx;

    const w = viewWidthPx();
    const h = viewHeightPx();
    canvas.width = w;
    canvas.height = h;

    this.player = new Player(
      (w - CONFIG.tileSize) / 2,
      (h - CONFIG.tileSize) / 2,
    );
    this.inventory = new Inventory(CONFIG.inventorySlots);
    this.warehouse = new Inventory(CONFIG.warehouseSlots);
    this.wallet = new Wallet(CONFIG.startingGold);
    this.savePoint = {
      chunkId: "village",
      x: this.player.x,
      y: this.player.y,
    };

    this.wirePanels();
    this.tryLoad();
    this.invPanel.refresh(this.inventory);

    this.onBeforeUnload = () => this.saveNow();
    window.addEventListener("beforeunload", this.onBeforeUnload);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.dispose();
    this.saveNow();
    window.removeEventListener("beforeunload", this.onBeforeUnload);
  }

  private wirePanels(): void {
    this.shopPanel.setActions({
      onExpandBag: () => {
        const err = this.shop.buyBagExpand(this.inventory, this.wallet);
        if (err) this.pushToast(err);
        else {
          this.pushToast(`背包扩至 ${this.inventory.capacity} 格`);
          this.refreshOpenPanels();
          this.saveNow();
        }
      },
      onExpandWarehouse: () => {
        const err = this.shop.buyWarehouseExpand(this.warehouse, this.wallet);
        if (err) this.pushToast(err);
        else {
          this.pushToast(`仓库扩至 ${this.warehouse.capacity} 格`);
          this.refreshOpenPanels();
          this.saveNow();
        }
      },
      onBuyItem: (itemId) => {
        const err = this.shop.buyOne(this.inventory, this.wallet, itemId);
        if (err) this.pushToast(err);
        else {
          this.pushToast(`购入 ${getItem(itemId).name} x1`);
          this.refreshOpenPanels();
          this.saveNow();
        }
      },
      onClose: () => this.closeShop(),
    });

    this.invPanel.setActions({
      onSellOneOf: (itemId) => {
        const r = this.shop.sellOne(this.inventory, this.wallet, itemId);
        this.afterShopTrade(r, getItem(itemId).name);
      },
      onSellAllOf: (itemId) => {
        const r = this.shop.sellAll(this.inventory, this.wallet, itemId);
        this.afterShopTrade(r, getItem(itemId).name);
      },
      onEat: (itemId) => this.tryEat(itemId),
      onDrink: (itemId) => this.tryDrink(itemId),
    });

    this.warehousePanel.setActions({
      onDepositAll: () => {
        const n = this.warehouse.depositAllFrom(this.inventory);
        this.pushToast(n > 0 ? `存入 ${n} 件` : "没有可存入的物品或仓库已满");
        this.refreshOpenPanels();
        this.saveNow();
      },
      onWithdrawAll: () => {
        const n = this.inventory.depositAllFrom(this.warehouse);
        this.pushToast(n > 0 ? `取出 ${n} 件` : "没有可取出的物品或背包已满");
        this.refreshOpenPanels();
        this.saveNow();
      },
      onBagSlot: (index) => {
        const stack = this.inventory.takeSlot(index);
        if (!stack) return;
        const err = this.warehouse.addStack(stack);
        if (err) {
          this.inventory.addStack(stack);
          this.pushToast("仓库已满");
        } else {
          this.pushToast(`存入 ${getItem(stack.id).name} x${stack.count}`);
        }
        this.refreshOpenPanels();
      },
      onWarehouseSlot: (index) => {
        // 商店联动时格子只右键卖；非商店模式左键取出
        if (this.shopPanel.isOpen) return;
        const stack = this.warehouse.takeSlot(index);
        if (!stack) return;
        const err = this.inventory.addStack(stack);
        if (err) {
          this.warehouse.addStack(stack);
          this.pushToast("背包已满");
        } else {
          this.pushToast(`取出 ${getItem(stack.id).name} x${stack.count}`);
        }
        this.refreshOpenPanels();
      },
      onSellOneOf: (itemId) => {
        const r = this.shop.sellOne(this.warehouse, this.wallet, itemId);
        this.afterShopTrade(r, getItem(itemId).name);
      },
      onSellAllOf: (itemId) => {
        const r = this.shop.sellAll(this.warehouse, this.wallet, itemId);
        this.afterShopTrade(r, getItem(itemId).name);
      },
      onClose: () => {
        if (this.shopPanel.isOpen) this.closeShop();
        else this.warehousePanel.setOpen(false);
      },
    });

    this.cookPanel.setActions({
      onStart: (recipeId, amount) => {
        const err = this.cooking.start(recipeId, amount, this.inventory);
        if (err) this.pushToast(err);
        else {
          this.pushToast("开始烹饪…");
          this.cookPanel.refresh(this.cooking, this.inventory, this.skills);
          this.saveNow();
        }
      },
      onStop: () => {
        const toasts: Toast[] = [];
        this.cooking.stop(toasts, "已停止烹饪");
        this.toasts.push(...toasts);
        this.cookPanel.refresh(this.cooking, this.inventory, this.skills);
        this.bagDirty = true;
      },
      onClose: () => this.cookPanel.setOpen(false),
    });

    this.farmPanel.setActions({
      onPlant: (cropId) => {
        const plot = this.farmPanel.targetPlot;
        if (!plot) return;
        const nowSec = Date.now() / 1000;
        const err = this.farmIx.tryPlant(
          plot,
          cropId,
          nowSec,
          this.inventory,
        );
        if (err) {
          this.pushToast(err);
          this.farmPanel.refresh(this.inventory, nowSec);
          return;
        }
        const crop = getCrop(cropId);
        this.pushToast(
          `已种植${crop.name} · ${crop.growSec}s 后长成${crop.matureLabel}`,
        );
        this.farmPanel.setOpen(false);
        this.bagDirty = true;
        this.saveNow();
      },
      onClose: () => this.farmPanel.setOpen(false),
    });

    this.alchemyPanel.setActions({
      onStart: (recipeId, amount) => {
        const err = this.alchemy.start(recipeId, amount, this.inventory);
        if (err) this.pushToast(err);
        else {
          this.pushToast("开始制药…");
          this.alchemyPanel.refresh(
            this.alchemy,
            this.inventory,
            this.skills,
          );
          this.saveNow();
        }
      },
      onStop: () => {
        const toasts: Toast[] = [];
        this.alchemy.stop(toasts, "已停止制药");
        this.toasts.push(...toasts);
        this.alchemyPanel.refresh(this.alchemy, this.inventory, this.skills);
        this.bagDirty = true;
      },
      onClose: () => this.alchemyPanel.setOpen(false),
    });

    this.combatPanel.setActions({
      onConfirm: () => {
        if (this.combatPanel.currentMode === "start") {
          const bounds = this.world.boundsPx();
          this.coopCombat.start({ arenaW: bounds.w, arenaH: bounds.h });
          this.combatPanel.setOpen(false);
          this.pushToast("战斗开始 · 自动追鸡 · E 可停止");
        } else {
          this.coopCombat.stop();
          this.combatPanel.setOpen(false);
          this.pushToast("已停止战斗");
        }
      },
      onCancel: () => this.combatPanel.setOpen(false),
    });
  }

  private afterShopTrade(
    r: { sold: number; gold: number },
    itemName?: string,
  ): void {
    if (r.sold <= 0) this.pushToast("没有可卖的资源");
    else {
      const name = itemName ? ` ${itemName}` : "";
      this.pushToast(`卖出${name} x${r.sold}，+${r.gold} 金`);
    }
    this.refreshOpenPanels();
    this.saveNow();
  }

  /** 打开商店：同时打开背包 + 仓库 */
  private openShop(): void {
    this.closeAllPanels();
    this.invPanel.setShopLinked(true);
    this.warehousePanel.setShopLinked(true);
    this.shopPanel.setOpen(true);
    this.invPanel.setOpen(true);
    this.warehousePanel.setOpen(true);
    this.shopPanel.refresh(
      this.shop,
      this.wallet,
      this.inventory,
      this.warehouse,
    );
    this.invPanel.refresh(this.inventory);
    this.warehousePanel.refresh(this.inventory, this.warehouse);
  }

  private closeShop(): void {
    this.shopPanel.setOpen(false);
    this.invPanel.setOpen(false);
    this.warehousePanel.setOpen(false);
    this.invPanel.setShopLinked(false);
    this.warehousePanel.setShopLinked(false);
  }

  private refreshOpenPanels(): void {
    if (this.invPanel.isOpen) this.invPanel.refresh(this.inventory);
    if (this.shopPanel.isOpen) {
      this.shopPanel.refresh(
        this.shop,
        this.wallet,
        this.inventory,
        this.warehouse,
      );
    }
    if (this.warehousePanel.isOpen) {
      this.warehousePanel.refresh(this.inventory, this.warehouse);
    }
    if (this.cookPanel.isOpen) {
      this.cookPanel.refresh(this.cooking, this.inventory, this.skills);
    }
    if (this.alchemyPanel.isOpen) {
      this.alchemyPanel.refresh(this.alchemy, this.inventory, this.skills);
    }
    if (this.skillsPanel.isOpen) {
      this.skillsPanel.refresh(this.skills);
    }
    if (this.farmPanel.isOpen) {
      this.farmPanel.refresh(this.inventory, Date.now() / 1000);
    }
  }

  private tryLoad(): void {
    const data = loadSave();
    if (!data) {
      this.pushToast("新的旅程 · 本地存档将自动保存");
      return;
    }

    this.wallet.gold = data.gold;
    this.hp = data.hp;
    this.world.currentId = data.chunkId;
    this.player.x = data.playerX;
    this.player.y = data.playerY;
    this.player.facing = data.facing;
    this.inventory = Inventory.fromJSON(data.inventory);
    this.warehouse = Inventory.fromJSON(data.warehouse);
    this.skills.loadJSON(data.skills);
    this.shop.loadJSON(data.shop);
    this.savePoint = data.savePoint;
    this.time.progress = data.dayProgress;
    this.interactables.loadJSON(data.interactables);
    this.farms.loadJSON(data.farmPlots);
    this.buffs.loadJSON(data.buffs);
    this.lastGatherKind = data.lastGatherKind;
    this.interaction.lastGatherKind = data.lastGatherKind;

    const elapsed = (Date.now() - data.wallMs) / 1000;
    const offlineToasts = applyOfflineProgress({
      elapsedSec: elapsed,
      lastGatherKind: this.lastGatherKind,
      inventory: this.inventory,
      skills: this.skills,
    });
    this.toasts.push(...offlineToasts);
    if (offlineToasts.length === 0) {
      this.pushToast("已读取本地存档");
    }

    // 本机一次性：已有存档 +10000 金（标记后不再发）
    this.applyOneTimeGoldGrant(10_000);
  }

  /** 仅本机 localStorage 标记，不进存档版本逻辑；只跑一次 */
  private applyOneTimeGoldGrant(amount: number): void {
    const flagKey = `${CONFIG.saveKey}::grant-gold-1w-v1`;
    try {
      if (localStorage.getItem(flagKey) === "1") return;
      this.wallet.gold += amount;
      localStorage.setItem(flagKey, "1");
      this.pushToast(`+${amount} 金币`);
      this.saveNow();
    } catch {
      /* 无 localStorage 则跳过 */
    }
  }

  private saveNow(): void {
    writeSave({
      version: CONFIG.version,
      wallMs: Date.now(),
      gold: this.wallet.gold,
      hp: this.hp,
      chunkId: this.world.currentId,
      playerX: this.player.x,
      playerY: this.player.y,
      facing: this.player.facing,
      inventory: this.inventory.toJSON(),
      warehouse: this.warehouse.toJSON(),
      skills: this.skills.toJSON(),
      shop: this.shop.toJSON(),
      savePoint: this.savePoint,
      dayProgress: this.time.progress,
      interactables: this.interactables.toJSON(),
      lastGatherKind: this.lastGatherKind,
      farmPlots: this.farms.toJSON(),
      buffs: this.buffs.toJSON(),
    });
  }

  private readonly frame = (ts: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    this.update(dt);
    this.render();
    this.input.endFrame();
    this.raf = requestAnimationFrame(this.frame);
  };

  private anyGameplayPanelOpen(): boolean {
    return (
      this.shopPanel.isOpen ||
      this.warehousePanel.isOpen ||
      this.invPanel.isOpen ||
      this.cookPanel.isOpen ||
      this.alchemyPanel.isOpen ||
      this.combatPanel.isOpen ||
      this.skillsPanel.isOpen ||
      this.farmPanel.isOpen
    );
  }

  private pauseGame(): void {
    this.paused = true;
    this.closeAllPanels();
    this.pauseMenu.setOpen(true);
  }

  private resumeGame(): void {
    this.paused = false;
    this.pauseMenu.setOpen(false);
  }

  private update(dt: number): void {
    // Esc：关面板 → 或 打开/关闭暂停
    if (this.input.isEscapeJustPressed()) {
      if (this.pauseMenu.isOpen) {
        this.pauseMenu.handleEscape();
      } else if (this.anyGameplayPanelOpen()) {
        this.closeAllPanels();
      } else {
        this.pauseGame();
      }
    }

    // 暂停中：不推进世界，只保留菜单操作
    if (this.paused) {
      return;
    }

    if (this.input.isInventoryJustPressed()) {
      // 商店联动时 B 关闭整组；否则只切换背包
      if (this.shopPanel.isOpen) {
        this.closeAllPanels();
      } else {
        const next = !this.invPanel.isOpen;
        this.closeAllPanels();
        this.invPanel.setShopLinked(false);
        this.invPanel.setOpen(next);
        if (next) this.invPanel.refresh(this.inventory);
      }
    }

    if (this.input.isSkillsJustPressed()) {
      const next = !this.skillsPanel.isOpen;
      this.closeAllPanels();
      this.skillsPanel.setOpen(next);
      if (next) this.skillsPanel.refresh(this.skills);
    }

    this.time.update(dt);

    // 战斗中：自动追鸡，禁用手动移动与切屏
    if (this.coopCombat.fighting) {
      const bounds = this.world.boundsPx();
      const fight = this.coopCombat.update({
        dt,
        player: this.player,
        inventory: this.inventory,
        skills: this.skills,
        arenaW: bounds.w,
        arenaH: bounds.h,
      });
      if (fight.toasts.length) {
        this.toasts.push(...fight.toasts);
        this.bagDirty = true;
      }
    } else {
      const axis = this.input.getMoveAxis();
      this.player.update(dt, axis);

      if (this.world.resolvePlayerBounds(this.player)) {
        this.transitionFlash = 1.6;
      }
    }
    if (this.transitionFlash > 0) {
      this.transitionFlash = Math.max(0, this.transitionFlash - dt);
    }

    const nowSec = Date.now() / 1000;
    const gatherList = this.interactables.forChunk(this.world.currentId);
    const facilityList = this.facilities.forChunk(this.world.currentId);
    const farmList = this.farms.forChunk(this.world.currentId);

    this.focusFacility = findFacilityFocus(this.player, facilityList);

    // 设施 / 农田：点按 E（面板打开时 E 关闭）
    let usedInteractForFacility = false;
    if (this.input.isInteractJustPressed()) {
      if (
        this.shopPanel.isOpen ||
        this.warehousePanel.isOpen ||
        this.cookPanel.isOpen ||
        this.alchemyPanel.isOpen ||
        this.combatPanel.isOpen ||
        this.skillsPanel.isOpen ||
        this.farmPanel.isOpen
      ) {
        this.closeAllPanels();
        usedInteractForFacility = true;
      } else if (this.coopCombat.fighting) {
        // 战斗中 E：打开停止确认
        this.closeAllPanels();
        this.combatPanel.openStop();
        usedInteractForFacility = true;
      } else if (this.focusFacility?.kind === "campfire") {
        const lightToasts: Toast[] = [];
        this.campfire.tryToggle(this.inventory, lightToasts);
        this.toasts.push(...lightToasts);
        usedInteractForFacility = true;
      } else if (this.focusFacility) {
        this.openFacility(this.focusFacility);
        usedInteractForFacility = true;
      } else {
        // 空农田：打开种植面板（成熟/生长由 farmIx 处理）
        const farmFocus = findFarmFocus(this.player, farmList);
        if (farmFocus && farmPhase(farmFocus, nowSec) === "empty") {
          this.closeAllPanels();
          this.farmPanel.openFor(farmFocus, this.inventory, nowSec);
          usedInteractForFacility = true;
        }
      }
    }

    // 农田：生长提示 / 砍苹果树
    const farmResult = this.farmIx.update({
      dt,
      nowSec,
      player: this.player,
      interactJustPressed:
        !usedInteractForFacility && this.input.isInteractJustPressed(),
      list: farmList,
      inventory: this.inventory,
      skills: this.skills,
      panelOpen: this.farmPanel.isOpen || this.anyGameplayPanelOpen(),
    });
    this.focusFarm = farmResult.focus;
    this.activeFarm = farmResult.active;
    if (farmResult.consumedPress) usedInteractForFacility = true;
    if (farmResult.toasts.length) {
      this.toasts.push(...farmResult.toasts);
      this.bagDirty = true;
    }

    // 篝火燃烧（离开范围 / 没木头会熄灭）
    const campfireFac =
      facilityList.find((f) => f.kind === "campfire") ?? null;
    const nearFire =
      !!campfireFac && isNearCampfire(this.player, campfireFac);
    const fireResult = this.campfire.update({
      dt,
      player: this.player,
      campfire: campfireFac,
      inventory: this.inventory,
      skills: this.skills,
      inRange: nearFire,
    });
    if (fireResult.toasts.length) {
      this.toasts.push(...fireResult.toasts);
      this.bagDirty = true;
    }

    // 烹饪进行中
    const cookResult = this.cooking.update({
      dt,
      inventory: this.inventory,
      skills: this.skills,
    });
    if (cookResult.toasts.length) {
      this.toasts.push(...cookResult.toasts);
      this.bagDirty = true;
    }
    // 烹饪面板打开时节流刷新进度（避免每帧重建按钮）
    if (this.cookPanel.isOpen) {
      this.cookUiAcc += dt;
      if (
        cookResult.finishedBatch ||
        (this.cooking.active && this.cookUiAcc >= 0.2)
      ) {
        this.cookUiAcc = 0;
        this.cookPanel.refresh(this.cooking, this.inventory, this.skills);
      }
    } else {
      this.cookUiAcc = 0;
    }

    // 制药进行中
    const alchemyResult = this.alchemy.update({
      dt,
      inventory: this.inventory,
      skills: this.skills,
    });
    if (alchemyResult.toasts.length) {
      this.toasts.push(...alchemyResult.toasts);
      this.bagDirty = true;
    }
    if (this.alchemyPanel.isOpen) {
      this.alchemyUiAcc += dt;
      if (
        alchemyResult.finishedBatch ||
        (this.alchemy.active && this.alchemyUiAcc >= 0.2)
      ) {
        this.alchemyUiAcc = 0;
        this.alchemyPanel.refresh(this.alchemy, this.inventory, this.skills);
      }
    } else {
      this.alchemyUiAcc = 0;
    }

    // 药水增益倒计时
    const buffToasts: Toast[] = [];
    this.buffs.update(dt, buffToasts);
    if (buffToasts.length) this.toasts.push(...buffToasts);

    // 采集：树/鱼点一下持续采（开面板时不采；农田交互优先；战斗中不采）
    const canGather =
      !this.shopPanel.isOpen &&
      !this.warehousePanel.isOpen &&
      !this.cookPanel.isOpen &&
      !this.alchemyPanel.isOpen &&
      !this.farmPanel.isOpen &&
      !this.combatPanel.isOpen &&
      !this.coopCombat.fighting &&
      !this.activeFarm;
    const result = this.interaction.update({
      dt,
      nowSec,
      player: this.player,
      interactHeld: canGather && this.input.isInteractHeld(),
      interactJustPressed:
        canGather &&
        !usedInteractForFacility &&
        this.input.isInteractJustPressed(),
      list: gatherList,
      inventory: this.inventory,
      skills: this.skills,
      extraBonusDrops: this.buffs.treeBonusDrops(),
      onTreeChopped: (toasts) => this.buffs.onTreeChopped(toasts),
    });

    this.focusGatherId = result.focus?.id ?? null;
    this.activeInteract = result.active;
    if (result.lastGatherKind) this.lastGatherKind = result.lastGatherKind;

    if (result.toasts.length) {
      this.toasts.push(...result.toasts);
      this.bagDirty = true;
    }
    if (this.bagDirty) {
      this.refreshOpenPanels();
      this.bagDirty = false;
    }

    // 自动存档（可在设置里关闭）
    if (this.settings.raw.autosave) {
      this.autosaveAcc += dt;
      if (this.autosaveAcc >= CONFIG.autosaveSec) {
        this.autosaveAcc = 0;
        this.saveNow();
      }
    }

    if (this.settings.raw.showToasts) {
      for (const t of this.toasts) t.ttl -= dt;
      this.toasts = this.toasts.filter((t) => t.ttl > 0);
    } else {
      this.toasts = [];
    }
  }

  private openFacility(f: Facility): void {
    this.closeAllPanels();
    switch (f.kind) {
      case "shop":
        this.openShop();
        break;
      case "warehouse":
        this.warehousePanel.setShopLinked(false);
        this.warehousePanel.setOpen(true);
        this.warehousePanel.refresh(this.inventory, this.warehouse);
        break;
      case "save_point":
        this.activateSavePoint();
        break;
      case "campfire":
        break;
      case "cooking_pot":
        this.cookPanel.setOpen(true);
        this.cookPanel.refresh(this.cooking, this.inventory, this.skills);
        break;
      case "alchemy_table":
        this.alchemyPanel.setOpen(true);
        this.alchemyPanel.refresh(this.alchemy, this.inventory, this.skills);
        break;
      case "chicken_coop":
        this.combatPanel.openStart();
        break;
    }
  }

  private activateSavePoint(): void {
    this.savePoint = {
      chunkId: this.world.currentId,
      x: this.player.x,
      y: this.player.y,
    };
    this.hp = CONFIG.maxHp;
    this.pushToast("存档点已激活 · 生命已恢复");
    this.saveNow();
  }

  private closeAllPanels(): void {
    if (this.shopPanel.isOpen) {
      this.closeShop();
    } else {
      this.invPanel.setOpen(false);
      this.warehousePanel.setOpen(false);
      this.invPanel.setShopLinked(false);
      this.warehousePanel.setShopLinked(false);
    }
    this.shopPanel.setOpen(false);
    this.cookPanel.setOpen(false);
    this.alchemyPanel.setOpen(false);
    this.combatPanel.setOpen(false);
    this.skillsPanel.setOpen(false);
    this.farmPanel.setOpen(false);
  }

  private pushToast(text: string, ttl = 2.4): void {
    if (!this.settings.raw.showToasts) return;
    this.toasts.push({ text, ttl });
  }

  /** 背包左键：食用食物，回血并消耗 1 个（回血数值见 data/foods.ts） */
  private tryEat(itemId: ItemId): void {
    if (!isEdible(itemId)) {
      this.pushToast("这个不能吃");
      return;
    }
    if (this.inventory.countOf(itemId) <= 0) {
      this.pushToast("没有这件物品");
      return;
    }
    if (this.hp >= CONFIG.maxHp) {
      this.pushToast("生命已满，不必食用");
      return;
    }
    const def = getItem(itemId);
    const heal = getFoodHeal(itemId);
    if (heal <= 0) {
      this.pushToast("这个不能吃");
      return;
    }
    const removed = this.inventory.remove(itemId, 1);
    if (removed <= 0) {
      this.pushToast("食用失败");
      return;
    }
    const before = this.hp;
    this.hp = Math.min(CONFIG.maxHp, this.hp + heal);
    const gained = Math.round(this.hp - before);
    this.pushToast(`食用${def.name} · +${gained} HP`);
    this.refreshOpenPanels();
    this.saveNow();
  }

  /** 背包左键：饮用药水（效果见 data/potions.ts） */
  private tryDrink(itemId: ItemId): void {
    if (!isDrinkable(itemId)) {
      this.pushToast("这个不能喝");
      return;
    }
    if (this.inventory.countOf(itemId) <= 0) {
      this.pushToast("没有这件物品");
      return;
    }
    const removed = this.inventory.remove(itemId, 1);
    if (removed <= 0) {
      this.pushToast("饮用失败");
      return;
    }
    const err = this.buffs.applyDrink(itemId);
    if (err) {
      this.inventory.add(itemId, 1);
      this.pushToast(err);
      return;
    }
    const def = getItem(itemId);
    const effect = getPotionEffect(itemId);
    const added = effect?.charges ?? 0;
    const total = this.buffs.active?.chargesLeft ?? added;
    this.pushToast(
      `饮用${def.name} · +${added} 次（共 ${total} 次）`,
    );
    this.refreshOpenPanels();
    this.saveNow();
  }

  private render(): void {
    const { ctx, canvas, world, player } = this;
    const chunk = world.current;
    const nowSec = Date.now() / 1000;
    const gatherList = this.interactables.forChunk(world.currentId);
    const facilityList = this.facilities.forChunk(world.currentId);

    const nowDraw = performance.now() / 1000;
    renderChunkBackground(ctx, chunk, canvas.width, canvas.height, nowDraw);
    const farmList = this.farms.forChunk(world.currentId);
    drawFarmPlots(
      ctx,
      farmList,
      nowSec,
      this.focusFarm?.id ?? null,
      this.activeFarm,
    );
    drawFacilities(
      ctx,
      facilityList,
      this.focusFacility?.id ?? null,
      {
        lit: this.campfire.lit,
        progress: this.campfire.progress,
        timeSec: nowDraw,
      },
      {
        cooking: this.cooking.active,
        progress: this.cooking.progress,
        timeSec: nowDraw,
      },
      {
        crafting: this.alchemy.active,
        progress: this.alchemy.progress,
        timeSec: nowDraw,
      },
    );
    drawInteractables(
      ctx,
      gatherList,
      nowSec,
      this.focusGatherId,
      this.activeInteract,
    );
    if (this.world.currentId === "coop" && this.coopCombat.fighting) {
      drawChickens(ctx, this.coopCombat.chickens, nowSec);
    }

    this.drawPlayer();
    this.drawDayOverlay();
    this.drawHpBar();

    // 交互提示
    const tip = this.promptText();
    if (tip) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(tip).width;
      const px = player.x + player.size / 2;
      const py = player.y - 10;
      ctx.fillRect(px - tw / 2 - 4, py - 7, tw + 8, 12);
      ctx.fillStyle = "#f5f0d8";
      ctx.textBaseline = "middle";
      ctx.fillText(tip, px, py);
    }

    if (!this.paused) {
      this.drawToasts();
    }
    this.updateHud();

    // 暂停时在画布上叠一层暗色（DOM 菜单在外层）
    if (this.paused) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,244,192,0.9)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("已暂停", canvas.width / 2, 20);
    }
  }

  private promptText(): string | null {
    if (
      this.shopPanel.isOpen ||
      this.warehousePanel.isOpen ||
      this.cookPanel.isOpen ||
      this.alchemyPanel.isOpen ||
      this.combatPanel.isOpen ||
      this.farmPanel.isOpen
    ) {
      return null;
    }
    if (this.coopCombat.fighting) {
      return `战斗中 · E 停止 · 鸡 ${this.coopCombat.aliveCount}`;
    }
    if (this.focusFacility?.kind === "campfire") {
      if (this.campfire.lit) return "E · 熄灭篝火";
      return "E · 点燃篝火";
    }
    if (this.focusFacility?.kind === "cooking_pot") {
      if (this.cooking.active) return "E · 烹饪锅（烹饪中）";
      return "E · 打开烹饪锅";
    }
    if (this.focusFacility?.kind === "alchemy_table") {
      if (this.alchemy.active) return "E · 制药台（制药中）";
      return "E · 打开制药台";
    }
    if (this.focusFacility?.kind === "chicken_coop") {
      return "E · 开始战斗";
    }
    if (this.focusFacility) {
      return `E · ${this.focusFacility.label}`;
    }
    if (this.activeFarm) {
      return "砍苹果树中 · E 停止";
    }
    if (this.focusFarm) {
      const nowSec = Date.now() / 1000;
      const phase = farmPhase(this.focusFarm, nowSec);
      if (phase === "empty") return "E · 种植";
      if (phase === "growing") {
        const left = Math.ceil(
          Math.max(0, this.focusFarm.readyWallSec - nowSec),
        );
        return `生长中 · ${left}s · E 查看`;
      }
      return "E · 砍苹果树";
    }
    if (this.activeInteract) {
      const profile = GATHER[this.activeInteract.kind];
      if (profile.mode === "auto") {
        return `${profile.label}中 · E 停止`;
      }
      return `按住 E · ${profile.label}`;
    }
    if (this.focusGatherId) {
      const list = this.interactables.forChunk(this.world.currentId);
      const focus = list.find((i) => i.id === this.focusGatherId);
      if (!focus) return null;
      const profile = GATHER[focus.kind];
      if (profile.mode === "auto") {
        return `E · ${profile.label}`;
      }
      return `按住 E · ${profile.label}`;
    }
    return null;
  }

  private playerSprite(facing: Facing): SpriteName {
    switch (facing) {
      case "up":
        return "player_up";
      case "left":
        return "player_left";
      case "right":
        return "player_right";
      default:
        return "player_down";
    }
  }

  private drawPlayer(): void {
    const { ctx, player } = this;
    // 阴影随步伐压扁；精灵表 walk 帧自带起伏，不再叠代码 bob
    const squash = player.moving
      ? 1 - Math.abs(Math.sin(player.walkPhase)) * 0.08
      : 1;
    const shadowRx = player.size * 0.36 * (2 - squash);
    const shadowRy = player.size * 0.12 * squash;

    drawShadow(
      ctx,
      player.x + player.size / 2,
      player.y + player.size - 1,
      shadowRx,
      shadowRy,
    );

    // 优先：Mystic Woods 精灵表 idle / walk
    if (
      drawPlayerFrame(
        ctx,
        player.facing,
        player.moving,
        player.walkPhase,
        player.x,
        player.y,
        player.size,
      )
    ) {
      return;
    }

    // 回退：四向单帧 PNG + 微弹
    const bob = player.moving
      ? Math.round(Math.sin(player.walkPhase) * 1.6)
      : 0;
    const ok = drawSprite(
      ctx,
      this.playerSprite(player.facing),
      player.x,
      player.y - bob,
      { w: player.size, h: player.size },
    );
    if (ok) return;

    ctx.fillStyle = "#f0d28a";
    ctx.fillRect(
      Math.round(player.x),
      Math.round(player.y - bob),
      player.size,
      player.size,
    );
    ctx.fillStyle = "#2a2010";
    const cx = Math.round(player.x) + player.size / 2;
    const cy = Math.round(player.y - bob) + player.size / 2;
    const n = 3;
    switch (player.facing) {
      case "up":
        ctx.fillRect(cx - 1, cy - n - 1, 2, n);
        break;
      case "down":
        ctx.fillRect(cx - 1, cy + 1, 2, n);
        break;
      case "left":
        ctx.fillRect(cx - n - 1, cy - 1, n, 2);
        break;
      case "right":
        ctx.fillRect(cx + 1, cy - 1, n, 2);
        break;
    }
  }

  private ensureLightLayer(
    w: number,
    h: number,
  ): CanvasRenderingContext2D {
    if (
      !this.lightLayer ||
      !this.lightLayerCtx ||
      this.lightLayer.width !== w ||
      this.lightLayer.height !== h
    ) {
      this.lightLayer = document.createElement("canvas");
      this.lightLayer.width = w;
      this.lightLayer.height = h;
      const c = this.lightLayer.getContext("2d");
      if (!c) throw new Error("Campfire light canvas unavailable");
      this.lightLayerCtx = c;
    }
    return this.lightLayerCtx;
  }

  /** 当前块光源（篝火 / 烹饪锅） */
  private activeLights(): { x: number; y: number; warm: boolean }[] {
    const list = this.facilities.forChunk(this.world.currentId);
    const lights: { x: number; y: number; warm: boolean }[] = [];
    if (this.campfire.lit) {
      const f = list.find((x) => x.kind === "campfire");
      if (f) {
        lights.push({
          x: f.x + f.size / 2,
          y: f.y + f.size * 0.55,
          warm: true,
        });
      }
    }
    if (this.cooking.active) {
      const f = list.find((x) => x.kind === "cooking_pot");
      if (f) {
        lights.push({
          x: f.x + f.size / 2,
          y: f.y + f.size * 0.5,
          warm: false,
        });
      }
    }
    if (this.alchemy.active) {
      const f = list.find((x) => x.kind === "alchemy_table");
      if (f) {
        lights.push({
          x: f.x + f.size / 2,
          y: f.y + f.size * 0.5,
          warm: false,
        });
      }
    }
    return lights;
  }

  private drawDayOverlay(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const d = this.time.darkness();
    const lights = this.activeLights();
    const t = performance.now() / 1000;
    const flicker =
      1 + Math.sin(t * 12) * 0.05 + Math.sin(t * 21) * 0.035;
    const lightRadius = CONFIG.tileSize * 5.2 * flicker;

    // 昼夜压暗；光源挖洞
    if (d > 0) {
      const phase = this.time.phase();
      const lctx = this.ensureLightLayer(w, h);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.clearRect(0, 0, w, h);
      if (phase === "dusk" || phase === "dawn") {
        lctx.fillStyle = `rgba(48, 22, 36, ${d * 0.85})`;
      } else {
        lctx.fillStyle = `rgba(6, 12, 36, ${d})`;
      }
      lctx.fillRect(0, 0, w, h);

      if (lights.length) {
        lctx.globalCompositeOperation = "destination-out";
        for (const light of lights) {
          const hole = lctx.createRadialGradient(
            light.x,
            light.y,
            lightRadius * 0.12,
            light.x,
            light.y,
            lightRadius,
          );
          hole.addColorStop(0, "rgba(0,0,0,1)");
          hole.addColorStop(0.35, "rgba(0,0,0,0.85)");
          hole.addColorStop(0.7, "rgba(0,0,0,0.35)");
          hole.addColorStop(1, "rgba(0,0,0,0)");
          lctx.fillStyle = hole;
          lctx.fillRect(0, 0, w, h);
        }
        lctx.globalCompositeOperation = "source-over";
      }

      ctx.drawImage(this.lightLayer!, 0, 0);
    }

    // 光源光晕
    for (const light of lights) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const warmCore = 0.28 + d * 0.35;
      const warmMid = 0.14 + d * 0.22;
      const glow = ctx.createRadialGradient(
        light.x,
        light.y,
        0,
        light.x,
        light.y,
        lightRadius * 1.05,
      );
      if (light.warm) {
        glow.addColorStop(0, `rgba(255, 210, 120, ${warmCore})`);
        glow.addColorStop(0.22, `rgba(255, 150, 60, ${warmMid})`);
        glow.addColorStop(0.55, `rgba(220, 90, 30, ${0.08 + d * 0.1})`);
      } else {
        // 锅：偏暖白蒸汽光
        glow.addColorStop(0, `rgba(255, 230, 200, ${warmCore * 0.9})`);
        glow.addColorStop(0.28, `rgba(255, 180, 100, ${warmMid * 0.9})`);
        glow.addColorStop(0.6, `rgba(180, 120, 80, ${0.06 + d * 0.08})`);
      }
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 轻 vignette
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.25,
      w / 2,
      h / 2,
      w * 0.72,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  private drawHpBar(): void {
    const { ctx, canvas } = this;
    const w = 64;
    const h = 6;
    const x = canvas.width - w - 8;
    const y = 8;
    // 像素风外框
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#2a1a1a";
    ctx.fillRect(x, y, w, h);
    const ratio = Math.max(0, this.hp / CONFIG.maxHp);
    const grad = ratio > 0.35 ? "#c84a4a" : "#ff4040";
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, Math.round(w * ratio), h);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x, y, Math.round(w * ratio), 1);
  }

  private drawToasts(): void {
    const { ctx, canvas } = this;
    let y = canvas.height - 12;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i]!;
      const alpha = Math.min(1, t.ttl / 0.4);
      ctx.fillStyle = `rgba(0,0,0,${0.55 * alpha})`;
      const tw = ctx.measureText(t.text).width;
      ctx.fillRect(canvas.width / 2 - tw / 2 - 6, y - 8, tw + 12, 16);
      ctx.fillStyle = `rgba(255,245,210,${alpha})`;
      ctx.fillText(t.text, canvas.width / 2, y);
      y -= 18;
    }
  }

  private updateHud(): void {
    const chunk = this.world.current;
    const lines = [
      `地图: ${chunk.name}`,
      `时间: ${this.time.phaseLabel()}`,
      `金币: ${this.wallet.gold}`,
      `HP: ${Math.ceil(this.hp)}/${CONFIG.maxHp}`,
    ];
    const buff = this.buffs.statusLine();
    if (buff) lines.push(`增益: ${buff}`);
    if (this.coopCombat.fighting) {
      lines.push(`战斗 · 鸡 ${this.coopCombat.aliveCount}`);
    }
    this.hud.textContent = lines.join("\n");
  }
}
