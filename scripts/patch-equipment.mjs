import fs from "fs";
import path from "path";

const SEED_DIR = path.resolve("src/data/seed");

// Era-specific weapon pools, organized by time period
// Each weapon: { name: {zh, en}, category, description: {zh, en} }
// Regions pick from these based on military level and geographic context

const ERA_WEAPONS = {
  // -1600 Bronze Age
  "bronze-age": {
    universal: [
      {
        name: { zh: "青铜剑", en: "Bronze Sword" },
        category: "melee",
        description: {
          zh: "铸造青铜短剑，近战主力兵器",
          en: "Cast bronze short sword, primary melee weapon",
        },
      },
      {
        name: { zh: "青铜矛", en: "Bronze Spear" },
        category: "melee",
        description: {
          zh: "长柄青铜矛头，步兵标准装备",
          en: "Long-shafted bronze spearhead, standard infantry weapon",
        },
      },
      {
        name: { zh: "青铜匕首", en: "Bronze Dagger" },
        category: "melee",
        description: {
          zh: "近身格斗短刃",
          en: "Close-quarters combat short blade",
        },
      },
      {
        name: { zh: "投石索", en: "Sling" },
        category: "ranged",
        description: {
          zh: "投射石弹的绳索武器，射程可达200步",
          en: "Stone-hurling cord weapon with a range of up to 200 paces",
        },
      },
      {
        name: { zh: "木盾", en: "Wooden Shield" },
        category: "armor",
        description: {
          zh: "覆以皮革或青铜片的木制盾牌",
          en: "Wooden shield covered with leather or bronze plates",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "复合弓", en: "Composite Bow" },
        category: "ranged",
        description: {
          zh: "木、角、筋复合弓，射程远于单体弓",
          en: "Wood, horn, and sinew composite bow with greater range than self bows",
        },
      },
      {
        name: { zh: "青铜战斧", en: "Bronze Battle Axe" },
        category: "melee",
        description: {
          zh: "劈砍利器，破甲能力强",
          en: "Powerful chopping weapon with strong armor-piercing capability",
        },
      },
      {
        name: { zh: "战车", en: "War Chariot" },
        category: "vehicle",
        description: {
          zh: "双马牵引战车，搭载弓手与驭手",
          en: "Two-horse chariot carrying archer and driver",
        },
      },
      {
        name: { zh: "青铜甲胄", en: "Bronze Armor" },
        category: "armor",
        description: {
          zh: "青铜片甲，保护躯干要害",
          en: "Bronze plate armor protecting vital torso areas",
        },
      },
      {
        name: { zh: "青铜戈", en: "Bronze Ge (Halberd)" },
        category: "melee",
        description: {
          zh: "中国特有的钩啄兵器，战车兵标配",
          en: "Chinese hook-cleaving polearm, standard chariot weapon",
        },
      },
    ],
    elite: [
      {
        name: { zh: "攻城锤", en: "Battering Ram" },
        category: "siege",
        description: {
          zh: "用于破坏城门和城墙的大型攻城器械",
          en: "Heavy siege engine for breaching gates and walls",
        },
      },
      {
        name: { zh: "攻城梯", en: "Siege Ladder" },
        category: "siege",
        description: {
          zh: "攀越城墙的云梯",
          en: "Scaling ladder for overcoming fortification walls",
        },
      },
    ],
  },

  // -800 Iron Age
  "iron-age": {
    universal: [
      {
        name: { zh: "铁剑", en: "Iron Sword" },
        category: "melee",
        description: {
          zh: "锻铁长剑，较青铜更坚韧锋利",
          en: "Forged iron sword, harder and sharper than bronze",
        },
      },
      {
        name: { zh: "铁矛", en: "Iron Spear" },
        category: "melee",
        description: {
          zh: "铁质矛头长枪，步兵核心武器",
          en: "Iron-tipped long spear, core infantry weapon",
        },
      },
      {
        name: { zh: "标枪", en: "Javelin" },
        category: "ranged",
        description: {
          zh: "投掷用轻矛，可在冲锋前削弱敌阵",
          en: "Light throwing spear to weaken enemy formations before charge",
        },
      },
      {
        name: { zh: "单体弓", en: "Self Bow" },
        category: "ranged",
        description: {
          zh: "单片木材制成的弓",
          en: "Bow made from a single piece of wood",
        },
      },
      {
        name: { zh: "圆盾", en: "Round Shield" },
        category: "armor",
        description: {
          zh: "木制或覆铁圆盾，步兵防护标配",
          en: "Wooden or iron-rimmed round shield, standard infantry protection",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "骑兵长矛", en: "Cavalry Lance" },
        category: "melee",
        description: {
          zh: "骑兵冲锋用长柄武器",
          en: "Long polearm for mounted charge",
        },
      },
      {
        name: { zh: "复合弓", en: "Composite Bow" },
        category: "ranged",
        description: {
          zh: "游牧民族精制复合弓，骑射利器",
          en: "Refined composite bow of nomadic peoples, ideal for mounted archery",
        },
      },
      {
        name: { zh: "铁甲", en: "Iron Scale Armor" },
        category: "armor",
        description: {
          zh: "铁鳞片甲衣，防护力显著提升",
          en: "Iron scale armor vest with significantly improved protection",
        },
      },
      {
        name: { zh: "战车", en: "War Chariot" },
        category: "vehicle",
        description: {
          zh: "铁制配件战车，仍为重要战力",
          en: "Iron-fitted chariot, still a significant military asset",
        },
      },
      {
        name: { zh: "铁战斧", en: "Iron Battle Axe" },
        category: "melee",
        description: {
          zh: "铁质战斧，劈砍威力极大",
          en: "Iron battle axe with devastating chopping power",
        },
      },
    ],
    elite: [
      {
        name: { zh: "攻城锤", en: "Battering Ram" },
        category: "siege",
        description: {
          zh: "包铁攻城锤，摧毁城门利器",
          en: "Iron-tipped battering ram for destroying city gates",
        },
      },
      {
        name: { zh: "投石机", en: "Traction Trebuchet" },
        category: "siege",
        description: {
          zh: "人力牵引投石机，抛射石弹攻城",
          en: "Man-powered traction trebuchet for hurling stone projectiles",
        },
      },
    ],
  },

  // -500 Axial Age / -323 Hellenistic / -221 Qin-Rome
  classical: {
    universal: [
      {
        name: { zh: "铁剑", en: "Iron Sword" },
        category: "melee",
        description: {
          zh: "锻铁长剑，步兵近战标配",
          en: "Forged iron longsword, standard infantry melee weapon",
        },
      },
      {
        name: { zh: "长矛", en: "Long Spear" },
        category: "melee",
        description: {
          zh: "步兵方阵核心武器，长达3-5米",
          en: "Core phalanx weapon, 3-5 meters in length",
        },
      },
      {
        name: { zh: "标枪", en: "Javelin" },
        category: "ranged",
        description: {
          zh: "投掷短矛，冲锋前远程杀伤",
          en: "Throwing spear for ranged attack before charge",
        },
      },
      {
        name: { zh: "圆盾", en: "Round Shield" },
        category: "armor",
        description: {
          zh: "青铜面或铁面木盾",
          en: "Bronze-faced or iron-faced wooden shield",
        },
      },
      {
        name: { zh: "弓", en: "Bow" },
        category: "ranged",
        description: {
          zh: "单体弓或复合弓，远程打击主力",
          en: "Self bow or composite bow, primary ranged strike weapon",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "萨里沙长矛", en: "Sarissa" },
        category: "melee",
        description: {
          zh: "马其顿方阵专用超长矛，长达6米",
          en: "Macedonian phalanx pike up to 6 meters long",
        },
      },
      {
        name: { zh: "弩", en: "Crossbow" },
        category: "ranged",
        description: {
          zh: "机械上弦弩机，射程远精度高",
          en: "Mechanically drawn crossbow with long range and high accuracy",
        },
      },
      {
        name: { zh: "铁札甲", en: "Lamellar Armor" },
        category: "armor",
        description: {
          zh: "铁片编缀甲衣，防护全面",
          en: "Iron lamellar armor assembled from laced plates",
        },
      },
      {
        name: { zh: "骑兵弯刀", en: "Cavalry Saber" },
        category: "melee",
        description: {
          zh: "骑兵专用弧形刀，利于马上劈斩",
          en: "Curved cavalry blade optimized for mounted slashing",
        },
      },
      {
        name: { zh: "战象", en: "War Elephant" },
        category: "vehicle",
        description: {
          zh: "搭载弓手的作战大象，冲击力惊人",
          en: "Combat elephant carrying archers with devastating charge power",
        },
      },
    ],
    elite: [
      {
        name: { zh: "抛石机", en: "Torsion Catapult" },
        category: "siege",
        description: {
          zh: "扭力弹射器，投射石弹或燃烧物",
          en: "Torsion-powered catapult hurling stones or incendiaries",
        },
      },
      {
        name: { zh: "弩炮", en: "Ballista" },
        category: "siege",
        description: {
          zh: "大型弩机，发射巨型箭矢",
          en: "Large crossbow-like engine firing giant bolts",
        },
      },
      {
        name: { zh: "攻城塔", en: "Siege Tower" },
        category: "siege",
        description: {
          zh: "移动攻城塔楼，攀城作战平台",
          en: "Mobile siege tower serving as an elevated assault platform",
        },
      },
    ],
  },

  // 100 Han-Rome Peak
  "han-rome": {
    universal: [
      {
        name: { zh: "铁剑", en: "Iron Gladius/Jian" },
        category: "melee",
        description: {
          zh: "精锻铁剑，罗马短剑或汉代环首刀",
          en: "Refined iron sword: Roman gladius or Han ring-pommel dao",
        },
      },
      {
        name: { zh: "长矛", en: "Pilum/Mao" },
        category: "melee",
        description: {
          zh: "投掷用重标枪（罗马）或长戈矛（汉）",
          en: "Heavy javelin (Roman pilum) or long spear (Han mao)",
        },
      },
      {
        name: { zh: "弩", en: "Crossbow" },
        category: "ranged",
        description: {
          zh: "汉代连弩与单射弩并用，精准有效",
          en: "Han-era repeating and single-shot crossbows, accurate and effective",
        },
      },
      {
        name: { zh: "方盾", en: "Scutum/Shield" },
        category: "armor",
        description: {
          zh: "大型长方形盾牌，龟甲阵核心",
          en: "Large rectangular shield, core of testudo formation",
        },
      },
      {
        name: { zh: "铁甲", en: "Lorica/Iron Armor" },
        category: "armor",
        description: {
          zh: "罗马环片甲或汉代铁札甲",
          en: "Roman lorica segmentata or Han lamellar iron armor",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "环首刀", en: "Ring-Pommel Dao" },
        category: "melee",
        description: {
          zh: "汉军标准配刀，单刃直背，劈斩利器",
          en: "Standard Han army saber, single-edged straight back, ideal for slashing",
        },
      },
      {
        name: { zh: "骑兵长矛", en: "Cavalry Kontos" },
        category: "melee",
        description: {
          zh: "重骑兵用双手持长矛",
          en: "Two-handed heavy cavalry lance",
        },
      },
      {
        name: { zh: "复合弓", en: "Composite Bow" },
        category: "ranged",
        description: {
          zh: "匈奴/帕提亚式复合弓，骑射核心武器",
          en: "Xiongnu/Parthian composite bow, core mounted archery weapon",
        },
      },
      {
        name: { zh: "投石机", en: "Onager" },
        category: "siege",
        description: {
          zh: "罗马投石机，抛射大型石弹",
          en: "Roman onager catapult, launching large stone projectiles",
        },
      },
    ],
    elite: [
      {
        name: { zh: "连弩", en: "Repeating Crossbow" },
        category: "ranged",
        description: {
          zh: "可连续发射的机械弩，汉代军事科技代表",
          en: "Continuously firing mechanical crossbow, hallmark of Han military technology",
        },
      },
      {
        name: { zh: "攻城塔", en: "Siege Tower" },
        category: "siege",
        description: {
          zh: "多层攻城塔楼，大型攻城战标配",
          en: "Multi-story siege tower, standard for major siege warfare",
        },
      },
    ],
  },

  // 220 Three Kingdoms / 476 Fall of Rome
  "late-classical": {
    universal: [
      {
        name: { zh: "环首刀", en: "Ring-Pommel Dao" },
        category: "melee",
        description: {
          zh: "单刃直刀，三国/南北朝步骑通用",
          en: "Single-edged straight saber, used by infantry and cavalry",
        },
      },
      {
        name: { zh: "长枪", en: "Long Spear" },
        category: "melee",
        description: { zh: "步兵标准长兵器", en: "Standard infantry polearm" },
      },
      {
        name: { zh: "弩", en: "Crossbow" },
        category: "ranged",
        description: {
          zh: "单兵弩与床弩，中国军队核心远程武器",
          en: "Infantry crossbow and mounted crossbow, core ranged weapon",
        },
      },
      {
        name: { zh: "弓", en: "Bow" },
        category: "ranged",
        description: {
          zh: "复合弓或长弓，远射主力",
          en: "Composite or longbow, primary ranged weapon",
        },
      },
      {
        name: { zh: "铁甲", en: "Iron Armor" },
        category: "armor",
        description: {
          zh: "铁札甲或锁子甲，防护全身要害",
          en: "Lamellar or chainmail armor protecting vital areas",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "马槊", en: "Horse Lance (Shuo)" },
        category: "melee",
        description: {
          zh: "重骑兵标志性武器，冲击力极强",
          en: "Signature heavy cavalry weapon with tremendous charge impact",
        },
      },
      {
        name: { zh: "诸葛连弩", en: "Zhuge Repeating Crossbow" },
        category: "ranged",
        description: {
          zh: "可连发十矢的机械弩，守城利器",
          en: "Mechanical crossbow firing ten bolts in succession, excellent for defense",
        },
      },
      {
        name: { zh: "铁具装", en: "Heavy Horse Armor" },
        category: "armor",
        description: {
          zh: "覆盖全身的重装骑兵铁甲",
          en: "Full-body heavy cavalry iron barding",
        },
      },
      {
        name: { zh: "拍竿", en: "Ship-Mounted Trebuchet" },
        category: "naval",
        description: {
          zh: "水战拍竿，击毁敌船上层结构",
          en: "Ship-mounted swinging beam to smash enemy superstructures",
        },
      },
    ],
    elite: [
      {
        name: { zh: "投石车", en: "Trebuchet" },
        category: "siege",
        description: {
          zh: "大型配重式投石机，攻城主力",
          en: "Large counterweight trebuchet, primary siege weapon",
        },
      },
      {
        name: { zh: "冲车", en: "Battering Ram Carriage" },
        category: "siege",
        description: {
          zh: "有顶棚防护的攻城冲车",
          en: "Roofed battering ram carriage for siege warfare",
        },
      },
    ],
  },

  // 750 Tang Golden Age
  tang: {
    universal: [
      {
        name: { zh: "横刀", en: "Tang Hengdao" },
        category: "melee",
        description: {
          zh: "唐军标配直刀，锋利坚韧",
          en: "Standard Tang army straight saber, sharp and resilient",
        },
      },
      {
        name: { zh: "长枪", en: "Long Spear" },
        category: "melee",
        description: {
          zh: "步兵与骑兵通用长矛",
          en: "Universal long spear for infantry and cavalry",
        },
      },
      {
        name: { zh: "角弓", en: "Horn Bow" },
        category: "ranged",
        description: {
          zh: "唐代精制复合弓，射程远威力大",
          en: "Refined Tang composite bow with great range and power",
        },
      },
      {
        name: { zh: "弩", en: "Crossbow" },
        category: "ranged",
        description: {
          zh: "单兵弩与臂张弩，列阵齐射",
          en: "Infantry crossbow and arm-drawn crossbow for volley fire",
        },
      },
      {
        name: { zh: "明光铠", en: "Mingguang Armor" },
        category: "armor",
        description: {
          zh: "唐代胸甲带圆形护心镜，防护优异",
          en: "Tang breastplate with circular chest mirrors, excellent protection",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "陌刀", en: "Modao (Great Blade)" },
        category: "melee",
        description: {
          zh: "唐代步兵重型双手刀，专克骑兵",
          en: "Tang infantry heavy two-handed blade, specializing in anti-cavalry",
        },
      },
      {
        name: { zh: "马槊", en: "Horse Lance" },
        category: "melee",
        description: {
          zh: "唐代重骑兵标准武器，柔韧不折",
          en: "Standard Tang heavy cavalry lance, flexible and unbreakable",
        },
      },
      {
        name: { zh: "火箭", en: "Fire Arrows" },
        category: "ranged",
        description: {
          zh: "箭头缠裹油脂引火材料，纵火利器",
          en: "Arrows wrapped with oil and incendiary materials for setting fires",
        },
      },
      {
        name: { zh: "楼船", en: "Tower Ship" },
        category: "naval",
        description: {
          zh: "多层战船，搭载弩手与拍竿",
          en: "Multi-story warship carrying crossbowmen and trebuchets",
        },
      },
    ],
    elite: [
      {
        name: { zh: "投石车", en: "Trebuchet" },
        category: "siege",
        description: {
          zh: "人力/配重投石机，攻城核心重器",
          en: "Traction/counterweight trebuchet, core siege weapon",
        },
      },
      {
        name: { zh: "云梯车", en: "Siege Ladder Cart" },
        category: "siege",
        description: {
          zh: "有防护的大型攻城云梯车",
          en: "Protected large-scale siege ladder cart",
        },
      },
    ],
  },

  // 1200 Crusades / 1280 Mongol Empire
  medieval: {
    universal: [
      {
        name: { zh: "长剑", en: "Longsword" },
        category: "melee",
        description: {
          zh: "骑士标准双刃直剑，十字形护手",
          en: "Knight's standard double-edged straight sword with cruciform guard",
        },
      },
      {
        name: { zh: "长枪", en: "Lance" },
        category: "melee",
        description: {
          zh: "骑兵冲锋长矛，骑士战核心武器",
          en: "Cavalry charge lance, core weapon of knightly warfare",
        },
      },
      {
        name: { zh: "弯刀", en: "Scimitar" },
        category: "melee",
        description: {
          zh: "伊斯兰世界弯刀，轻便利于骑战劈斩",
          en: "Islamic curved sword, light and ideal for mounted slashing",
        },
      },
      {
        name: { zh: "长弓", en: "Longbow" },
        category: "ranged",
        description: {
          zh: "英格兰长弓手主力弓，射程可达300步",
          en: "English longbow, effective range up to 300 paces",
        },
      },
      {
        name: { zh: "锁子甲", en: "Chainmail" },
        category: "armor",
        description: {
          zh: "铁环编织甲衣，灵活且防护可靠",
          en: "Iron ring-linked armor, flexible and reliably protective",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "蒙古复合弓", en: "Mongol Composite Bow" },
        category: "ranged",
        description: {
          zh: "蒙古骑兵标志武器，射程远精度高",
          en: "Signature Mongol cavalry weapon with great range and accuracy",
        },
      },
      {
        name: { zh: "弩", en: "Crossbow" },
        category: "ranged",
        description: {
          zh: "绞盘上弦重弩，可破重甲",
          en: "Windlass-drawn heavy crossbow capable of piercing heavy armor",
        },
      },
      {
        name: { zh: "板甲", en: "Plate Armor" },
        category: "armor",
        description: {
          zh: "全身钢板铠甲（晚期），防护力顶级",
          en: "Full plate steel armor (late period), top-tier protection",
        },
      },
      {
        name: { zh: "火药武器", en: "Gunpowder Weapons" },
        category: "ranged",
        description: {
          zh: "早期火铳与火箭（中国/伊斯兰世界传入）",
          en: "Early firearms and rockets (introduced from China/Islamic world)",
        },
      },
      {
        name: { zh: "希腊火", en: "Greek Fire" },
        category: "naval",
        description: {
          zh: "拜占庭海战秘密武器，水上不灭之火",
          en: "Byzantine naval secret weapon, inextinguishable fire on water",
        },
      },
    ],
    elite: [
      {
        name: { zh: "配重投石机", en: "Counterweight Trebuchet" },
        category: "siege",
        description: {
          zh: "中世纪最强攻城武器，可抛射150公斤石弹",
          en: "Most powerful medieval siege weapon, hurling 150kg stone projectiles",
        },
      },
      {
        name: { zh: "攻城塔", en: "Siege Tower" },
        category: "siege",
        description: {
          zh: "多层木制移动塔楼，掩护攻城部队",
          en: "Multi-story mobile wooden tower shielding assault troops",
        },
      },
      {
        name: { zh: "回回炮", en: "Huihui Trebuchet" },
        category: "siege",
        description: {
          zh: "蒙古西征引进的大型配重投石机",
          en: "Large counterweight trebuchet introduced during Mongol western campaigns",
        },
      },
    ],
  },

  // 1500 Renaissance
  renaissance: {
    universal: [
      {
        name: { zh: "长剑", en: "Longsword" },
        category: "melee",
        description: {
          zh: "骑士与步兵通用直剑",
          en: "Universal straight sword for knights and infantry",
        },
      },
      {
        name: { zh: "长矛", en: "Pike" },
        category: "melee",
        description: {
          zh: "瑞士长矛方阵武器，长达5-6米",
          en: "Swiss pike phalanx weapon, 5-6 meters long",
        },
      },
      {
        name: { zh: "火绳枪", en: "Matchlock Musket" },
        category: "ranged",
        description: {
          zh: "早期火枪，以缓燃绳引燃火药击发",
          en: "Early firearm ignited by slow-burning match cord",
        },
      },
      {
        name: { zh: "弩", en: "Crossbow" },
        category: "ranged",
        description: {
          zh: "钢臂弩，仍在部分军队中使用",
          en: "Steel-limbed crossbow, still used in some armies",
        },
      },
      {
        name: { zh: "板甲", en: "Full Plate Armor" },
        category: "armor",
        description: {
          zh: "文艺复兴时期精制全身板甲",
          en: "Renaissance refined full-body plate armor",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "卡尔弗林炮", en: "Culverin Cannon" },
        category: "artillery",
        description: {
          zh: "长管铸铁炮，射程远精度高",
          en: "Long-barreled cast iron cannon with long range and high accuracy",
        },
      },
      {
        name: { zh: "臼炮", en: "Mortar" },
        category: "artillery",
        description: {
          zh: "短管大口径炮，高弧度轰击城墙",
          en: "Short-barreled large-caliber gun for high-arc bombardment of walls",
        },
      },
      {
        name: { zh: "战列帆船", en: "Galleon" },
        category: "naval",
        description: {
          zh: "多层甲板武装大帆船",
          en: "Multi-deck armed sailing warship",
        },
      },
      {
        name: { zh: "手铳", en: "Hand Cannon" },
        category: "ranged",
        description: {
          zh: "早期单手持火器",
          en: "Early handheld single-shot firearm",
        },
      },
    ],
    elite: [
      {
        name: { zh: "破城炮", en: "Siege Bombard" },
        category: "siege",
        description: {
          zh: "超大口径攻城炮，可击碎城墙",
          en: "Ultra-large caliber siege cannon capable of shattering fortification walls",
        },
      },
      {
        name: { zh: "加莱赛战船", en: "Galleass" },
        category: "naval",
        description: {
          zh: "桨帆混合动力大型战船",
          en: "Large oar-and-sail hybrid warship",
        },
      },
    ],
  },

  // 1648 Early Modern
  "early-modern": {
    universal: [
      {
        name: { zh: "燧发枪", en: "Flintlock Musket" },
        category: "ranged",
        description: {
          zh: "燧石击发火枪，步兵标准火器",
          en: "Flint-sparked musket, standard infantry firearm",
        },
      },
      {
        name: { zh: "刺刀", en: "Bayonet" },
        category: "melee",
        description: {
          zh: "装于枪口的刺刀，兼顾远近",
          en: "Barrel-mounted blade combining ranged and melee capability",
        },
      },
      {
        name: { zh: "骑兵佩剑", en: "Cavalry Saber" },
        category: "melee",
        description: {
          zh: "弧形骑兵军刀，利于马上劈砍",
          en: "Curved cavalry sword ideal for mounted slashing attacks",
        },
      },
      {
        name: { zh: "野战炮", en: "Field Cannon" },
        category: "artillery",
        description: {
          zh: "轻型轮式火炮，随军机动作战",
          en: "Light wheeled cannon for mobile field operations",
        },
      },
      {
        name: { zh: "手枪", en: "Flintlock Pistol" },
        category: "ranged",
        description: {
          zh: "骑兵用燧发手枪",
          en: "Flintlock pistol for cavalry use",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "加农炮", en: "Cannon" },
        category: "artillery",
        description: {
          zh: "重型铸铁/铸铜加农炮",
          en: "Heavy cast iron/bronze cannon",
        },
      },
      {
        name: { zh: "风帆战列舰", en: "Ship of the Line" },
        category: "naval",
        description: {
          zh: "多层炮甲板风帆战列舰，海战主力",
          en: "Multi-gun-deck sailing warship, capital ship of naval warfare",
        },
      },
      {
        name: { zh: "掷弹筒", en: "Grenade" },
        category: "ranged",
        description: {
          zh: "早期手掷爆炸物",
          en: "Early hand-thrown explosive device",
        },
      },
      {
        name: { zh: "胸甲", en: "Cuirass" },
        category: "armor",
        description: {
          zh: "钢制胸背甲，骑兵仍在使用",
          en: "Steel breast-and-back plate, still used by cavalry",
        },
      },
    ],
    elite: [
      {
        name: { zh: "攻城臼炮", en: "Siege Mortar" },
        category: "siege",
        description: {
          zh: "大口径短管攻城炮，抛射爆裂弹",
          en: "Large-bore short-barrel siege gun lobbing explosive shells",
        },
      },
      {
        name: { zh: "三桅武装商船", en: "Armed Merchantman" },
        category: "naval",
        description: {
          zh: "武装远洋贸易船只",
          en: "Armed ocean-going trade vessel",
        },
      },
    ],
  },

  // 1750 Enlightenment
  enlightenment: {
    universal: [
      {
        name: { zh: "燧发滑膛枪", en: "Smoothbore Flintlock" },
        category: "ranged",
        description: {
          zh: "标准步兵火枪，排枪齐射战术核心",
          en: "Standard infantry musket, core of line volley tactics",
        },
      },
      {
        name: { zh: "刺刀", en: "Socket Bayonet" },
        category: "melee",
        description: {
          zh: "套筒式刺刀，可装枪射击后白刃冲锋",
          en: "Socket bayonet allowing firing then charging with fixed blade",
        },
      },
      {
        name: { zh: "野战炮", en: "Field Gun" },
        category: "artillery",
        description: {
          zh: "6磅至12磅轮式野战炮",
          en: "6 to 12-pounder wheeled field cannon",
        },
      },
      {
        name: { zh: "骑兵军刀", en: "Cavalry Saber" },
        category: "melee",
        description: {
          zh: "弧形重军刀，骑兵标配",
          en: "Heavy curved saber, standard cavalry weapon",
        },
      },
      {
        name: { zh: "手枪", en: "Pistol" },
        category: "ranged",
        description: {
          zh: "军官与骑兵随身短火器",
          en: "Short firearm for officers and cavalry",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "榴弹炮", en: "Howitzer" },
        category: "artillery",
        description: {
          zh: "曲射炮，可越过障碍物轰击",
          en: "Curved-trajectory gun firing over obstacles",
        },
      },
      {
        name: { zh: "风帆战列舰", en: "Ship of the Line" },
        category: "naval",
        description: {
          zh: "74炮标准战列舰，列强海军主力",
          en: "74-gun standard ship of the line, mainstay of great power navies",
        },
      },
      {
        name: { zh: "线膛来复枪", en: "Rifle" },
        category: "ranged",
        description: {
          zh: "膛线步枪，精度远超滑膛枪",
          en: "Rifled musket with accuracy far exceeding smoothbores",
        },
      },
      {
        name: { zh: "开花弹", en: "Explosive Shell" },
        category: "artillery",
        description: {
          zh: "内含火药的爆炸弹丸",
          en: "Explosive projectile filled with gunpowder",
        },
      },
    ],
    elite: [
      {
        name: { zh: "重型攻城炮", en: "Heavy Siege Gun" },
        category: "siege",
        description: {
          zh: "24磅以上重型攻城火炮",
          en: "24-pounder or larger heavy siege cannon",
        },
      },
      {
        name: { zh: "一等战列舰", en: "First-Rate Ship of the Line" },
        category: "naval",
        description: {
          zh: "100门以上火炮的旗舰级战列舰",
          en: "Flagship-class warship mounting 100+ guns",
        },
      },
    ],
  },

  // 1840 Industrial Revolution
  industrial: {
    universal: [
      {
        name: { zh: "线膛步枪", en: "Rifled Musket" },
        category: "ranged",
        description: {
          zh: "米尼弹线膛步枪，射程与精度大幅提升",
          en: "Minié ball rifled musket with greatly improved range and accuracy",
        },
      },
      {
        name: { zh: "左轮手枪", en: "Revolver" },
        category: "ranged",
        description: {
          zh: "柯尔特型转轮手枪，可连发六弹",
          en: "Colt-type revolver capable of firing six rounds",
        },
      },
      {
        name: { zh: "刺刀", en: "Bayonet" },
        category: "melee",
        description: {
          zh: "套筒刺刀，仍为步兵白刃战标配",
          en: "Socket bayonet, still standard for infantry close combat",
        },
      },
      {
        name: { zh: "野战炮", en: "Field Artillery" },
        category: "artillery",
        description: {
          zh: "线膛野战炮，使用开花弹",
          en: "Rifled field gun firing explosive shells",
        },
      },
      {
        name: { zh: "骑兵军刀", en: "Cavalry Saber" },
        category: "melee",
        description: {
          zh: "骑兵军刀仍在使用",
          en: "Cavalry saber still in active use",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "加特林机枪", en: "Gatling Gun" },
        category: "ranged",
        description: {
          zh: "手摇式多管机枪，火力压制利器",
          en: "Hand-cranked multi-barrel machine gun for fire suppression",
        },
      },
      {
        name: { zh: "铁甲舰", en: "Ironclad Warship" },
        category: "naval",
        description: {
          zh: "蒸汽动力铁甲战船，木帆船终结者",
          en: "Steam-powered ironclad warship, rendering wooden ships obsolete",
        },
      },
      {
        name: { zh: "后装线膛炮", en: "Breech-Loading Rifle Cannon" },
        category: "artillery",
        description: {
          zh: "克虏伯式后装线膛钢炮",
          en: "Krupp-style breech-loading rifled steel cannon",
        },
      },
      {
        name: { zh: "水雷", en: "Naval Mine" },
        category: "naval",
        description: {
          zh: "漂浮或锚定水雷，封锁航道",
          en: "Floating or anchored mine for blocking waterways",
        },
      },
    ],
    elite: [
      {
        name: { zh: "重型攻城炮", en: "Heavy Siege Artillery" },
        category: "siege",
        description: {
          zh: "大口径攻城臼炮与加农炮",
          en: "Large-caliber siege mortars and cannons",
        },
      },
      {
        name: { zh: "鱼雷", en: "Torpedo" },
        category: "naval",
        description: {
          zh: "自航式水下爆炸鱼雷",
          en: "Self-propelled underwater explosive torpedo",
        },
      },
    ],
  },

  // 1900 Imperialism
  imperialism: {
    universal: [
      {
        name: { zh: "栓动步枪", en: "Bolt-Action Rifle" },
        category: "ranged",
        description: {
          zh: "毛瑟/李-恩菲尔德式栓动步枪，步兵标配",
          en: "Mauser/Lee-Enfield bolt-action rifle, standard infantry weapon",
        },
      },
      {
        name: { zh: "马克沁机枪", en: "Maxim Machine Gun" },
        category: "ranged",
        description: {
          zh: "水冷式重机枪，改变战争形态",
          en: "Water-cooled heavy machine gun, transforming the nature of warfare",
        },
      },
      {
        name: { zh: "野战炮", en: "Field Gun" },
        category: "artillery",
        description: {
          zh: "75mm速射野战炮，如法国75小姐",
          en: "75mm quick-firing field gun like the French 75",
        },
      },
      {
        name: { zh: "手枪", en: "Service Pistol" },
        category: "ranged",
        description: {
          zh: "军官配发制式手枪",
          en: "Regulation sidearm issued to officers",
        },
      },
      {
        name: { zh: "刺刀", en: "Bayonet" },
        category: "melee",
        description: {
          zh: "步枪配套刺刀，冲锋白刃战",
          en: "Rifle-mounted bayonet for charging and close combat",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "榴弹炮", en: "Howitzer" },
        category: "artillery",
        description: {
          zh: "曲射榴弹炮，攻击掩体与堑壕",
          en: "Curved-fire howitzer for attacking bunkers and trenches",
        },
      },
      {
        name: { zh: "无畏舰", en: "Dreadnought" },
        category: "naval",
        description: {
          zh: "全重炮战列舰，海军军备竞赛核心",
          en: "All-big-gun battleship, core of the naval arms race",
        },
      },
      {
        name: { zh: "驱逐舰", en: "Destroyer" },
        category: "naval",
        description: {
          zh: "鱼雷驱逐舰，护航与反舰",
          en: "Torpedo boat destroyer for escort and anti-ship duties",
        },
      },
      {
        name: { zh: "手榴弹", en: "Hand Grenade" },
        category: "ranged",
        description: {
          zh: "手投式爆炸弹，堑壕战利器",
          en: "Hand-thrown explosive, ideal for trench warfare",
        },
      },
    ],
    elite: [
      {
        name: { zh: "重型攻城炮", en: "Heavy Siege Howitzer" },
        category: "siege",
        description: {
          zh: "大口径攻城榴弹炮",
          en: "Large-caliber siege howitzer",
        },
      },
      {
        name: { zh: "潜艇", en: "Submarine" },
        category: "naval",
        description: {
          zh: "早期柴油/电力潜艇",
          en: "Early diesel-electric submarine",
        },
      },
    ],
  },

  // 1939 World War Era
  "world-war": {
    universal: [
      {
        name: { zh: "半自动步枪", en: "Semi-Auto Rifle" },
        category: "ranged",
        description: {
          zh: "M1加兰德/SVT-40等半自动步枪",
          en: "M1 Garand/SVT-40 semi-automatic rifles",
        },
      },
      {
        name: { zh: "冲锋枪", en: "Submachine Gun" },
        category: "ranged",
        description: {
          zh: "汤普森/MP40/PPSh-41冲锋枪，近战火力猛",
          en: "Thompson/MP40/PPSh-41 SMGs with fierce close-quarters firepower",
        },
      },
      {
        name: { zh: "重机枪", en: "Heavy Machine Gun" },
        category: "ranged",
        description: {
          zh: "MG42/勃朗宁M2重机枪，火力压制核心",
          en: "MG42/Browning M2 HMG, core fire suppression weapon",
        },
      },
      {
        name: { zh: "野战炮", en: "Field Artillery" },
        category: "artillery",
        description: {
          zh: "75-105mm榴弹炮，师级火力支援",
          en: "75-105mm howitzer, division-level fire support",
        },
      },
      {
        name: { zh: "手榴弹", en: "Hand Grenade" },
        category: "ranged",
        description: {
          zh: "破片手榴弹，步兵必备",
          en: "Fragmentation hand grenade, infantry essential",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "中型坦克", en: "Medium Tank" },
        category: "vehicle",
        description: {
          zh: "T-34/谢尔曼/四号坦克，装甲战核心",
          en: "T-34/Sherman/Panzer IV medium tank, core of armored warfare",
        },
      },
      {
        name: { zh: "俯冲轰炸机", en: "Dive Bomber" },
        category: "aerial",
        description: {
          zh: "斯图卡/SBD俯冲轰炸机，精确打击地面目标",
          en: "Stuka/SBD dive bomber for precise ground target strikes",
        },
      },
      {
        name: { zh: "战斗机", en: "Fighter Aircraft" },
        category: "aerial",
        description: {
          zh: "喷火/零式/Bf109战斗机，争夺制空权",
          en: "Spitfire/Zero/Bf109 fighter for air superiority",
        },
      },
      {
        name: { zh: "航空母舰", en: "Aircraft Carrier" },
        category: "naval",
        description: {
          zh: "舰载机母舰，太平洋战争主角",
          en: "Carrier launching aircraft, star of the Pacific War",
        },
      },
      {
        name: { zh: "潜艇", en: "Submarine" },
        category: "naval",
        description: {
          zh: "U型潜艇/美军舰队潜艇，破交战利器",
          en: "U-boat/Fleet submarine for commerce raiding",
        },
      },
    ],
    elite: [
      {
        name: { zh: "重型坦克", en: "Heavy Tank" },
        category: "vehicle",
        description: {
          zh: "虎式/IS-2重型坦克，装甲矛头",
          en: "Tiger/IS-2 heavy tank, armored spearhead",
        },
      },
      {
        name: { zh: "火箭炮", en: "Rocket Artillery" },
        category: "artillery",
        description: {
          zh: "喀秋莎/Nebelwerfer多管火箭炮",
          en: "Katyusha/Nebelwerfer multiple rocket launcher",
        },
      },
      {
        name: { zh: "V-2火箭", en: "V-2 Rocket" },
        category: "missile",
        description: {
          zh: "世界首种弹道导弹，射程320公里",
          en: "World's first ballistic missile with 320km range",
        },
      },
    ],
  },

  // 1962 Cold War
  "cold-war": {
    universal: [
      {
        name: { zh: "突击步枪", en: "Assault Rifle" },
        category: "ranged",
        description: {
          zh: "AK-47/M16突击步枪，现代步兵核心武器",
          en: "AK-47/M16 assault rifle, core modern infantry weapon",
        },
      },
      {
        name: { zh: "通用机枪", en: "General Purpose Machine Gun" },
        category: "ranged",
        description: {
          zh: "PK/M60通用机枪，班排火力支柱",
          en: "PK/M60 GPMG, squad and platoon fire backbone",
        },
      },
      {
        name: { zh: "火箭筒", en: "Rocket Launcher" },
        category: "ranged",
        description: {
          zh: "RPG-7/M72反坦克火箭筒",
          en: "RPG-7/M72 anti-tank rocket launcher",
        },
      },
      {
        name: { zh: "自行火炮", en: "Self-Propelled Gun" },
        category: "artillery",
        description: {
          zh: "155mm/152mm自行榴弹炮",
          en: "155mm/152mm self-propelled howitzer",
        },
      },
      {
        name: { zh: "手榴弹", en: "Hand Grenade" },
        category: "ranged",
        description: {
          zh: "破片/烟雾/闪光手榴弹",
          en: "Fragmentation/smoke/flashbang grenade",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "主战坦克", en: "Main Battle Tank" },
        category: "vehicle",
        description: {
          zh: "T-72/M60巴顿/豹1主战坦克",
          en: "T-72/M60 Patton/Leopard 1 main battle tank",
        },
      },
      {
        name: { zh: "喷气战斗机", en: "Jet Fighter" },
        category: "aerial",
        description: {
          zh: "米格-21/F-4鬼怪超音速战斗机",
          en: "MiG-21/F-4 Phantom supersonic jet fighter",
        },
      },
      {
        name: { zh: "战略轰炸机", en: "Strategic Bomber" },
        category: "aerial",
        description: {
          zh: "B-52/图-95远程战略轰炸机",
          en: "B-52/Tu-95 long-range strategic bomber",
        },
      },
      {
        name: { zh: "核潜艇", en: "Nuclear Submarine" },
        category: "naval",
        description: {
          zh: "弹道导弹核潜艇，二次核打击平台",
          en: "Ballistic missile nuclear submarine, second-strike platform",
        },
      },
      {
        name: { zh: "防空导弹", en: "SAM System" },
        category: "missile",
        description: {
          zh: "S-75/MIM-23地对空导弹系统",
          en: "SA-2/MIM-23 surface-to-air missile system",
        },
      },
    ],
    elite: [
      {
        name: { zh: "洲际弹道导弹", en: "ICBM" },
        category: "missile",
        description: {
          zh: "民兵/SS-18洲际弹道导弹，核威慑支柱",
          en: "Minuteman/SS-18 ICBM, pillar of nuclear deterrence",
        },
      },
      {
        name: { zh: "航空母舰", en: "Aircraft Carrier" },
        category: "naval",
        description: {
          zh: "核动力航母战斗群",
          en: "Nuclear-powered carrier battle group",
        },
      },
      {
        name: { zh: "核弹头", en: "Nuclear Warhead" },
        category: "nuclear",
        description: {
          zh: "战略/战术核弹头",
          en: "Strategic/tactical nuclear warhead",
        },
      },
    ],
  },

  // 2000 Modern Era / 2023 AI Age
  modern: {
    universal: [
      {
        name: { zh: "突击步枪", en: "Assault Rifle" },
        category: "ranged",
        description: {
          zh: "M4/AK-74M/HK416模块化突击步枪",
          en: "M4/AK-74M/HK416 modular assault rifle",
        },
      },
      {
        name: { zh: "通用机枪", en: "GPMG" },
        category: "ranged",
        description: {
          zh: "M240/PKM通用机枪",
          en: "M240/PKM general purpose machine gun",
        },
      },
      {
        name: { zh: "反坦克导弹", en: "Anti-Tank Missile" },
        category: "missile",
        description: {
          zh: "标枪/陶式/红箭反坦克导弹",
          en: "Javelin/TOW/HJ anti-tank guided missile",
        },
      },
      {
        name: { zh: "自行榴弹炮", en: "Self-Propelled Howitzer" },
        category: "artillery",
        description: {
          zh: "155mm自行榴弹炮，GPS制导弹药",
          en: "155mm SPH with GPS-guided munitions",
        },
      },
      {
        name: { zh: "单兵防空导弹", en: "MANPADS" },
        category: "missile",
        description: {
          zh: "毒刺/针式便携防空导弹",
          en: "Stinger/Igla man-portable air defense system",
        },
      },
    ],
    advanced: [
      {
        name: { zh: "主战坦克", en: "Main Battle Tank" },
        category: "vehicle",
        description: {
          zh: "M1A2/T-90/豹2/99A主战坦克",
          en: "M1A2/T-90/Leopard 2/Type 99A main battle tank",
        },
      },
      {
        name: { zh: "多用途战斗机", en: "Multirole Fighter" },
        category: "aerial",
        description: {
          zh: "F-35/歼-20/苏-57第五代隐身战斗机",
          en: "F-35/J-20/Su-57 5th-gen stealth multirole fighter",
        },
      },
      {
        name: { zh: "武装无人机", en: "Armed UAV" },
        category: "aerial",
        description: {
          zh: "MQ-9/翼龙/TB2察打一体无人机",
          en: "MQ-9/Wing Loong/TB2 armed reconnaissance UAV",
        },
      },
      {
        name: { zh: "宙斯盾驱逐舰", en: "Aegis Destroyer" },
        category: "naval",
        description: {
          zh: "配备宙斯盾/中华神盾防空系统的导弹驱逐舰",
          en: "Missile destroyer with Aegis/Chinese Aegis air defense system",
        },
      },
      {
        name: { zh: "巡航导弹", en: "Cruise Missile" },
        category: "missile",
        description: {
          zh: "战斧/长剑远程巡航导弹",
          en: "Tomahawk/CJ long-range cruise missile",
        },
      },
    ],
    elite: [
      {
        name: { zh: "核动力航母", en: "Nuclear Carrier" },
        category: "naval",
        description: {
          zh: "尼米兹/福特级核动力航母",
          en: "Nimitz/Ford-class nuclear-powered aircraft carrier",
        },
      },
      {
        name: { zh: "弹道导弹核潜艇", en: "SSBN" },
        category: "naval",
        description: {
          zh: "俄亥俄/北风之神战略核潜艇",
          en: "Ohio/Borei-class strategic nuclear submarine",
        },
      },
      {
        name: { zh: "洲际弹道导弹", en: "ICBM" },
        category: "missile",
        description: {
          zh: "民兵III/东风-41/萨尔马特洲际弹道导弹",
          en: "Minuteman III/DF-41/Sarmat ICBM",
        },
      },
      {
        name: { zh: "高超音速武器", en: "Hypersonic Weapon" },
        category: "missile",
        description: {
          zh: "东风-17/先锋高超音速滑翔弹头",
          en: "DF-17/Avangard hypersonic glide vehicle",
        },
      },
      {
        name: { zh: "网络战武器", en: "Cyber Weapons" },
        category: "cyber",
        description: {
          zh: "网络攻击与电子战系统",
          en: "Cyber attack and electronic warfare systems",
        },
      },
    ],
  },
};

