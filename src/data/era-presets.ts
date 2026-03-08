import type { LocalizedText } from "@/lib/types";

export interface EraPreset {
  id: string;
  name: LocalizedText;
  year: number;
  month: number;
  era: LocalizedText;
  description: LocalizedText;
  icon: string;
  color: string;
}

export const ERA_PRESETS: EraPreset[] = [
  {
    id: "bronze-age",
    name: { zh: "青铜时代", en: "Bronze Age" },
    year: -1600,
    month: 1,
    era: { zh: "青铜时代中期", en: "Middle Bronze Age" },
    description: {
      zh: "商朝建立，巴比伦帝国鼎盛，埃及新王国即将崛起，爱琴海迈锡尼文明繁荣",
      en: "Shang Dynasty founded, Babylonian Empire at peak, Egyptian New Kingdom rising, Mycenaean civilization flourishing",
    },
    icon: "🏺",
    color: "#CD7F32",
  },
  {
    id: "iron-age",
    name: { zh: "铁器时代", en: "Iron Age" },
    year: -800,
    month: 1,
    era: { zh: "铁器时代初期", en: "Early Iron Age" },
    description: {
      zh: "西周末年，亚述帝国称霸两河流域，希腊城邦兴起，腓尼基人纵横地中海",
      en: "Late Western Zhou, Assyrian Empire dominant, Greek city-states emerging, Phoenicians trading across Mediterranean",
    },
    icon: "⚔️",
    color: "#708090",
  },
  {
    id: "axial-age",
    name: { zh: "轴心时代", en: "Axial Age" },
    year: -500,
    month: 1,
    era: { zh: "轴心时代", en: "Axial Age" },
    description: {
      zh: "孔子与老子的时代，波斯帝国鼎盛，希腊民主制度确立，佛陀在印度传道",
      en: "Age of Confucius and Laozi, Persian Empire at peak, Greek democracy established, Buddha teaching in India",
    },
    icon: "🧘",
    color: "#9B59B6",
  },
  {
    id: "hellenistic",
    name: { zh: "希腊化时代", en: "Hellenistic Period" },
    year: -323,
    month: 6,
    era: { zh: "希腊化时代", en: "Hellenistic Period" },
    description: {
      zh: "亚历山大大帝刚刚去世，帝国分裂在即，战国七雄争霸，孔雀王朝统一印度",
      en: "Alexander the Great just died, empire fragmenting, Warring States era in China, Maurya Empire unifying India",
    },
    icon: "🏛️",
    color: "#3498DB",
  },
  {
    id: "qin-rome",
    name: { zh: "秦汉与罗马", en: "Qin-Han & Rome" },
    year: -221,
    month: 1,
    era: { zh: "帝国时代", en: "Age of Empires" },
    description: {
      zh: "秦始皇统一六国，罗马共和国扩张，迦太基战争进行中，印度孔雀王朝鼎盛",
      en: "Qin Shi Huang unifies China, Roman Republic expanding, Punic Wars ongoing, Maurya Empire at peak",
    },
    icon: "👑",
    color: "#E74C3C",
  },
  {
    id: "han-rome-peak",
    name: { zh: "两大帝国鼎盛", en: "Twin Empires" },
    year: 100,
    month: 1,
    era: { zh: "古典帝国鼎盛期", en: "Classical Empire Zenith" },
    description: {
      zh: "东汉鼎盛，罗马帝国图拉真时代，丝绸之路贸易繁荣，贵霜帝国连接东西方",
      en: "Eastern Han at peak, Roman Empire under Trajan, Silk Road thriving, Kushan Empire bridging East and West",
    },
    icon: "🛣️",
    color: "#F39C12",
  },
  {
    id: "three-kingdoms",
    name: { zh: "三国时代", en: "Three Kingdoms Era" },
    year: 220,
    month: 1,
    era: { zh: "三国与罗马危机", en: "Three Kingdoms & Roman Crisis" },
    description: {
      zh: "魏蜀吴三足鼎立，罗马帝国陷入三世纪危机，萨珊波斯崛起，笈多王朝即将兴起",
      en: "Wei, Shu, Wu competing, Roman Empire in Third Century Crisis, Sassanid Persia rising, Gupta Empire emerging",
    },
    icon: "🐉",
    color: "#E67E22",
  },
  {
    id: "fall-of-rome",
    name: { zh: "罗马帝国衰亡", en: "Fall of Rome" },
    year: 476,
    month: 9,
    era: { zh: "古典世界终结", en: "End of Classical World" },
    description: {
      zh: "西罗马帝国灭亡，南北朝对峙，拜占庭帝国存续，蛮族王国林立，萨珊波斯强盛",
      en: "Western Roman Empire fallen, Northern and Southern Dynasties in China, Byzantine Empire endures, barbarian kingdoms emerge",
    },
    icon: "🏚️",
    color: "#95A5A6",
  },
  {
    id: "tang-golden-age",
    name: { zh: "大唐盛世", en: "Tang Golden Age" },
    year: 750,
    month: 1,
    era: { zh: "中世纪盛期", en: "Early Medieval Zenith" },
    description: {
      zh: "唐朝天宝年间极盛即将转衰，阿拉伯帝国阿拔斯王朝建立，拜占庭帝国稳固，查理曼即将崛起",
      en: "Tang Dynasty at apex before An Lushan Rebellion, Abbasid Caliphate just established, Carolingian Empire emerging",
    },
    icon: "🌸",
    color: "#E91E63",
  },
  {
    id: "crusades",
    name: { zh: "十字军时代", en: "Age of Crusades" },
    year: 1200,
    month: 1,
    era: { zh: "十字军时代", en: "Age of Crusades" },
    description: {
      zh: "南宋偏安江南，蒙古帝国即将崛起，十字军东征持续，阿尤布王朝统治中东，日本镰仓幕府",
      en: "Southern Song in China, Mongol Empire about to rise, Crusades continuing, Ayyubid Sultanate rules Middle East, Kamakura Shogunate in Japan",
    },
    icon: "⚜️",
    color: "#C0392B",
  },
  {
    id: "mongol-empire",
    name: { zh: "蒙古帝国", en: "Mongol Empire" },
    year: 1280,
    month: 1,
    era: { zh: "蒙古和平", en: "Pax Mongolica" },
    description: {
      zh: "元朝统治中国，蒙古帝国横跨欧亚，马可波罗到访中国，德里苏丹国抵御蒙古",
      en: "Yuan Dynasty rules China, Mongol Empire spans Eurasia, Marco Polo visits China, Delhi Sultanate resists Mongols",
    },
    icon: "🏇",
    color: "#2ECC71",
  },
  {
    id: "renaissance",
    name: { zh: "文艺复兴", en: "Renaissance" },
    year: 1500,
    month: 1,
    era: { zh: "文艺复兴与大航海", en: "Renaissance & Age of Exploration" },
    description: {
      zh: "明朝弘治中兴，奥斯曼帝国鼎盛，欧洲文艺复兴高峰，大航海时代开启，印加与阿兹特克文明",
      en: "Ming Dynasty thriving, Ottoman Empire at peak, European Renaissance, Age of Exploration begins, Inca & Aztec civilizations",
    },
    icon: "🎨",
    color: "#1ABC9C",
  },
  {
    id: "early-modern",
    name: { zh: "近代早期", en: "Early Modern Period" },
    year: 1648,
    month: 10,
    era: { zh: "近代早期", en: "Early Modern Period" },
    description: {
      zh: "三十年战争结束，威斯特伐利亚体系建立，清朝入关不久，莫卧儿帝国全盛，科学革命进行中",
      en: "Thirty Years' War ends, Westphalian system established, early Qing Dynasty, Mughal Empire at peak, Scientific Revolution underway",
    },
    icon: "🔭",
    color: "#8E44AD",
  },
  {
    id: "enlightenment",
    name: { zh: "启蒙时代", en: "Age of Enlightenment" },
    year: 1750,
    month: 1,
    era: { zh: "启蒙时代", en: "Age of Enlightenment" },
    description: {
      zh: "清朝乾隆盛世，欧洲启蒙运动高潮，法国大革命前夕，英国殖民扩张，工业革命萌芽",
      en: "Qing Dynasty Qianlong era, European Enlightenment at peak, eve of French Revolution, British colonial expansion, Industrial Revolution beginning",
    },
    icon: "💡",
    color: "#F1C40F",
  },
  {
    id: "industrial-revolution",
    name: { zh: "工业革命", en: "Industrial Revolution" },
    year: 1840,
    month: 1,
    era: { zh: "工业革命时期", en: "Industrial Revolution" },
    description: {
      zh: "鸦片战争爆发，英国维多利亚时代，工业革命改变世界，美国西进运动，日本即将明治维新",
      en: "Opium War begins, Victorian Britain, Industrial Revolution transforming the world, American westward expansion, Japan approaching Meiji Restoration",
    },
    icon: "🏭",
    color: "#34495E",
  },
  {
    id: "imperialism",
    name: { zh: "帝国主义时代", en: "Age of Imperialism" },
    year: 1900,
    month: 1,
    era: { zh: "帝国主义时代", en: "Age of Imperialism" },
    description: {
      zh: "八国联军侵华，大英帝国日不落，美国崛起，日本明治维新成功，非洲被瓜分",
      en: "Eight-Nation Alliance in China, British Empire at zenith, USA rising, Meiji Japan industrialized, Scramble for Africa complete",
    },
    icon: "🌍",
    color: "#D35400",
  },
  {
    id: "world-war-era",
    name: { zh: "世界大战时代", en: "World War Era" },
    year: 1939,
    month: 9,
    era: { zh: "第二次世界大战", en: "World War II" },
    description: {
      zh: "二战爆发，纳粹德国侵略扩张，日本侵华战争持续，苏联备战，美国中立但即将参战",
      en: "WWII begins, Nazi Germany expanding, Japan invading China, Soviet Union preparing, USA neutral but soon to join",
    },
    icon: "💥",
    color: "#7F8C8D",
  },
  {
    id: "cold-war",
    name: { zh: "冷战时代", en: "Cold War Era" },
    year: 1962,
    month: 10,
    era: { zh: "冷战高峰", en: "Cold War Peak" },
    description: {
      zh: "古巴导弹危机，美苏对峙，中国大跃进时期，亚非拉去殖民化浪潮，太空竞赛白热化",
      en: "Cuban Missile Crisis, US-Soviet confrontation, China's Great Leap Forward, decolonization wave, Space Race intensifying",
    },
    icon: "☢️",
    color: "#2C3E50",
  },
  {
    id: "modern-era",
    name: { zh: "现代世界", en: "Modern World" },
    year: 2000,
    month: 1,
    era: { zh: "千禧之交", en: "Turn of the Millennium" },
    description: {
      zh: "千年之交，互联网时代来临，全球化加速，中国加入WTO，反恐战争即将开始",
      en: "Turn of millennium, Internet age dawning, globalization accelerating, China joining WTO, War on Terror about to begin",
    },
    icon: "🌐",
    color: "#0984E3",
  },
];
