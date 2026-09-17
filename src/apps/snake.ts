import { Lcd, palette } from "../lcd";
import type { KeyEvent } from "../keys";
import type { App, Runtime } from "../runtime";

const COLS = 16;
const ROWS = 14;
const CELL = 18;
const ORIGIN_X = 16;
const ORIGIN_Y = 44;
const STEP = 0.16;

type Dir = { x: number; y: number };

export class SnakeApp implements App {
  readonly id = "snake";
  readonly title = "Snake";
  private body: { x: number; y: number }[] = [];
  private dir: Dir = { x: 1, y: 0 };
  private queued: Dir | null = null;
  private food = { x: 8, y: 7 };
  private started = false;
  private dead = false;
  private acc = 0;
  private score = 0;
  private best = 0;

  constructor(private readonly runtime: Runtime) {}

  enter(): void {
    this.reset(false);
  }

  exit(): void {}

  private reset(keepBest: boolean): void {
    this.body = [
      { x: 4, y: 7 },
      { x: 3, y: 7 },
      { x: 2, y: 7 },
    ];
    this.dir = { x: 1, y: 0 };
    this.queued = null;
    this.started = false;
    this.dead = false;
    this.acc = 0;
    this.score = 0;
    if (!keepBest) this.best = Math.max(this.best, 0);
    this.placeFood();
  }

  private placeFood(): void {
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      if (!this.body.some((p) => p.x === x && p.y === y)) {
        this.food = { x, y };
        return;
      }
    }
  }

  private turn(next: Dir): void {
    if (this.dead) {
      this.reset(true);
      return;
    }
    const cur = this.queued ?? this.dir;
    if (cur.x + next.x === 0 && cur.y + next.y === 0) return;
    this.queued = next;
    this.started = true;
  }

  tick(dt: number): void {
    if (!this.started || this.dead) return;
    this.acc += dt;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.step();
    }
  }

  private step(): void {
    if (this.queued) {
      this.dir = this.queued;
      this.queued = null;
    }
    const head = this.body[0]!;
    const next = { x: head.x + this.dir.x, y: head.y + this.dir.y };
    if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS || this.body.some((p) => p.x === next.x && p.y === next.y)) {
      this.dead = true;
      this.best = Math.max(this.best, this.score);
      return;
    }
    this.body.unshift(next);
    if (next.x === this.food.x && next.y === this.food.y) {
      this.score += 1;
      this.placeFood();
    } else {
      this.body.pop();
    }
  }

  draw(lcd: Lcd): void {
    lcd.clear();
    lcd.fillRect(0, 0, 320, 28, palette.panel);
    lcd.text(10, 8, "SNAKE", palette.accent, 2);
    lcd.text(160, 12, `SCR ${this.score}`, palette.fg);
    lcd.text(240, 12, `BEST ${this.best}`, palette.dim);

    lcd.fillRect(ORIGIN_X - 2, ORIGIN_Y - 2, COLS * CELL + 4, ROWS * CELL + 4, "#04100a");
    lcd.strokeRect(ORIGIN_X - 2, ORIGIN_Y - 2, COLS * CELL + 4, ROWS * CELL + 4, palette.dim);

    for (let i = 0; i < this.body.length; i++) {
      const p = this.body[i]!;
      lcd.fillRect(ORIGIN_X + p.x * CELL + 1, ORIGIN_Y + p.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? palette.accent : palette.snake);
    }
    lcd.fillRect(ORIGIN_X + this.food.x * CELL + 3, ORIGIN_Y + this.food.y * CELL + 3, CELL - 6, CELL - 6, palette.food);

    if (!this.started) {
      lcd.fillRect(40, 140, 240, 52, "#07140ee6");
      lcd.center(150, "WAIT FOR INPUT", palette.warn, 2);
      lcd.center(176, "Arrow keys or WASD", palette.fg);
    }
    if (this.dead) {
      lcd.fillRect(40, 140, 240, 52, "#140807e6");
      lcd.center(150, "GAME OVER", palette.danger, 2);
      lcd.center(176, "Ent / arrow to retry", palette.fg);
    }
    lcd.text(10, 304, "Esc menu", palette.dim);
  }

  key(event: KeyEvent): void {
    if (event.id === "ESC") {
      this.runtime.home();
      return;
    }
    if (event.id === "UP" || event.char === "w" || event.char === "W") {
      this.turn({ x: 0, y: -1 });
      return;
    }
    if (event.id === "DOWN" || event.char === "s" || event.char === "S") {
      this.turn({ x: 0, y: 1 });
      return;
    }
    if (event.id === "LEFT" || event.char === "a" || event.char === "A") {
      this.turn({ x: -1, y: 0 });
      return;
    }
    if (event.id === "RIGHT" || event.char === "d" || event.char === "D") {
      this.turn({ x: 1, y: 0 });
      return;
    }
    if (this.dead && event.id === "ENTER") this.reset(true);
  }
}
