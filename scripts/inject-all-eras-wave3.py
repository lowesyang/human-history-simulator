#!/usr/bin/env python3
"""Wave 3: Fix tech levels for major civilizations and add sectors."""
import json, os

ALL_ERA_SECTORS = {

# ============================================================
# TANG GOLDEN AGE (750) — Tang China needs level correction!
# ============================================================
"era-tang-golden-age.json": {
    "tang_dynasty": {
        "level": 9,
        "sectors": {
            "porcelainAndSilk": {
                "zh": "瓷器与丝绸技术全球领先：唐三彩（三彩釉陶）是中国陶瓷技术的杰出代表，远销中东和欧洲。丝绸织造技术达到新高度，锦、绫、罗等高级面料通过丝绸之路畅销西方。长沙窑率先使用釉下彩技术，开创陶瓷装饰新纪元。",
                "en": "World-leading porcelain and silk: Tang Sancai (tri-color glazed pottery) is a crowning achievement of Chinese ceramics, exported to the Middle East and Europe. Silk weaving reaches new heights, with brocade, damask, and gauze sold extensively westward via the Silk Road. Changsha kilns pioneer underglaze painting, inaugurating a new era in ceramic decoration."
            },
            "printingAndPaper": {
                "zh": "印刷与造纸术传播全球：雕版印刷术在唐代广泛应用，世界现存最早的印刷品《金刚经》（868年）即为唐代作品。造纸术经怛罗斯之战（751年）传入阿拉伯世界，开始改变人类文明进程。宣纸等高级纸张制造技术成熟。",
                "en": "Printing and papermaking spreading globally: woodblock printing is widely applied in Tang China; the world's oldest surviving printed work, the Diamond Sutra (868), is a Tang product. Papermaking technology transmits to the Arab world via the Battle of Talas (751), beginning to transform human civilization. High-quality papers like Xuan paper reach maturity."
            },
            "agriculturalTechnology": {
                "zh": "农业技术精密高效：曲辕犁的改良大幅提升耕作效率。筒车（水力灌溉装置）广泛使用。占城稻早期品种开始引进。大运河与灌溉体系使江南成为'天下粮仓'。唐代人口峰值约8000万，农业体系养活了当时全球最大规模的人口。",
                "en": "Precise and efficient agriculture: the improved curved-shaft plow dramatically increases farming efficiency. Water-wheel irrigation devices (tongche) are widely used. Early Champa rice varieties begin to be introduced. The Grand Canal and irrigation systems make Jiangnan the 'granary of the empire.' Tang population peaks at ~80 million, with agriculture feeding the world's largest population."
            },
            "militaryTechnology": {
                "zh": "军事技术处于转型期：唐朝早期府兵制是世界上最高效的军事动员体系之一。火药配方在唐代已出现于炼丹术文献中（尚未军事化）。陌刀步兵和重装骑兵战术成熟。但安史之乱（755年）正在动摇帝国军事基础。",
                "en": "Military technology in transition: the early Tang fubing system is one of the world's most efficient military mobilization systems. Gunpowder formulas appear in Tang-era alchemical texts (not yet militarized). Infantry sword tactics (modao) and heavy cavalry are mature. But the An Lushan Rebellion (755) is shaking the empire's military foundations."
            }
        },
        "overallAssessment": {
            "zh": "750年的唐朝是全球科技最先进的文明之一，在瓷器、丝绸、印刷、造纸和农业技术上全面领先。唐朝的技术成就通过丝绸之路影响了整个欧亚大陆——造纸术在怛罗斯之战后传入伊斯兰世界，最终传到欧洲，是改变人类历史的关键技术传播事件。火药配方已在炼丹文献中出现，将在数百年后改变全球战争方式。但安史之乱标志着唐朝科技黄金时代的终结。",
            "en": "Tang China in 750 is one of the world's most technologically advanced civilizations, comprehensively leading in porcelain, silk, printing, papermaking, and agricultural technology. Tang achievements influenced all of Eurasia through the Silk Road — papermaking transmitted to the Islamic world after the Battle of Talas, eventually reaching Europe, a pivotal technology transfer event in human history. Gunpowder formulas appear in alchemical texts, destined to transform global warfare centuries later. But the An Lushan Rebellion marks the end of Tang's technological golden age."
        }
    },
    "abbasid_revolution": {
        "level": 7,
        "sectors": {
            "scienceAndLearning": {
                "zh": "伊斯兰科学即将进入黄金时代：阿拔斯王朝将在巴格达建立'智慧之家'（约830年），成为中世纪世界最伟大的学术中心。阿拉伯学者将翻译并保存大量希腊、波斯和印度科学文献。代数学（花拉子米，约820年）和光学（海什木，约1000年）等开创性研究即将诞生。",
                "en": "Islamic science about to enter its Golden Age: the Abbasid Caliphate will establish the House of Wisdom in Baghdad (~830), the medieval world's greatest academic center. Arab scholars will translate and preserve vast Greek, Persian, and Indian scientific texts. Pioneering research in algebra (al-Khwarizmi, ~820) and optics (Ibn al-Haytham, ~1000) is forthcoming."
            },
            "irrigationAndAgriculture": {
                "zh": "灌溉与农业技术融合东西方：阿拉伯帝国整合了美索不达米亚、波斯和埃及的灌溉传统，创造了先进的农业水利体系。坎儿井（地下引水渠道）技术传播至新征服地区。引进并传播了柑橘、棉花、蔗糖等作物。",
                "en": "Irrigation and agriculture fusing East and West: the Arab Empire integrates Mesopotamian, Persian, and Egyptian irrigation traditions, creating advanced agricultural hydraulic systems. Qanat (underground water channel) technology spreads to newly conquered regions. Citrus, cotton, and sugarcane are introduced and disseminated."
            }
        },
        "overallAssessment": {
            "zh": "750年的阿拔斯革命政权刚刚取代倭马亚王朝，正站在伊斯兰科学黄金时代的门槛上。巴格达将成为全球知识和技术的汇聚中心——希腊哲学、印度数学、波斯工程、中国造纸术将在这里融合创新。阿拉伯数字（实为印度数字的阿拉伯传播版本）、代数学和现代光学将从这里传向欧洲。阿拔斯时代的科技成就是人类文明的桥梁。",
            "en": "The Abbasid revolutionary regime in 750 has just replaced the Umayyads, standing on the threshold of the Islamic Golden Age of Science. Baghdad will become the global center of knowledge and technology — Greek philosophy, Indian mathematics, Persian engineering, and Chinese papermaking will converge and innovate here. Arabic numerals (actually Indian numerals transmitted via Arabs), algebra, and modern optics will spread from here to Europe. Abbasid-era scientific achievements are bridges of human civilization."
        }
    }
},

# ============================================================
# HAN-ROME PEAK (100 CE)
# ============================================================
"era-han-rome-peak.json": {
    "eastern_han": {
        "level": 8,
        "sectors": {
            "metallurgyAndAgriculture": {
                "zh": "冶铁与农业技术全球最先进：东汉的冶铁技术远超同期任何文明——高炉炼铁和炒钢法使中国钢铁产量全球最大。铁制农具（铁犁、铁锄）普及率远高于罗马。水排（水力鼓风机）用于冶铁，是人类最早利用水力进行工业生产的实例之一。",
                "en": "World's most advanced metallurgy and agriculture: Eastern Han iron technology far surpasses any contemporary civilization — blast furnace smelting and puddling processes make China the world's largest steel producer. Iron agricultural tools (plows, hoes) are far more prevalent than in Rome. The water-powered bellows (shui pai) for iron smelting is among humanity's earliest uses of water power for industrial production."
            },
            "printingAndPaper": {
                "zh": "造纸术正在革命性发展：蔡伦（约105年）改进造纸术，使纸张成为廉价、高效的书写材料。这一发明将在数百年后传播至全球，彻底改变人类知识传播方式。同时期罗马帝国仍使用昂贵的莎草纸和羊皮纸。",
                "en": "Papermaking undergoing revolutionary development: Cai Lun (~105 CE) improves papermaking, making paper an inexpensive, efficient writing material. This invention will spread globally over the centuries, fundamentally transforming human knowledge dissemination. The contemporary Roman Empire still uses expensive papyrus and parchment."
            },
            "engineeringAndInfrastructure": {
                "zh": "工程与基础设施规模宏大：东汉继承并维护了从秦始皇到汉武帝建设的道路网络、长城和灌溉系统。张衡发明了地动仪（约132年）和浑天仪，代表古代最先进的天文和地震观测技术。",
                "en": "Grand-scale engineering and infrastructure: Eastern Han maintains road networks, the Great Wall, and irrigation systems built from Qin Shi Huang to Emperor Wu. Zhang Heng invented the seismoscope (~132 CE) and armillary sphere, representing antiquity's most advanced astronomical and seismic observation technology."
            }
        },
        "overallAssessment": {
            "zh": "公元100年的东汉在冶铁、造纸和工程技术方面是全球最先进的文明。高炉炼铁技术领先欧洲一千多年，蔡伦改进的造纸术将改变人类文明进程。张衡的地动仪和浑天仪展示了中国古代科学的精妙。东汉与罗马帝国是'双帝国时代'的科技双子星——中国在冶金和造纸方面领先，罗马在建筑工程和军事组织方面领先，两大文明通过丝绸之路间接交流技术和产品。",
            "en": "Eastern Han in 100 CE is the world's most technologically advanced civilization in metallurgy, papermaking, and engineering. Blast furnace technology leads Europe by over a millennium; Cai Lun's improved papermaking will transform human civilization. Zhang Heng's seismoscope and armillary sphere showcase the refinement of ancient Chinese science. Eastern Han and Rome are the 'Twin Empire Era's' tech twin stars — China leads in metallurgy and papermaking, Rome in architectural engineering and military organization, with both civilizations indirectly exchanging technology and products via the Silk Road."
        }
    },
    "roman_empire": {
        "level": 8,
        "sectors": {
            "architectureAndEngineering": {
                "zh": "建筑与工程技术登峰造极：罗马帝国的建筑工程在公元100年达到巅峰——罗马斗兽场（80年竣工）可容纳5万观众，万神殿（即将于118-128年重建）的穹顶将保持世界最大混凝土穹顶纪录近两千年。水渠系统日供水量达100万立方米。罗马道路网络总长超过8万公里。",
                "en": "Architecture and engineering at their zenith: Roman Empire construction peaks around 100 CE — the Colosseum (completed 80 CE) seats 50,000; the Pantheon (to be rebuilt 118-128) dome will hold the record as the world's largest concrete dome for nearly two millennia. Aqueduct systems deliver 1 million cubic meters of water daily. The Roman road network exceeds 80,000 km."
            },
            "militaryOrganization": {
                "zh": "军事组织与工程全球最完善：罗马军团体制在图拉真时代（98-117年）达到巅峰。每支军团都是自给自足的军事-工程单位，能修建道路、桥梁、堡垒和供水系统。罗马军事工程（攻城术、防御工事、军营建设）标准化程度无与伦比。",
                "en": "Most refined military organization and engineering globally: the Roman legion system peaks under Trajan (98-117 CE). Each legion is a self-sufficient military-engineering unit capable of building roads, bridges, forts, and water systems. Roman military engineering (siege warfare, fortifications, camp construction) is standardized to an unmatched degree."
            }
        },
        "overallAssessment": {
            "zh": "公元100年的罗马帝国在建筑工程和军事组织方面达到古代世界的最高峰。斗兽场、万神殿、水渠和道路网络展示了无与伦比的工程能力。但罗马的技术优势集中在'应用工程'而非'基础科学'——与同时期的中国相比，罗马在冶金和造纸方面明显落后。罗马工程的真正奇迹在于其规模和标准化——这是一个靠组织能力而非技术创新建立霸权的帝国。",
            "en": "The Roman Empire in 100 CE reaches antiquity's highest peak in architectural engineering and military organization. The Colosseum, Pantheon, aqueducts, and road networks demonstrate unmatched engineering capability. But Roman tech advantage concentrates on 'applied engineering' rather than 'basic science' — compared to contemporary China, Rome clearly lags in metallurgy and papermaking. Roman engineering's true marvel lies in its scale and standardization — this is an empire built on organizational capability rather than technological innovation."
        }
    }
},

# ============================================================
# QIN-ROME ERA (-221)
# ============================================================
"era-qin-rome.json": {
    "qin_empire_221_bce": {
        "level": 7,
        "sectors": {
            "engineeringAndInfrastructure": {
                "zh": "工程与基础设施全球最大规模：秦始皇统一后启动了人类历史上最宏伟的基建工程——长城（连接并扩展既有城墙）、驰道（标准化道路网络）、灵渠（沟通长江和珠江水系）。秦兵马俑展示了大规模标准化制造能力。度量衡和文字的统一是史无前例的标准化工程。",
                "en": "World's largest-scale engineering and infrastructure: after unification, Qin Shi Huang launches history's grandest infrastructure projects — the Great Wall (connecting and extending existing walls), imperial highways (standardized road network), Lingqu Canal (connecting Yangtze and Pearl River systems). The Terracotta Army demonstrates large-scale standardized manufacturing. Unification of weights, measures, and writing is an unprecedented standardization feat."
            },
            "militaryTechnology": {
                "zh": "军事技术和组织最高效：秦军的弩机是当时世界最先进的远程武器，零部件标准化可互换——比西方'可互换零件'概念早两千年。秦军编制和奖惩制度（军功爵制）是古代世界最系统化的军事体制。",
                "en": "Most efficient military technology and organization: Qin crossbows are the era's most advanced ranged weapons, with standardized interchangeable parts — predating the Western 'interchangeable parts' concept by two millennia. Qin army organization and the military merit rank system are the ancient world's most systematized military institutions."
            }
        },
        "overallAssessment": {
            "zh": "公元前221年的秦帝国在大规模工程建设和军事标准化方面达到了古代世界的巅峰。长城、驰道、灵渠和兵马俑展示了一个中央集权国家将技术大规模、标准化应用的惊人能力。弩机的零部件标准化生产可能是人类历史上最早的'标准化制造'实践。但秦帝国的技术应用高度服务于军事和控制目的，民生技术发展相对有限。帝国的暴政式动员在15年内耗尽了国力。",
            "en": "The Qin Empire in 221 BCE reaches antiquity's zenith in large-scale engineering and military standardization. The Great Wall, highways, Lingqu Canal, and Terracotta Army demonstrate a centralized state's stunning ability to apply technology at scale. Crossbow parts standardization may be humanity's earliest 'standardized manufacturing' practice. But Qin tech application is highly focused on military and control purposes; civilian tech development is relatively limited. The empire's brutal mobilization exhausted national strength within 15 years."
        }
    }
},

# ============================================================
# ADDITIONAL FOR ENLIGHTENMENT (1750)
# ============================================================
"era-enlightenment.json": {
    "dutch_republic": {
        "level": 8,
        "sectors": {
            "financialInfrastructure": {
                "zh": "金融基础设施仍全球领先：阿姆斯特丹银行和证券交易所虽然影响力不如巅峰时期，但仍是全球金融中心之一。荷兰的保险业、银行业和国际贸易金融服务体系在欧洲无可匹敌。",
                "en": "Financial infrastructure still globally leading: the Bank of Amsterdam and stock exchange, though past their peak influence, remain among global financial centers. Dutch insurance, banking, and international trade financial services are unmatched in Europe."
            },
            "navalAndMaritime": {
                "zh": "海军与航海技术仍然先进：荷兰造船业虽然规模不如黄金时代，但技术水平仍是欧洲前列。荷兰东印度公司仍在东南亚和日本维持贸易网络。风车技术在排水和磨坊中的应用高度成熟。",
                "en": "Naval and maritime tech still advanced: Dutch shipbuilding, though diminished from Golden Age scale, maintains European-leading technical standards. The VOC still maintains trade networks in Southeast Asia and Japan. Windmill technology for drainage and milling is highly refined."
            }
        },
        "overallAssessment": {
            "zh": "1750年的荷兰虽然政治和军事影响力已大不如前，但在金融体系和海上贸易技术方面仍保持世界级水平。阿姆斯特丹金融体系是18世纪全球资本流动的关键节点。但荷兰的衰落表明，仅靠商业和金融技术无法维持大国地位——英法两国凭借更大的人口和工业基础正在全面超越。",
            "en": "The Netherlands in 1750, though diminished in political and military influence, maintains world-class financial systems and maritime trade technology. Amsterdam's financial system is a key node in 18th-century global capital flows. But Dutch decline demonstrates that commercial and financial technology alone cannot maintain great power status — Britain and France, with larger populations and industrial bases, are comprehensively overtaking."
        }
    },
    "prussia": {
        "level": 7,
        "sectors": {
            "militaryReform": {
                "zh": "军事改革欧洲最系统：腓特烈大帝（1740-1786年在位）将普鲁士军队打造为欧洲最精锐的军事力量。'斜线战术'（oblique order）是18世纪最先进的战场机动战术。普鲁士军事学院和参谋制度为现代军事组织奠定基础。",
                "en": "Europe's most systematic military reform: Frederick the Great (r. 1740-1786) forges the Prussian army into Europe's most elite military force. The 'oblique order' is the 18th century's most advanced battlefield maneuver tactic. Prussian military academies and staff system lay foundations for modern military organization."
            },
            "educationAndScience": {
                "zh": "教育改革领先欧陆：普鲁士率先推行全民义务教育理念。柏林科学院汇聚欧拉等顶尖数学家和科学家。普鲁士的教育和军事制度将在19世纪成为全球仿效的典范。",
                "en": "Continental education reform leader: Prussia pioneers universal compulsory education concepts. The Berlin Academy of Sciences attracts top mathematicians and scientists including Euler. Prussian education and military institutions will become globally emulated models in the 19th century."
            }
        },
        "overallAssessment": {
            "zh": "1750年的普鲁士虽然在工业和商业方面远不如英法荷兰，但在军事组织和教育制度方面已建立显著优势。腓特烈大帝的军事改革使普鲁士以相对较小的国土和人口跻身欧洲五强。普鲁士的核心竞争力在于'制度创新'——义务教育、参谋制度和军事学院体系将在未来一个世纪为德国统一和崛起提供人才基础。",
            "en": "Prussia in 1750, though far behind Britain, France, and the Netherlands in industry and commerce, has established significant advantages in military organization and education. Frederick the Great's military reforms make Prussia a European great power with relatively small territory and population. Prussia's core competitiveness lies in 'institutional innovation' — compulsory education, the staff system, and military academies will provide the talent base for German unification and rise in the coming century."
        }
    }
},

# ============================================================
# ADDITIONAL FOR WW2 ERA
# ============================================================
"era-world-war-era.json": {
    "canada_1939": {
        "level": 8,
        "sectors": {
            "industrialAndResources": {
                "zh": "工业与资源开发能力强：加拿大在小麦生产、矿产（镍、铝）和林业方面全球领先。战时将成为大英帝国最重要的军工后勤基地——大英联邦航空训练计划（BCATP）将在加拿大训练超过13万名飞行员。加拿大的工业产能将在战争中急剧扩张。",
                "en": "Strong industrial and resource development: Canada leads globally in wheat, minerals (nickel, aluminum), and forestry. Will become the British Empire's most important military-industrial logistics base in wartime — the BCATP will train over 130,000 pilots in Canada. Canadian industrial capacity will expand dramatically during the war."
            }
        },
        "overallAssessment": {
            "zh": "1939年的加拿大作为大英帝国的自治领，拥有丰富的自然资源和快速增长的工业能力。战争将使加拿大从'资源出口国'转变为'军工强国'——镍、铝等战略物资和大规模飞行员训练是加拿大对盟军胜利的关键贡献。加拿大科技的战时发展将为战后成为独立的工业化国家奠定基础。",
            "en": "Canada in 1939, as a British Empire dominion, has abundant natural resources and rapidly growing industrial capability. The war will transform Canada from 'resource exporter' to 'military-industrial power' — strategic materials (nickel, aluminum) and large-scale pilot training are Canada's key contributions to Allied victory. Wartime tech development will lay foundations for postwar emergence as an independent industrialized nation."
        }
    }
},

# ============================================================
# ADDITIONAL FOR COLD WAR — more nations
# ============================================================
"era-cold-war.json": {
    "south_africa_1962": {
        "level": 7,
        "sectors": {
            "miningTech": {
                "zh": "采矿技术世界领先：南非在深层金矿和钻石开采方面技术全球最先进。德比尔斯（钻石）和安格鲁阿美（黄金）集团掌握世界级矿业技术。深井采矿（超过3000米深度）技术独步全球。但种族隔离制度严重限制了科技人才的发展。",
                "en": "World-leading mining technology: South Africa has the world's most advanced deep-level gold and diamond mining technology. De Beers (diamonds) and Anglo American (gold) command world-class mining tech. Ultra-deep mining (exceeding 3,000m depth) technology is globally unmatched. But apartheid severely limits scientific talent development."
            }
        },
        "overallAssessment": {
            "zh": "1962年的南非凭借采矿技术在特定领域达到世界顶级水平，但种族隔离制度造成了科技发展的结构性障碍——大量非白人人口被排除在高等教育和技术培训之外。南非正在秘密推进核武器计划（最终于1979年完成），但国际制裁将日益限制技术进口。",
            "en": "South Africa in 1962 reaches world-class levels in specific domains through mining technology, but apartheid creates structural barriers to tech development — the vast non-white population is excluded from higher education and technical training. South Africa is secretly advancing a nuclear weapons program (completed 1979), but international sanctions will increasingly limit technology imports."
        }
    },
    "israel_1962": {
        "level": 7,
        "sectors": {
            "defenseAndAgriculture": {
                "zh": "国防与农业科技独特优势：以色列国防军和摩萨德在军事技术和情报方面极为先进。滴灌技术（即将由奈坦菲姆公司商业化）将革命性改变干旱地区农业。魏兹曼科学研究所和希伯来大学是中东最强的研究机构。以色列正秘密发展核武器（迪莫纳核设施）。",
                "en": "Unique defense and agricultural tech advantages: IDF and Mossad are extremely advanced in military technology and intelligence. Drip irrigation (about to be commercialized by Netafim) will revolutionize arid-zone agriculture. Weizmann Institute and Hebrew University are the Middle East's strongest research institutions. Israel is secretly developing nuclear weapons (Dimona facility)."
            }
        },
        "overallAssessment": {
            "zh": "1962年的以色列虽然建国仅14年，但已在国防技术和农业科技方面展现出令人瞩目的创新能力。滴灌技术和沙漠农业改造是以色列对全球农业科技的重大贡献。但以色列科技的核心驱动力是生存压力——被敌对国家包围的地缘现实迫使以色列必须在军事和农业技术上寻求突破性创新。",
            "en": "Israel in 1962, though only 14 years old, already demonstrates remarkable innovation in defense technology and agricultural science. Drip irrigation and desert agriculture transformation are major Israeli contributions to global agricultural technology. But Israel's core tech driver is survival pressure — surrounded by hostile nations, Israel is compelled to seek breakthrough innovations in military and agricultural technology."
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
                # Always update level if specified, even if sectors exist
                if sd.get('level') and sd['level'] != tech.get('level'):
                    old = tech.get('level')
                    tech['level'] = sd['level']
                    print(f"    Level fix: {region['name']['zh']} {old} -> {sd['level']}")
                if 'sectors' not in tech:
                    tech['sectors'] = sd['sectors']
                    tech['overallAssessment'] = sd['overallAssessment']
                    region['technology'] = tech
                    updated += 1
                elif sd.get('overallAssessment') and 'overallAssessment' not in tech:
                    tech['overallAssessment'] = sd['overallAssessment']
                    region['technology'] = tech
                    updated += 1
        
        if updated > 0:
            with open(filepath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {era}: {updated} regions updated")
            total_updated += updated
        else:
            # Still write if level changed
            with open(filepath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {era}: level-only updates applied")
    
    print(f"\nTotal updated across all eras: {total_updated}")

if __name__ == "__main__":
    main()
