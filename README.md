# SkoolBox

Klasserom-app for storskjerm/tavle: elevtrekker, quiz-arena, nedtelling og klasseliste. Bygget med Tauri 2.0 + React + Vite.

## Utvikling

- `npm run dev` — starter kun Vite-frontenden i nettleser (rask UI-iterasjon, ingen Rust-kompilering).
- `npm run start` — starter selve skrivebordsappen (`tauri dev`), med hot-reload.
- `npm run build` — bygger frontend til `dist/` (brukes internt av Tauri).
- `npm run tauri build` — bygger de installerbare filene (NSIS `-setup.exe` og MSI) i `src-tauri/target/release/bundle/`.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
