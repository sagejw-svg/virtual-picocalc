import { Lcd, palette } from "../lcd";
import type { KeyEvent } from "../keys";
import type { App, Runtime } from "../runtime";

const PICOMITE = "https://jvanderberg.github.io/PicoMiteAllVersions/";

export class AboutApp implements App {
  readonly id = "about";
  readonly title = "About";

  constructor(private readonly runtime: Runtime) {}

  enter(): void {}
  exit(): void {}

  draw(lcd: Lcd): void {
    lcd.clear();
    lcd.fillRect(0, 0, 320, 28, palette.panel);
    lcd.text(10, 8, "ABOUT", palette.accent, 2);
    lcd.text(200, 12, "K6WRJ", palette.warn);

    lcd.text(12, 44, "Virtual PicoCalc", palette.fg, 2);
    lcd.text(12, 68, "Browser mock of ClockworkPi");
    lcd.text(12, 80, "PicoCalc: 320x320 IPS LCD,");
    lcd.text(12, 92, "67-key backlit QWERTY, PWR.");

    lcd.hline(12, 110, 296, palette.dim);
    lcd.text(12, 122, "Built-in apps", palette.accent);
    lcd.text(12, 138, "About, Calculator, Morse Koch");
    lcd.text(12, 150, "trainer (12 WPM), Snake, and");
    lcd.text(12, 162, "a toy BASIC with HELLO/COUNT.");

    lcd.hline(12, 180, 296, palette.dim);
    lcd.text(12, 192, "Want the real MMBasic?", palette.accent);
    lcd.text(12, 208, "PicoMite / MMBasic Anywhere:");
    lcd.text(12, 224, "jvanderberg.github.io", palette.info);
    lcd.text(12, 236, "PicoMiteAllVersions", palette.info);

    lcd.text(12, 260, "Ent / F1  open PicoMite page", palette.dim);
    lcd.text(12, 272, "Alt+Space keyboard backlight", palette.dim);
    lcd.text(12, 284, "PWR       sleep / wake", palette.dim);
    lcd.text(12, 304, "Esc menu", palette.dim);
  }

  key(event: KeyEvent): void {
    if (event.id === "ESC") {
      this.runtime.home();
      return;
    }
    if (event.id === "ENTER" || event.id === "F1" || event.id === " ") {
      window.open(PICOMITE, "_blank", "noopener,noreferrer");
    }
  }
}

export { PICOMITE };
