import { Lcd, palette } from "../lcd";
import type { KeyEvent } from "../keys";
import type { App, Runtime } from "../runtime";

/** LCWO / Koch introduction order. */
const KOCH = [
  "K",
  "M",
  "R",
  "S",
  "U",
  "A",
  "P",
  "T",
  "L",
  "O",
  "W",
  "I",
  ".",
  "N",
  "J",
  "E",
  "F",
  "0",
  "Y",
  ",",
  "V",
  "G",
  "5",
  "/",
  "Q",
  "9",
  "Z",
  "H",
  "3",
  "8",
  "B",
  "?",
  "4",
  "2",
  "7",
  "C",
  "1",
  "D",
  "6",
  "X",
  "=",
  "+",
] as const;

const MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "/": "-..-.",
  "=": "-...-",
  "+": ".-.-.",
};

const GROUP = 5;
const CALLSIGN = "K6WRJ";

export class MorseApp implements App {
  readonly id = "morse";
  readonly title = "Morse Koch";
  wpm = 12;
  private lesson = 2;
  private playing = false;
  private target = "";
  private typed = "";
  private lastResult = "";
  private correct = 0;
  private total = 0;
  private audio: AudioContext | null = null;
  private playGen = 0;

  constructor(private readonly runtime: Runtime) {}

  enter(): void {
    this.typed = "";
    this.lastResult = "";
    this.playing = false;
  }

  exit(): void {
    this.playGen += 1;
    void this.audio?.close();
    this.audio = null;
  }

  private charset(): string[] {
    return KOCH.slice(0, Math.max(2, this.lesson)).map((c) => c);
  }

  private async ensureAudio(): Promise<AudioContext> {
    if (!this.audio || this.audio.state === "closed") {
      this.audio = new AudioContext();
    }
    if (this.audio.state === "suspended") await this.audio.resume();
    return this.audio;
  }

  private async playGroup(): Promise<void> {
    if (this.playing) return;
    const set = this.charset();
    this.target = Array.from({ length: GROUP }, () => set[Math.floor(Math.random() * set.length)]!).join("");
    this.typed = "";
    this.lastResult = "";
    this.playing = true;
    const gen = ++this.playGen;
    try {
      const ctx = await this.ensureAudio();
      const dit = 1.2 / this.wpm;
      let t = ctx.currentTime + 0.05;
      for (const ch of this.target) {
        const code = MORSE[ch] ?? "";
        for (const mark of code) {
          const dur = mark === "-" ? dit * 3 : dit;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 600;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.18, t + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + dur + 0.01);
          t += dur + dit;
        }
        t += dit * 2;
      }
      const waitMs = Math.max(0, (t - ctx.currentTime) * 1000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } finally {
      if (gen === this.playGen) this.playing = false;
    }
  }

  private submit(): void {
    if (!this.target || this.playing) return;
    const guess = this.typed.toUpperCase();
    this.total += 1;
    if (guess === this.target) {
      this.correct += 1;
      this.lastResult = "OK  " + this.target;
      if (this.correct >= 3 && this.correct / this.total >= 0.9 && this.lesson < KOCH.length) {
        this.lesson += 1;
        this.lastResult = "OK  next " + KOCH[this.lesson - 1];
      }
    } else {
      this.lastResult = this.target + " != " + (guess || "?");
    }
    this.typed = "";
    this.target = "";
  }

  draw(lcd: Lcd): void {
    lcd.clear();
    lcd.fillRect(0, 0, 320, 28, palette.panel);
    lcd.text(10, 8, "KOCH", palette.accent, 2);
    lcd.text(140, 12, CALLSIGN, palette.warn);
    lcd.text(230, 12, `${this.wpm} WPM`, palette.info);

    const set = this.charset().join(" ");
    lcd.text(12, 42, `Lesson ${this.lesson} / ${KOCH.length}`, palette.fg);
    lcd.text(12, 56, wrap(set, 50), palette.dim);

    lcd.fillRect(10, 86, 300, 70, "#04100a");
    lcd.strokeRect(10, 86, 300, 70, palette.dim);
    lcd.text(18, 96, this.playing ? "Listening..." : this.target ? "Copy the group" : "Space plays a 5-char group", this.playing ? palette.warn : palette.dim);
    lcd.text(18, 118, this.typed.padEnd(GROUP, "_").split("").join(" "), palette.fg, 2);
    lcd.text(18, 142, this.lastResult, this.lastResult.startsWith("OK") ? palette.accent : palette.danger);

    const pct = this.total ? Math.round((this.correct / this.total) * 100) : 0;
    lcd.text(12, 170, `Score  ${this.correct} / ${this.total}   ${pct}%`);

    lcd.text(12, 198, "Koch method: full speed from the", palette.dim);
    lcd.text(12, 210, "first day. Start with K and M,", palette.dim);
    lcd.text(12, 222, "add a letter when copy is solid.", palette.dim);
    lcd.text(12, 242, "Default 12 WPM  ·  tone 600 Hz", palette.dim);

    lcd.text(12, 272, "+/- WPM    [ ] lesson    Ent check", palette.dim);
    lcd.text(12, 284, "Space play group of 5", palette.dim);
    lcd.text(12, 304, "Esc menu", palette.dim);
  }

  key(event: KeyEvent): void {
    if (event.id === "ESC") {
      this.runtime.home();
      return;
    }
    if (event.id === " " && !this.target && !this.playing) {
      void this.playGroup();
      return;
    }
    if (event.id === "ENTER") {
      if (this.target) this.submit();
      else void this.playGroup();
      return;
    }
    if (event.char === "+" || event.id === "UP" || event.id === "F2") {
      this.wpm = Math.min(40, this.wpm + 1);
      return;
    }
    if (event.char === "-" || event.id === "DOWN" || event.id === "F1") {
      this.wpm = Math.max(5, this.wpm - 1);
      return;
    }
    if (event.id === "]" || event.id === "RIGHT") {
      this.lesson = Math.min(KOCH.length, this.lesson + 1);
      return;
    }
    if (event.id === "[" || event.id === "LEFT") {
      this.lesson = Math.max(2, this.lesson - 1);
      return;
    }
    if (event.id === "BKSP" || event.id === "DEL") {
      this.typed = this.typed.slice(0, -1);
      return;
    }
    if (this.playing || !this.target) return;
    const ch = event.char.toUpperCase();
    if (ch && this.typed.length < GROUP && (MORSE[ch] || ch === " ")) {
      if (ch !== " ") this.typed += ch;
    }
  }
}

function wrap(text: string, width: number): string {
  return text.length <= width ? text : text.slice(0, width);
}
