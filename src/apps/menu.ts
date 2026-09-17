import { Lcd, palette } from "../lcd";
import type { KeyEvent } from "../keys";
import type { App, Runtime } from "../runtime";

export class MenuApp implements App {
  readonly id = "menu";
  readonly title = "Launcher";
  private index = 0;
  private items: { id: string; title: string; blurb: string }[] = [];

  constructor(private readonly runtime: Runtime) {}

  enter(): void {
    this.items = this.runtime
      .list()
      .filter((app) => app.id !== this.id)
      .map((app) => ({
        id: app.id,
        title: app.title,
        blurb: blurbs[app.id] ?? "",
      }));
    this.index = Math.min(this.index, Math.max(0, this.items.length - 1));
  }

  exit(): void {}

  draw(lcd: Lcd): void {
    lcd.clear();
    lcd.fillRect(0, 0, 320, 36, palette.panel);
    lcd.text(10, 8, "PicoCalc", palette.accent, 2);
    lcd.text(160, 14, "K6WRJ", palette.dim, 1);
    lcd.hline(8, 40, 304, palette.dim);

    this.items.forEach((item, i) => {
      const y = 52 + i * 44;
      if (i === this.index) {
        lcd.fillRect(8, y - 6, 304, 40, "#123322");
        lcd.fillRect(8, y - 6, 4, 40, palette.accent);
      }
      lcd.text(20, y, item.title, i === this.index ? palette.fg : palette.dim, 2);
      lcd.text(20, y + 20, item.blurb, i === this.index ? palette.info : palette.dim);
    });

    lcd.text(10, 304, "Arrows select   Ent open   Esc here", palette.dim);
  }

  key(event: KeyEvent): void {
    if (event.id === "UP") {
      this.index = (this.index + this.items.length - 1) % this.items.length;
      return;
    }
    if (event.id === "DOWN") {
      this.index = (this.index + 1) % this.items.length;
      return;
    }
    if (event.id === "ENTER" || event.id === "F1") {
      const item = this.items[this.index];
      if (item) this.runtime.go(item.id);
    }
  }
}

const blurbs: Record<string, string> = {
  about: "Device, credits, PicoMite link",
  calc: "Four-function pocket calculator",
  morse: "Koch method trainer  ·  12 WPM",
  snake: "Wait for first arrow / WASD",
  basic: "Toy BASIC  ·  HELLO / COUNT",
};
