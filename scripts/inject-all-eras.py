#!/usr/bin/env python3
"""Batch-inject technology sectors into ALL era JSON files."""
import json, glob, os

ALL_ERA_SECTORS = {

# ============================================================
# WW2 ERA (1939)
# ============================================================
"era-world-war-era.json": {
    "germany_1939": {
        "level": 9,
        "sectors": {
            "militaryEngineering": {
                "zh": "军事工程全球前沿：闪击战理论与装甲集群战术革新现代战争形态。虎式坦克、Me-262喷气式战斗机（研发中）、V-2弹道导弹（研发中）代表尖端军事技术。但战略轰炸能力不如英美，核武器研发（海森堡项目）进展远落后于美国曼哈顿计划。",
                "en": "Frontier military engineering: Blitzkrieg theory and armored group tactics revolutionize modern warfare. Tiger tanks, Me-262 jet fighters (in development), V-2 ballistic missiles (in development) represent cutting-edge military tech. But strategic bombing capability lags behind Britain/US; nuclear weapons R&D (Heisenberg project) far behind the US Manhattan Project."
            },
            "chemicalsAndIndustrial": {
                "zh": "化工与合成材料全球领先：IG法本（I.G. Farben）是全球最大化工企业，合成橡胶（丁纳橡胶）和合成燃料技术缓解了资源封锁压力。克虏伯钢铁和蒂森集团构成强大的重工业基础。哈伯-博施法固氮技术在农业和军事上均至关重要。",
                "en": "Global leader in chemicals and synthetic materials: IG Farben is the world's largest chemical company; synthetic rubber (Buna) and synthetic fuel technologies alleviate resource blockade pressures. Krupp and Thyssen form a powerful heavy industrial base. Haber-Bosch nitrogen fixation is critical for both agriculture and military."
            },
            "opticsAndPrecision": {
                "zh": "光学与精密仪器世界顶级：蔡司光学瞄准镜、恩尼格玛密码机、高精度机床制造体现德国精密工程传统。但密码技术将被英国图灵团队破解。",
                "en": "World-class optics and precision instruments: Zeiss optical sights, Enigma cipher machines, and high-precision machine tools embody the German precision engineering tradition. But Enigma will be broken by Turing's team at Bletchley Park."
            }
        },
        "overallAssessment": {
            "zh": "1939年的德国拥有全球最先进的军事工程和化工技术，闪击战理论将在战争初期取得惊人胜利。但战略资源（石油、稀有金属）严重不足，合成替代品难以完全弥补。核武器研发方向错误将成为致命短板。德国科技虽然精锐但缺乏持久战所需的资源工业深度。",
            "en": "Germany in 1939 possesses the world's most advanced military engineering and chemical technology; Blitzkrieg will achieve stunning early victories. But critical strategic resource shortages (oil, rare metals) cannot be fully compensated by synthetics. Misdirected nuclear research will prove a fatal weakness. German tech is elite but lacks the resource-industrial depth needed for a protracted war."
        }
    },
    "united_kingdom_1939": {
        "level": 9,
        "sectors": {
            "radarAndIntelligence": {
                "zh": "雷达与情报技术全球领先：英国率先建成实用化雷达预警网络（Chain Home），将在不列颠空战中发挥决定性作用。布莱切利园密码破解中心汇聚全球顶尖数学家（图灵等），恩尼格玛破译改变战争进程。",
                "en": "Global leader in radar and intelligence: Britain first deployed an operational radar early warning network (Chain Home), which will prove decisive in the Battle of Britain. Bletchley Park codebreaking center gathers the world's top mathematicians (Turing et al.); Enigma decryption will alter the course of the war."
            },
            "navalAndAerospace": {
                "zh": "海军与航空技术世界前列：皇家海军仍是全球最大海军之一，航母战术应用领先。喷火式和飓风式战斗机将在不列颠空战中证明价值。罗尔斯-罗伊斯梅林引擎是盟军最重要的航空发动机之一。但陆军装甲技术落后于德国。",
                "en": "World-class naval and aerospace tech: the Royal Navy remains one of the world's largest; carrier warfare tactics lead. Spitfire and Hurricane fighters will prove their worth in the Battle of Britain. Rolls-Royce Merlin is one of the Allies' most important aero-engines. But army armored technology lags behind Germany."
            },
            "nuclearResearch": {
                "zh": "核物理研究处于前沿：英国MAUD委员会率先确认原子弹的可行性，但因战争资源压力将核研究成果移交美国曼哈顿计划。弗里施-派尔斯备忘录（1940年）是核武器可行性的关键文件。",
                "en": "Frontier nuclear physics research: the British MAUD Committee first confirmed atomic bomb feasibility, but wartime resource pressures led to transferring nuclear research to the US Manhattan Project. The Frisch-Peierls Memorandum (1940) is the key document on nuclear weapons feasibility."
            }
        },
        "overallAssessment": {
            "zh": "1939年的英国科技以雷达、情报技术和海空力量为核心优势。Chain Home雷达网和布莱切利园密码破解将成为二战中最具战略意义的科技贡献。罗尔斯-罗伊斯发动机技术支撑盟军空中力量。但工业产能不如美国和德国，需要依赖大英帝国全球资源网络和美国援助来维持战争能力。",
            "en": "Britain's tech in 1939 centers on radar, intelligence, and naval-air power. Chain Home radar and Bletchley Park codebreaking will become WWII's most strategically significant tech contributions. Rolls-Royce engine technology underpins Allied air power. But industrial capacity falls short of the US and Germany, requiring the British Empire's global resource network and US aid to sustain the war effort."
        }
    },
    "united_states_1939": {
        "level": 9,
        "sectors": {
            "industrialCapacity": {
                "zh": "工业产能全球最大：美国拥有全球最大的钢铁、汽车和石油产业。福特、通用汽车的大规模生产体系将在战时转产军事装备，成为'民主国家的兵工厂'。但1939年军工产能尚未动员，军队规模仅世界第18位。",
                "en": "World's largest industrial capacity: the US has the world's largest steel, automotive, and oil industries. Ford and GM's mass production systems will convert to military equipment in wartime, becoming the 'Arsenal of Democracy.' But in 1939, military-industrial capacity is not yet mobilized; army size ranks only 18th globally."
            },
            "aviationAndEngineering": {
                "zh": "航空工业快速发展：波音、洛克希德、道格拉斯等航空公司正在研发新一代飞机。B-17轰炸机代表美国战略轰炸理念。但战斗机技术暂时落后于欧洲（梅塞施密特Bf-109、喷火式）。",
                "en": "Rapidly developing aviation: Boeing, Lockheed, Douglas are developing next-generation aircraft. The B-17 bomber represents American strategic bombing doctrine. But fighter technology temporarily lags behind Europe (Bf-109, Spitfire)."
            },
            "nuclearResearch": {
                "zh": "核物理研究力量集结中：爱因斯坦1939年8月致信罗斯福警告德国可能研制原子弹，直接推动曼哈顿计划的筹备。大量欧洲流亡物理学家（费米、西拉德、特勒等）汇聚美国，使美国核研究人才全球最强。",
                "en": "Nuclear physics research forces assembling: Einstein's August 1939 letter to Roosevelt warning of German atomic bomb potential directly spurs Manhattan Project preparations. Masses of European émigré physicists (Fermi, Szilard, Teller) converge on the US, giving it the world's strongest nuclear research talent."
            }
        },
        "overallAssessment": {
            "zh": "1939年的美国拥有全球最大的工业产能但军事力量尚未动员。核物理人才储备因欧洲流亡科学家涌入而达到全球最强。一旦战争机器全面启动（1941年后），美国的工业产能将转化为压倒性的军事优势——飞机、坦克、舰船的产量将超过所有交战国总和。曼哈顿计划将在6年内改变人类历史。",
            "en": "The US in 1939 has the world's largest industrial capacity but its military is not yet mobilized. Nuclear physics talent is the world's strongest thanks to European émigré scientists. Once the war machine fully activates (post-1941), US industrial capacity will translate into overwhelming military advantage — aircraft, tank, and ship production will exceed all belligerents combined. The Manhattan Project will change human history within 6 years."
        }
    },
    "soviet_union_1939": {
        "level": 8,
        "sectors": {
            "heavyIndustry": {
                "zh": "重工业产能巨大但质量参差：斯大林五年计划使苏联钢铁产量跃居世界前列，拖拉机厂可快速转产坦克。T-34坦克正在研发中，将成为二战最优秀坦克之一。但'大清洗'严重削弱了军事技术人才和指挥层。",
                "en": "Massive heavy industrial capacity but uneven quality: Stalin's Five-Year Plans propelled Soviet steel output to world-leading levels; tractor factories can rapidly convert to tank production. The T-34 is in development and will become one of WWII's finest tanks. But the Great Purge severely weakened military-technical talent and command structure."
            },
            "militaryTech": {
                "zh": "军事技术潜力巨大但受创：喀秋莎火箭炮（BM-13）研发中，将成为苏军标志性武器。IL-2攻击机设计中。但大清洗导致大量军事科学家和工程师被处决或流放，军事技术创新严重受阻。芬兰冬季战争（1939-40）将暴露苏军技术和训练上的严重缺陷。",
                "en": "Enormous military tech potential but damaged: Katyusha rocket launchers (BM-13) in development, destined to become an iconic Soviet weapon. IL-2 ground attack aircraft in design. But the Great Purge saw masses of military scientists and engineers executed or exiled, severely hindering innovation. The Winter War against Finland (1939-40) will expose serious Soviet military technology and training deficiencies."
            }
        },
        "overallAssessment": {
            "zh": "1939年的苏联拥有庞大的重工业基础和巨大的军事技术潜力，但'大清洗'造成的人才断层严重削弱了科技创新能力。苏联科技的核心优势在于'数量压倒质量'的动员能力和将民用工业快速转产军用的体制优势。T-34和喀秋莎将成为战争转折点的关键武器，但这些成果要到1941年后才能充分展现。",
            "en": "The USSR in 1939 has a massive heavy industrial base and enormous military tech potential, but the Great Purge created a devastating talent gap that severely weakened innovation. Soviet tech's core advantage lies in 'quantity over quality' mobilization capability and the systemic ability to rapidly convert civilian industry to military production. The T-34 and Katyusha will become pivotal war-turning weapons, but these achievements won't fully materialize until after 1941."
        }
    },
    "japan_1939": {
        "level": 8,
        "sectors": {
            "navalTechnology": {
                "zh": "海军技术世界前列：日本海军航空兵实力全球顶尖，零式战斗机（研发中）将成为太平洋战争初期最优秀的舰载战斗机。大和级战列舰（建造中）代表战列舰技术巅峰。航母机动部队战术领先全球。",
                "en": "World-class naval technology: Japanese naval aviation is among the world's best; the Zero fighter (in development) will become the Pacific War's early-stage premier carrier fighter. Yamato-class battleships (under construction) represent the zenith of battleship technology. Carrier strike force tactics lead globally."
            },
            "opticsAndInstruments": {
                "zh": "光学仪器精密：日本光学（后来的尼康）为海军提供精密瞄准镜和测距仪。精密光学制造能力为战后相机和电子产业奠定基础。",
                "en": "Precise optical instruments: Nippon Kogaku (later Nikon) provides precision targeting optics and rangefinders for the Navy. Precision optical manufacturing capability lays the foundation for post-war camera and electronics industries."
            }
        },
        "overallAssessment": {
            "zh": "1939年的日本在海军航空技术方面达到世界顶级水平，零式战斗机和航母战术将在太平洋战争初期取得惊人战果。但工业产能远不如美国（钢铁产量仅为美国1/10），石油几乎完全依赖进口。一旦美国工业机器全面运转，日本将无法在消耗战中维持。科技短板在于电子和雷达技术明显落后于英美。",
            "en": "Japan in 1939 achieves world-class naval aviation technology; the Zero and carrier tactics will produce stunning early Pacific War results. But industrial capacity is far inferior to the US (steel output only 1/10th). Oil is almost entirely imported. Once US industry fully mobilizes, Japan cannot sustain a war of attrition. Key tech weakness: electronics and radar clearly behind Britain/US."
        }
    },
    "france_1939": {
        "level": 8,
        "sectors": {
            "militaryEngineering": {
                "zh": "军事工程有实力但理念过时：马奇诺防线代表最先进的要塞工程技术，但防御理念停留在一战。索玛S-35和B1重型坦克在装甲和火力上不逊于德国坦克，但战术运用分散且通信指挥落后。",
                "en": "Capable military engineering but outdated doctrine: the Maginot Line represents the most advanced fortress engineering, but its defensive concept is stuck in WWI. Somua S35 and B1 heavy tanks match German tanks in armor and firepower, but tactical deployment is dispersed with poor communications and command."
            },
            "aviationAndAuto": {
                "zh": "航空与汽车工业有基础：雷诺和雪铁龙在汽车制造领域有实力。但航空工业因1936年国有化改革而产能混乱，战斗机产量严重不足。莫拉纳-索尔尼MS.406等战斗机性能落后于梅塞施密特Bf-109。",
                "en": "Aviation and auto industry has foundations: Renault and Citroën have automotive manufacturing strength. But aviation industry capacity is disrupted by 1936 nationalization reforms, with severely insufficient fighter production. MS.406 and other fighters underperform the Bf-109."
            }
        },
        "overallAssessment": {
            "zh": "1939年的法国拥有世界级的要塞工程和重型坦克，但军事理念停留在一战思维。工业产能虽可观但动员效率低下。航空工业的国有化改革导致产能混乱。法国科技的悲剧在于硬件不差但软件（战术理念、指挥通信、动员体制）严重落后于德国，这将导致1940年的灾难性败退。",
            "en": "France in 1939 has world-class fortress engineering and heavy tanks, but military doctrine is stuck in WWI thinking. Industrial capacity is substantial but mobilization efficiency is low. Aviation nationalization reforms caused production chaos. France's tech tragedy is that hardware wasn't inferior but software (tactics, command communications, mobilization systems) severely lagged Germany — leading to the catastrophic 1940 defeat."
        }
    }
},

# ============================================================
# COLD WAR ERA (1962)
# ============================================================
"era-cold-war.json": {
    "usa_1962": {
        "level": 10,
        "sectors": {
            "spaceAndMissile": {
                "zh": "太空竞赛全力推进：肯尼迪1961年宣布登月目标，NASA阿波罗计划大规模投入。但苏联在太空竞赛中暂时领先（首颗卫星、首位宇航员）。洲际弹道导弹（民兵、大力神）构成核威慑基础。古巴导弹危机正将世界推向核战争边缘。",
                "en": "Space race in full swing: Kennedy's 1961 Moon pledge drives massive NASA Apollo program investment. But the USSR temporarily leads in the space race (first satellite, first cosmonaut). ICBMs (Minuteman, Titan) form the nuclear deterrence backbone. The Cuban Missile Crisis is pushing the world to the brink of nuclear war."
            },
            "electronicsAndComputers": {
                "zh": "电子与计算机技术全球主导：IBM大型机统治商用计算市场，仙童半导体和德州仪器开创集成电路时代。贝尔实验室在晶体管和激光技术上持续突破。ARPA（后来的DARPA）刚开始资助将催生互联网的研究项目。",
                "en": "Global dominance in electronics and computers: IBM mainframes dominate commercial computing; Fairchild Semiconductor and Texas Instruments pioneer the integrated circuit era. Bell Labs continues breakthroughs in transistors and lasers. ARPA (later DARPA) begins funding research that will eventually create the internet."
            },
            "nuclearTechnology": {
                "zh": "核技术全球最先进：拥有超过27,000枚核弹头，核三位一体（陆基/潜射/空基）体系完备。核动力航母（企业号，1961年服役）和核潜艇技术领先全球。民用核电开始商业化运营。",
                "en": "World's most advanced nuclear technology: possesses over 27,000 nuclear warheads with complete nuclear triad (land/sea/air). Nuclear-powered carrier (USS Enterprise, 1961) and nuclear submarine technology lead globally. Civilian nuclear power begins commercial operation."
            },
            "aviationAndDefense": {
                "zh": "航空与国防工业无与伦比：B-52战略轰炸机、F-4幽灵战斗机、U-2侦察机代表最高航空技术水平。波音707开启喷气式民航时代。军工复合体规模全球最大——艾森豪威尔刚卸任时警告了其巨大影响力。",
                "en": "Unmatched aviation and defense industry: B-52 strategic bombers, F-4 Phantom fighters, U-2 spy planes represent the highest aviation technology. Boeing 707 inaugurates the jet airliner era. The military-industrial complex is the world's largest — Eisenhower's farewell warning about its influence was just delivered."
            }
        },
        "overallAssessment": {
            "zh": "1962年的美国处于冷战科技竞赛的关键时刻。虽然太空竞赛暂时落后苏联，但在计算机、电子、核技术和航空工业方面保持全面领先。集成电路的发明和阿波罗计划将在60年代下半叶产出巨大的技术红利。美国科技的核心优势在于军民两用技术的转化能力和私营企业的创新活力。",
            "en": "The US in 1962 is at a critical juncture in the Cold War tech race. Though temporarily behind the USSR in space, it maintains comprehensive leadership in computers, electronics, nuclear technology, and aviation. Integrated circuits and the Apollo program will yield enormous tech dividends in the latter 1960s. America's core tech advantage lies in military-civilian tech conversion and private-sector innovation dynamism."
        }
    },
    "ussr_1962": {
        "level": 10,
        "sectors": {
            "spaceAndMissile": {
                "zh": "太空竞赛暂时领先：1957年发射人类首颗人造卫星，1961年加加林成为首位进入太空的人类。科罗廖夫领导的火箭设计局是苏联太空成就的核心。R-7洲际弹道导弹既是航天运载工具也是核威慑武器。但登月计划组织混乱，内部路线争论将导致最终失败。",
                "en": "Temporarily leading the space race: launched the first artificial satellite in 1957; Gagarin became the first human in space in 1961. Korolev's rocket design bureau is the core of Soviet space achievements. The R-7 ICBM serves both as a space launch vehicle and nuclear deterrent. But the Moon program is organizationally chaotic; internal disputes will ultimately lead to failure."
            },
            "nuclearTechnology": {
                "zh": "核武器技术全球前沿：1961年试爆'沙皇炸弹'（5000万吨TNT当量），是人类历史上最大核爆炸。核弹头数量约3300枚并在快速增长。核动力潜艇和破冰船技术发展中。",
                "en": "Frontier nuclear weapons technology: detonated the 'Tsar Bomba' in 1961 (50 megatons TNT equivalent), the largest nuclear explosion in human history. Nuclear warhead count ~3,300 and growing rapidly. Nuclear-powered submarine and icebreaker technology developing."
            },
            "heavyIndustry": {
                "zh": "重工业产能巨大：钢铁、重型机械、坦克生产能力位居世界前列。T-55坦克大量出口第三世界。但轻工业和消费品技术严重落后，计划经济体制抑制了民用技术创新。电子和计算机技术落后于美国。",
                "en": "Enormous heavy industrial capacity: steel, heavy machinery, and tank production rank among the world's top. T-55 tanks are exported massively to the Third World. But light industry and consumer tech severely lag; the planned economy suppresses civilian tech innovation. Electronics and computing lag behind the US."
            }
        },
        "overallAssessment": {
            "zh": "1962年的苏联在太空和核武器领域暂时领先或与美国并驾齐驱，沙皇炸弹和加加林太空飞行展示了苏联科技的巅峰成就。但科技发展严重偏向军事和重工业，民用技术和消费品生产远落后于西方。计划经济体制限制了技术创新的灵活性。半导体和计算机技术的差距将在未来数十年愈加扩大。",
            "en": "The USSR in 1962 temporarily leads or matches the US in space and nuclear weapons; Tsar Bomba and Gagarin's flight showcase Soviet tech at its peak. But tech development is severely biased toward military and heavy industry; civilian technology and consumer production far lag the West. The planned economy limits innovation flexibility. The semiconductor and computing gap will widen enormously in coming decades."
        }
    },
    "japan_1962": {
        "level": 8,
        "sectors": {
            "electronics": {
                "zh": "消费电子崛起：索尼晶体管收音机（1955年起）开创日本电子产品出口先河。东京通信工业（索尼前身）和松下正快速攀升。新干线（1964年通车）正在建设中，将成为全球高速铁路先驱。日本电子产业正从模仿向创新转型。",
                "en": "Consumer electronics rising: Sony's transistor radio (from 1955) pioneered Japanese electronics exports. Tokyo Tsushin Kogyo (Sony's predecessor) and Matsushita are rapidly ascending. The Shinkansen (opening 1964) is under construction, destined to become the global HSR pioneer. Japanese electronics are transitioning from imitation to innovation."
            },
            "automotive": {
                "zh": "汽车工业高速发展：丰田、日产正从小型车起步进军国际市场。丰田生产方式（TPS）精益制造体系正在成型。日本汽车产量快速增长但尚未对欧美构成重大威胁。本田从摩托车制造商转向汽车。",
                "en": "Auto industry in rapid development: Toyota and Nissan are entering international markets starting with small cars. Toyota Production System (TPS) lean manufacturing is taking shape. Japanese car production grows rapidly but doesn't yet pose a major threat to Western automakers. Honda transitions from motorcycles to automobiles."
            },
            "shipbuilding": {
                "zh": "造船业即将登顶：日本造船产量在1950年代快速追赶英国，即将在1960年代超越成为世界第一造船国。三菱重工、川崎重工等在大型油轮建造方面极具竞争力。",
                "en": "Shipbuilding about to reach #1: Japanese shipbuilding rapidly caught up to Britain in the 1950s, about to surpass it in the 1960s to become the world's #1. Mitsubishi Heavy Industries, Kawasaki and others are highly competitive in large tanker construction."
            }
        },
        "overallAssessment": {
            "zh": "1962年的日本正处于经济奇迹的起飞阶段，从战后废墟中崛起的消费电子、汽车和造船工业即将在1960-70年代横扫全球市场。新干线的建设象征着日本从'模仿者'向'创新者'的转变。丰田生产方式将重新定义全球制造业标准。但在基础科学和军事技术方面受和平宪法约束和冷战格局限制。",
            "en": "Japan in 1962 is at the takeoff stage of its economic miracle; consumer electronics, automotive, and shipbuilding industries rising from postwar ruins are about to sweep global markets in the 1960s-70s. Shinkansen construction symbolizes Japan's transition from 'imitator' to 'innovator.' TPS will redefine global manufacturing standards. But constrained in basic science and military tech by the peace constitution and Cold War framework."
        }
    },
    "france_1962": {
        "level": 8,
        "sectors": {
            "nuclearAndAerospace": {
                "zh": "核技术与航空航天自主发展：戴高乐坚持独立核威慑，1960年首次核试验成功。法国核电计划启动。达索公司幻影III战斗机性能世界前列。协和号超音速客机（与英国合作）正在研发中。法国航天计划独立于美苏体系之外。",
                "en": "Independent nuclear and aerospace development: de Gaulle insists on an independent nuclear deterrent; first nuclear test in 1960. French nuclear power program launches. Dassault's Mirage III fighter performs at world-class level. Concorde supersonic airliner (with Britain) is in development. French space program operates independently of US/Soviet systems."
            },
            "highSpeedRail": {
                "zh": "铁路技术欧洲领先：法国国铁（SNCF）正在研究高速铁路技术，为后来的TGV奠定基础。电气化铁路网络覆盖广泛。",
                "en": "European railway leader: SNCF is researching high-speed rail technology, laying the groundwork for the future TGV. Electrified railway network covers extensively."
            }
        },
        "overallAssessment": {
            "zh": "1962年的法国在戴高乐领导下追求科技自主，独立核力量和航空航天工业是核心。幻影III战斗机出口成功证明法国军事技术的国际竞争力。但整体工业产能不如美苏两超，计算机和电子领域落后。法国科技战略的独特之处在于拒绝依附任何超级大国，坚持'第三条道路'。",
            "en": "France in 1962 pursues tech autonomy under de Gaulle; independent nuclear forces and aerospace are the core. Mirage III export success proves French military tech's international competitiveness. But overall industrial capacity falls short of the US/USSR superpowers; computers and electronics lag. France's unique tech strategy is refusing dependence on either superpower, insisting on a 'third way.'"
        }
    },
    "west_germany_1962": {
        "level": 8,
        "sectors": {
            "automotiveAndIndustrial": {
                "zh": "汽车与工业复兴奇迹：大众甲壳虫成为全球最畅销汽车之一，梅赛德斯和宝马重建高端品牌。西门子在电气工程和工业设备领域恢复全球地位。'莱茵河奇迹'使西德工业产出超过战前水平。克虏伯重建钢铁产业。",
                "en": "Automotive and industrial revival miracle: VW Beetle becomes one of the world's best-selling cars; Mercedes and BMW rebuild premium brands. Siemens restores global position in electrical engineering and industrial equipment. The 'Rhine Miracle' pushes West German industrial output above prewar levels. Krupp rebuilds the steel industry."
            },
            "chemicalsAndPharma": {
                "zh": "化工与制药恢复世界级水平：IG法本拆分后的拜耳、赫希斯特、巴斯夫各自发展成全球化工巨头。德国制药和精细化工传统迅速恢复。但核技术和军事工业受到盟国限制。",
                "en": "Chemicals and pharma restored to world-class: post-IG Farben breakup, Bayer, Hoechst, BASF each develop into global chemical giants. German pharma and fine chemical traditions quickly recover. But nuclear and military industries remain restricted by Allied constraints."
            }
        },
        "overallAssessment": {
            "zh": "1962年的西德经历了战后最惊人的经济复兴，汽车和化工产业重新达到世界顶级水平。'经济奇迹'的核心驱动力是马歇尔计划、货币改革和德国工程传统的复兴。但作为冷战前线国家和战败国，军事和核技术受到严格限制。计算机和航天领域尚未涉足。西德科技的特点是'民用工业强、军事技术受限'。",
            "en": "West Germany in 1962 has achieved the most stunning postwar economic revival; automotive and chemical industries are back at world-class level. The 'Economic Miracle' was driven by the Marshall Plan, currency reform, and revival of the German engineering tradition. But as a Cold War frontline state and defeated power, military and nuclear tech are strictly restricted. Computing and space are not yet engaged. West German tech is characterized by 'strong civilian industry, restricted military tech.'"
        }
    }
},

# ============================================================
# IMPERIALISM ERA (1900)
# ============================================================
"era-imperialism.json": {
    "british_empire_home_1900": {
        "level": 10,
        "sectors": {
            "navalTechnology": {
                "zh": "海军技术全球霸主：皇家海军实行'两强标准'（舰队规模超过第二和第三大海军之和），无畏舰（Dreadnought，即将于1906年下水）将革命性改变海战。阿姆斯特朗和维克斯是全球最大军舰制造商。海底电缆网络使英国掌控全球通信。",
                "en": "Global naval technology hegemon: Royal Navy maintains 'Two-Power Standard'; HMS Dreadnought (launching 1906) will revolutionize naval warfare. Armstrong and Vickers are the world's largest warship builders. Submarine cable networks give Britain control of global communications."
            },
            "industrialAndEngineering": {
                "zh": "工业革命发源地但领先优势正在缩小：虽然蒸汽机、纺织机械和铁路技术由英国开创，但德国和美国在钢铁、化工和电气领域已经追赶甚至超越。英国工业正面临'先发劣势'——设备老化、投资不足。",
                "en": "Industrial Revolution birthplace but lead narrowing: though steam engines, textile machinery, and railways were British inventions, Germany and the US have caught up or overtaken in steel, chemicals, and electrical engineering. British industry faces 'first-mover disadvantage' — aging equipment, underinvestment."
            },
            "financialInfrastructure": {
                "zh": "全球金融体系核心：伦敦城是全球金融中心，英镑是世界储备货币，金本位制由英国主导。劳合社保险市场、伦敦金属交易所等机构定义全球商业规则。",
                "en": "Core of the global financial system: the City of London is the world financial center; sterling is the world reserve currency; the gold standard is British-led. Lloyd's insurance market, London Metal Exchange and other institutions define global commercial rules."
            }
        },
        "overallAssessment": {
            "zh": "1900年的大英帝国仍是全球科技的领导者，但领先优势正在快速缩小。海军技术和全球金融体系仍无可匹敌，但工业技术已被德国（化工、电气）和美国（钢铁、大规模生产）超越。英国科技面临'帝国过度扩张'和'工业老化'的双重挑战，新兴技术领域（电气、化工、汽车）的投资不足将在20世纪上半叶显现后果。",
            "en": "The British Empire in 1900 remains the global tech leader, but its lead is rapidly narrowing. Naval technology and the global financial system are still unmatched, but industrial tech has been overtaken by Germany (chemicals, electrical) and the US (steel, mass production). British tech faces dual challenges of 'imperial overstretch' and 'industrial aging'; underinvestment in emerging technologies (electrical, chemical, automotive) will show consequences in the first half of the 20th century."
        }
    },
    "german_empire_1900": {
        "level": 9,
        "sectors": {
            "chemicalsAndPharmaceuticals": {
                "zh": "化工与制药全球第一：拜耳（阿司匹林1899年上市）、赫希斯特、巴斯夫组成全球最强化工产业集群。合成染料、炸药和药品领域德国占全球市场的90%以上。哈伯正在研究固氮技术。",
                "en": "Global #1 in chemicals and pharmaceuticals: Bayer (aspirin launched 1899), Hoechst, BASF form the world's strongest chemical cluster. Germany holds over 90% of global synthetic dye, explosive, and pharmaceutical markets. Haber is researching nitrogen fixation."
            },
            "electricalEngineering": {
                "zh": "电气工程全球领先：西门子和AEG（通用电气公司）在发电机、电力输配、电气化铁路方面全球领先。德国电气产业规模已超越英国。",
                "en": "Global electrical engineering leader: Siemens and AEG lead globally in generators, power transmission, and electrified railways. Germany's electrical industry has surpassed Britain in scale."
            },
            "scientificResearch": {
                "zh": "基础科学研究全球最强：1900年前后德国大学体系（洪堡模式）是全球学术标杆。普朗克1900年提出量子理论，伦琴发现X射线（1895年），科赫确立细菌学基础。德国拥有全球最多的诺贝尔科学奖得主。",
                "en": "World's strongest basic science research: the German university system (Humboldt model) around 1900 is the global academic benchmark. Planck proposes quantum theory in 1900; Röntgen discovers X-rays (1895); Koch establishes bacteriology. Germany has the most Nobel science laureates globally."
            }
        },
        "overallAssessment": {
            "zh": "1900年的德意志帝国在化工、电气和基础科学三个领域已超越英国成为全球科技最强国之一。化工产业垄断全球染料和药品市场，大学研究体系培养了量子力学和细菌学等划时代发现。海军建设（提尔皮茨计划）正与英国展开军备竞赛。但在海军传统和全球金融体系方面仍不及英国。德国科技的崛起是二十世纪最重要的地缘科技事件之一。",
            "en": "The German Empire in 1900 has surpassed Britain in chemicals, electrical engineering, and basic science to become one of the world's strongest tech powers. The chemical industry monopolizes global dye and pharmaceutical markets; the university research system has produced epoch-making discoveries in quantum mechanics and bacteriology. Naval buildup (Tirpitz Plan) is in an arms race with Britain. But still inferior in naval tradition and the global financial system. Germany's tech rise is one of the most important geo-technological events of the 20th century."
        }
    },
    "usa_1900": {
        "level": 8,
        "sectors": {
            "massProduction": {
                "zh": "大规模生产体系全球领先：美国发明了可互换零件和流水线生产理念（惠特尼、福特即将实现）。钢铁产量1890年代已超过英国（卡内基钢铁）。石油工业（洛克菲勒标准石油）全球垄断。爱迪生的电力系统和贝尔的电话网络正改变日常生活。",
                "en": "Global leader in mass production: America invented interchangeable parts and assembly line concepts (Whitney; Ford about to realize them). Steel output surpassed Britain in the 1890s (Carnegie Steel). Oil industry (Rockefeller's Standard Oil) holds a global monopoly. Edison's electrical systems and Bell's telephone networks are transforming daily life."
            },
            "inventionAndInnovation": {
                "zh": "发明创新活力最强：爱迪生实验室开创了'工业化发明'模式。电灯、留声机、电影放映机、电话等美国发明正在改变世界。莱特兄弟正在研究动力飞行（1903年将首飞）。特斯拉和威斯汀豪斯推广交流电系统。",
                "en": "Most dynamic invention and innovation: Edison's lab pioneered 'industrialized invention.' Electric light, phonograph, motion pictures, telephone — American inventions are changing the world. The Wright brothers are researching powered flight (first flight in 1903). Tesla and Westinghouse promote AC electrical systems."
            }
        },
        "overallAssessment": {
            "zh": "1900年的美国工业产能已跃居世界第一，大规模生产和发明创新是其核心优势。但在基础科学和军事技术方面仍落后于欧洲——美国大学尚未达到德国水平，海军规模远不如英国。美国科技的独特之处在于将发明与商业化完美结合，创造了爱迪生、贝尔、卡内基等'发明家-企业家'模式。二十世纪将是美国科技霸权的世纪。",
            "en": "The US in 1900 has the world's #1 industrial capacity; mass production and invention are its core advantages. But basic science and military tech still lag Europe — US universities haven't reached German levels; the navy is far smaller than Britain's. America's tech uniqueness lies in perfectly combining invention with commercialization, creating the Edison/Bell/Carnegie 'inventor-entrepreneur' model. The 20th century will be the century of American tech hegemony."
        }
    },
    "meiji_japan_1900": {
        "level": 8,
        "sectors": {
            "militaryModernization": {
                "zh": "军事近代化成效显著：1895年甲午战争击败清朝，证明明治维新军事改革成功。日本海军以英国皇家海军为师，建造了世界级战舰（三笠号即将参加1905年日俄战争）。陆军以普鲁士为范本全面改革。",
                "en": "Highly effective military modernization: the 1895 Sino-Japanese War victory proved Meiji military reform success. The Japanese Navy models itself on the Royal Navy, building world-class warships (Mikasa about to participate in the 1905 Russo-Japanese War). The Army comprehensively reformed on the Prussian model."
            },
            "industrialization": {
                "zh": "工业化快速推进：政府主导的'殖产兴业'政策建立了现代纺织、造船和采矿工业。八幡制铁所（1901年投产）标志日本钢铁工业起步。但工业规模与欧美差距仍然巨大，核心技术和设备依赖进口。",
                "en": "Rapid industrialization: government-led 'promote industry' policies established modern textile, shipbuilding, and mining industries. Yawata Steel Works (operational 1901) marks the start of Japanese steel. But industrial scale still vastly behind the West, with core technology and equipment dependent on imports."
            }
        },
        "overallAssessment": {
            "zh": "1900年的日本是亚洲唯一成功实现近代化的国家，军事技术已达到欧洲二流强国水平。即将到来的日俄战争（1904-05年）胜利将震惊世界，证明非西方国家可以击败欧洲大国。但工业化仍处早期，核心技术依赖引进。日本的独特成就在于仅用30余年完成了欧洲数百年的军事近代化进程。",
            "en": "Japan in 1900 is Asia's only successfully modernized nation, with military technology reaching second-tier European power level. The upcoming Russo-Japanese War (1904-05) victory will stun the world, proving a non-Western nation can defeat a European great power. But industrialization is still early-stage with core tech dependent on imports. Japan's unique achievement is completing in just 30+ years the military modernization that took Europe centuries."
        }
    }
},

# ============================================================
# INDUSTRIAL REVOLUTION (1840)
# ============================================================
"era-industrial-revolution.json": {
    "united_kingdom_1840": {
        "level": 10,
        "sectors": {
            "steamAndMachinery": {
                "zh": "蒸汽动力与机械制造全球绝对领先：瓦特改良蒸汽机已广泛应用于采矿、纺织和运输。英国拥有全球一半以上的蒸汽机。大不列颠号蒸汽铁船（1843年下水）代表造船技术巅峰。机床制造（莫兹利车床）是工业革命的核心使能技术。",
                "en": "Absolute global leader in steam power and machinery: Watt's improved steam engine is widely used in mining, textiles, and transport. Britain possesses over half the world's steam engines. SS Great Britain (launching 1843) represents the pinnacle of shipbuilding. Machine tool manufacturing (Maudslay lathe) is the core enabling technology of the Industrial Revolution."
            },
            "railwayAndTransport": {
                "zh": "铁路技术开创者：1830年利物浦-曼彻斯特铁路开通以来，英国铁路网络快速扩张。铁路工程（隧道、桥梁、车站）带动了钢铁、煤炭和工程设计等相关产业。铁路技术正向全球输出。",
                "en": "Railway technology pioneer: since the 1830 Liverpool-Manchester Railway, Britain's rail network expands rapidly. Railway engineering (tunnels, bridges, stations) drives steel, coal, and engineering design. Railway technology is being exported worldwide."
            },
            "textileIndustry": {
                "zh": "纺织工业全球垄断：兰开夏棉纺织业是工业革命的起点和支柱产业。动力织机和珍妮纺纱机使英国纺织品产量是世界其他国家总和的数倍。曼彻斯特是'世界棉都'。但劳动条件恶劣，工人运动正在兴起。",
                "en": "Global textile monopoly: Lancashire cotton industry is the starting point and pillar of the Industrial Revolution. Power looms and spinning jenny make British textile output many times that of all other countries combined. Manchester is 'Cottonopolis.' But labor conditions are appalling, and the workers' movement is rising."
            }
        },
        "overallAssessment": {
            "zh": "1840年的英国是全球唯一的工业化国家，在蒸汽动力、机械制造、铁路和纺织工业方面拥有压倒性领先。'世界工厂'的地位无可争议。但工业化也带来严重的社会问题——童工、贫民窟、环境污染。法国和普鲁士正开始追赶，但与英国的差距至少有20-30年。英国的技术霸权将持续到19世纪末。",
            "en": "Britain in 1840 is the world's only industrialized nation, with overwhelming leadership in steam power, machinery, railways, and textiles. Its 'workshop of the world' status is undisputed. But industrialization brings severe social problems — child labor, slums, pollution. France and Prussia are beginning to catch up, but the gap is at least 20-30 years. Britain's tech hegemony will persist until the late 19th century."
        }
    },
    "prussia_1840": {
        "level": 8,
        "sectors": {
            "militaryReform": {
                "zh": "军事教育与改革领先欧陆：普鲁士总参谋部体制是全球最先进的军事组织。克虏伯钢铁开始生产铸钢大炮（将在1866年和1870年战争中证明威力）。后膛装填步枪技术领先。普鲁士军事学院培养体系被各国效仿。",
                "en": "Leading continental military education and reform: the Prussian General Staff system is the world's most advanced military organization. Krupp begins producing cast-steel cannons (to prove decisive in 1866 and 1870 wars). Breech-loading rifle technology leads. The Prussian military academy system is emulated globally."
            },
            "educationAndScience": {
                "zh": "教育与科学体系欧洲最强：洪堡大学改革（1810年）创立了现代研究型大学模式。普鲁士识字率全欧最高。化学和物理研究在德语大学蓬勃发展。关税同盟（Zollverein）正推动德意志经济统合。",
                "en": "Europe's strongest education and science system: Humboldt's university reform (1810) created the modern research university model. Prussian literacy rates are Europe's highest. Chemistry and physics research flourishes in German-speaking universities. The Zollverein customs union drives German economic integration."
            }
        },
        "overallAssessment": {
            "zh": "1840年的普鲁士虽然工业化程度远不如英国，但在军事组织和教育科学体系方面已建立显著优势。克虏伯钢铁和总参谋部体制将在30年后统一德意志。洪堡大学模式将使德国在19世纪后半叶成为全球科学研究中心。普鲁士的核心竞争力不在工厂数量，而在制度创新和人才培养。",
            "en": "Prussia in 1840, though far less industrialized than Britain, has established significant advantages in military organization and education-science systems. Krupp steel and the General Staff system will unify Germany in 30 years. The Humboldt university model will make Germany the global science research center in the latter 19th century. Prussia's core competitiveness lies not in factory count but in institutional innovation and talent cultivation."
        }
    }
},

# ============================================================
# ENLIGHTENMENT (1750)
# ============================================================
"era-enlightenment.json": {
    "kingdom_of_great_britain": {
        "level": 8,
        "sectors": {
            "protoIndustrialization": {
                "zh": "工业革命前夜：纽科门蒸汽机已用于矿井排水，瓦特即将改良蒸汽机（1769年）。亚伯拉罕·达比在铁桥峡谷开创焦炭炼铁。约翰·凯飞梭和哈格里夫斯珍妮纺纱机预示纺织工业革命即将到来。",
                "en": "Eve of the Industrial Revolution: Newcomen steam engines pump mines; Watt is about to improve the steam engine (1769). Abraham Darby pioneers coke-smelted iron at Ironbridge Gorge. Kay's flying shuttle and Hargreaves' spinning jenny herald the coming textile revolution."
            },
            "navalTechnology": {
                "zh": "海军技术全球领先：皇家海军控制全球海洋，风帆战列舰（一级战舰100门以上火炮）技术成熟。航海仪器（哈里森航海钟H4解决经度问题）和海图测绘领先世界。",
                "en": "Global naval leadership: Royal Navy controls the oceans; ship-of-the-line technology (100+ gun first-rates) is mature. Navigation instruments (Harrison's H4 chronometer solves the longitude problem) and charting lead the world."
            },
            "scientificRevolution": {
                "zh": "科学革命的延续：牛顿力学和光学理论（1687年《原理》）奠定了现代物理学基础。皇家学会是全球最重要的科学机构。本杰明·富兰克林的电学实验和卡文迪什的化学研究推动自然科学进步。",
                "en": "Continuation of the Scientific Revolution: Newton's mechanics and optics (1687 Principia) laid modern physics foundations. The Royal Society is the world's most important scientific institution. Franklin's electrical experiments and Cavendish's chemistry advance natural science."
            }
        },
        "overallAssessment": {
            "zh": "1750年的英国正处于人类历史最重大变革的前夜——工业革命即将开始。蒸汽机、焦炭炼铁和纺织机械的萌芽已经出现。海军技术和科学研究继续领先。牛顿科学革命的遗产为技术创新提供了理论基础。英国将在未来50年内从农业社会转变为世界第一个工业化国家。",
            "en": "Britain in 1750 stands on the eve of humanity's most momentous transformation — the Industrial Revolution is about to begin. Seeds of steam engines, coke-smelted iron, and textile machinery are already visible. Naval technology and scientific research continue to lead. Newton's Scientific Revolution legacy provides the theoretical foundation for technological innovation. Britain will transform from an agricultural society to the world's first industrialized nation within 50 years."
        }
    },
    "qing_dynasty": {
        "level": 7,
        "sectors": {
            "traditionalCrafts": {
                "zh": "传统手工业世界领先：景德镇瓷器、苏杭丝绸、茶叶加工、漆器等手工业产品质量全球最高。中国瓷器是全球最重要的贸易品之一，欧洲大量仿制。年画、木版印刷和造纸术产量远超欧洲。",
                "en": "World-leading traditional craftsmanship: Jingdezhen porcelain, Suzhou-Hangzhou silk, tea processing, lacquerware are the world's highest quality handicrafts. Chinese porcelain is among the most important global trade goods, extensively imitated in Europe. Woodblock printing and papermaking output far exceeds Europe."
            },
            "agriculturalTechnology": {
                "zh": "农业技术成熟高效：精耕细作的水稻种植体系养活全球最大人口（约3亿）。梯田灌溉工程、轮作复种技术极其成熟。《天工开物》（1637年）系统总结了明清时期的技术成就。但缺乏向机械化转变的动力。",
                "en": "Mature and efficient agricultural technology: intensive wet-rice cultivation feeds the world's largest population (~300 million). Terrace irrigation and crop rotation techniques are extremely refined. Tiangong Kaiwu (1637) systematically compiled Ming-Qing technological achievements. But lacks impetus for mechanization."
            },
            "waterEngineering": {
                "zh": "水利工程历史悠久：大运河（世界最长运河）仍是南北经济命脉。黄河治理和江南水利体系规模宏大。但水利技术停留在传统经验层面，缺乏流体力学等科学理论支撑。",
                "en": "Long-standing water engineering: the Grand Canal (world's longest) remains the north-south economic lifeline. Yellow River management and Jiangnan water systems are massive in scale. But water engineering remains at the traditional empirical level, lacking scientific foundations like fluid mechanics."
            }
        },
        "overallAssessment": {
            "zh": "1750年的清朝仍是全球最大经济体（GDP约占世界25%），传统手工业和农业技术在各自领域世界领先。但致命的差距正在形成：欧洲的科学革命和即将到来的工业革命将创造一种中国传统技术体系无法应对的全新生产方式。清朝科技停留在经验主义阶段，缺乏系统科学理论和机械化转型动力。这一差距将在90年后的鸦片战争中以毁灭性方式暴露。",
            "en": "The Qing Dynasty in 1750 is still the world's largest economy (~25% of global GDP); traditional craftsmanship and agricultural technology lead in their respective domains. But a fatal gap is forming: Europe's Scientific Revolution and the coming Industrial Revolution will create an entirely new mode of production that China's traditional technology system cannot address. Qing tech remains at the empirical stage, lacking systematic scientific theory and mechanization impetus. This gap will be devastatingly exposed in the Opium War 90 years later."
        }
    }
},

# ============================================================
# RENAISSANCE (1500)
# ============================================================
"era-renaissance.json": {
    "ming_china": {
        "level": 8,
        "sectors": {
            "porcelainAndSilk": {
                "zh": "瓷器与丝绸全球最高水平：景德镇官窑青花瓷是全球最受追捧的奢侈品。丝绸织造技术精湛，通过海上丝绸之路大量出口。中国手工业产出占全球总量的很大比例。",
                "en": "World's highest-level porcelain and silk: Jingdezhen imperial kiln blue-and-white porcelain is the world's most sought-after luxury good. Silk weaving technology is superb, exported massively via the Maritime Silk Road. Chinese handicraft output accounts for a large share of the global total."
            },
            "navigationAndShipbuilding": {
                "zh": "造船与航海技术曾领先世界：郑和宝船（1405-1433年远航）代表15世纪全球最先进的造船技术，船长约120米。但1433年后海禁政策终止了远洋探索。到1500年，明朝已主动放弃海洋技术优势。",
                "en": "Shipbuilding and navigation once world-leading: Zheng He's treasure ships (1405-1433 voyages) represented the 15th century's most advanced shipbuilding, ~120m in length. But the 1433 sea ban ended oceanic exploration. By 1500, the Ming Dynasty has voluntarily abandoned its maritime technology advantage."
            },
            "printingAndPaper": {
                "zh": "印刷与造纸技术历史最久：活字印刷（毕昇11世纪发明）和木版印刷广泛应用。但中文字符数量庞大使活字印刷效率不如拉丁字母。造纸术和火药虽源于中国，但应用创新已不如欧洲。",
                "en": "Longest history in printing and papermaking: movable type (Bi Sheng, 11th century) and woodblock printing widely used. But the vast number of Chinese characters makes movable type less efficient than with Latin alphabets. Though papermaking and gunpowder originated in China, application innovation now lags Europe."
            }
        },
        "overallAssessment": {
            "zh": "1500年的明朝在传统手工业（瓷器、丝绸、茶叶）和农业技术上仍是全球最先进的文明之一。但一个关键转折已经发生：郑和下西洋被终止后，中国主动放弃了海洋探索，而同时期的葡萄牙和西班牙正开启大航海时代。火药、指南针、印刷术等中国发明在欧洲被创造性地应用于军事和知识传播，中国却未能实现同等程度的技术转化。这一'大分流'的种子正在此时种下。",
            "en": "The Ming Dynasty in 1500 is still one of the world's most advanced civilizations in traditional crafts (porcelain, silk, tea) and agriculture. But a critical turning point has occurred: after Zheng He's voyages were terminated, China voluntarily abandoned ocean exploration, just as Portugal and Spain were launching the Age of Discovery. Gunpowder, compass, and printing — Chinese inventions — are being creatively applied in Europe for military and knowledge dissemination, while China fails to achieve comparable technological conversion. The seeds of the 'Great Divergence' are being planted."
        }
    },
    "ottoman_empire": {
        "level": 8,
        "sectors": {
            "militaryTechnology": {
                "zh": "军事技术欧亚领先：奥斯曼帝国拥有当时最先进的攻城炮技术，乌尔班大炮在1453年攻破君士坦丁堡城墙改写历史。禁卫军（耶尼切里）是全球最早的常备职业军队之一。火器应用水平高于大多数欧洲国家。",
                "en": "Eurasian military technology leader: the Ottoman Empire possesses the era's most advanced siege artillery; Orban's great cannon breached Constantinople's walls in 1453, rewriting history. Janissaries are among the world's earliest standing professional armies. Firearms usage exceeds most European states."
            },
            "architectureAndEngineering": {
                "zh": "建筑与工程宏伟：锡南大师（即将活跃）将设计苏莱曼清真寺等伊斯兰建筑杰作。奥斯曼水利工程和城市供水系统技术先进。伊斯坦布尔大巴扎是全球最大的室内市场。",
                "en": "Grand architecture and engineering: Master Sinan (about to become active) will design Islamic architectural masterpieces including the Süleymaniye Mosque. Ottoman hydraulic engineering and urban water supply systems are technologically advanced. Istanbul's Grand Bazaar is the world's largest covered market."
            }
        },
        "overallAssessment": {
            "zh": "1500年的奥斯曼帝国正处于苏莱曼大帝时代（即将到来）的巅峰前夜，在军事技术和建筑工程方面领先欧亚。攻城炮和常备军体制是其军事优势的核心。但奥斯曼帝国对印刷术持保守态度（直到18世纪才允许土耳其语印刷），这将成为长期科技停滞的关键因素之一。",
            "en": "The Ottoman Empire in 1500 is on the eve of its zenith under Suleiman the Magnificent (imminent), leading Eurasia in military technology and architectural engineering. Siege artillery and the standing army system are the core of its military advantage. But the Ottoman conservative attitude toward printing (Turkish-language printing not permitted until the 18th century) will become a key factor in long-term technological stagnation."
        }
    },
    "venice": {
        "level": 8,
        "sectors": {
            "navalAndMaritime": {
                "zh": "造船与航海技术地中海最强：威尼斯兵工厂（Arsenale）是欧洲最大的工业设施，可日产一艘战舰，采用流水线式生产管理。桨帆战舰（加莱塞船）技术领先。航海地图和航海仪器制造精良。",
                "en": "Strongest naval and maritime tech in the Mediterranean: the Venice Arsenal is Europe's largest industrial facility, capable of producing one warship per day using assembly-line management. Galley technology leads. Nautical charts and navigation instruments are finely crafted."
            },
            "glassAndCrafts": {
                "zh": "玻璃与精密工艺全球领先：穆拉诺岛玻璃制造是欧洲最先进的精密手工业，生产镜子、透镜和彩色玻璃。威尼斯工匠的保密制度极严。印刷业发达，阿尔杜斯·马努提乌斯创立的威尼斯印刷所是欧洲最重要的出版中心。",
                "en": "World-leading glass and precision crafts: Murano glass manufacturing is Europe's most advanced precision handicraft, producing mirrors, lenses, and colored glass. Venetian artisan secrecy is extreme. Printing flourishes — Aldus Manutius's Venetian press is Europe's most important publishing center."
            }
        },
        "overallAssessment": {
            "zh": "1500年的威尼斯是地中海世界的技术高地，兵工厂的流水线生产管理可视为工业革命的早期先驱。穆拉诺玻璃和威尼斯印刷业代表欧洲最精密的手工业技术。但威尼斯正面临大航海时代带来的地缘挑战——新航路使地中海贸易的战略地位下降，葡萄牙人绕过好望角直达亚洲将动摇威尼斯的商业基础。",
            "en": "Venice in 1500 is the technological high ground of the Mediterranean; the Arsenal's assembly-line production management can be seen as an early precursor to the Industrial Revolution. Murano glass and Venetian printing represent Europe's most precise handicraft technology. But Venice faces the geopolitical challenge of the Age of Discovery — new sea routes diminish Mediterranean trade's strategic importance; Portugal's Cape route to Asia will shake Venice's commercial foundations."
        }
    },
    "spain": {
        "level": 7,
        "sectors": {
            "navigationAndExploration": {
                "zh": "航海与探险技术前沿：哥伦布1492年发现新大陆，西班牙成为大航海时代的两大先锋之一。航海技术（星盘、十字杆、卡拉克帆船）和地图制图学快速发展。麦哲伦即将于1519年启程环球航行。",
                "en": "Frontier navigation and exploration: Columbus's 1492 discovery of the New World makes Spain one of the two pioneers of the Age of Discovery. Navigation technology (astrolabe, cross-staff, carrack ships) and cartography advance rapidly. Magellan will depart for circumnavigation in 1519."
            },
            "militaryTechnology": {
                "zh": "军事技术欧洲前列：西班牙方阵（tercio）是16世纪初欧洲最强陆军战术体系。火绳枪与长矛兵配合的战术创新领先。格拉纳达攻城战（1492年）展示了先进的攻城技术。",
                "en": "European military technology leader: the Spanish tercio is early 16th century Europe's most powerful army tactical system. Tactical innovation combining arquebusiers and pikemen leads. The siege of Granada (1492) demonstrated advanced siege technology."
            }
        },
        "overallAssessment": {
            "zh": "1500年的西班牙凭借航海探险和军事技术正在开创一个全球帝国。哥伦布发现新大陆和即将到来的征服美洲将改变世界格局。但西班牙的科技优势主要集中在军事和航海领域，在制造业和科学研究方面落后于意大利城邦和即将崛起的北欧。新大陆的金银流入将在短期内带来巨大财富，但长期将导致'荷兰病'式的制造业衰退。",
            "en": "Spain in 1500 is creating a global empire through naval exploration and military technology. Columbus's discovery and the coming conquest of the Americas will reshape the world order. But Spain's tech advantage concentrates on military and navigation; it lags Italian city-states and the rising northern Europeans in manufacturing and scientific research. New World gold and silver will bring enormous short-term wealth but long-term 'Dutch Disease' manufacturing decline."
        }
    }
},

# ============================================================
# TANG GOLDEN AGE (750)
# ============================================================
"era-tang-golden-age.json": {
    "byzantine_empire": {
        "level": 7,
        "sectors": {
            "militaryTechnology": {
                "zh": "希腊火——古代最强秘密武器：拜占庭帝国独占'希腊火'（液态燃烧剂喷射武器）技术，在海战中几乎无敌。城防工程（君士坦丁堡三重城墙）在公元750年仍是世界最坚固的防御体系。",
                "en": "Greek Fire — antiquity's most powerful secret weapon: the Byzantine Empire exclusively possesses 'Greek Fire' (liquid incendiary projection weapon), nearly invincible in naval warfare. Fortification engineering (Constantinople's triple walls) remains the world's most formidable defensive system in 750 CE."
            },
            "architectureAndEngineering": {
                "zh": "建筑与工程继承罗马传统：圣索菲亚大教堂（537年建成）是当时世界最大的穹顶建筑，工程技术领先千年。水渠、下水道和城市基础设施体系继承并发展了罗马工程遗产。",
                "en": "Architecture and engineering inheriting Roman tradition: Hagia Sophia (completed 537) is the world's largest domed building, engineering technology a millennium ahead. Aqueducts, sewers, and urban infrastructure systems inherit and develop the Roman engineering legacy."
            }
        },
        "overallAssessment": {
            "zh": "750年的拜占庭帝国是地中海世界技术最先进的文明，希腊火和君士坦丁堡城防体系使其在军事技术上拥有独特优势。圣索菲亚大教堂代表了古代建筑工程的最高成就。但帝国正面临阿拉伯帝国的全面挑战，领土大幅缩小。拜占庭的技术优势在于防御而非进攻，这将使其维持近七个世纪的生存。",
            "en": "The Byzantine Empire in 750 is the Mediterranean world's most technologically advanced civilization; Greek Fire and Constantinople's defenses give it unique military-technological advantages. Hagia Sophia represents the highest achievement of ancient architectural engineering. But the Empire faces the full challenge of the Arab Empire, with territory greatly reduced. Byzantine tech advantage lies in defense rather than offense, enabling its survival for nearly seven more centuries."
        }
    }
},

# ============================================================
# CRUSADES ERA (1200)
# ============================================================
"era-crusades.json": {
    "southern_song": {
        "level": 9,
        "sectors": {
            "gunpowderAndWeaponry": {
                "zh": "火药武器全球最先进：南宋是全球最早大规模使用火药武器的文明。突火枪（原始火铳）、震天雷（爆炸弹）、火箭等火药兵器已在对金、蒙古的战争中广泛使用。但火器尚处原始阶段，尚不能完全取代冷兵器。",
                "en": "World's most advanced gunpowder weapons: the Southern Song is the first civilization to use gunpowder weapons at scale. Fire lances (proto-firearms), thunder crash bombs (explosive shells), and rockets are widely used in wars against Jin and Mongol forces. But firearms are still primitive and cannot fully replace cold weapons."
            },
            "navalAndShipbuilding": {
                "zh": "造船与航海技术全球领先：南宋远洋船舶（福船）使用水密隔舱、指南针导航，载重量和航海能力远超同期欧洲船只。泉州是全球最繁忙的港口，海上丝绸之路贸易鼎盛。",
                "en": "World-leading naval and shipbuilding: Southern Song ocean-going vessels (Fujian ships) use watertight compartments and compass navigation, with carrying capacity and seaworthiness far exceeding contemporary European ships. Quanzhou is the world's busiest port; Maritime Silk Road trade flourishes."
            },
            "printingAndPaper": {
                "zh": "印刷技术全球最先进：毕昇活字印刷术已发明（11世纪），铜活字和木活字印刷广泛应用。书籍产量远超同期欧洲（欧洲此时仍使用手抄本）。纸币（交子、会子）的使用是人类金融史上的重大创新。",
                "en": "World's most advanced printing: Bi Sheng's movable type invented (11th century); copper and wooden movable type widely used. Book production far exceeds contemporary Europe (still using manuscripts). Paper money (jiaozi, huizi) usage is a major innovation in human financial history."
            },
            "agricultureAndIrrigation": {
                "zh": "农业技术全球最高产：占城稻引进后实现一年两熟至三熟。梯田灌溉体系和水车技术精密。南宋以全国约半数领土养活了全球最大的城市人口，临安（杭州）人口超百万。",
                "en": "World's most productive agriculture: Champa rice introduction enables two to three harvests per year. Terrace irrigation systems and waterwheel technology are refined. The Southern Song feeds the world's largest urban population on about half the country's territory; Lin'an (Hangzhou) population exceeds one million."
            }
        },
        "overallAssessment": {
            "zh": "1200年的南宋是全球科技最先进的文明：火药武器、活字印刷、指南针航海、纸币制度——'四大发明'中的三项在此时期达到应用高峰。造船和航海技术远超欧洲，农业产量全球最高。但南宋面临蒙古帝国的致命军事压力，先进技术未能转化为足够的军事优势。历史的讽刺在于，这些中国发明传播到欧洲后，将在数百年后被用于彻底改变全球力量格局。",
            "en": "The Southern Song in 1200 is the world's most technologically advanced civilization: gunpowder weapons, movable type, compass navigation, paper money — three of the 'Four Great Inventions' reach their application peak in this period. Shipbuilding and navigation far surpass Europe; agricultural output is the world's highest. But the Southern Song faces fatal military pressure from the Mongol Empire; advanced technology fails to translate into sufficient military advantage. History's irony: these Chinese inventions, once transmitted to Europe, will be used to completely reshape global power dynamics centuries later."
        }
    }
},

# ============================================================
# IRON AGE (-800)
# ============================================================
"era-iron-age.json": {
    "neo_assyrian_empire": {
        "level": 8,
        "sectors": {
            "militaryEngineering": {
                "zh": "军事工程古代世界最先进：新亚述帝国拥有古代最强大的攻城技术——攻城锤、移动攻城塔、坑道掘进和引水淹城等手段系统化运用。铁制武器大规模装备军队。亚述战车和骑兵编制是古代最完善的军事组织。",
                "en": "Most advanced military engineering in the ancient world: the Neo-Assyrian Empire possesses antiquity's most powerful siege technology — battering rams, mobile siege towers, tunneling, and water diversion systematically employed. Iron weapons equip the army at scale. Assyrian chariots and cavalry represent the ancient world's most refined military organization."
            },
            "hydraulicEngineering": {
                "zh": "水利工程宏大：塞纳赫里布在尼尼微修建的供水渠道长约80公里，包含世界已知最古老的水渠桥。灌溉系统支撑美索不达米亚肥沃的农业。",
                "en": "Grand hydraulic engineering: Sennacherib's water supply channel to Nineveh stretches ~80 km, including the world's oldest known aqueduct bridge. Irrigation systems sustain Mesopotamia's fertile agriculture."
            }
        },
        "overallAssessment": {
            "zh": "公元前800年的新亚述帝国拥有古代世界最先进的军事技术和工程能力。铁制武器的大规模使用、系统化的攻城术和完善的军事组织使亚述成为古代近东最令人畏惧的军事力量。但亚述的技术优势高度集中在军事领域，其暴力统治方式最终将导致帝国崩溃。",
            "en": "The Neo-Assyrian Empire in 800 BCE possesses the ancient world's most advanced military technology and engineering. Large-scale iron weapons, systematized siege warfare, and refined military organization make Assyria the most feared military force in the ancient Near East. But Assyria's tech advantage is highly concentrated in the military domain; its brutal ruling style will ultimately lead to imperial collapse."
        }
    }
}
}

def main():
    base_dir = "src/data/seed"
    total_updated = 0
    
    for filename, region_sectors in ALL_ERA_SECTORS.items():
        filepath = os.path.join(base_dir, filename)
        if not os.path.exists(filepath):
            print(f"  ⚠ File not found: {filepath}")
            continue
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        era = data.get('era', {}).get('zh', '?')
        updated = 0
        
        for region in data['regions']:
            rid = region['id']
            if rid in region_sectors:
                sd = region_sectors[rid]
                tech = region.get('technology', {})
                if 'sectors' not in tech:
                    tech['sectors'] = sd['sectors']
                    tech['overallAssessment'] = sd['overallAssessment']
                    if sd.get('level') and sd['level'] != tech.get('level'):
                        old = tech.get('level')
                        tech['level'] = sd['level']
                        print(f"    Level: {region['name']['zh']} {old} -> {sd['level']}")
                    region['technology'] = tech
                    updated += 1
        
        if updated > 0:
            with open(filepath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {era}: {updated} regions updated")
            total_updated += updated
        else:
            print(f"  {era}: no updates needed")
    
    print(f"\nTotal updated across all eras: {total_updated}")

if __name__ == "__main__":
    main()