// Map era file names to weapon pool keys
const ERA_MAP = {
  "bronze-age": "bronze-age",
  "iron-age": "iron-age",
  "axial-age": "classical",
  hellenistic: "classical",
  "qin-rome": "classical",
  "han-rome-peak": "han-rome",
  "three-kingdoms": "late-classical",
  "fall-of-rome": "late-classical",
  "tang-golden-age": "tang",
  crusades: "medieval",
  "mongol-empire": "medieval",
  renaissance: "renaissance",
  "early-modern": "early-modern",
  enlightenment: "enlightenment",
  "industrial-revolution": "industrial",
  imperialism: "imperialism",
  "world-war-era": "world-war",
  "cold-war": "cold-war",
  "modern-era": "modern",
  "ai-age": "modern",
};

function pickWeapons(pool, milLevel) {
  const items = [...pool.universal];
  if (milLevel >= 4) items.push(...pool.advanced);
  if (milLevel >= 7) items.push(...pool.elite);

  // Pick count based on military level
  let count;
  if (milLevel <= 2) count = 2;
  else if (milLevel <= 4) count = 3;
  else if (milLevel <= 6) count = 4;
  else if (milLevel <= 8) count = 5;
  else count = 6;

  // Deterministic shuffle using region index seed
  const shuffled = items.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Seed random for reproducibility per region
function seededRandom(seed) {
  let h = seed;
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h - 1) / 2147483646;
  };
}

