import { Lcd, palette } from "../lcd";
import type { KeyEvent } from "../keys";
import type { App, Runtime } from "../runtime";

const OPS = new Set(["+", "-", "*", "/"]);

export class CalculatorApp implements App {
  readonly id = "calc";
  readonly title = "Calculator";
  private display = "0";
  private acc: number | null = null;
  private op: string | null = null;
  private fresh = true;
  private error = false;

  constructor(private readonly runtime: Runtime) {}

  enter(): void {
    this.clear();
  }

  exit(): void {}

  private clear(): void {
    this.display = "0";
    this.acc = null;
    this.op = null;
    this.fresh = true;
    this.error = false;
  }

  private inputDigit(d: string): void {
    if (this.error) this.clear();
    if (this.fresh) {
      this.display = d === "." ? "0." : d;
      this.fresh = false;
      return;
    }
    if (d === "." && this.display.includes(".")) return;
    if (this.display === "0" && d !== ".") this.display = d;
    else if (this.display.length < 14) this.display += d;
  }

  private applyOp(next: string): void {
    if (this.error) return;
    const value = Number(this.display);
    if (this.acc === null || this.fresh) {
      this.acc = value;
    } else if (this.op) {
      this.acc = this.compute(this.acc, value, this.op);
      if (this.acc === null) return;
      this.display = formatNum(this.acc);
    }
    this.op = next;
    this.fresh = true;
  }

  private equals(): void {
    if (this.error || this.op === null || this.acc === null) return;
    const value = Number(this.display);
    const result = this.compute(this.acc, value, this.op);
    if (result === null) return;
    this.display = formatNum(result);
    this.acc = result;
    this.op = null;
    this.fresh = true;
  }

  private compute(a: number, b: number, op: string): number | null {
    let result = 0;
    if (op === "+") result = a + b;
    else if (op === "-") result = a - b;
    else if (op === "*") result = a * b;
    else if (op === "/") {
      if (b === 0) {
        this.display = "Error";
        this.error = true;
        this.acc = null;
        this.op = null;
        this.fresh = true;
        return null;
      }
      result = a / b;
    }
    return result;
  }

  private backspace(): void {
    if (this.error || this.fresh) return;
    this.display = this.display.length <= 1 ? "0" : this.display.slice(0, -1);
    if (this.display === "-") this.display = "0";
  }

  draw(lcd: Lcd): void {
    lcd.clear();
    lcd.fillRect(0, 0, 320, 28, palette.panel);
    lcd.text(10, 8, "CALC", palette.accent, 2);
    lcd.text(200, 12, this.op ? this.op : "", palette.warn);

    lcd.fillRect(10, 40, 300, 56, "#04100a");
    lcd.strokeRect(10, 40, 300, 56, palette.dim);
    const shown = this.display.length > 16 ? this.display.slice(-16) : this.display;
    lcd.text(304 - shown.length * 12, 56, shown, this.error ? palette.danger : palette.fg, 2);

    const keys = [
      ["C", "+-", "%", "/"],
      ["7", "8", "9", "*"],
      ["4", "5", "6", "-"],
      ["1", "2", "3", "+"],
      ["0", ".", "=", ""],
    ];
    keys.forEach((row, r) => {
      row.forEach((label, c) => {
        if (!label) return;
        const x = 10 + c * 76;
        const y = 110 + r * 38;
        const w = label === "0" ? 152 : 70;
        lcd.fillRect(x, y, w, 32, "#10261a");
        lcd.strokeRect(x, y, w, 32, palette.dim);
        lcd.text(x + 28 - label.length * 3, y + 10, label, OPS.has(label) || label === "=" ? palette.warn : palette.fg);
      });
    });
    lcd.text(10, 304, "Esc menu   C clear   Ent =", palette.dim);
  }

  key(event: KeyEvent): void {
    if (event.id === "ESC") {
      this.runtime.home();
      return;
    }
    if (event.id === "BKSP" || event.id === "DEL") {
      this.backspace();
      return;
    }
    if (event.id === "ENTER" || event.char === "=") {
      this.equals();
      return;
    }
    const ch = event.char || event.id;
    if (ch === "c" || ch === "C") {
      this.clear();
      return;
    }
    if (ch === "%") {
      const n = Number(this.display);
      if (!this.error && Number.isFinite(n)) {
        this.display = formatNum(n / 100);
        this.fresh = true;
      }
      return;
    }
    if (/^[0-9.]$/.test(ch)) {
      this.inputDigit(ch);
      return;
    }
    if (OPS.has(ch)) {
      this.applyOp(ch);
      return;
    }
    if (event.id === "F1") this.clear();
  }
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const text = Math.abs(n) >= 1e12 || (Math.abs(n) > 0 && Math.abs(n) < 1e-8) ? n.toExponential(6) : String(Number(n.toPrecision(12)));
  return text.length > 14 ? n.toExponential(6) : text;
}
