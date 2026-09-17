import { Lcd, palette } from "../lcd";
import type { KeyEvent } from "../keys";
import type { App, Runtime } from "../runtime";

const HELLO = [
  '10 PRINT "HELLO, PICOCALC"',
  '20 PRINT "FROM K6WRJ"',
  "30 END",
].join("\n");

const COUNT = ["10 FOR I = 1 TO 10", "20 PRINT I", "30 NEXT I", "40 END"].join("\n");

const SAMPLES: Record<string, string> = {
  HELLO,
  COUNT,
};

export class BasicApp implements App {
  readonly id = "basic";
  readonly title = "BASIC";
  private lines = new Map<number, string>();
  private vars = new Map<string, number | string>();
  private output: string[] = [];
  private input = "";
  private running = false;
  private cursorOn = true;
  private blink = 0;
  private scroll = 0;

  constructor(private readonly runtime: Runtime) {}

  enter(): void {
    this.output = [
      "PicoCalc BASIC 0.1",
      "LOAD HELLO  or  LOAD COUNT",
      "LIST  RUN  NEW  HELP",
      "READY.",
    ];
    this.input = "";
    this.running = false;
    this.scroll = 0;
  }

  exit(): void {
    this.running = false;
  }

  tick(dt: number): void {
    this.blink += dt;
    if (this.blink >= 0.45) {
      this.blink = 0;
      this.cursorOn = !this.cursorOn;
    }
  }

  private print(line: string): void {
    for (const part of line.split("\n")) this.output.push(part);
    while (this.output.length > 80) this.output.shift();
    this.scroll = 0;
  }

  private loadSample(name: string): void {
    const src = SAMPLES[name.toUpperCase()];
    if (!src) {
      this.print(`?NO SAMPLE ${name}`);
      return;
    }
    this.lines.clear();
    for (const raw of src.split("\n")) this.storeLine(raw);
    this.print(`LOADED ${name.toUpperCase()}`);
  }

  private storeLine(raw: string): void {
    const match = raw.match(/^(\d+)\s*(.*)$/);
    if (!match) return;
    const n = Number(match[1]);
    const rest = match[2] ?? "";
    if (!rest) this.lines.delete(n);
    else this.lines.set(n, rest);
  }

  private list(): void {
    const nums = [...this.lines.keys()].sort((a, b) => a - b);
    if (!nums.length) {
      this.print("(empty)");
      return;
    }
    for (const n of nums) this.print(`${n} ${this.lines.get(n)}`);
  }

  private run(): void {
    const nums = [...this.lines.keys()].sort((a, b) => a - b);
    if (!nums.length) {
      this.print("READY.");
      return;
    }
    this.vars.clear();
    this.running = true;
    const index = new Map(nums.map((n, i) => [n, i]));
    const forStack: { v: string; end: number; step: number; nextPc: number }[] = [];
    let pc = 0;
    let guard = 0;
    try {
      while (pc < nums.length && this.running && guard++ < 5000) {
        const n = nums[pc]!;
        const stmt = this.lines.get(n) ?? "";
        const result = this.exec(stmt, n);
        if (result.kind === "end") break;
        if (result.kind === "goto") {
          const dest = index.get(result.line);
          if (dest === undefined) throw new Error(`UNDEF ${result.line}`);
          pc = dest;
          continue;
        }
        if (result.kind === "for") {
          forStack.push({ ...result.frame, nextPc: pc + 1 });
          pc += 1;
          continue;
        }
        if (result.kind === "next") {
          const frame = result.v
            ? forStack.filter((f) => f.v === result.v).pop()
            : forStack[forStack.length - 1];
          if (!frame) throw new Error("NEXT WITHOUT FOR");
          const cur = Number(this.vars.get(frame.v) ?? 0) + frame.step;
          this.vars.set(frame.v, cur);
          const done = frame.step >= 0 ? cur > frame.end : cur < frame.end;
          if (done) {
            const idx = forStack.lastIndexOf(frame);
            if (idx >= 0) forStack.splice(idx, 1);
            pc += 1;
          } else {
            pc = frame.nextPc;
          }
          continue;
        }
        pc += 1;
      }
    } catch (err) {
      this.print("?" + (err instanceof Error ? err.message : "ERROR"));
    }
    this.running = false;
    this.print("READY.");
  }