function pickWeaponsSeeded(pool, milLevel, seed) {
  const rng = seededRandom(seed);
  const items = [...pool.universal];
  if (milLevel >= 4) items.push(...pool.advanced);
  if (milLevel >= 7) items.push(...pool.elite);

  let count;
  if (milLevel <= 2) count = 2;
  else if (milLevel <= 4) count = 3;
  else if (milLevel <= 6) count = 4;
  else if (milLevel <= 8) count = 5;
  else count = 6;

  const shuffled = items.slice().sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function hashStr(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash || 1;
}

const files = fs
  .readdirSync(SEED_DIR)
  .filter((f) => f.startsWith("era-") && f.endsWith(".json"));
let totalPatched = 0;

for (const file of files) {
  const eraKey = file.replace("era-", "").replace(".json", "");
  const poolKey = ERA_MAP[eraKey];
  if (!poolKey) {
    console.log(`⚠ No weapon pool for ${eraKey}, skipping`);
    continue;
  }
  const pool = ERA_WEAPONS[poolKey];
  const filePath = path.join(SEED_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let patched = 0;

  for (const region of data.regions) {
    if (!region.military) continue;
    const mil = region.military;
    // Only patch if equipment is empty
    if (mil.equipment && mil.equipment.length > 0) continue;

    const level = mil.level || 3;
    const seed = hashStr(region.id + eraKey);
    const weapons = pickWeaponsSeeded(pool, level, seed);
    mil.equipment = weapons;
    patched++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`✓ ${eraKey}: patched ${patched} regions`);
  totalPatched += patched;
}

console.log(`\nTotal: ${totalPatched} regions patched with equipment data.`);
