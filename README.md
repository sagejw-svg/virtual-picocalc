# Virtual PicoCalc

A browser mock of the [ClockworkPi PicoCalc](https://www.clockworkpi.com/picocalc): a 320×320 LCD, a backlit 67-key QWERTY, and a PWR switch. It is a visual handheld you can click or type on — not a cycle-accurate emulator.

For the real PicoMite / MMBasic interpreter in a browser, use [PicoMite All Versions](https://jvanderberg.github.io/PicoMiteAllVersions/).

## Apps

| App | Notes |
| --- | --- |
| **About** | Device credits, K6WRJ, link out to PicoMite |
| **Calculator** | Four-function pocket calc (`+ - * /`, percent, clear) |
| **Morse Koch** | Koch-method trainer, **12 WPM** default, callsign **K6WRJ** |
| **Snake** | Stays still until the first arrow key or WASD |
| **BASIC** | Toy interpreter with `HELLO` and `COUNT` samples |

## Controls

- On-screen keys or your computer keyboard
- **Esc** returns to the launcher
- **PWR** sleeps and wakes the device
- **Alt+Space** toggles keyboard backlight
- Morse: Space plays a 5-character group, `+/-` changes WPM, `[ ]` changes lesson
- BASIC: `LOAD HELLO`, `LOAD COUNT`, `LIST`, `RUN`, `NEW`, `HELP`

## Develop

```bash
npm install
npm run dev
```

Production build (required for Pages):

```bash
npm run build
```

Vite is configured with `base: './'` so the `dist/` bundle works from a project Pages URL or any subpath.

## GitHub Pages

Pushing `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml). That workflow builds the Vite app and deploys `dist/` with GitHub Actions.

Live site: <https://sagejw-svg.github.io/virtual-picocalc/>

The first deploy needs Pages turned on once: **Settings → Pages → Source = GitHub Actions**. After that, re-run the workflow (or push `main` again). GitHub App tokens cannot create the Pages site; a repo admin has to flip that switch.

## License

MIT
