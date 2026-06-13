# LoopTrain Devlog

LoopTrain Devlog is a static Astro site for `looptrain.me`.

## Local development

```bash
npm install
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:4321/
```

## Build and verify

```bash
npm run build
npx astro check
```

The static output is generated in:

```text
dist/
```

## Game entry route

The website CTA uses a stable internal route:

```text
/play/game
```

This route is intentionally deployment-owned. The final game runtime path is not hardcoded in page components.

During deployment, configure Nginx so `/play/game` points to the real LoopTrain game runtime, for example the current ST Game Shell target:

```text
http://127.0.0.1:8000/?looptrain=game
```

See:

```text
nginx/looptrain.me.conf
```

If the game runtime changes later, keep `/play/game` stable and update only the Nginx mapping.

## Important constraints

- Static site first: no database, login, comments, CMS, payment, or user upload.
- Game entry is the first product goal.
- Do not reveal core mystery spoilers.
- Public character pages must keep hidden NPCs locked.
