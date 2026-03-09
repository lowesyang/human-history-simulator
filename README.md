# Human History Simulator

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/human-history-simulator/pulls)

**Human History Simulator** is an AI-powered civilization simulator that uses large language models as simulation engines — not chatbots. Pick any era from 1600 BCE to 2000 CE, and watch dozens of civilizations evolve on an interactive world map as the AI generates events, computes state transitions, and reshapes the geopolitical landscape turn by turn.

<p align="center">
  <img src="docs/assets/screenshot.png" alt="Human History Simulator Screenshot" width="100%" />
</p>

Every civilization carries a rich state snapshot — rulers, government, economy, military, technology, culture, demographics, diplomacy — and every turn produces historically grounded mutations: wars redraw borders, trade routes shift wealth, plagues decimate populations, and inventions spark new eras. Same starting conditions, different emergent histories.

[English](./README.md) · [中文](./README.zh-CN.md)

## Highlights

- **[19 Historical Eras](#supported-eras)** — Bronze Age through Modern World, each seeded with dozens of historically accurate civilizations.
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

|     | Era                       | Year     | Description                                                                                                                |
| --- | ------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 🏺  | **Bronze Age**            | 1600 BCE | Shang Dynasty founded, Babylonian Empire at peak, Egyptian New Kingdom rising, Mycenaean civilization flourishing          |
| ⚔️  | **Iron Age**              | 800 BCE  | Late Western Zhou, Assyrian Empire dominant, Greek city-states emerging, Phoenicians trading across Mediterranean          |
| 🧘  | **Axial Age**             | 500 BCE  | Age of Confucius and Laozi, Persian Empire at peak, Greek democracy established, Buddha teaching in India                  |
| 🏛️  | **Hellenistic Period**    | 323 BCE  | Alexander the Great just died, empire fragmenting, Warring States era in China, Maurya Empire unifying India               |
| 👑  | **Qin-Han & Rome**        | 221 BCE  | Qin Shi Huang unifies China, Roman Republic expanding, Punic Wars ongoing, Maurya Empire at peak                           |
| 🛣️  | **Twin Empires**          | 100 CE   | Eastern Han at peak, Roman Empire under Trajan, Silk Road thriving, Kushan Empire bridging East and West                   |
| 🐉  | **Three Kingdoms**        | 220 CE   | Wei, Shu, Wu competing, Roman Empire in Third Century Crisis, Sassanid Persia rising, Gupta Empire emerging                |
| 🏚️  | **Fall of Rome**          | 476 CE   | Western Roman Empire fallen, Northern and Southern Dynasties in China, Byzantine Empire endures, barbarian kingdoms emerge |
| 🌸  | **Tang Golden Age**       | 750 CE   | Tang Dynasty at apex before An Lushan Rebellion, Abbasid Caliphate just established, Carolingian Empire emerging           |
| ⚜️  | **Age of Crusades**       | 1200 CE  | Southern Song in China, Mongol Empire about to rise, Crusades continuing, Kamakura Shogunate in Japan                      |
| 🏇  | **Mongol Empire**         | 1280 CE  | Yuan Dynasty rules China, Mongol Empire spans Eurasia, Marco Polo visits China, Delhi Sultanate resists Mongols            |
| 🎨  | **Renaissance**           | 1500 CE  | Ming Dynasty thriving, Ottoman Empire at peak, European Renaissance, Age of Exploration begins                             |
| 🔭  | **Early Modern Period**   | 1648 CE  | Thirty Years' War ends, Westphalian system established, early Qing Dynasty, Scientific Revolution underway                 |
| 💡  | **Age of Enlightenment**  | 1750 CE  | Qing Dynasty Qianlong era, European Enlightenment at peak, eve of French Revolution, Industrial Revolution beginning       |
| 🏭  | **Industrial Revolution** | 1840 CE  | Opium War begins, Victorian Britain, Industrial Revolution transforming the world, Japan approaching Meiji Restoration     |
| 🌍  | **Age of Imperialism**    | 1900 CE  | British Empire at zenith, USA rising, Meiji Japan industrialized, Scramble for Africa complete                             |
| 💥  | **World War Era**         | 1939 CE  | WWII begins, Nazi Germany expanding, Japan invading China, Soviet Union preparing, USA neutral but soon to join            |
| ☢️  | **Cold War Era**          | 1962 CE  | Cuban Missile Crisis, US-Soviet confrontation, decolonization wave, Space Race intensifying                                |
| 🌐  | **Modern World**          | 2000 CE  | Turn of millennium, Internet age dawning, globalization accelerating, China joining WTO                                    |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
