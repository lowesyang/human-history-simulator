# Human History Simulator

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/human-history-simulator/pulls)

**Human History Simulator** 是一个 AI 驱动的文明模拟器，将大语言模型作为模拟引擎而非聊天工具。从公元前 1600 年到公元 2000 年，选择任意历史时代，在交互式世界地图上观看数十个文明的演化 —— AI 生成历史事件、计算状态转移、逐回合重塑地缘政治格局。

每个文明都携带丰富的状态快照 —— 统治者、政体、经济、军事、科技、文化、人口、外交 —— 每回合产生基于历史逻辑的变化：战争重划疆域、贸易路线转移财富、瘟疫削减人口、发明开启新纪元。相同起点，不同的涌现历史。

[English](./README.md) · [中文](./README.zh-CN.md)

## 特性

- **19 个历史纪元** —— 从青铜时代到现代世界，每个纪元预置数十个历史准确的文明。
- **LLM 驱动演化** —— AI 编排器聚类区域、生成事件，并跨经济、军事、外交、文化等维度计算逐字段的状态转移。
- **交互式世界地图** —— 领土叠加层，支持悬停查看与点击进入文明详情。
- **深度文明档案** —— 每个区域 10 个标签页：政治、军事、经济、财政、科技、文化、人口、外交、评估、历史。
- **战争系统** —— 结构化冲突追踪：交战方、开战理由、战略优势、战后影响分析。
- **自定义事件** —— 注入"假如……"事件，观察 AI 如何应对。
- **时间控制** —— 播放 / 暂停 / 单步 / 按纪元推进 / 回滚到任意年份。
- **双语界面** —— 完整的中英文 UI 与本地化文明数据。

## 运行机制

每次推进时间，模拟器会执行多阶段流水线：

1. **事件生成** —— AI 为下一时段生成历史事件（战争、发明、条约、灾害、迁徙等）。也可注入自定义事件探索架空历史。

2. **区域聚类** —— 编排器基于事件共现、战争交战关系和领土邻近性构建关系图，通过 BFS 提取连通分量。相关文明被分为一组，孤立文明单独批处理。

3. **史学家代理** —— 每组区域被分配给专门的 LLM 提示词：**直接影响**（事件波及区域的完整冲击）、**间接影响**（邻近区域的涟漪效应）或**独立演化**（孤立区域的内生发展）。最多 10 组并行执行，失败自动重试。

4. **状态转移** —— LLM 返回紧凑的 JSON diff（点号路径字段增量），而非完整快照。引擎应用相对增量、绝对赋值和自动计算字段，生成下一世界状态。

5. **战争提取** —— 专用分析器从战争事件中提取结构化冲突数据 —— 交战方、起因、优势、影响 —— 并跨纪元追踪战争进程。

6. **演化日志** —— 每纪元记录逐字段变更日志，驱动历史标签页和演化日志面板。

## 快速开始

### 前置条件

- **Node.js** ≥ 18
- 一个 **[OpenRouter](https://openrouter.ai/)** API 密钥

### 安装与运行

```bash
git clone https://github.com/your-username/human-history-simulator.git
cd human-history-simulator
npm install
```

创建 `.env.local`：

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
LLM_MODEL=openai/gpt-5.4
LLM_MAX_GROUP_SIZE=10
```

| 变量                 | 说明                                        |
| -------------------- | ------------------------------------------- |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥                         |
| `LLM_MODEL`          | 模拟使用的模型（OpenRouter 上任意可用模型） |
| `LLM_MAX_GROUP_SIZE` | 每次 LLM 调用的最大区域数                   |

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) —— 选择纪元，开始模拟。

## 脚本

| 命令                         | 说明                     |
| ---------------------------- | ------------------------ |
| `npm run dev`                | 启动开发服务器           |
| `npm run build`              | 生产构建                 |
| `npm run start`              | 启动生产服务器           |
| `npm run lint`               | ESLint 检查              |
| `npm run seed`               | 使用默认纪元初始化数据库 |
| `npm run seed -- bronze-age` | 使用指定纪元初始化       |
| `npm run generate:eras`      | 通过 LLM 生成纪元数据    |

## 支持的纪元

| 纪元       | 起始年份   | 纪元         | 起始年份 |
| ---------- | ---------- | ------------ | -------- |
| 青铜时代   | 前 1600 年 | 唐代盛世     | 750 年   |
| 铁器时代   | 前 800 年  | 十字军时代   | 1200 年  |
| 轴心时代   | 前 500 年  | 蒙古帝国     | 1280 年  |
| 希腊化时代 | 前 323 年  | 文艺复兴     | 1500 年  |
| 秦汉与罗马 | 前 221 年  | 近代早期     | 1648 年  |
| 双帝国鼎盛 | 100 年     | 启蒙时代     | 1750 年  |
| 三国时代   | 220 年     | 工业革命     | 1840 年  |
| 西罗马陷落 | 476 年     | 帝国主义时代 | 1900 年  |
|            |            | 世界大战     | 1939 年  |
|            |            | 冷战时代     | 1962 年  |
|            |            | 现代世界     | 2000 年  |

## 贡献

欢迎贡献！请随时提交 Issue 或 Pull Request。

## 许可证

MIT
