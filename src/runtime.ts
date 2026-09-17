import { Lcd } from "./lcd";
import type { KeyEvent } from "./keys";

export interface App {
  readonly id: string;
  readonly title: string;
  enter(): void;
  exit(): void;
  draw(lcd: Lcd): void;
  key(event: KeyEvent): void;
  tick?(dt: number): void;
}

export class Runtime {
  private readonly apps = new Map<string, App>();
  private current: App | null = null;
  homeId = "menu";

  register(app: App): void {
    this.apps.set(app.id, app);
  }

  get(id: string): App | undefined {
    return this.apps.get(id);
  }

  list(): App[] {
    return [...this.apps.values()];
  }

  get active(): App | null {
    return this.current;
  }

  go(id: string): void {
    if (this.current?.id === id) return;
    this.current?.exit();
    const next = this.apps.get(id);
    if (!next) return;
    this.current = next;
    next.enter();
  }

  home(): void {
    this.go(this.homeId);
  }

  draw(lcd: Lcd): void {
    this.current?.draw(lcd);
  }

  key(event: KeyEvent): void {
    this.current?.key(event);
  }

  tick(dt: number): void {
    this.current?.tick?.(dt);
  }
}
