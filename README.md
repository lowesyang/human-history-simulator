# Human History Simulator

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/human-history-simulator/pulls)

> _If you had the power to rewrite history, where would you take humanity?_

**Human History Simulator** is a civilization simulation powered by an LLM-based multi-agent system as its historical reasoning engine. Choose from **19 eras** spanning **3,600 years**, from the Bronze Age forges of 1600 BCE to the digital networks of 2000 CE, and set **1,400+ civilizations** in motion on an interactive world map. Each civilization is a deeply modeled entity tracking **100+ state fields**: GDP, military strength, literacy, trade routes, cultural output, and far more. Every turn, the multi-agent engine weaves new events, computes state transitions, and reshapes the geopolitical landscape. No two playthroughs are ever the same.

<p align="center">
  <img src="docs/assets/screenshot.png" alt="Human History Simulator Screenshot" width="100%" />
</p>

Territory boundaries are drawn from **47 real historical GeoJSON snapshots** (2000 BCE – 2010 CE) built on open academic basemaps: actual scholarly boundary data, not approximations. Wars redraw borders. Trade routes shift wealth across continents. Plagues decimate populations. Inventions ignite revolutions. Every mutation is logged at field-level granularity, giving you a god's-eye view of cause and effect across millennia. Same starting conditions, endlessly divergent histories.

[English](./README.md) · [中文](./README.zh-CN.md)

## Highlights

- **[19 Historical Eras](#supported-eras)** covering Bronze Age through Modern World, each seeded with historically accurate civilizations, rulers, and geopolitical configurations.
- **1,400+ Civilizations** including empires, kingdoms, city-states, tribes, and trade networks, with 60 to 100 regions simulated per era.
- **Multi-Agent Evolution** where an AI orchestrator clusters regions, generates events, and computes per-field state transitions across economy, military, diplomacy, culture, and more.
- **Real Historical Boundaries** from 47 GeoJSON boundary snapshots sourced from open academic basemaps, spanning 4,000 years of territorial change.
- **Interactive World Map** with territory overlays, hover inspection, and click-to-detail for every civilization.
- **Deep Civilization Profiles** with 10 dimension tabs per region and 100+ tracked fields: rulers, government departments, GDP, trade goods, military branches, demographics, cultural achievements, and more.
- **War System** providing structured conflict tracking with belligerents, casus belli, strategic advantages, and post-war impact.
- **Custom Events** that let you inject "what-if" scenarios and watch the AI react.
- **Time Control** with play, pause, step, advance-by-epoch, and rollback to any year.
- **Bilingual** with full English & Chinese UI and localized civilization data.

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

## Roadmap

- [ ] **Smarter Simulation Engine**: Optimize historical progression efficiency and add tunable parameters like _contingency_ (chance of unexpected events) and _determinism_ (weight of structural forces) to shape the balance between chaos and inevitability.
- [ ] **Richer Civilization Profiles**: Deepen per-civilization data with more granular fields: social structure, religious influence, artistic movements, infrastructure, and more.
- [ ] **Broader Historical Coverage**: Surface overlooked but historically significant states, tribes, and regions on the map. The ones textbooks forget, but history remembers.
- [ ] **War Impact Visualization**: Go beyond event logs and visualize the ripple effects of conflict on borders, population, economy, and power balance in real time.
- [ ] **Flexible Custom Events**: Make "what-if" injection more expressive and fun: chain events, set preconditions, and craft elaborate alternate history scenarios.
- [ ] **Future Era Projection**: Extend the timeline beyond the present and let the engine speculate on humanity's next chapters: 2050, 2100, and beyond.
- [ ] **Perspective Mode**: Step into the shoes of a national leader. See the world through the strategic lens of any civilization: their threats, opportunities, alliances, and blind spots.
- [ ] **Skill-Based Agent Integration**: Expose the simulator as a set of Skills so that autonomous agents from platforms like OpenClaw can take over the human role: selecting eras, injecting events, making strategic decisions, and driving the simulation forward without manual interaction.
- [ ] **Historical Economics & Finance Data**: Integrate more accurate per-era economic and financial data — trade volumes, monetary systems, taxation structures, debt levels, and wealth distribution — to ground each civilization's economy in real historical research.
- [ ] **Core Asset Price Tracking**: Model the historical trajectories of key assets across eras: commodities (gold, silver, grain, oil), land values, and proto-equity instruments, visualized as interactive trend charts that evolve alongside the simulation.
- [ ] **Spiritual & Cultural Civilization Index**: Assess and quantify the state of humanity's intellectual and spiritual life in each era — philosophical movements, religious influence, artistic output, scientific thought, and collective morale — as a first-class simulation dimension.
- [ ] **Contingency vs. Determinism Monitor**: Add fine-grained tracking that compares historical contingency (butterfly-effect events, unlikely outcomes) against structural determinism (geographic, economic, demographic forces), with side-by-side divergence analysis across parallel runs.
- [ ] **Live State Editor**: Allow direct modification of any civilization's state at any point in time — tweak GDP, change a ruler, redraw an alliance, adjust military strength — and watch the engine propagate consequences forward.

## Acknowledgments

- **[aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)** — Open-source historical world map boundaries (GeoJSON) from 2000 BCE to 2010 CE by André Ourednik. This project's territory visualization is built upon these academic basemaps, simplified and matched to our internal region system. We are deeply grateful for this invaluable open dataset that makes historical boundary rendering possible.
- **[OpenRouter](https://openrouter.ai/)** — Unified LLM API gateway that powers the simulation engine.
- **[MapLibre GL](https://maplibre.org/)** — Open-source map rendering library.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
