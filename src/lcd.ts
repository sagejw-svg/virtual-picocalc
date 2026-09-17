import { CELL_H, CELL_W, GLYPH_H, GLYPH_W, glyphColumns } from "./font";

export const LCD_SIZE = 320;

export const palette = {
  bg: "#07140e",
  panel: "#0c1d14",
  fg: "#c6f5c0",
  dim: "#5d8a62",
  accent: "#3ecf8e",
  warn: "#e8c36a",
  danger: "#ff6b4a",
  info: "#7ec8ff",
  snake: "#4ae07a",
  food: "#ff5a7a",
  invertBg: "#3ecf8e",
  invertFg: "#07140e",
} as const;

export class Lcd {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly width = LCD_SIZE;
  readonly height = LCD_SIZE;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas is required");
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = false;
  }

  clear(color: string = palette.bg): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  fillRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
  }

  pset(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 1, 1);
  }

  text(x: number, y: number, value: string, color: string = palette.fg, scale = 1): void {
    let cx = Math.round(x);
    const cy = Math.round(y);
    for (const ch of value) {
      if (ch === "\n") continue;
      const cols = glyphColumns(ch);
      for (let col = 0; col < GLYPH_W; col++) {
        const bits = cols[col] ?? 0;
        for (let row = 0; row < GLYPH_H; row++) {
          if (bits & (1 << row)) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(cx + col * scale, cy + row * scale, scale, scale);
          }
        }
      }
      cx += CELL_W * scale;
    }
  }

  textInv(x: number, y: number, value: string, scale = 1): void {
    const w = value.length * CELL_W * scale + scale;
    const h = CELL_H * scale;
    this.fillRect(x - scale, y - scale, w + scale, h + scale, palette.invertBg);
    this.text(x, y, value, palette.invertFg, scale);
  }

  center(y: number, value: string, color: string = palette.fg, scale = 1): void {
    const w = value.length * CELL_W * scale;
    this.text(Math.floor((this.width - w) / 2), y, value, color, scale);
  }

  hline(x: number, y: number, w: number, color: string = palette.dim): void {
    this.fillRect(x, y, w, 1, color);
  }

  cols(scale = 1): number {
    return Math.floor(this.width / (CELL_W * scale));
  }

  rows(scale = 1): number {
    return Math.floor(this.height / (CELL_H * scale));
  }

  cellX(col: number, scale = 1): number {
    return col * CELL_W * scale;
  }

  cellY(row: number, scale = 1): number {
    return row * CELL_H * scale;
  }
}
