import "./style.css";
import { AboutApp, PICOMITE } from "./apps/about";
import { BasicApp } from "./apps/basic";
import { CalculatorApp } from "./apps/calculator";
import { MenuApp } from "./apps/menu";
import { MorseApp } from "./apps/morse";
import { SnakeApp } from "./apps/snake";
import { KEY_ROWS, findKey, hostEventToPicoId, resolveChar, type KeyEvent, type PicoKeyId } from "./keys";
import { Lcd, palette } from "./lcd";
import { Runtime } from "./runtime";

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("#app missing");

appRoot.innerHTML = `
  <div class="page">
    <header>
      <h1>Virtual PicoCalc</h1>
      <p>
        A visual ClockworkPi PicoCalc in the browser — 320×320 LCD, backlit QWERTY, and PWR.
        Full MMBasic lives at
        <a href="${PICOMITE}" target="_blank" rel="noreferrer">PicoMite All Versions</a>.
      </p>
    </header>
    <div class="device" data-power="on" data-backlight="on" data-caps="off">
      <div class="brand-row">
        <div class="brand">ClockworkPi · PicoCalc</div>
        <div class="power-cluster">
          <span class="led" aria-hidden="true"></span>
          <button type="button" class="pwr" title="Power">PWR</button>
        </div>
      </div>
      <div class="bezel">
        <canvas class="lcd" width="320" height="320" aria-label="PicoCalc LCD"></canvas>
      </div>
      <div class="speaker" aria-hidden="true"></div>
      <div class="kbd"></div>
    </div>
    <p class="hint">
      Click the keys or type. Esc returns to the launcher. Alt+Space toggles keyboard backlight.
      Snake waits for the first arrow or WASD. Morse Koch defaults to 12 WPM (K6WRJ).
    </p>
  </div>
`;

const device = appRoot.querySelector<HTMLDivElement>(".device")!;
const canvas = appRoot.querySelector<HTMLCanvasElement>("canvas.lcd")!;
const kbdEl = appRoot.querySelector<HTMLDivElement>(".kbd")!;
const pwrBtn = appRoot.querySelector<HTMLButtonElement>(".pwr")!;
const lcd = new Lcd(canvas);

for (const row of KEY_ROWS) {
  const rowEl = document.createElement("div");
  rowEl.className = "kbd-row";
  for (const key of row) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.tabIndex = -1;
    btn.className = "key";
    btn.dataset.id = key.id;
    if (key.wide) btn.dataset.wide = String(key.wide);
    btn.textContent = key.label;
    rowEl.append(btn);
  }
  kbdEl.append(rowEl);
}

const runtime = new Runtime();
runtime.register(new MenuApp(runtime));
runtime.register(new AboutApp(runtime));
runtime.register(new CalculatorApp(runtime));
runtime.register(new MorseApp(runtime));
runtime.register(new SnakeApp(runtime));
runtime.register(new BasicApp(runtime));

let power = true;
let backlight = true;
let shift = false;
let caps = false;
let ctrl = false;
let alt = false;
let boot = 0.7;

runtime.go("menu");

function setPower(next: boolean): void {
  power = next;
  device.dataset.power = power ? "on" : "off";
  if (power) {
    boot = 0.7;
    runtime.go("menu");
  }
}

function setBacklight(next: boolean): void {
  backlight = next;
  device.dataset.backlight = backlight ? "on" : "off";
}

function flashKey(id: PicoKeyId, down: boolean): void {
  const btn = kbdEl.querySelector<HTMLButtonElement>(`.key[data-id="${cssEscape(id)}"]`);
  btn?.classList.toggle("is-down", down);
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function dispatch(id: PicoKeyId, repeat = false): void {
  if (id === "PWR") {
    setPower(!power);
    return;
  }
  if (!power) return;

  if (id === "SHL" || id === "SHR") {
    shift = true;
    return;
  }
  if (id === "CTRL") {
    ctrl = true;
    return;
  }
  if (id === "ALT") {
    alt = true;
    return;
  }
  if (id === "CAPS") {
    caps = !caps;
    device.dataset.caps = caps ? "on" : "off";
    return;
  }
  if (id === " " && alt) {
    setBacklight(!backlight);
    return;
  }

  const key = findKey(id);
  const event: KeyEvent = {
    id,
    char: key ? resolveChar(key, shift, caps) : "",
    shift,
    caps,
    ctrl,
    alt,
    repeat,
  };
  runtime.key(event);
}

function releaseModifier(id: PicoKeyId): void {
  if (id === "SHL" || id === "SHR") shift = false;
  if (id === "CTRL") ctrl = false;
  if (id === "ALT") alt = false;
}

kbdEl.addEventListener("pointerdown", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".key");
  if (!btn) return;
  const id = btn.dataset.id as PicoKeyId;
  flashKey(id, true);
  btn.blur();
  dispatch(id);
});

window.addEventListener("pointerup", () => {
  kbdEl.querySelectorAll(".key.is-down").forEach((el) => el.classList.remove("is-down"));
  shift = false;
  ctrl = false;
  alt = false;
});

pwrBtn.tabIndex = -1;
pwrBtn.addEventListener("click", (e) => {
  e.preventDefault();
  pwrBtn.blur();
  setPower(!power);
});

device.addEventListener(
  "keydown",
  (e) => {
    if ((e.key === "Enter" || e.key === " ") && (e.target as HTMLElement).closest("button")) {
      e.preventDefault();
    }
  },
  true,
);

window.addEventListener("keydown", (e) => {
  const id = hostEventToPicoId(e);
  if (!id) return;
  if (["Tab", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "F1", "F2", "F3", "F4", "F5"].includes(e.key)) {
    e.preventDefault();
  }
  flashKey(id, true);
  dispatch(id, e.repeat);
});

window.addEventListener("keyup", (e) => {
  const id = hostEventToPicoId(e);
  if (!id) return;
  flashKey(id, false);
  releaseModifier(id);
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (power) {
    if (boot > 0) {
      boot -= dt;
      lcd.clear("#020806");
      lcd.center(130, "PicoCalc", palette.accent, 3);
      lcd.center(180, "K6WRJ", palette.warn, 2);
      lcd.center(214, "320 x 320", palette.dim);
    } else {
      runtime.tick(dt);
      runtime.draw(lcd);
    }
  } else {
    lcd.clear("#010201");
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
