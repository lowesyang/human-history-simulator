#!/usr/bin/env python3
"""Batch-inject technology sectors into remaining era JSON files — wave 2."""
import json, os

ALL_ERA_SECTORS = {

# ============================================================
# EARLY MODERN (1648)
# ============================================================
"era-early-modern.json": {
    "dutch_republic": {
        "level": 8,
        "sectors": {
            "navalAndMaritime": {
                "zh": "海军与航海技术全球领先：荷兰东印度公司（VOC）拥有全球最大的商船队。荷兰造船业（弗利辛根、阿姆斯特丹造船厂）效率全球最高，弗鲁伊特型商船是当时最经济的远洋船只。荷兰海军在三次英荷战争中证明实力。",
                "en": "Global naval and maritime leader: the VOC (Dutch East India Company) has the world's largest merchant fleet. Dutch shipbuilding (Flushing, Amsterdam yards) is the world's most efficient; the fluyt merchantman is the era's most economical ocean vessel. The Dutch Navy proves its strength in three Anglo-Dutch Wars."
            },
            "opticsAndScience": {
                "zh": "光学与科学仪器先驱：列文虎克发明显微镜（约1670年代），惠更斯改进望远镜和钟表。荷兰是地图制图学（布劳地图集）和航海仪器制造中心。莱顿大学是欧洲重要的科学研究机构。",
                "en": "Optics and scientific instruments pioneer: Leeuwenhoek invents the microscope (~1670s); Huygens improves telescopes and clocks. The Netherlands is the center of cartography (Blaeu Atlas) and navigation instruments. Leiden University is a major European scientific institution."
            },
            "financialInnovation": {
                "zh": "金融创新全球最先进：阿姆斯特丹证券交易所（1602年）是世界首个股票交易所。阿姆斯特丹银行创立了现代银行体系雏形。荷兰发明了期货、期权等金融工具。",
                "en": "Most advanced financial innovation globally: the Amsterdam Stock Exchange (1602) is the world's first stock exchange. The Bank of Amsterdam creates the prototype of modern banking. The Dutch invent financial instruments like futures and options."
            }
        },
        "overallAssessment": {
            "zh": "1648年的荷兰共和国正处于'黄金时代'巅峰，在航海、光学、金融创新和科学研究方面全球领先。VOC是人类历史上第一家跨国公司，荷兰金融体系是现代资本主义的雏形。但荷兰的弱点在于国土和人口太小，无法维持长期的军事优势——英法两大强国的崛起将终结荷兰的全球霸权。",
            "en": "The Dutch Republic in 1648 is at the peak of its 'Golden Age,' leading globally in navigation, optics, financial innovation, and scientific research. The VOC is history's first multinational corporation; the Dutch financial system is the prototype of modern capitalism. But the Netherlands' weakness is its small territory and population, unable to sustain long-term military advantage — the rise of England and France will end Dutch global hegemony."
        }
    },
    "english_commonwealth": {
        "level": 6,
        "sectors": {
            "navalTechnology": {
                "zh": "海军技术快速崛起：克伦威尔的'航海条例'（1651年）推动英国海军快速扩张。英国造船技术从荷兰学习并快速改进。第一次英荷战争（1652-54年）证明英国海军已成为欧洲海上强国。",
                "en": "Rapidly rising naval technology: Cromwell's Navigation Acts (1651) drive rapid English naval expansion. English shipbuilding learns from and rapidly improves upon Dutch techniques. The First Anglo-Dutch War (1652-54) proves England a European naval power."
            },
            "scientificRevolution": {
                "zh": "科学革命萌芽：牛顿即将在数十年后发表《自然哲学的数学原理》。罗伯特·波义耳的化学研究和罗伯特·胡克的显微镜研究正开展中。皇家学会即将成立（1660年）。英国正从'科学输入国'转变为'科学输出国'。",
                "en": "Scientific Revolution emerging: Newton will publish Principia in decades. Robert Boyle's chemistry and Robert Hooke's microscopy are underway. The Royal Society is about to be founded (1660). England is transitioning from 'science importer' to 'science exporter.'"
            }
        },
        "overallAssessment": {
            "zh": "1648年的英国正处于从中等强国向全球大国转型的关键时期。海军力量快速增长，科学革命的种子正在播种。克伦威尔的军事和航海政策为日后大英帝国的崛起奠定基础。但内战的创伤和政治动荡暂时抑制了经济和技术发展。",
            "en": "England in 1648 is at a critical transition from a mid-tier power to a global one. Naval power is growing rapidly; seeds of the Scientific Revolution are being planted. Cromwell's military and navigation policies lay foundations for the future British Empire. But Civil War trauma and political turmoil temporarily suppress economic and technological development."
        }
    },
    "swedish_empire": {
        "level": 8,
        "sectors": {
            "militaryInnovation": {
                "zh": "军事创新欧洲领先：古斯塔夫二世（阿道夫）的军事改革彻底改变了欧洲战争方式——轻型火炮的机动运用、线式战术和混合兵种编制。瑞典军队被视为三十年战争中最具创新性的军事力量。瑞典铜和铁矿资源支撑军工产业。",
                "en": "European military innovation leader: Gustavus Adolphus's reforms revolutionized European warfare — mobile light artillery, linear tactics, and combined arms formations. The Swedish army is considered the Thirty Years' War's most innovative military force. Swedish copper and iron resources support the arms industry."
            },
            "miningAndMetallurgy": {
                "zh": "采矿与冶金技术先进：法伦铜矿是当时欧洲最大的铜矿，瑞典是全球最大的铜出口国和重要的铁出口国。先进的矿井排水和冶炼技术使瑞典成为欧洲的金属供应中心。",
                "en": "Advanced mining and metallurgy: the Falun copper mine is Europe's largest; Sweden is the world's largest copper exporter and a major iron exporter. Advanced mine drainage and smelting technology makes Sweden Europe's metal supply center."
            }
        },
        "overallAssessment": {
            "zh": "1648年的瑞典帝国凭借军事创新和矿业资源成为欧洲大国。古斯塔夫·阿道夫的军事改革影响了此后两个世纪的欧洲战争方式。但瑞典人口稀少（约150万），帝国扩张过度——波罗的海帝国的维持成本远超国力。这一矛盾将在1700年大北方战争中暴露。",
            "en": "The Swedish Empire in 1648 became a European great power through military innovation and mining resources. Gustavus Adolphus's military reforms influenced European warfare for two centuries. But Sweden's sparse population (~1.5 million) means imperial overreach — Baltic Empire maintenance costs far exceed national capacity. This contradiction will be exposed in the 1700 Great Northern War."
        }
    }
},

# ============================================================
# FALL OF ROME (476)
# ============================================================
"era-fall-of-rome.json": {
    "eastern_roman_empire_476": {
        "level": 6,
        "sectors": {
            "architectureAndEngineering": {
                "zh": "罗马工程传统的继承者：东罗马帝国保存并延续了罗马帝国的建筑和工程技术，包括大型穹顶建筑（圣索菲亚大教堂将于537年建成）、水渠供水系统和城市基础设施。君士坦丁堡的三重城墙（狄奥多西城墙）是当时世界最坚固的防御工事。",
                "en": "Inheritor of Roman engineering: the Eastern Roman Empire preserves and continues Roman architectural and engineering traditions, including large domed structures (Hagia Sophia to be completed in 537), aqueduct water supply systems, and urban infrastructure. Constantinople's triple walls (Theodosian Walls) are the world's strongest fortifications."
            },
            "militaryTechnology": {
                "zh": "军事技术承继罗马体系：东罗马军队保留了罗马军团的组织传统但在转型中。重装骑兵（cataphract）成为核心战术力量。'希腊火'（液态燃烧剂）即将在7世纪被发明，将成为拜占庭海军的秘密武器。",
                "en": "Military technology inheriting the Roman system: the Eastern Roman army retains Roman legion organizational traditions but is in transition. Heavy cavalry (cataphracts) become the core tactical force. 'Greek Fire' (liquid incendiary) will be invented in the 7th century, becoming the Byzantine Navy's secret weapon."
            }
        },
        "overallAssessment": {
            "zh": "476年的东罗马帝国是罗马文明的直接继承者，在建筑工程和城防技术方面保持了罗马帝国的最高水平。君士坦丁堡的三重城墙将使这座城市抵御千年围攻。但西罗马的覆灭意味着帝国失去了地中海西部的资源和人口。查士丁尼时代（527-565年）将迎来帝国的文化和工程复兴高峰。",
            "en": "The Eastern Roman Empire in 476 is the direct heir of Roman civilization, maintaining the Roman Empire's highest level in architectural engineering and fortification. Constantinople's triple walls will withstand a millennium of sieges. But the fall of Western Rome means the loss of western Mediterranean resources and population. The Justinian era (527-565) will see a peak of cultural and engineering revival."
        }
    },
    "northern_wei_476": {
        "level": 7,
        "sectors": {
            "metallurgyAndAgriculture": {
                "zh": "冶铁与农业技术领先东亚：北魏继承了中国先进的冶铁和铸铁技术，铁制农具广泛使用。均田制改革将在太和九年（485年）推行，重新分配土地，刺激农业生产。水利灌溉体系在黄河流域维持运作。",
                "en": "Leading East Asia in metallurgy and agriculture: Northern Wei inherits China's advanced iron smelting and casting technology; iron agricultural tools are widely used. The Equal-field System reform will be implemented in 485, redistributing land to stimulate agricultural production. Irrigation systems continue operating in the Yellow River basin."
            },
            "buddhistArtAndArchitecture": {
                "zh": "佛教艺术与石窟工程惊人：云冈石窟（460年代开始）和龙门石窟（即将开凿）代表东亚最宏伟的宗教石刻工程。北魏将佛教艺术与中国传统雕刻技术融合，创造了独特的艺术风格。",
                "en": "Stunning Buddhist art and cave engineering: Yungang Grottoes (started 460s) and Longmen Grottoes (about to begin) represent East Asia's grandest religious stone carving engineering. Northern Wei fuses Buddhist art with Chinese traditional carving techniques, creating a unique artistic style."
            }
        },
        "overallAssessment": {
            "zh": "476年的北魏是东亚最强大的政权，在冶铁、农业和大型工程方面继承了中国文明的技术传统。云冈石窟和即将开凿的龙门石窟展示了令人惊叹的石刻工程能力。但长期的南北分裂和频繁战争消耗了技术发展的资源。汉化改革（孝文帝改革，即将进行）将推动技术和制度的进一步融合。",
            "en": "Northern Wei in 476 is East Asia's most powerful state, inheriting Chinese civilization's technological traditions in iron smelting, agriculture, and large-scale engineering. Yungang Grottoes and the upcoming Longmen Grottoes demonstrate stunning stone carving engineering capability. But prolonged north-south division and frequent wars drain resources for technological development. Sinicization reforms (Emperor Xiaowen's, upcoming) will drive further technological and institutional integration."
        }
    }
},

# ============================================================
# HAN-ROME PEAK (100 CE)
# ============================================================
"era-han-rome-peak.json": {
    # Note: need to find the actual region IDs for Han and Rome
},

# ============================================================
# THREE KINGDOMS (220 CE)
# ============================================================
"era-three-kingdoms.json": {
    "aksum_220": {
        "level": 7,
        "sectors": {
            "architectureAndTrade": {
                "zh": "石碑建筑与国际贸易枢纽：阿克苏姆王国修建了世界上最高的独石石碑（方尖碑），高达33米，展示了先进的石材加工和工程技术。阿杜利斯港是红海最重要的贸易港口之一，连接罗马帝国和印度洋贸易网络。",
                "en": "Stele architecture and international trade hub: the Kingdom of Aksum erected the world's tallest monolithic stelae (obelisks), up to 33m tall, demonstrating advanced stone-working and engineering. The port of Adulis is one of the Red Sea's most important trade ports, connecting the Roman Empire and Indian Ocean trade networks."
            }
        },
        "overallAssessment": {
            "zh": "公元220年的阿克苏姆王国是东非最先进的文明，石碑建筑工程和国际贸易网络展示了其技术和组织能力。阿杜利斯港使阿克苏姆成为连接地中海与印度洋世界的关键枢纽。阿克苏姆即将成为最早皈依基督教的非洲王国之一。",
            "en": "The Kingdom of Aksum in 220 CE is East Africa's most advanced civilization; stele engineering and international trade networks demonstrate its technological and organizational capability. The port of Adulis makes Aksum a key hub connecting Mediterranean and Indian Ocean worlds. Aksum will soon become one of the earliest African kingdoms to adopt Christianity."
        }
    }
},

# ============================================================
# HELLENISTIC (-323)
# ============================================================
"era-hellenistic.json": {
    "ptolemaic_egypt_323": {
        "level": 7,
        "sectors": {
            "scienceAndLearning": {
                "zh": "科学与学术中心：亚历山大港将成为古代世界最伟大的学术中心。亚历山大图书馆（即将建立）将收藏古代世界最全面的知识。缪斯宫（Mouseion）将吸引欧几里得、阿基米德等最伟大的学者。埃拉托色尼将在此首次准确计算地球周长。",
                "en": "Science and learning center: Alexandria will become the ancient world's greatest academic center. The Library of Alexandria (about to be established) will house the most comprehensive collection of ancient knowledge. The Mouseion will attract the greatest scholars including Euclid and Archimedes. Eratosthenes will first accurately calculate Earth's circumference here."
            },
            "irrigationAndAgriculture": {
                "zh": "灌溉与农业技术古老而高效：尼罗河灌溉体系经数千年完善，是古代世界最高效的农业体系。阿基米得螺旋泵（即将发明）将进一步提升灌溉效率。法尤姆绿洲的排水工程展示了先进的水利技术。",
                "en": "Ancient and efficient irrigation and agriculture: the Nile irrigation system, refined over millennia, is the ancient world's most efficient agricultural system. The Archimedean screw (about to be invented) will further improve irrigation efficiency. Faiyum Oasis drainage engineering demonstrates advanced hydraulic technology."
            }
        },
        "overallAssessment": {
            "zh": "公元前323年的托勒密埃及继承了亚历山大帝国的科学遗产和埃及数千年的农业工程传统。亚历山大港将在未来数世纪成为古代世界的科学首都——几何学、天文学、地理学、医学的最重要突破将在这里诞生。古埃及的灌溉体系则为这一切提供了经济基础。",
            "en": "Ptolemaic Egypt in 323 BCE inherits Alexander's empire's scientific legacy and Egypt's millennia-old agricultural engineering tradition. Alexandria will become the ancient world's science capital for centuries — the most important breakthroughs in geometry, astronomy, geography, and medicine will be born here. Ancient Egypt's irrigation system provides the economic foundation for all of this."
        }
    },
    "rome_republic": {
        "level": 6,
        "sectors": {
            "engineeringAndInfrastructure": {
                "zh": "工程与基础设施建设能力突出：罗马道路（阿庇安大道，前312年建成）和水渠系统展示了罗马人卓越的工程组织能力。虽然在科学理论上不如希腊，但罗马人在实用工程方面无与伦比。拱券和混凝土技术正在发展中。",
                "en": "Outstanding engineering and infrastructure: Roman roads (Appian Way, built 312 BCE) and aqueduct systems demonstrate Romans' excellent engineering organization. Though inferior to the Greeks in scientific theory, Romans are unmatched in practical engineering. Arch and concrete technology is developing."
            },
            "militaryOrganization": {
                "zh": "军事组织古代最高效：罗马军团体制（操练队形、标准化装备、工程兵能力）是古代世界最系统化的军事组织。每支军团都能独立修建营地、道路和桥梁。罗马军事工程能力是其扩张的技术基础。",
                "en": "Most efficient military organization in antiquity: the Roman legion system (drill formations, standardized equipment, engineering capability) is the most systematized military organization in the ancient world. Each legion can independently build camps, roads, and bridges. Roman military engineering capability is the technological foundation of its expansion."
            }
        },
        "overallAssessment": {
            "zh": "公元前323年的罗马共和国在科学和文化上远不如希腊世界，但在实用工程和军事组织方面已展现出独特优势。罗马道路和水渠系统将在未来数个世纪发展为古代世界最宏伟的基础设施网络。罗马的技术核心不在理论创新，而在于将已有技术大规模、标准化地应用于军事和城市建设。",
            "en": "The Roman Republic in 323 BCE is far inferior to the Greek world in science and culture, but already shows unique advantages in practical engineering and military organization. Roman roads and aqueducts will develop into the ancient world's grandest infrastructure network over the coming centuries. Rome's tech core lies not in theoretical innovation but in large-scale, standardized application of existing technology for military and urban construction."
        }
    }
},

# ============================================================
# AXIAL AGE (-500)
# — most regions are level 5, so fewer candidates
# ============================================================

# ============================================================
# MONGOL EMPIRE (1280)
# ============================================================
"era-mongol-empire.json": {
    "venice_1280": {
        "level": 6,
        "sectors": {
            "navalAndTrade": {
                "zh": "海运与贸易技术地中海领先：威尼斯兵工厂已成为地中海最大的造船设施。威尼斯商船队连接东西方贸易，马可·波罗正从中国归来（1295年回到威尼斯）。威尼斯玻璃制造（穆拉诺岛）和造船技术在地中海独占鳌头。",
                "en": "Mediterranean-leading maritime and trade technology: the Venice Arsenal is the Mediterranean's largest shipbuilding facility. Venetian merchant fleets connect East-West trade; Marco Polo is returning from China (arriving Venice 1295). Venetian glassmaking (Murano) and shipbuilding technology lead the Mediterranean."
            }
        },
        "overallAssessment": {
            "zh": "1280年的威尼斯是地中海贸易和造船技术的中心。兵工厂的标准化生产管理远超同时代任何欧洲国家。威尼斯的商业网络延伸至蒙古帝国和中国（马可·波罗）。但欧洲整体技术水平在此时仍远落后于中国和伊斯兰世界。",
            "en": "Venice in 1280 is the center of Mediterranean trade and shipbuilding technology. The Arsenal's standardized production management far surpasses any contemporary European country. Venice's commercial network extends to the Mongol Empire and China (Marco Polo). But overall European technology still lags far behind China and the Islamic world."
        }
    }
},

# ============================================================
# QIN-ROME (-221) — most regions level 4-5
# ============================================================

# ============================================================
# ADDITIONAL COUNTRIES FOR COLD WAR ERA
# ============================================================
"era-cold-war.json": {
    "sweden_1962": {
        "level": 8,
        "sectors": {
            "defenseIndustry": {
                "zh": "国防工业自主且先进：萨博（SAAB）J35'龙'（Draken）战斗机是世界上第一种实用双三角翼战斗机，性能接近超级大国水平。博福斯防空炮全球知名。瑞典坚持武装中立，自主研发几乎全部军事装备。",
                "en": "Autonomous and advanced defense industry: Saab J35 Draken is the world's first practical double-delta wing fighter, performance approaching superpower level. Bofors anti-aircraft guns are world-renowned. Sweden maintains armed neutrality, independently developing nearly all military equipment."
            },
            "automotiveAndIndustrial": {
                "zh": "汽车与工业发展成熟：沃尔沃和萨博汽车以安全性和北欧设计著称。爱立信在电信设备领域崛起。ABB（阿西亚-布朗-勃法瑞）在电力和自动化领域全球领先。",
                "en": "Mature automotive and industrial development: Volvo and Saab cars are renowned for safety and Nordic design. Ericsson rises in telecommunications equipment. ASEA (later ABB) leads globally in power and automation."
            }
        },
        "overallAssessment": {
            "zh": "1962年的瑞典以中立国身份发展出令人瞩目的自主国防工业和民用工业体系。萨博战斗机、博福斯火炮和沃尔沃汽车证明小国也能在尖端技术领域达到世界水平。瑞典的社会民主模式将'福利国家'与'技术创新'成功结合。",
            "en": "Sweden in 1962 has developed an impressive autonomous defense and civilian industrial system as a neutral nation. Saab fighters, Bofors guns, and Volvo cars prove that small nations can achieve world-class levels in cutting-edge technology. Sweden's social democratic model successfully combines 'welfare state' with 'technological innovation.'"
        }
    },
    "canada_1962": {
        "level": 8,
        "sectors": {
            "nuclearAndEnergy": {
                "zh": "核技术与能源工业有独特优势：加拿大CANDU重水堆是世界独特的核反应堆设计，不需要浓缩铀。水力发电规模全球前列。石油和矿产资源开采技术先进。但1959年阿夫罗箭（Avro Arrow）先进战斗机项目被取消是加拿大航空工业的重大挫折。",
                "en": "Unique nuclear and energy advantages: Canada's CANDU heavy water reactor is a unique nuclear design not requiring enriched uranium. Hydroelectric power generation ranks globally. Oil and mining technology is advanced. But the 1959 Avro Arrow advanced fighter cancellation was a major setback for Canadian aviation."
            }
        },
        "overallAssessment": {
            "zh": "1962年的加拿大在核技术（CANDU反应堆）和资源开采方面有独特优势。但作为美国的邻国和盟友，加拿大在国防工业上日益依赖美国——阿夫罗箭项目的取消象征着加拿大放弃了独立发展尖端军事技术的雄心。加拿大科技的特点是'资源技术强、独立军工弱'。",
            "en": "Canada in 1962 has unique advantages in nuclear technology (CANDU) and resource extraction. But as the US neighbor and ally, Canada increasingly depends on America for defense — the Avro Arrow cancellation symbolizes abandoning ambitions for independent advanced military tech. Canadian tech is characterized by 'strong resource technology, weak independent defense industry.'"
        }
    },
    "italy_1962": {
        "level": 8,
        "sectors": {
            "automotiveAndDesign": {
                "zh": "汽车与工业设计全球知名：菲亚特是意大利最大的工业集团，菲亚特500（'Cinquecento'）是意大利经济奇迹的象征。法拉利和兰博基尼在跑车领域代表最高技术和设计水平。意大利设计美学影响全球工业产品。",
                "en": "Globally renowned automotive and design: Fiat is Italy's largest industrial group; the Fiat 500 symbolizes the Italian economic miracle. Ferrari and Lamborghini represent the highest tech and design in sports cars. Italian design aesthetics influence global industrial products."
            },
            "petroleumEngineering": {
                "zh": "石油工业国有化成功：ENI（国家碳化氢公司）在马泰伊领导下打破了'七姐妹'石油巨头的垄断，与中东和非洲产油国建立了新型合作关系。石油化工技术快速发展。",
                "en": "Successful nationalized petroleum: ENI under Mattei breaks the 'Seven Sisters' oil cartel monopoly, establishing new cooperative relationships with Middle Eastern and African oil states. Petrochemical technology develops rapidly."
            }
        },
        "overallAssessment": {
            "zh": "1962年的意大利正经历'经济奇迹'，汽车工业（菲亚特）、设计美学和石油工业（ENI）是核心竞争力。意大利科技的独特之处在于将工程技术与艺术设计完美融合——法拉利跑车和菲亚特小车分别代表了这一传统的两个极端。但南北经济差距巨大，基础科学研究投入不足。",
            "en": "Italy in 1962 is experiencing its 'Economic Miracle'; automotive (Fiat), design aesthetics, and petroleum (ENI) are core competencies. Italy's tech uniqueness lies in perfectly fusing engineering with artistic design — Ferrari and Fiat 500 represent the two extremes of this tradition. But the north-south economic gap is vast, and basic science research investment is insufficient."
        }
    }
},

# ============================================================
# ADDITIONAL FOR IMPERIALISM (1900)
# ============================================================
"era-imperialism.json": {
    "france_third_republic_1900": {
        "level": 8,
        "sectors": {
            "scienceAndMedicine": {
                "zh": "科学与医学欧洲前列：巴斯德的微生物学和疫苗研究（狂犬疫苗1885年）使法国在生物医学领域全球领先。居里夫妇正在进行放射性研究（1903年将获诺贝尔奖）。法国科学院和巴斯德研究所是全球重要科研机构。",
                "en": "European leader in science and medicine: Pasteur's microbiology and vaccine research (rabies vaccine 1885) makes France a global leader in biomedicine. The Curies are conducting radioactivity research (Nobel Prize in 1903). The French Academy of Sciences and Pasteur Institute are globally important research institutions."
            },
            "automotiveAndAviation": {
                "zh": "汽车与航空工业先驱：法国是汽车工业的发源地之一，标致和雷诺已开始生产汽车。法国在早期航空领域活跃——热气球技术领先，飞机研发正在起步。1900年巴黎世博会展示了法国的技术实力和文化影响力。",
                "en": "Automotive and aviation pioneer: France is one of the birthplaces of the auto industry; Peugeot and Renault have begun car production. France is active in early aviation — balloon technology leads, airplane R&D is starting. The 1900 Paris Exposition showcases French technological strength and cultural influence."
            }
        },
        "overallAssessment": {
            "zh": "1900年的法国在科学研究（巴斯德微生物学、居里夫妇放射性研究）和汽车/航空先驱方面位居世界前列。但工业产能不如英国和德国，重化工业发展受制于资源不足。法国科技的核心优势在于基础科学研究和创新性强，但将科研成果转化为工业产能的能力弱于德国。殖民帝国（北非、印度支那）主要贡献原材料而非技术发展。",
            "en": "France in 1900 ranks among the world's top in scientific research (Pasteur's microbiology, Curie radioactivity) and automotive/aviation pioneering. But industrial capacity falls short of Britain and Germany; heavy industry is constrained by resource limitations. France's core tech advantage is strong basic science research and innovation, but its ability to convert research into industrial capacity is weaker than Germany's. The colonial empire (North Africa, Indochina) mainly contributes raw materials rather than tech development."
        }
    },
    "russian_empire_1900": {
        "level": 7,
        "sectors": {
            "railwayAndInfrastructure": {
                "zh": "铁路工程雄心壮志：西伯利亚大铁路（1891年开工）是人类历史上最宏伟的铁路工程，全长9000余公里，即将于1904年完工。铁路建设推动了俄国钢铁和采矿工业发展。但技术和资金大量依赖法国和比利时。",
                "en": "Ambitious railway engineering: the Trans-Siberian Railway (begun 1891) is history's grandest railway project, over 9,000 km, nearing completion in 1904. Railway construction drives Russian steel and mining development. But technology and capital heavily depend on France and Belgium."
            },
            "heavyIndustry": {
                "zh": "重工业发展中但落后于西欧：维特伯爵推动的工业化政策使俄国钢铁产量快速增长，巴库油田产量全球第一。但工业化严重依赖外国投资和技术。军工产业有实力但效率低下——1905年日俄战争将暴露其军事技术短板。",
                "en": "Heavy industry developing but behind Western Europe: Count Witte's industrialization policies drive rapid steel output growth; Baku oil field output is the world's highest. But industrialization heavily depends on foreign investment and technology. Arms industry has strength but is inefficient — the 1905 Russo-Japanese War will expose military tech shortcomings."
            }
        },
        "overallAssessment": {
            "zh": "1900年的俄罗斯帝国正在经历大规模工业化，西伯利亚大铁路和巴库石油是其最重要的技术成就。但俄国工业化是'国家主导、外资依赖'的模式——法国资本和西欧技术是发展的关键支撑。与西欧的技术差距在军事领域尤为明显，日俄战争的失败将证明数量优势无法弥补技术差距。",
            "en": "The Russian Empire in 1900 is undergoing massive industrialization; the Trans-Siberian Railway and Baku oil are its most important tech achievements. But Russian industrialization follows a 'state-led, foreign-dependent' model — French capital and Western European technology are critical supports. The technology gap with Western Europe is especially apparent in military affairs; the Russo-Japanese War defeat will prove that numerical advantage cannot compensate for the technology gap."
        }
    }
},

# ============================================================
# ADDITIONAL FOR INDUSTRIAL REVOLUTION (1840)
# ============================================================
"era-industrial-revolution.json": {
    "france_july_monarchy_1840": {
        "level": 8,
        "sectors": {
            "scienceAndEngineering": {
                "zh": "科学与工程教育领先欧陆：巴黎综合理工学院（Polytechnique，1794年创立）培养了大量工程师和科学家，是法国科技发展的人才基础。拉瓦锡化学革命的遗产使法国化学研究领先。达盖尔1839年发明摄影术轰动世界。",
                "en": "Continental leader in science and engineering education: École Polytechnique (founded 1794) trains masses of engineers and scientists, forming the talent base for French tech. Lavoisier's chemistry revolution legacy keeps French chemistry research leading. Daguerre's 1839 invention of photography stuns the world."
            },
            "railwayAndInfrastructure": {
                "zh": "铁路与基础设施建设追赶英国：法国1837年开通第一条铁路（巴黎-圣日耳曼），铁路网络快速扩张但规模仍不到英国一半。法国的优势在于铁路工程的系统规划（中央集权体制推动统一标准）。",
                "en": "Railway and infrastructure catching up to Britain: France opened its first railway in 1837 (Paris-Saint-Germain); the rail network expands rapidly but is still less than half of Britain's. France's advantage is systematic railway planning (centralized governance promoting unified standards)."
            }
        },
        "overallAssessment": {
            "zh": "1840年的法国是仅次于英国的第二工业化国家，但与英国的差距仍然显著（蒸汽机数量不到英国1/5）。法国的优势在于科学教育体系和创新能力——摄影术的发明、化学研究的领先证明法国在'基础科学到应用创新'的链条上有独特优势。但法国大革命和拿破仑战争的政治动荡延缓了工业化进程。",
            "en": "France in 1840 is the second most industrialized nation after Britain, but the gap remains significant (steam engine count less than 1/5 of Britain's). France's advantage lies in its scientific education system and innovation — photography's invention and chemistry research leadership prove France has unique strengths in the 'basic science to applied innovation' chain. But political turmoil from the Revolution and Napoleonic Wars delayed industrialization."
        }
    },
    "us_1840": {
        "level": 7,
        "sectors": {
            "manufacturingAndInvention": {
                "zh": "制造业与发明创新活跃：美国发明了'可互换零件'制造法（惠特尼），正奠定大规模生产的基础。科尔特左轮手枪工厂是早期标准化生产的典范。棉花轧棉机使南方棉花产量暴增。但美国制造业仍以初级加工为主，精密制造落后于英国。",
                "en": "Active manufacturing and invention: America invented 'interchangeable parts' manufacturing (Whitney), laying mass production foundations. Colt's revolver factory exemplifies early standardized production. The cotton gin caused Southern cotton output to surge. But US manufacturing is still primarily processing; precision manufacturing lags Britain."
            },
            "railwayExpansion": {
                "zh": "铁路扩张势头强劲：美国铁路里程已超过5000英里并快速增长，正成为世界铁路建设最活跃的国家。但铁路设备大量从英国进口，自主制造能力有限。蒸汽船在密西西比河上广泛使用，推动内陆交通革命。",
                "en": "Strong railway expansion momentum: US rail mileage exceeds 5,000 miles and grows rapidly, becoming the world's most active railway builder. But rail equipment is largely imported from Britain; domestic manufacturing capability is limited. Steamboats widely used on the Mississippi, driving an inland transport revolution."
            }
        },
        "overallAssessment": {
            "zh": "1840年的美国正处于工业化起步阶段，在'可互换零件'和标准化生产方面展现出独特创新力。铁路扩张势头全球最强，但核心工业技术仍依赖英国。美国的独特优势在于广袤的国土、丰富的资源和创业精神——这些要素将在19世纪下半叶将美国推上工业产能世界第一的位置。但1840年时，美国仍是一个以农业为主的发展中国家。",
            "en": "The US in 1840 is at the early stage of industrialization, showing unique innovation in interchangeable parts and standardized production. Railway expansion momentum is the world's strongest, but core industrial technology still depends on Britain. America's unique advantages are vast territory, abundant resources, and entrepreneurial spirit — factors that will propel the US to #1 industrial capacity in the latter 19th century. But in 1840, the US is still primarily an agricultural developing country."
        }
    }
}
}

def main():
    base_dir = "src/data/seed"
    total_updated = 0
    
    for filename, region_sectors in ALL_ERA_SECTORS.items():
        if not region_sectors:
            continue
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
                if not sd.get('sectors'):
                    continue
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
