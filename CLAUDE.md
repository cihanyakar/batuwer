# CLAUDE.md

## Project Overview

Batuwer is a co-op tower defense game (up to 4 players) built with Phaser 3 (client) and Socket.IO (server). Supports single player and multiplayer with a WC3-style lobby system.

## Tech Stack

- **Client**: Phaser 3, TypeScript, Vite
- **Server**: Node.js, Socket.IO, TypeScript (tsx for dev)
- **Shared**: Game logic, types, map data shared between client and server
- **Testing**: Vitest
- **Linting**: ESLint (flat config) with strict TypeScript rules

## Project Structure

```
src/
  shared/                    # Pure logic & data — NO framework imports
    types.ts                 # All interfaces, events, GAME_CONFIG
    maps.ts                  # MapDefinition data (Grasslands, Fortress)
    lobby-logic.ts           # Pure lobby state machine functions
    lobby-logic.test.ts      # 27 tests
    utils.ts                 # clamp, generateId
    utils.test.ts
  server/
    index.ts                 # HTTP + Socket.IO wiring → LobbyManager
    lobby-manager.ts         # Manages lobbies (EventEmitter), calls lobby-logic
    lobby-manager.test.ts    # 15 tests
    game-session.ts          # Stub for future game loop
  client/
    main.ts                  # Phaser config, scene list
    network.ts               # Socket.IO typed wrapper
    settings-store.ts        # In-memory GameSettings store
    ui/
      button.ts              # Reusable Phaser button component
      text-input.ts          # Reusable Phaser text input component
      panel.ts               # Reusable panel background component
    scenes/
      boot-scene.ts          # → MainMenuScene
      main-menu-scene.ts     # Single Player / Multiplayer / Settings
      settings-scene.ts      # Player name, volume sliders
      map-select-scene.ts    # Map cards with path preview
      lobby-browser-scene.ts # Browse/create/join lobbies
      lobby-scene.ts         # WC3-style: 4 slots, ready, map preview
      game-scene.ts          # Map renderer placeholder
      hud-scene.ts           # Minimal HUD overlay
```

## Scene Flow

```
BootScene → MainMenuScene
               ├── Single Player → MapSelectScene → GameScene + HudScene
               ├── Multiplayer  → LobbyBrowserScene → LobbyScene → GameScene + HudScene
               └── Settings     → SettingsScene → MainMenuScene
```

## Commands

- `npm run dev` — Start both server and client concurrently
- `npm run dev:server` — Server only (tsx watch, port 3000)
- `npm run dev:client` — Client only (Vite, port 5173, proxies /socket.io to server)
- `npm run build` — TypeScript check + Vite build
- `npm test` — Run tests once (`vitest run`)
- `npm run test:watch` — Run tests in watch mode
- `npm run lint` — ESLint check
- `npm run lint:fix` — ESLint autofix
- `npm run typecheck` — `tsc --noEmit`

## Code Conventions

- **Strict TypeScript**: `strict: true`, no `any`, explicit return types on exported functions
- **Type imports**: Use `import type` at top level when all specifiers are types; use inline `type` keyword when mixing value and type imports from same module
- **Naming**: camelCase default, PascalCase for types, UPPER_CASE for enum members and constants
- **File naming**: kebab-case enforced by ESLint unicorn/filename-case
- **Path aliases**: `@shared/*`, `@client/*`, `@server/*` (configured in tsconfig + vite + vitest)
- **Imports**: Ordered by builtin > external > internal > parent > sibling, no newlines between groups
- **Tests**: Use `it()` (not `test()`), `toStrictEqual` preferred, top-level `describe` required, test files colocated as `*.test.ts`
- **Strings**: Extract duplicate strings (3+ occurrences) as constants (sonarjs/no-duplicate-string)

## Git Hooks (Husky)

- **pre-commit**: Runs `lint-staged` (ESLint + tsc on staged .ts files) then `vitest run` (all tests must pass)
- **commit-msg**: Enforces Conventional Commits format — `type(scope): description` (e.g. `feat(game): add wave system`)

## Core Principle: Logic / UI Separation

**Game logic must NEVER know about UI.** This is the #1 architectural rule.

- All game logic lives in `src/shared/` as pure functions and plain data structures. No Phaser imports, no DOM, no Socket.IO — only plain TypeScript operating on plain objects.
- `src/client/` is a thin rendering layer that reads state and draws it. It never computes game rules.
- `src/server/` orchestrates networking but delegates all game rules to `src/shared/`.
- Every piece of game logic must be unit-testable without any runtime environment (no browser, no server, no mocks of UI frameworks).
- When adding a new feature: write the logic as a pure function in `src/shared/` with tests first, then wire it into server and client separately.

**Litmus test**: If you can't test it with `vitest run` in a plain Node process without mocking Phaser/Socket.IO/DOM, the logic is in the wrong place.

## Architecture Notes

- Lobby logic is a pure state machine in `src/shared/lobby-logic.ts`; server's `LobbyManager` calls these functions
- `LobbyManager` extends EventEmitter; server `index.ts` wires events to Socket.IO rooms (`lobby:${id}`)
- Maps are defined as pure data in `src/shared/maps.ts` — add new maps by adding `MapDefinition` objects
- Socket events are typed via `ServerToClientEvents` / `ClientToServerEvents` interfaces
- Client UI components (button, text-input, panel) are factory functions, not Phaser class extensions
- Vite dev server proxies `/socket.io` to the game server on port 3000
- All UI is rendered in Phaser — no HTML/CSS for game UI