  private exec(stmt: string, lineNo: number): ExecResult {
    const text = stmt.trim();
    if (!text || text.startsWith("REM") || text.startsWith("'")) return { kind: "ok" };
    const upper = text.toUpperCase();
    if (upper === "END" || upper === "STOP") return { kind: "end" };
    if (upper === "CLS") {
      this.output = [];
      return { kind: "ok" };
    }
    if (upper.startsWith("PRINT")) {
      this.print(this.evalPrint(text.slice(5)));
      return { kind: "ok" };
    }
    if (upper.startsWith("GOTO")) {
      return { kind: "goto", line: Number(text.slice(4).trim()) };
    }
    if (upper.startsWith("FOR")) {
      const m = text.match(/^FOR\s+([A-Z])\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i);
      if (!m) throw new Error(`SYNTAX ${lineNo}`);
      const v = m[1]!.toUpperCase();
      const start = this.num(m[2]!);
      const end = this.num(m[3]!);
      const step = m[4] ? this.num(m[4]) : 1;
      this.vars.set(v, start);
      return { kind: "for", frame: { v, end, step } };
    }
    if (upper.startsWith("NEXT")) {
      const v = text.slice(4).trim().toUpperCase();
      return { kind: "next", v };
    }
    if (upper.startsWith("IF")) {
      const m = text.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/i);
      if (!m) throw new Error(`SYNTAX ${lineNo}`);
      if (this.truthy(m[1]!)) {
        const thenPart = m[2]!.trim();
        if (/^\d+$/.test(thenPart)) return { kind: "goto", line: Number(thenPart) };
        return this.exec(thenPart, lineNo);
      }
      return { kind: "ok" };
    }
    if (upper.startsWith("LET ")) {
      this.assign(text.slice(4));
      return { kind: "ok" };
    }
    if (/^[A-Z]\s*=/.test(upper)) {
      this.assign(text);
      return { kind: "ok" };
    }
    throw new Error(`SYNTAX ${lineNo}`);
  }

  private assign(text: string): void {
    const m = text.match(/^([A-Z])\s*=\s*(.+)$/i);
    if (!m) throw new Error("SYNTAX");
    const name = m[1]!.toUpperCase();
    const rhs = m[2]!.trim();
    this.vars.set(name, rhs.startsWith('"') ? this.unquote(rhs) : this.num(rhs));
  }

  private evalPrint(raw: string): string {
    if (!raw.trim()) return "";
    const parts = splitPrint(raw);
    return parts
      .map((part) => {
        const t = part.trim();
        if (!t) return "";
        if (t.startsWith('"')) return this.unquote(t);
        const v = t.toUpperCase();
        if (this.vars.has(v)) return String(this.vars.get(v));
        return String(this.num(t));
      })
      .join(" ");
  }

  private unquote(text: string): string {
    const m = text.match(/^"(.*)"$/);
    return m ? m[1]!.replace(/""/g, '"') : text;
  }

  private num(expr: string): number {
    const tokenized = expr.replace(/([A-Z])/gi, (name) => {
      const v = this.vars.get(name.toUpperCase());
      if (typeof v === "number") return String(v);
      if (typeof v === "string") return String(Number(v) || 0);
      return name;
    });
    if (!/^[-+*/().\d\s]+$/.test(tokenized)) throw new Error("BAD EXPR");
    const value = Function(`"use strict"; return (${tokenized});`)() as unknown;
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("BAD EXPR");
    return value;
  }

  private truthy(expr: string): boolean {
    const m = expr.match(/^(.+?)(<=|>=|<>|=|<|>)(.+)$/);
    if (!m) return this.num(expr) !== 0;
    const a = this.num(m[1]!);
    const b = this.num(m[3]!);
    const op = m[2]!;
    if (op === "=") return a === b;
    if (op === "<>") return a !== b;
    if (op === "<") return a < b;
    if (op === ">") return a > b;
    if (op === "<=") return a <= b;
    return a >= b;
  }

  private help(): void {
    this.print("PRINT LET FOR NEXT GOTO IF END");
    this.print("LOAD HELLO  LOAD COUNT");
    this.print("LIST RUN NEW CLS HELP");
    this.print("Type a numbered line to store it.");
  }

  private submit(): void {
    const raw = this.input.trim();
    this.input = "";
    if (!raw) return;
    this.print("> " + raw);
    const upper = raw.toUpperCase();
    try {
      if (/^\d/.test(raw)) {
        this.storeLine(raw);
        return;
      }
      if (upper === "LIST") return this.list();
      if (upper === "RUN") return this.run();
      if (upper === "NEW") {
        this.lines.clear();
        this.vars.clear();
        this.print("READY.");
        return;
      }
      if (upper === "HELP") return this.help();
      if (upper === "CLS") {
        this.output = [];
        return;
      }
      if (upper.startsWith("LOAD ")) return this.loadSample(raw.slice(5).trim());
      if (upper === "LOAD") {
        this.print("LOAD HELLO  or  LOAD COUNT");
        return;
      }
      const result = this.exec(raw, 0);
      if (result.kind === "end") this.print("READY.");
    } catch (err) {
      this.print("?" + (err instanceof Error ? err.message : "ERROR"));
    }
  }

  draw(lcd: Lcd): void {
    lcd.clear();
    lcd.fillRect(0, 0, 320, 20, palette.panel);
    lcd.text(8, 6, "BASIC", palette.accent);
    lcd.text(80, 6, this.running ? "RUN" : "READY", this.running ? palette.warn : palette.dim);
    lcd.text(200, 6, "HELLO/COUNT", palette.dim);

    const visible = 32;
    const start = Math.max(0, this.output.length - visible + this.scroll);
    const slice = this.output.slice(start, start + visible);
    slice.forEach((line, i) => {
      lcd.text(6, 26 + i * 8, line.slice(0, 52), palette.fg);
    });

    const y = 304;
    lcd.fillRect(0, y - 4, 320, 20, palette.panel);
    const prompt = "> " + this.input;
    const shown = prompt.slice(-50);
    lcd.text(6, y, shown + (this.cursorOn ? "_" : ""), palette.accent);
  }

  key(event: KeyEvent): void {
    if (event.id === "ESC") {
      this.runtime.home();
      return;
    }
    if (event.id === "ENTER") {
      this.submit();
      return;
    }
    if (event.id === "BKSP") {
      this.input = this.input.slice(0, -1);
      return;
    }
    if (event.id === "UP") {
      this.scroll = Math.max(this.scroll - 1, Math.min(0, 32 - this.output.length));
      return;
    }
    if (event.id === "DOWN") {
      this.scroll = Math.min(0, this.scroll + 1);
      return;
    }
    if (event.id === "TAB") {
      if (!this.input) this.input = "LOAD HELLO";
      return;
    }
    if (event.id === "F1") {
      this.loadSample("HELLO");
      return;
    }
    if (event.id === "F2") {
      this.loadSample("COUNT");
      return;
    }
    if (event.char && event.char >= " " && event.char.length === 1) {
      if (this.input.length < 80) this.input += event.char;
    }
  }
}

type ExecResult =
  | { kind: "ok" }
  | { kind: "end" }
  | { kind: "goto"; line: number }
  | { kind: "for"; frame: { v: string; end: number; step: number } }
  | { kind: "next"; v: string };

function splitPrint(raw: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote = false;
  for (const ch of raw) {
    if (ch === '"') quote = !quote;
    if ((ch === "," || ch === ";") && !quote) {
      out.push(buf);
      buf = "";
    } else buf += ch;
  }
  if (buf) out.push(buf);
  return out;
}
