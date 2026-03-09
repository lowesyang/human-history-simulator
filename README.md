# Human History Simulator

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/human-history-simulator/pulls)

**Human History Simulator** is an AI-powered civilization simulator that uses large language models as simulation engines — not chatbots. Pick any era from 1600 BCE to 2000 CE, and watch dozens of civilizations evolve on an interactive world map as the AI generates events, computes state transitions, and reshapes the geopolitical landscape turn by turn.

Every civilization carries a rich state snapshot — rulers, government, economy, military, technology, culture, demographics, diplomacy — and every turn produces historically grounded mutations: wars redraw borders, trade routes shift wealth, plagues decimate populations, and inventions spark new eras. Same starting conditions, different emergent histories.

[English](./README.md) · [中文](./README.zh-CN.md)

## Highlights

- **19 Historical Eras** — Bronze Age through Modern World, each seeded with dozens of historically accurate civilizations.
- **LLM-Driven Evolution** — AI orchestrator clusters regions, generates events, and computes per-field state transitions across economy, military, diplomacy, culture, and more.
- **Interactive World Map** — Territory overlays with hover inspection and click-to-detail for every civilization.
- **Deep Civilization Profiles** — 10 tabs per region: Political, Military, Economy, Finances, Technology, Culture, Demographics, Diplomacy, Assessment, History.
- **War System** — Structured conflict tracking with belligerents, casus belli, strategic advantages, and post-war impact.
- **Custom Events** — Inject "what-if" events and watch the AI react.
- **Time Control** — Play / pause / step / advance by epoch / rollback to any year.
- **Bilingual** — Full English & Chinese UI with localized civilization data.

## How It Works

Each time you advance the clock, the simulation runs a multi-stage pipeline:

1. **Event Generation** — AI produces historically grounded events (wars, inventions, treaties, disasters, migrations) for the upcoming period. You can also inject custom events for alternative history scenarios.

2. **Region Clustering** — The orchestrator builds a relation graph from event co-occurrence, war belligerents, and territory proximity, then extracts connected components via BFS. Related civilizations are grouped together; isolated ones are batched separately.

3. **Historian Agents** — Each group is dispatched to specialized LLM prompts: **Direct** (full impact for event-affected regions), **Indirect** (ripple effects for neighbors), or **Independent** (internal evolution for isolated regions). Up to 10 groups run in parallel with auto-retry.

4. **State Transitions** — The LLM returns compact JSON diffs (dot-notation field deltas), not full snapshots. The engine applies relative deltas, absolute sets, and auto-calculated fields to produce the next world state.

5. **War Extraction** — A dedicated analyzer extracts structured conflict data from war events — belligerents, causes, advantages, impact — and tracks wars across epochs.

6. **Evolution Logging** — Per-epoch changelogs record every field-level mutation, powering the History tab and Evolution Log panel.

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- An **[OpenRouter](https://openrouter.ai/)** API key

### Install & Run

```bash
git clone https://github.com/your-username/human-history-simulator.git
cd human-history-simulator
npm install
```

Create `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
LLM_MODEL=openai/gpt-5.4
LLM_MAX_GROUP_SIZE=10
```

| Variable             | Description                                    |
| -------------------- | ---------------------------------------------- |
| `OPENROUTER_API_KEY` | Your OpenRouter API key                        |
| `LLM_MODEL`          | Model for simulation (any model on OpenRouter) |
| `LLM_MAX_GROUP_SIZE` | Max regions per LLM call                       |

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — pick an era and start simulating.

## Scripts

| Command                      | Description                    |
| ---------------------------- | ------------------------------ |
| `npm run dev`                | Development server             |
| `npm run build`              | Production build               |
| `npm run start`              | Production server              |
| `npm run lint`               | ESLint                         |
| `npm run seed`               | Seed database with default era |
| `npm run seed -- bronze-age` | Seed with a specific era       |
| `npm run generate:eras`      | Generate era data via LLM      |

## Supported Eras

| Era                | Year     | Era                   | Year    |
| ------------------ | -------- | --------------------- | ------- |
| Bronze Age         | 1600 BCE | Tang Golden Age       | 750 CE  |
| Iron Age           | 800 BCE  | Age of Crusades       | 1200 CE |
| Axial Age          | 500 BCE  | Mongol Empire         | 1280 CE |
| Hellenistic Period | 323 BCE  | Renaissance           | 1500 CE |
| Qin-Han & Rome     | 221 BCE  | Early Modern Period   | 1648 CE |
| Twin Empires       | 100 CE   | Age of Enlightenment  | 1750 CE |
| Three Kingdoms     | 220 CE   | Industrial Revolution | 1840 CE |
| Fall of Rome       | 476 CE   | Age of Imperialism    | 1900 CE |
|                    |          | World War Era         | 1939 CE |
|                    |          | Cold War Era          | 1962 CE |
|                    |          | Modern World          | 2000 CE |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
