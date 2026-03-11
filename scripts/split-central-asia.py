#!/usr/bin/env python3
"""Split the combined Central Asia region into 5 individual countries for AI Age and Modern Era."""

import json
import sys
import os

def create_ai_age_countries():
    """Create 5 individual Central Asian country entries for the AI Age era."""
    return [
        {
            "id": "ai_kazakhstan",
            "name": {"zh": "哈萨克斯坦", "en": "Kazakhstan"},
            "territoryId": "kazakhstan",
            "territoryScale": "xl",
            "civilization": {
                "name": {"zh": "哈萨克斯坦共和国", "en": "Republic of Kazakhstan"},
                "type": "republic",
                "ruler": {"zh": "卡西姆-若马尔特·托卡耶夫", "en": "Kassym-Jomart Tokayev"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "后纳扎尔巴耶夫时代总统制", "en": "Post-Nazarbayev presidential system"},
                "capital": {"zh": "阿斯塔纳", "en": "Astana"},
                "governmentForm": {
                    "zh": "总统制共和国。2022年「一月事件」后，托卡耶夫推进有限政治改革——削弱前总统纳扎尔巴耶夫家族影响力、修宪限制总统权力、允许有限政党竞争，但权力仍高度集中。",
                    "en": "Presidential republic. After the January 2022 events, Tokayev pursued limited political reforms — weakening former President Nazarbayev's family influence, constitutional amendments limiting presidential power, allowing limited party competition, but power remains highly concentrated."
                },
                "socialStructure": {
                    "zh": "以部族（жүз）网络为基础的社会结构，分大玉兹、中玉兹、小玉兹三大部落联盟。城市中产阶级在阿拉木图和阿斯塔纳发展迅速，但城乡二元分化严重。",
                    "en": "Social structure based on tribal (zhuz) networks, divided into Great, Middle, and Lesser Hordes. Urban middle class growing rapidly in Almaty and Astana, but severe urban-rural divide."
                },
                "rulingClass": {
                    "zh": "托卡耶夫亲信网络、安全机构高层、能源与矿业寡头（含外资合资）、前纳扎尔巴耶夫时代精英残余。",
                    "en": "Tokayev's inner circle, security apparatus leadership, energy and mining oligarchs (including foreign JVs), remnants of Nazarbayev-era elites."
                },
                "succession": {
                    "zh": "2019年纳扎尔巴耶夫向托卡耶夫权力交接，2022年骚乱后托卡耶夫彻底巩固权力。名义上总统选举，实际为控制性继承。",
                    "en": "2019 Nazarbayev-to-Tokayev power transfer, Tokayev consolidated power after 2022 unrest. Nominally presidential elections, effectively controlled succession."
                }
            },
            "government": {
                "structure": {
                    "zh": "总统主导型政府，下设参议院和马日利斯（下院）。总统任命总理和州长。2022年改革后宪法法院恢复设立。",
                    "en": "President-dominated government with Senate and Mazhilis (lower house). President appoints PM and governors. Constitutional Court restored after 2022 reforms."
                },
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家权力核心，制定重大政策与人事任命。", "en": "Core of state power, setting major policies and personnel appointments."}, "headCount": 3000},
                    {"name": {"zh": "国家安全委员会", "en": "National Security Committee (KNB)"}, "function": {"zh": "管理国内安全、情报与反恐。2022年后进行大规模改组。", "en": "Managing domestic security, intelligence, and counter-terrorism. Major reorganization after 2022."}, "headCount": 15000},
                    {"name": {"zh": "数字发展与航空航天部", "en": "Ministry of Digital Development and Aerospace"}, "function": {"zh": "推动电子政务、AI战略与航天产业发展。", "en": "Advancing e-governance, AI strategy, and aerospace industry."}, "headCount": 2000}
                ],
                "totalOfficials": 500000,
                "localAdmin": {"zh": "全国分17个州（含3个直辖市），州长由总统任命。幅员广大（全球第九大国），地方治理依赖州长体系。", "en": "Country divided into 17 regions (including 3 cities of republican significance), governors appointed by president. Vast territory (world's 9th largest)."},
                "legalSystem": {"zh": "大陆法系，2022年后恢复宪法法院。阿斯塔纳国际金融中心（AIFC）采用英国普通法体系以吸引外资。", "en": "Civil law system, Constitutional Court restored after 2022. AIFC uses English common law to attract foreign investment."},
                "taxationSystem": {"zh": "企业税20%、个人所得税10%。AIFC特区享受税收优惠。能源出口收入为主要财政来源。", "en": "Corporate tax 20%, personal income tax 10%. AIFC zone enjoys tax incentives. Energy export revenue as main fiscal source."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教为主（约70%），世俗国家体制，宗教活动受政府管控。少数俄罗斯东正教徒。", "en": "Sunni Islam predominant (~70%), secular state system, religious activities government-controlled. Minority Russian Orthodox."},
                "philosophy": {"zh": "突厥游牧文化传统与苏联世俗遗产交织，「曼吉利克·叶尔」（永恒国家）国家理念。后苏联民族建构与去俄化进程中。", "en": "Turkic nomadic cultural traditions intertwined with Soviet secular legacy, 'Mangilik Yel' (Eternal Nation) state ideology. Ongoing post-Soviet nation-building and de-Russification."},
                "writingSystem": {"zh": "2023年起逐步从西里尔字母转换为拉丁字母（计划2031年完成）。", "en": "Gradual transition from Cyrillic to Latin alphabet since 2023 (planned completion by 2031)."},
                "culturalAchievements": {"zh": "迪玛希·库达别尔根全球歌唱事业、2017年阿斯塔纳世博会、传统骑马文化（马上竞技）、拜科努尔航天基地。", "en": "Dimash Kudaibergen's global singing career, 2017 Astana Expo, traditional equestrian culture, Baikonur Cosmodrome."},
                "languageFamily": {"zh": "哈萨克语（突厥语族）为国语，俄语为官方使用语言。", "en": "Kazakh (Turkic family) as national language, Russian as official language of use."}
            },
            "economy": {
                "level": 5,
                "gdpEstimate": {"amount": 220000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "gdpPerCapita": {"amount": 11200, "unit": {"zh": "美元/人", "en": "US dollars per capita"}},
                "gdpDescription": {"zh": "中亚最大经济体，GDP约2200亿美元。经济高度依赖石油天然气出口（占出口60%+），铀矿开采占全球40%产量。阿斯塔纳国际金融中心试图推动金融多元化。", "en": "Largest Central Asian economy at ~$220B GDP. Highly dependent on oil and gas exports (60%+ of exports), uranium mining at 40% of global supply. AIFC attempting financial diversification."},
                "mainIndustries": {"zh": "石油天然气、铀矿开采（全球第一）、金属冶炼、粮食生产、金融科技", "en": "Oil and gas, uranium mining (world's #1), metal smelting, grain production, fintech"},
                "tradeGoods": {"zh": "原油、天然气、铀、金属、粮食", "en": "Crude oil, natural gas, uranium, metals, grain"},
                "currency": {"name": {"zh": "哈萨克斯坦坚戈", "en": "Kazakh Tenge"}, "type": "fiat", "metalBasis": "none", "unitName": {"zh": "坚戈", "en": "KZT"}},
                "householdWealth": {"zh": "家庭财富中位数约1.5万美元。城乡差距与地区差距显著。", "en": "Median household wealth ~$15,000. Significant urban-rural and regional disparities."},
                "averageIncome": {"amount": 7500, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "foreignTradeVolume": {"amount": 120000000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "tradeRoutes": {"zh": "中国-中亚天然气管道、里海管道联盟（CPC）、中欧班列过境、一带一路「中间走廊」核心节点。", "en": "China-Central Asia gas pipeline, Caspian Pipeline Consortium (CPC), China-Europe rail transit, Belt and Road 'Middle Corridor' core node."},
                "economicSystem": {"zh": "国家资本主义，能源资源由国有企业Samruk-Kazyna控制。AIFC试图吸引外国投资。后2022年推进有限经济改革。", "en": "State capitalism, energy resources controlled by SOE Samruk-Kazyna. AIFC attempting to attract foreign investment. Limited economic reforms post-2022."}
            },
            "finances": {
                "annualRevenue": {"amount": 55000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "annualExpenditure": {"amount": 58000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "surplus": {"amount": -3000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "revenueBreakdown": [
                    {"source": {"zh": "能源出口收入", "en": "Energy export revenue"}, "amount": {"amount": 25000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 45.5},
                    {"source": {"zh": "税收收入", "en": "Tax revenue"}, "amount": {"amount": 20000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 36.4},
                    {"source": {"zh": "国有企业利润", "en": "SOE profits"}, "amount": {"amount": 10000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 18.1}
                ],
                "expenditureBreakdown": [
                    {"category": {"zh": "社会支出", "en": "Social spending"}, "amount": {"amount": 22000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 37.9},
                    {"category": {"zh": "基础设施", "en": "Infrastructure"}, "amount": {"amount": 14000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 24.1},
                    {"category": {"zh": "国防安全", "en": "Defense and security"}, "amount": {"amount": 7000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 12.1}
                ],
                "treasury": {"amount": 60000000000, "unit": {"zh": "美元（国家基金）", "en": "US dollars (National Fund)"}},
                "treasuryDescription": {"zh": "哈萨克斯坦国家基金（Samruk-Kazyna管理）约600亿美元，是中亚最大财政缓冲。", "en": "Kazakhstan's National Fund (managed by Samruk-Kazyna) at ~$60B, the largest fiscal buffer in Central Asia."},
                "debtLevel": {"zh": "公共债务约25%GDP。", "en": "Public debt ~25% GDP."},
                "fiscalPolicy": {"zh": "通过国家基金稳定财政，石油收入超额部分存入基金。", "en": "Fiscal stabilization through National Fund, excess oil revenue deposited into fund."}
            },
            "military": {
                "level": 4,
                "totalTroops": 110000,
                "standingArmy": 75000,
                "reserves": 35000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 50000, "description": {"zh": "以苏联遗留装备为主，正推进现代化（采购土耳其无人机Bayraktar TB2与以色列防空系统）。", "en": "Primarily Soviet-era equipment, pursuing modernization (procuring Turkish Bayraktar TB2 drones and Israeli air defense)."}},
                    {"name": {"zh": "空军", "en": "Air Force"}, "count": 12000, "description": {"zh": "苏-27/苏-30战斗机为主，少量引进现代装备。", "en": "Su-27/Su-30 fighters, with limited modern acquisitions."}},
                    {"name": {"zh": "国民卫队", "en": "National Guard"}, "count": 30000, "description": {"zh": "2022年「一月事件」后大幅扩编与改组，承担国内安全与反恐任务。", "en": "Significantly expanded and reorganized after January 2022 events, handling domestic security and counter-terrorism."}}
                ],
                "commandStructure": {"totalGenerals": 65, "commanderInChief": {"zh": "总统兼任武装力量最高统帅", "en": "President serves as supreme commander of armed forces"}},
                "technology": {"zh": "从土耳其采购Bayraktar TB2无人机，从以色列采购防空系统。拜科努尔航天发射基地（租借给俄罗斯）。", "en": "Procuring Bayraktar TB2 drones from Turkey and air defense from Israel. Baikonur Cosmodrome (leased to Russia)."},
                "annualMilitarySpending": {"amount": 3500000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "militarySpendingPctGdp": 1.6,
                "threats": {"zh": "俄罗斯地缘影响力（北方边境漫长）、阿富汗外溢风险、国内民族紧张（俄族人口）。", "en": "Russian geopolitical influence (long northern border), Afghan spillover risk, domestic ethnic tensions (Russian minority)."},
                "recentBattles": {"zh": "2022年「一月事件」——全国性骚乱，CSTO出兵协助镇压，约230人死亡。", "en": "2022 'January Events' — nationwide unrest, CSTO troops assisted suppression, ~230 killed."}
            },
            "demographics": {
                "population": 19700000,
                "populationDescription": {"zh": "人口约1970万，哈萨克族约70%、俄罗斯族约15%。人口增长稳定。", "en": "Population ~19.7M, Kazakhs ~70%, Russians ~15%. Stable population growth."},
                "urbanPopulation": 12000000,
                "urbanizationRate": 60,
                "majorCities": [
                    {"name": {"zh": "阿拉木图", "en": "Almaty"}, "population": 2100000},
                    {"name": {"zh": "阿斯塔纳", "en": "Astana"}, "population": 1350000},
                    {"name": {"zh": "卡拉干达", "en": "Karaganda"}, "population": 500000},
                    {"name": {"zh": "奇姆肯特", "en": "Shymkent"}, "population": 1100000}
                ],
                "ethnicGroups": {"zh": "哈萨克族（约70%）、俄罗斯族（约15%）、乌兹别克族、乌克兰族、维吾尔族等。", "en": "Kazakhs (~70%), Russians (~15%), Uzbeks, Ukrainians, Uyghurs, etc."},
                "socialClasses": {"zh": "能源寡头与权贵阶层、城市新兴中产（阿拉木图IT与金融）、广大农牧区贫困人口。", "en": "Energy oligarchs and elites, emerging urban middle class (Almaty IT and finance), large rural poor."},
                "literacyRate": 99.8,
                "lifeExpectancy": {"zh": "74岁", "en": "74 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（CSTO成员但寻求保持距离）、中国（经济伙伴/SCO成员）、土耳其（突厥兄弟国）、欧盟（能源合作）。", "en": "Russia (CSTO member but seeking distance), China (economic partner/SCO member), Turkey (Turkic brotherhood), EU (energy cooperation)."},
                "enemies": {"zh": "无正式敌国。对阿富汗塔利班政权保持警惕。", "en": "No formal enemies. Vigilant toward Afghan Taliban regime."},
                "vassals": {"zh": "无附庸国。", "en": "No vassal states."},
                "treaties": {"zh": "CSTO、SCO、欧亚经济联盟（EAEU）、突厥国家组织。", "en": "CSTO, SCO, Eurasian Economic Union (EAEU), Organization of Turkic States."},
                "foreignPolicy": {"zh": "多向平衡外交——在俄罗斯、中国与西方之间维持等距。俄乌战争后加速「去俄化」外交调整，拒绝承认俄吞并乌东领土。", "en": "Multi-vector balanced diplomacy — maintaining equidistance among Russia, China, and the West. Accelerated 'de-Russification' after Russia-Ukraine war, refused to recognize Russian annexation of Ukrainian territory."},
                "recentDiplomaticEvents": {"zh": "2023年中国-中亚峰会在西安举行。在联合国就乌克兰问题保持中立投票。「中间走廊」战略地位提升。", "en": "2023 China-Central Asia summit in Xi'an. Neutral votes on Ukraine at the UN. Enhanced 'Middle Corridor' strategic status."}
            },
            "technology": {
                "level": 4,
                "era": {"zh": "工业化与数字化转型期", "en": "Industrialization and digital transformation"},
                "keyInnovations": {"zh": "阿斯塔纳国际金融中心（AIFC）金融科技沙盒、Kaspi.kz超级应用、铀提取技术（全球最先进）、拜科努尔航天基地。", "en": "AIFC fintech sandbox, Kaspi.kz super app, uranium extraction technology (world's most advanced), Baikonur Cosmodrome."},
                "infrastructure": {"zh": "中亚最发达的公路与铁路网络。互联网普及率约85%。中欧班列重要过境枢纽。", "en": "Most developed road and rail network in Central Asia. Internet penetration ~85%. Major China-Europe rail transit hub."}
            },
            "aiSector": {
                "level": 2,
                "policy": {"zh": "2022年发布首份AI发展概念文件。AIFC金融科技沙盒为AI应用提供监管试验场。", "en": "Released first AI development concept paper in 2022. AIFC fintech sandbox provides regulatory testing ground for AI applications."},
                "regulatoryStance": {"zh": "AIFC提供较先进的金融科技监管沙盒，但整体AI监管框架不完善。", "en": "AIFC provides advanced fintech regulatory sandbox, but overall AI regulatory framework incomplete."},
                "investmentScale": {"zh": "AI投资约3-4亿美元/年，主要集中在金融科技领域。", "en": "AI investment ~$300-400M/year, mainly concentrated in fintech."},
                "keyModels": [{"name": {"zh": "Kaspi.kz AI推荐系统", "en": "Kaspi.kz AI Recommendation System"}, "developer": {"zh": "Kaspi.kz", "en": "Kaspi.kz"}, "releaseYear": 2023, "capabilities": {"zh": "金融科技超级应用中的AI驱动支付、电商与银行服务推荐。", "en": "AI-driven payment, e-commerce, and banking service recommendations in fintech super app."}}],
                "leadingCompanies": [
                    {"name": {"zh": "Kaspi.kz", "en": "Kaspi.kz"}, "valuation": {"zh": "约200亿美元（市值）", "en": "~$20B (market cap)"}, "keyProducts": {"zh": "哈萨克斯坦最大金融科技超级应用。", "en": "Kazakhstan's largest fintech super app."}, "headquarters": {"zh": "阿拉木图", "en": "Almaty"}},
                    {"name": {"zh": "Kolesa Group", "en": "Kolesa Group"}, "valuation": {"zh": "约10亿美元", "en": "~$1B"}, "keyProducts": {"zh": "中亚最大在线分类信息与电商平台。", "en": "Central Asia's largest online classifieds and e-commerce platform."}, "headquarters": {"zh": "阿拉木图", "en": "Almaty"}}
                ],
                "keyFigures": [{"name": {"zh": "巴格达特·穆辛", "en": "Bagdat Mussin"}, "title": {"zh": "数字发展与航空航天部长", "en": "Minister of Digital Development and Aerospace"}, "affiliation": {"zh": "哈萨克斯坦政府", "en": "Kazakhstan Government"}, "contribution": {"zh": "推动数字化转型与AI发展战略。", "en": "Driving digital transformation and AI strategy."}}],
                "researchFocus": {"zh": "政务数字化与智慧城市（阿斯塔纳）、金融科技AI、铀矿与能源勘探AI。", "en": "Government digitalization and smart city (Astana), fintech AI, uranium and energy exploration AI."},
                "computeInfrastructure": {"zh": "纳扎尔巴耶夫大学拥有区域最好的计算设施。依赖国际云服务。", "en": "Nazarbayev University has region's best computing facilities. Dependent on international cloud services."},
                "talentPool": {"zh": "纳扎尔巴耶夫大学与Bolashak奖学金培养核心人才。大量优秀人才外流。", "en": "Nazarbayev University and Bolashak scholarships as core talent pipelines. Significant brain drain."},
                "globalRanking": {"zh": "中亚AI发展最领先的国家，Kaspi.kz展示了跳跃式发展可能性。", "en": "Leading AI development in Central Asia, Kaspi.kz demonstrates leapfrog potential."},
                "outlook": {"zh": "受益于「中间走廊」枢纽地位与年轻人口红利，有望在5-10年内建立基础AI能力。", "en": "Benefits from 'Middle Corridor' hub status and young demographic dividend, may build foundational AI capabilities in 5-10 years."}
            },
            "assessment": {
                "strengths": {"zh": "丰富能源与矿产资源（石油/天然气/铀）、中亚最大经济体、地缘战略位置（中间走廊核心）、改革势头。", "en": "Rich energy and mineral resources (oil/gas/uranium), largest Central Asian economy, geostrategic location (Middle Corridor core), reform momentum."},
                "weaknesses": {"zh": "威权治理、荷兰病风险、俄族人口地缘安全隐患、人才外流。", "en": "Authoritarian governance, Dutch disease risk, Russian minority geosecurity concerns, brain drain."},
                "outlook": {"zh": "「中间走廊」战略机遇为哈萨克斯坦带来历史性转型窗口。若能深化改革、吸引外资，有望超越资源经济。", "en": "'Middle Corridor' strategic opportunity opens historic transformation window. If reforms deepen and investment attracted, may transcend resource economy."}
            },
            "status": "stable",
            "description": {
                "zh": "2023年的哈萨克斯坦是中亚最大经济体与领土最广的国家，正经历后纳扎尔巴耶夫时代的政治经济转型。2022年「一月事件」后，托卡耶夫总统推进有限改革，削弱旧权贵影响力。作为全球最大铀生产国和重要油气出口国，哈萨克斯坦在俄乌战争后凭借「中间走廊」地位获得新战略价值。Kaspi.kz等金融科技应用展现了数字经济跳跃式发展的潜力。",
                "en": "Kazakhstan in 2023 is Central Asia's largest economy and most expansive territory, undergoing post-Nazarbayev political and economic transformation. After the January 2022 events, President Tokayev pursues limited reforms to weaken old elite influence. As the world's largest uranium producer and major oil/gas exporter, Kazakhstan gained new strategic value through the 'Middle Corridor' after the Russia-Ukraine war. Fintech apps like Kaspi.kz demonstrate digital leapfrog potential."
            }
        },
        {
            "id": "ai_uzbekistan",
            "name": {"zh": "乌兹别克斯坦", "en": "Uzbekistan"},
            "territoryId": "uzbekistan",
            "territoryScale": "lg",
            "civilization": {
                "name": {"zh": "乌兹别克斯坦共和国", "en": "Republic of Uzbekistan"},
                "type": "republic",
                "ruler": {"zh": "沙夫卡特·米尔济约耶夫", "en": "Shavkat Mirziyoyev"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "后卡里莫夫时代改革总统制", "en": "Post-Karimov reform presidential system"},
                "capital": {"zh": "塔什干", "en": "Tashkent"},
                "governmentForm": {"zh": "总统制共和国。2016年卡里莫夫去世后，米尔济约耶夫大力推进经济开放与有限政治改革，成为中亚改革先锋。2023年修宪延长总统任期至2037年。", "en": "Presidential republic. After Karimov's death in 2016, Mirziyoyev pushed economic opening and limited political reform, becoming Central Asia's reform pioneer. 2023 constitutional amendments extended presidential term to 2037."},
                "socialStructure": {"zh": "以地区和氏族网络为基础，塔什干-撒马尔罕-费尔干纳三大区域精英竞争。城市化与年轻人口推动社会变革。", "en": "Based on regional and clan networks, competition among Tashkent-Samarkand-Fergana regional elites. Urbanization and young population driving social change."},
                "rulingClass": {"zh": "米尔济约耶夫亲信、撒马尔罕派系精英、安全机构高层、新兴商人阶层。", "en": "Mirziyoyev's inner circle, Samarkand faction elites, security apparatus leadership, emerging business class."},
                "succession": {"zh": "2023年修宪实际为米尔济约耶夫「归零」任期，可执政至2037年。接班人安排不明。", "en": "2023 constitutional amendment effectively 'reset' Mirziyoyev's term, allowing rule until 2037. Succession plans unclear."}
            },
            "government": {
                "structure": {"zh": "强总统制政府，下设参议院和立法院。近年推进行政效率改革与反腐。", "en": "Strong presidential government with Senate and Legislative Chamber. Recent administrative efficiency reforms and anti-corruption drives."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家权力核心，制定改革政策与方向。", "en": "Core of state power, setting reform policies and direction."}, "headCount": 2500},
                    {"name": {"zh": "IT Park", "en": "IT Park"}, "function": {"zh": "科技创业孵化器与IT产业特区，推动数字经济发展。", "en": "Tech startup incubator and IT industry special zone, promoting digital economy."}, "headCount": 500}
                ],
                "totalOfficials": 400000,
                "localAdmin": {"zh": "全国分12个州与1个自治共和国（卡拉卡尔帕克斯坦）。2022年卡拉卡尔帕克斯坦自治地位争议引发骚乱。", "en": "12 regions and 1 autonomous republic (Karakalpakstan). 2022 Karakalpakstan autonomy dispute triggered unrest."},
                "legalSystem": {"zh": "大陆法系，近年推进司法改革，但司法独立性仍不足。", "en": "Civil law system, recent judicial reforms, but judicial independence still insufficient."},
                "taxationSystem": {"zh": "近年大幅简化税制，降低税率以吸引外资。企业税15%。", "en": "Recently simplified tax system significantly, lowered rates to attract FDI. Corporate tax 15%."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教（约90%），世俗国家体制。撒马尔罕和布哈拉是伊斯兰文明重要历史中心。", "en": "Sunni Islam (~90%), secular state system. Samarkand and Bukhara are important historical centers of Islamic civilization."},
                "philosophy": {"zh": "丝绸之路文明传统与苏联世俗遗产融合。帖木儿大帝被奉为国家象征。近年加强中亚区域认同。", "en": "Silk Road civilizational tradition fused with Soviet secular legacy. Tamerlane elevated as national symbol. Recently strengthening Central Asian regional identity."},
                "writingSystem": {"zh": "拉丁字母（1993年起从西里尔转换，2023年推出最终版拉丁字母方案）。", "en": "Latin alphabet (transitioning from Cyrillic since 1993, final Latin script version released in 2023)."},
                "culturalAchievements": {"zh": "撒马尔罕/布哈拉/希瓦联合国世界遗产、丝绸之路文化遗产复兴、传统音乐（maqom）与建筑艺术。", "en": "Samarkand/Bukhara/Khiva UNESCO World Heritage, Silk Road cultural heritage revival, traditional music (maqom) and architectural arts."},
                "languageFamily": {"zh": "乌兹别克语（突厥语族）为国语，俄语仍广泛使用。", "en": "Uzbek (Turkic family) as national language, Russian still widely used."}
            },
            "economy": {
                "level": 4,
                "gdpEstimate": {"amount": 80000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "gdpPerCapita": {"amount": 2200, "unit": {"zh": "美元/人", "en": "US dollars per capita"}},
                "gdpDescription": {"zh": "中亚人口最多国家（3600万），GDP约800亿美元。米尔济约耶夫时代推进市场化改革，经济增长较快。黄金、棉花、天然气为主要出口品。", "en": "Most populous Central Asian country (36M), GDP ~$80B. Mirziyoyev era market reforms driving faster growth. Gold, cotton, natural gas as main exports."},
                "mainIndustries": {"zh": "棉花种植与加工、黄金开采、天然气、纺织、汽车组装（GM-Uzbekistan）、IT服务", "en": "Cotton cultivation and processing, gold mining, natural gas, textiles, auto assembly (GM-Uzbekistan), IT services"},
                "tradeGoods": {"zh": "黄金、棉花、天然气、纺织品、汽车", "en": "Gold, cotton, natural gas, textiles, automobiles"},
                "currency": {"name": {"zh": "乌兹别克斯坦索姆", "en": "Uzbek Som"}, "type": "fiat", "metalBasis": "none", "unitName": {"zh": "索姆", "en": "UZS"}},
                "householdWealth": {"zh": "家庭财富中位数约5000美元。大量海外劳工（尤其在俄罗斯）汇款是重要收入来源。", "en": "Median household wealth ~$5,000. Remittances from overseas workers (especially in Russia) are major income source."},
                "averageIncome": {"amount": 2000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "foreignTradeVolume": {"amount": 45000000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "tradeRoutes": {"zh": "中国-中亚天然气管道、中欧班列过境、与阿富汗贸易通道、传统丝绸之路路线。", "en": "China-Central Asia gas pipeline, China-Europe rail transit, Afghanistan trade corridors, traditional Silk Road routes."},
                "economicSystem": {"zh": "从国家控制经济向市场经济转型。2017年实行汇率自由化，近年推进国企私有化与外资引入。", "en": "Transitioning from state-controlled to market economy. Exchange rate liberalization in 2017, recent SOE privatization and FDI promotion."}
            },
            "finances": {
                "annualRevenue": {"amount": 25000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "annualExpenditure": {"amount": 27000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "surplus": {"amount": -2000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "revenueBreakdown": [
                    {"source": {"zh": "税收收入", "en": "Tax revenue"}, "amount": {"amount": 15000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 60},
                    {"source": {"zh": "资源出口收入", "en": "Resource export revenue"}, "amount": {"amount": 7000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 28}
                ],
                "expenditureBreakdown": [
                    {"category": {"zh": "社会支出与教育", "en": "Social spending and education"}, "amount": {"amount": 12000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 44.4},
                    {"category": {"zh": "基础设施", "en": "Infrastructure"}, "amount": {"amount": 8000000000, "unit": {"zh": "美元", "en": "US dollars"}}, "percentage": 29.6}
                ],
                "treasury": {"amount": 15000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "debtLevel": {"zh": "公共债务约35%GDP。", "en": "Public debt ~35% GDP."},
                "fiscalPolicy": {"zh": "加大社会支出与基建投入，推进税制改革以扩大税基。", "en": "Increasing social and infrastructure spending, tax reform to broaden tax base."}
            },
            "military": {
                "level": 3,
                "totalTroops": 65000,
                "standingArmy": 50000,
                "reserves": 15000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 40000, "description": {"zh": "中亚规模最大的常备军之一。苏联遗留装备为主。", "en": "One of Central Asia's largest standing armies. Primarily Soviet-era equipment."}},
                    {"name": {"zh": "空军", "en": "Air Force"}, "count": 7000, "description": {"zh": "苏制战机为主，注重对阿富汗方向防御。", "en": "Primarily Soviet aircraft, focused on defense toward Afghanistan."}},
                    {"name": {"zh": "安全部队", "en": "Security Forces"}, "count": 18000, "description": {"zh": "国内安全维稳力量，费尔干纳盆地反极端主义为重点。", "en": "Domestic security forces, with anti-extremism in Fergana Valley as priority."}}
                ],
                "commandStructure": {"totalGenerals": 40, "commanderInChief": {"zh": "总统兼任武装力量最高统帅", "en": "President serves as supreme commander"}},
                "technology": {"zh": "以苏联遗留装备为基础，近年从中国和土耳其少量引进现代装备。", "en": "Based on Soviet-era legacy, recent limited acquisitions from China and Turkey."},
                "annualMilitarySpending": {"amount": 2000000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "militarySpendingPctGdp": 2.5,
                "threats": {"zh": "阿富汗塔利班外溢风险、费尔干纳盆地极端主义、与吉尔吉斯/塔吉克边境争端。", "en": "Afghan Taliban spillover, Fergana Valley extremism, border disputes with Kyrgyzstan/Tajikistan."}
            },
            "demographics": {
                "population": 36000000,
                "populationDescription": {"zh": "中亚人口最多国家，约3600万。乌兹别克族约83%。中位年龄年轻（约28岁），人口增长率较高。", "en": "Most populous Central Asian country at ~36M. Uzbeks ~83%. Young median age (~28), high population growth rate."},
                "urbanPopulation": 18000000,
                "urbanizationRate": 50,
                "majorCities": [
                    {"name": {"zh": "塔什干", "en": "Tashkent"}, "population": 2900000},
                    {"name": {"zh": "撒马尔罕", "en": "Samarkand"}, "population": 550000},
                    {"name": {"zh": "纳曼干", "en": "Namangan"}, "population": 500000},
                    {"name": {"zh": "布哈拉", "en": "Bukhara"}, "population": 280000}
                ],
                "ethnicGroups": {"zh": "乌兹别克族（约83%）、塔吉克族（约5%）、俄罗斯族（约3%）、哈萨克族、卡拉卡尔帕克族等。", "en": "Uzbeks (~83%), Tajiks (~5%), Russians (~3%), Kazakhs, Karakalpaks, etc."},
                "socialClasses": {"zh": "政治精英、新兴商人阶层、城市知识分子、大量农村人口与海外劳工（数百万在俄罗斯务工）。", "en": "Political elites, emerging business class, urban intellectuals, large rural population and overseas workers (millions working in Russia)."},
                "literacyRate": 99.6,
                "lifeExpectancy": {"zh": "72岁", "en": "72 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（传统伙伴）、中国（经济与基建伙伴）、土耳其（突厥兄弟国）、韩国（劳务合作）。拒绝加入欧亚经济联盟。", "en": "Russia (traditional partner), China (economic/infrastructure partner), Turkey (Turkic brotherhood), South Korea (labor cooperation). Refused to join EAEU."},
                "enemies": {"zh": "无正式敌国。对阿富汗塔利班保持警惕，与邻国存在水资源争端。", "en": "No formal enemies. Vigilant toward Afghan Taliban, water disputes with neighbors."},
                "foreignPolicy": {"zh": "独立自主的多向外交，明确不加入军事联盟（不参加CSTO）。米尔济约耶夫时代大幅改善与邻国关系。", "en": "Independent multi-vector diplomacy, explicitly not joining military alliances (not in CSTO). Mirziyoyev era dramatically improved relations with neighbors."}
            },
            "technology": {
                "level": 3,
                "era": {"zh": "工业化与数字化初期", "en": "Early industrialization and digitalization"},
                "keyInnovations": {"zh": "IT Park科技孵化器、高铁项目推进、纺织业现代化。", "en": "IT Park tech incubator, high-speed rail project, textile industry modernization."},
                "infrastructure": {"zh": "公路铁路网络发展中，高铁项目（塔什干-撒马尔罕）推进中。互联网普及率约70%。", "en": "Road and rail network developing, high-speed rail (Tashkent-Samarkand) underway. Internet penetration ~70%."}
            },
            "aiSector": {
                "level": 1,
                "policy": {"zh": "将AI纳入数字经济战略，IT Park为科技创业提供政策支持。", "en": "AI incorporated into digital economy strategy, IT Park provides policy support for tech startups."},
                "investmentScale": {"zh": "AI投资有限，约1亿美元/年，主要通过IT Park渠道。", "en": "Limited AI investment, ~$100M/year, mainly through IT Park channels."},
                "outlook": {"zh": "凭借年轻人口与IT Park平台，乌兹别克斯坦有望成为中亚第二个建立基础AI能力的国家。", "en": "With young population and IT Park platform, Uzbekistan may become Central Asia's second country to build foundational AI capabilities."}
            },
            "assessment": {
                "strengths": {"zh": "中亚最大人口、丰富文化遗产（丝绸之路）、改革势头强劲、年轻人口红利。", "en": "Largest Central Asian population, rich cultural heritage (Silk Road), strong reform momentum, young demographic dividend."},
                "weaknesses": {"zh": "人均收入低、威权体制结构性限制、海外劳工依赖、水资源紧缺。", "en": "Low per capita income, structural limitations of authoritarian system, overseas labor dependence, water scarcity."},
                "outlook": {"zh": "米尔济约耶夫改革若能持续深化，乌兹别克斯坦有望成为中亚经济增长引擎。", "en": "If Mirziyoyev's reforms continue deepening, Uzbekistan may become Central Asia's economic growth engine."}
            },
            "status": "stable",
            "description": {
                "zh": "2023年的乌兹别克斯坦是中亚人口最多的国家（3600万），在米尔济约耶夫总统领导下成为区域改革先锋。自2016年卡里莫夫去世后，乌兹别克斯坦大力推进经济开放、汇率自由化和对外关系改善。撒马尔罕、布哈拉等丝绸之路古城代表了深厚的文明遗产。尽管2023年修宪引发争议，但经济改革势头与年轻人口红利为其长远发展提供了可能。",
                "en": "Uzbekistan in 2023 is Central Asia's most populous country (36M), becoming the region's reform pioneer under President Mirziyoyev. Since Karimov's death in 2016, Uzbekistan has pushed economic opening, exchange rate liberalization, and improved foreign relations. Silk Road cities like Samarkand and Bukhara represent deep civilizational heritage. Despite controversial 2023 constitutional amendments, reform momentum and young demographic dividend offer long-term potential."
            }
        },
        {
            "id": "ai_turkmenistan",
            "name": {"zh": "土库曼斯坦", "en": "Turkmenistan"},
            "territoryId": "turkmenistan",
            "territoryScale": "md",
            "civilization": {
                "name": {"zh": "土库曼斯坦", "en": "Turkmenistan"},
                "type": "republic",
                "ruler": {"zh": "谢尔达尔·别尔德穆哈梅多夫", "en": "Serdar Berdimuhamedow"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "别尔德穆哈梅多夫家族统治", "en": "Berdimuhamedow family rule"},
                "capital": {"zh": "阿什哈巴德", "en": "Ashgabat"},
                "governmentForm": {"zh": "高度威权总统制。2022年父亲古尔班古力将权力传给儿子谢尔达尔，实现家族世袭。全球最封闭的政治体制之一。", "en": "Highly authoritarian presidential system. Father Gurbanguly transferred power to son Serdar in 2022, establishing family dynasty. One of world's most closed political systems."},
                "socialStructure": {"zh": "部族结构深刻影响政治与社会，阿哈尔（Akhal）部族占主导地位。严格的信息封锁与社会控制。", "en": "Tribal structure deeply influences politics and society, Akhal tribe dominant. Strict information blockade and social control."},
                "rulingClass": {"zh": "别尔德穆哈梅多夫家族、阿哈尔部族精英、天然气产业管理层、安全机构。", "en": "Berdimuhamedow family, Akhal tribal elites, gas industry management, security apparatus."},
                "succession": {"zh": "2022年由父传子（古尔班古力传位于谢尔达尔），古尔班古力继续以人民委员会主席身份掌握实权。", "en": "2022 father-to-son transfer (Gurbanguly to Serdar), Gurbanguly continues to hold real power as People's Council chairman."}
            },
            "government": {
                "structure": {"zh": "总统独裁制，议会（梅吉利斯）为橡皮图章。2023年设立人民委员会（由前总统主持）作为最高权力机构。", "en": "Presidential dictatorship, parliament (Mejlis) rubber stamp. 2023 established People's Council (chaired by former president) as supreme body."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家决策核心。", "en": "Core of state decisions."}, "headCount": 1500},
                    {"name": {"zh": "国家天然气康采恩", "en": "Turkmengas State Concern"}, "function": {"zh": "管理天然气开采与出口，是国家收入支柱。", "en": "Managing gas extraction and export, pillar of state revenue."}, "headCount": 30000}
                ],
                "totalOfficials": 200000,
                "localAdmin": {"zh": "全国分5个州，州长由总统任命，中央控制极强。", "en": "5 provinces, governors appointed by president, extremely strong central control."},
                "legalSystem": {"zh": "苏联遗产法律体系，总统凌驾于法律之上，无司法独立可言。", "en": "Soviet-legacy legal system, president above the law, no judicial independence."},
                "taxationSystem": {"zh": "经济高度国有化，税收体系不透明。天然气出口收入为绝对主要财源。", "en": "Highly nationalized economy, opaque tax system. Gas export revenue as dominant fiscal source."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教（约90%），但世俗化程度高，宗教活动受严格管控。", "en": "Sunni Islam (~90%), but highly secularized, religious activities strictly controlled."},
                "philosophy": {"zh": "「鲁赫纳玛」（前总统尼亚佐夫的精神著作）意识形态遗产与土库曼民族主义结合。极端个人崇拜文化。", "en": "Ruhnama (former president Niyazov's spiritual work) ideological legacy combined with Turkmen nationalism. Extreme personality cult culture."},
                "writingSystem": {"zh": "拉丁字母（1993年起改革）。", "en": "Latin alphabet (reformed since 1993)."},
                "culturalAchievements": {"zh": "阿什哈巴德白色大理石建筑群（吉尼斯纪录最多白色大理石建筑城市）、汗血宝马（阿哈尔捷金马）传统。", "en": "Ashgabat white marble buildings (Guinness record for most marble-clad buildings), Akhal-Teke horse tradition."},
                "languageFamily": {"zh": "土库曼语（突厥语族），俄语使用减少。", "en": "Turkmen (Turkic family), Russian usage declining."}
            },
            "economy": {
                "level": 3,
                "gdpEstimate": {"amount": 60000000000, "unit": {"zh": "美元（数据不透明）", "en": "US dollars (opaque data)"}},
                "gdpPerCapita": {"amount": 9500, "unit": {"zh": "美元/人（官方数据，实际可能更低）", "en": "US dollars per capita (official, actual may be lower)"}},
                "gdpDescription": {"zh": "经济高度依赖天然气出口（占出口80%+），主要客户为中国。官方数据不透明，实际经济状况可能远差于公布数字。", "en": "Economy highly dependent on gas exports (80%+ of exports), mainly to China. Official data opaque, actual economic conditions may be far worse than published figures."},
                "mainIndustries": {"zh": "天然气开采与出口、石油、棉花、纺织", "en": "Natural gas extraction and export, oil, cotton, textiles"},
                "tradeGoods": {"zh": "天然气、石油、棉花、纺织品", "en": "Natural gas, oil, cotton, textiles"},
                "currency": {"name": {"zh": "土库曼斯坦马纳特", "en": "Turkmen Manat"}, "type": "fiat", "metalBasis": "none", "unitName": {"zh": "马纳特", "en": "TMT"}},
                "householdWealth": {"zh": "官方数据不可靠。实际居民生活水平较低，多重汇率制导致购买力不明。", "en": "Official data unreliable. Actual living standards low, multiple exchange rates obscure purchasing power."},
                "averageIncome": {"amount": 3000, "unit": {"zh": "美元/年（估计值）", "en": "US dollars per year (estimate)"}},
                "foreignTradeVolume": {"amount": 20000000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "economicSystem": {"zh": "高度国有化的计划经济遗产，天然气与棉花由国家垄断。外资参与有限（主要在能源领域）。", "en": "Highly nationalized planned economy legacy, gas and cotton state monopolized. Limited foreign participation (mainly in energy)."}
            },
            "finances": {
                "annualRevenue": {"amount": 18000000000, "unit": {"zh": "美元（估计值）", "en": "US dollars (estimate)"}},
                "annualExpenditure": {"amount": 20000000000, "unit": {"zh": "美元（估计值）", "en": "US dollars (estimate)"}},
                "surplus": {"amount": -2000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "treasury": {"amount": 10000000000, "unit": {"zh": "美元（估计值，数据不透明）", "en": "US dollars (estimate, opaque data)"}},
                "debtLevel": {"zh": "外债规模不透明，估计适中。", "en": "External debt scale opaque, estimated moderate."},
                "fiscalPolicy": {"zh": "天然气收入为财政支柱，政府维持大量补贴（免费水电气等）。", "en": "Gas revenue as fiscal pillar, government maintains extensive subsidies (free water, electricity, gas, etc.)."}
            },
            "military": {
                "level": 2,
                "totalTroops": 36000,
                "standingArmy": 26000,
                "reserves": 10000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 20000, "description": {"zh": "苏联遗留装备，维护水平低。", "en": "Soviet-era equipment, low maintenance standards."}},
                    {"name": {"zh": "海军（里海舰队）", "en": "Navy (Caspian Fleet)"}, "count": 3000, "description": {"zh": "大量采购意大利海军舰艇用于里海防御。", "en": "Purchased Italian naval vessels for Caspian defense."}},
                    {"name": {"zh": "安全部队", "en": "Security Forces"}, "count": 13000, "description": {"zh": "国内安全与政权保卫力量。", "en": "Domestic security and regime protection forces."}}
                ],
                "commandStructure": {"totalGenerals": 25, "commanderInChief": {"zh": "总统兼任武装力量最高统帅", "en": "President serves as supreme commander"}},
                "annualMilitarySpending": {"amount": 1500000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "militarySpendingPctGdp": 2.5,
                "threats": {"zh": "阿富汗边境安全、里海资源争端。", "en": "Afghan border security, Caspian resource disputes."}
            },
            "demographics": {
                "population": 6300000,
                "populationDescription": {"zh": "人口约630万。土库曼族约85%。数据不透明，实际人口可能更低（大量移民外流）。", "en": "Population ~6.3M. Turkmens ~85%. Opaque data, actual population may be lower (significant emigration)."},
                "urbanPopulation": 3200000,
                "urbanizationRate": 51,
                "majorCities": [
                    {"name": {"zh": "阿什哈巴德", "en": "Ashgabat"}, "population": 800000},
                    {"name": {"zh": "土库曼纳巴特", "en": "Turkmenabat"}, "population": 250000}
                ],
                "ethnicGroups": {"zh": "土库曼族（约85%）、乌兹别克族（约5%）、俄罗斯族（约4%）等。", "en": "Turkmens (~85%), Uzbeks (~5%), Russians (~4%), etc."},
                "literacyRate": 99.7,
                "lifeExpectancy": {"zh": "68岁", "en": "68 years"}
            },
            "diplomacy": {
                "allies": {"zh": "中国（天然气主要买家）、俄罗斯（传统关系）。维持永久中立国地位。", "en": "China (main gas buyer), Russia (traditional ties). Maintains permanent neutrality status."},
                "enemies": {"zh": "无正式敌国。永久中立国。", "en": "No formal enemies. Permanent neutrality."},
                "foreignPolicy": {"zh": "1995年联合国承认的永久中立国。不加入任何军事联盟。外交极为封闭。", "en": "UN-recognized permanent neutrality since 1995. No military alliance membership. Extremely closed diplomacy."}
            },
            "technology": {
                "level": 2,
                "era": {"zh": "工业化初期", "en": "Early industrialization"},
                "keyInnovations": {"zh": "天然气管道基础设施（中国-土库曼斯坦管道）。", "en": "Gas pipeline infrastructure (China-Turkmenistan pipeline)."},
                "infrastructure": {"zh": "互联网受严格审查，普及率极低（约25%）。全国仅有一个ISP（由国家控制）。", "en": "Internet strictly censored, extremely low penetration (~25%). Only one ISP nationwide (state-controlled)."}
            },
            "aiSector": {
                "level": 0,
                "policy": {"zh": "无专门AI政策。数字化发展极为滞后。", "en": "No AI-specific policies. Digital development extremely lagging."},
                "outlook": {"zh": "在当前封闭体制下，AI发展几乎不可能取得实质进展。", "en": "Under current closed system, substantive AI progress is virtually impossible."}
            },
            "assessment": {
                "strengths": {"zh": "全球第四大天然气储量、永久中立国地位、无外部冲突。", "en": "World's 4th largest gas reserves, permanent neutrality status, no external conflicts."},
                "weaknesses": {"zh": "极度威权与封闭、经济数据不透明、信息封锁、人权状况恶劣。", "en": "Extreme authoritarianism and isolation, opaque economic data, information blockade, poor human rights."},
                "outlook": {"zh": "在别尔德穆哈梅多夫家族统治下，土库曼斯坦将继续是全球最封闭的国家之一。天然气资源是维系政权的唯一经济支柱。", "en": "Under Berdimuhamedow family rule, Turkmenistan will remain one of world's most isolated countries. Gas resources are the sole economic pillar sustaining the regime."}
            },
            "status": "stable",
            "description": {
                "zh": "2023年的土库曼斯坦是全球最封闭的国家之一，2022年实现了别尔德穆哈梅多夫家族的权力世袭。经济高度依赖天然气出口（主要面向中国），官方经济数据极不透明。互联网受严格审查，社会信息封锁严密。作为联合国承认的永久中立国，土库曼斯坦不参加任何军事联盟。阿什哈巴德的白色大理石建筑群成为这个封闭国家最为人知的国际形象。",
                "en": "Turkmenistan in 2023 is one of the world's most isolated countries, achieving the Berdimuhamedow family's dynastic succession in 2022. Economy highly dependent on gas exports (mainly to China), with extremely opaque official data. Internet strictly censored, tight social information blockade. As a UN-recognized permanently neutral state, Turkmenistan joins no military alliances. Ashgabat's white marble buildings are the most internationally recognized image of this closed country."
            }
        },
        {
            "id": "ai_kyrgyzstan",
            "name": {"zh": "吉尔吉斯斯坦", "en": "Kyrgyzstan"},
            "territoryId": "kyrgyzstan",
            "territoryScale": "sm",
            "civilization": {
                "name": {"zh": "吉尔吉斯共和国", "en": "Kyrgyz Republic"},
                "type": "republic",
                "ruler": {"zh": "萨德尔·扎帕罗夫", "en": "Sadyr Japarov"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "后革命时代总统制", "en": "Post-revolution presidential system"},
                "capital": {"zh": "比什凯克", "en": "Bishkek"},
                "governmentForm": {"zh": "总统制共和国。2020年第三次「颜色革命」后扎帕罗夫上台，2021年修宪恢复强总统制。中亚唯一经历过多次政权更迭的国家。", "en": "Presidential republic. Japarov came to power after 2020 third 'color revolution', 2021 constitutional amendments restored strong presidency. Only Central Asian country with multiple regime changes."},
                "socialStructure": {"zh": "南北部族对立是政治主线。游牧传统深刻影响社会结构。公民社会相对于中亚其他国家较为活跃。", "en": "North-south tribal rivalry is political mainline. Nomadic traditions deeply influence social structure. Civil society relatively active compared to other Central Asian countries."},
                "rulingClass": {"zh": "扎帕罗夫及其民族主义盟友、安全机构、南方部族精英。", "en": "Japarov and nationalist allies, security apparatus, southern tribal elites."},
                "succession": {"zh": "中亚唯一通过革命实现多次政权更迭的国家（2005、2010、2020年），但民主化有限。", "en": "Only Central Asian country with multiple revolutionary regime changes (2005, 2010, 2020), but limited democratization."}
            },
            "government": {
                "structure": {"zh": "2021年修宪后恢复强总统制，削弱议会权力。", "en": "Strong presidency restored after 2021 constitutional amendments, weakened parliament."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家决策核心。", "en": "Core of state decisions."}, "headCount": 1000},
                    {"name": {"zh": "国家安全委员会", "en": "State Committee for National Security"}, "function": {"zh": "管理国内安全与情报。", "en": "Managing domestic security and intelligence."}, "headCount": 5000}
                ],
                "totalOfficials": 100000,
                "localAdmin": {"zh": "全国分7个州与2个直辖市（比什凯克与奥什）。地方自治相对发展。", "en": "7 regions and 2 cities (Bishkek and Osh). Relatively developed local autonomy."},
                "legalSystem": {"zh": "大陆法系，司法独立性相对于邻国略好但仍不足。", "en": "Civil law system, judicial independence slightly better than neighbors but still insufficient."},
                "taxationSystem": {"zh": "税收体系较为简化，企业税10%。对采矿业征收特别税。", "en": "Simplified tax system, corporate tax 10%. Special taxes on mining industry."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教（约80%），世俗传统较强。游牧文化影响深远。", "en": "Sunni Islam (~80%), strong secular tradition. Deep nomadic cultural influence."},
                "philosophy": {"zh": "游牧自由传统与苏联遗产结合。《玛纳斯》史诗是民族精神支柱。", "en": "Nomadic freedom tradition combined with Soviet legacy. Manas epic as pillar of national spirit."},
                "writingSystem": {"zh": "西里尔字母（暂无拉丁化计划）。", "en": "Cyrillic alphabet (no Latinization plan yet)."},
                "culturalAchievements": {"zh": "《玛纳斯》史诗（世界最长史诗之一）、传统毡房文化、天山自然遗产、世界游牧民族运动会。", "en": "Manas epic (one of world's longest epics), traditional yurt culture, Tian Shan natural heritage, World Nomad Games."},
                "languageFamily": {"zh": "吉尔吉斯语（突厥语族），俄语为官方语言。", "en": "Kyrgyz (Turkic family), Russian as official language."}
            },
            "economy": {
                "level": 3,
                "gdpEstimate": {"amount": 12000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "gdpPerCapita": {"amount": 1700, "unit": {"zh": "美元/人", "en": "US dollars per capita"}},
                "gdpDescription": {"zh": "中亚较贫困国家之一。经济依赖黄金开采（库姆托金矿）、水电、农业和海外劳工汇款（占GDP约30%）。", "en": "One of Central Asia's poorer countries. Economy dependent on gold mining (Kumtor), hydropower, agriculture, and overseas worker remittances (~30% of GDP)."},
                "mainIndustries": {"zh": "黄金开采（库姆托金矿）、水电、农牧业、轻工业", "en": "Gold mining (Kumtor), hydropower, agriculture and livestock, light industry"},
                "tradeGoods": {"zh": "黄金、电力、农产品、纺织品", "en": "Gold, electricity, agricultural products, textiles"},
                "currency": {"name": {"zh": "吉尔吉斯斯坦索姆", "en": "Kyrgyz Som"}, "type": "fiat", "metalBasis": "none", "unitName": {"zh": "索姆", "en": "KGS"}},
                "averageIncome": {"amount": 1400, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "foreignTradeVolume": {"amount": 10000000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "economicSystem": {"zh": "中亚经济最开放的国家之一。高度依赖海外劳工汇款与外国援助。", "en": "One of Central Asia's most open economies. Highly dependent on overseas worker remittances and foreign aid."}
            },
            "finances": {
                "annualRevenue": {"amount": 4000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "annualExpenditure": {"amount": 4500000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "surplus": {"amount": -500000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "treasury": {"amount": 3000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "debtLevel": {"zh": "公共债务约55%GDP，对外债依赖度高。", "en": "Public debt ~55% GDP, high dependence on external debt."},
                "fiscalPolicy": {"zh": "依赖国际贷款（世界银行/亚开行）与外国援助。", "en": "Dependent on international loans (World Bank/ADB) and foreign aid."}
            },
            "military": {
                "level": 2,
                "totalTroops": 18000,
                "standingArmy": 12000,
                "reserves": 6000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 9000, "description": {"zh": "规模较小，苏联遗留装备。", "en": "Small scale, Soviet-era equipment."}},
                    {"name": {"zh": "空军", "en": "Air Force"}, "count": 2500, "description": {"zh": "少量苏制直升机与运输机。", "en": "Small number of Soviet helicopters and transports."}},
                    {"name": {"zh": "安全部队", "en": "Security Forces"}, "count": 6500, "description": {"zh": "边防与国内安全力量。", "en": "Border and domestic security forces."}}
                ],
                "commandStructure": {"totalGenerals": 15, "commanderInChief": {"zh": "总统兼任武装力量最高统帅", "en": "President serves as supreme commander"}},
                "annualMilitarySpending": {"amount": 300000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "militarySpendingPctGdp": 2.5,
                "threats": {"zh": "与塔吉克斯坦边境武装冲突、费尔干纳盆地族群紧张、国内政治不稳定。", "en": "Border armed conflicts with Tajikistan, Fergana Valley ethnic tensions, domestic political instability."},
                "recentBattles": {"zh": "2022年吉尔吉斯-塔吉克边境武装冲突（约100人死亡），2020年「颜色革命」。", "en": "2022 Kyrgyzstan-Tajikistan border armed conflict (~100 killed), 2020 'color revolution'."}
            },
            "demographics": {
                "population": 6900000,
                "populationDescription": {"zh": "人口约690万。吉尔吉斯族约73%、乌兹别克族约15%。南方费尔干纳地区乌兹别克族集中。", "en": "Population ~6.9M. Kyrgyz ~73%, Uzbeks ~15%. Uzbeks concentrated in southern Fergana region."},
                "urbanPopulation": 2500000,
                "urbanizationRate": 36,
                "majorCities": [
                    {"name": {"zh": "比什凯克", "en": "Bishkek"}, "population": 1100000},
                    {"name": {"zh": "奥什", "en": "Osh"}, "population": 300000}
                ],
                "ethnicGroups": {"zh": "吉尔吉斯族（约73%）、乌兹别克族（约15%）、俄罗斯族（约5%）等。", "en": "Kyrgyz (~73%), Uzbeks (~15%), Russians (~5%), etc."},
                "literacyRate": 99.5,
                "lifeExpectancy": {"zh": "72岁", "en": "72 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（CSTO成员/军事基地所在国）、中国（经济伙伴）。在大国间平衡。", "en": "Russia (CSTO member/military base host), China (economic partner). Balancing among great powers."},
                "enemies": {"zh": "无正式敌国。与塔吉克斯坦存在边境争端。", "en": "No formal enemies. Border disputes with Tajikistan."},
                "foreignPolicy": {"zh": "在俄罗斯安全保障与中国经济影响之间平衡。CSTO与EAEU成员。", "en": "Balancing between Russian security guarantee and Chinese economic influence. CSTO and EAEU member."}
            },
            "technology": {
                "level": 2,
                "era": {"zh": "发展中", "en": "Developing"},
                "keyInnovations": {"zh": "水电技术、小规模IT创业生态。", "en": "Hydropower technology, small-scale IT startup ecosystem."},
                "infrastructure": {"zh": "基础设施落后，山地地形制约交通发展。互联网普及率约70%。", "en": "Underdeveloped infrastructure, mountainous terrain constrains transport. Internet penetration ~70%."}
            },
            "aiSector": {
                "level": 0,
                "policy": {"zh": "无专门AI政策。", "en": "No AI-specific policies."},
                "outlook": {"zh": "AI发展极为初期，缺乏资金、人才和基础设施。", "en": "Extremely early AI development, lacking funding, talent, and infrastructure."}
            },
            "assessment": {
                "strengths": {"zh": "水电资源丰富、公民社会相对活跃、天山自然旅游资源、年轻人口。", "en": "Rich hydropower resources, relatively active civil society, Tian Shan tourism, young population."},
                "weaknesses": {"zh": "政治不稳定、经济落后、与塔吉克边境冲突、海外劳工依赖。", "en": "Political instability, economic underdevelopment, Tajikistan border conflicts, overseas labor dependence."},
                "outlook": {"zh": "中亚民主化程度最高但也最不稳定的国家。经济发展依赖外部援助与劳工汇款。", "en": "Most democratized but also most unstable Central Asian country. Economic development depends on external aid and remittances."}
            },
            "status": "unstable",
            "description": {
                "zh": "2023年的吉尔吉斯斯坦是中亚唯一经历过三次政权更迭（2005、2010、2020年）的国家，扎帕罗夫总统在2021年修宪恢复强总统制。经济高度依赖黄金开采（库姆托金矿）和海外劳工汇款。与塔吉克斯坦的边境冲突（2022年）造成约百人死亡。《玛纳斯》史诗和游牧文化是民族精神支柱。作为中亚最开放和公民社会最活跃的国家，吉尔吉斯斯坦在民主化与稳定之间持续摇摆。",
                "en": "Kyrgyzstan in 2023 is the only Central Asian country with three regime changes (2005, 2010, 2020), with President Japarov restoring strong presidency through 2021 constitutional amendments. Economy highly dependent on gold mining (Kumtor) and overseas worker remittances. Border conflict with Tajikistan (2022) killed ~100. Manas epic and nomadic culture are pillars of national spirit. As Central Asia's most open country with the most active civil society, Kyrgyzstan continues swinging between democratization and stability."
            }
        },
        {
            "id": "ai_tajikistan",
            "name": {"zh": "塔吉克斯坦", "en": "Tajikistan"},
            "territoryId": "tajikistan",
            "territoryScale": "sm",
            "civilization": {
                "name": {"zh": "塔吉克斯坦共和国", "en": "Republic of Tajikistan"},
                "type": "republic",
                "ruler": {"zh": "埃莫马利·拉赫蒙", "en": "Emomali Rahmon"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "拉赫蒙长期执政", "en": "Rahmon's long-term rule"},
                "capital": {"zh": "杜尚别", "en": "Dushanbe"},
                "governmentForm": {"zh": "高度威权总统制。拉赫蒙自1994年执政近30年，被授予「民族领袖」终身称号。长子鲁斯塔姆被视为可能接班人。", "en": "Highly authoritarian presidential system. Rahmon in power since 1994 for nearly 30 years, granted lifelong 'Leader of the Nation' title. Eldest son Rustam seen as potential successor."},
                "socialStructure": {"zh": "以地区和氏族网络为基础。北方列宁纳巴德派与南方库利亚布派（拉赫蒙所属）长期竞争。1992-1997年内战创伤深远。", "en": "Based on regional and clan networks. Northern Leninabad faction vs. southern Kulyab faction (Rahmon's) long-term competition. 1992-1997 civil war left deep scars."},
                "rulingClass": {"zh": "拉赫蒙家族（大量家族成员占据要职）、库利亚布派系精英、安全机构。", "en": "Rahmon family (many family members in key positions), Kulyab faction elites, security apparatus."},
                "succession": {"zh": "拉赫蒙长子鲁斯塔姆·埃莫马利已任杜尚别市长和上院议长，被视为准备接班。", "en": "Rahmon's eldest son Rustam Emomali serves as Dushanbe mayor and Senate speaker, seen as being groomed for succession."}
            },
            "government": {
                "structure": {"zh": "强总统制，议会功能弱化。安全机构权力庞大。", "en": "Strong presidency, weakened parliament. Security apparatus holds extensive power."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家决策核心。", "en": "Core of state decisions."}, "headCount": 1000},
                    {"name": {"zh": "国家安全委员会", "en": "State Committee for National Security"}, "function": {"zh": "管理国内安全、情报与反伊斯兰极端主义。", "en": "Managing domestic security, intelligence, and anti-Islamic extremism."}, "headCount": 5000}
                ],
                "totalOfficials": 100000,
                "localAdmin": {"zh": "全国分4个州（含戈尔诺-巴达赫尚自治州）。中央控制强但山区治理困难。", "en": "4 regions (including Gorno-Badakhshan Autonomous Region). Strong central control but mountainous governance challenges."},
                "legalSystem": {"zh": "苏联遗产法律体系，司法受行政强烈影响。", "en": "Soviet-legacy legal system, judiciary strongly influenced by executive."},
                "taxationSystem": {"zh": "税收体系不完善，依赖铝业出口收入和外国援助。", "en": "Incomplete tax system, dependent on aluminum export revenue and foreign aid."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教为主（约96%），帕米尔地区有伊斯玛仪派少数群体。宗教活动受严格管控。", "en": "Sunni Islam predominant (~96%), Ismaili minority in Pamir region. Religious activities strictly controlled."},
                "philosophy": {"zh": "波斯文化传统——塔吉克人是中亚唯一的波斯语系民族。以波斯诗人鲁达基和伊本·西那为文化骄傲。", "en": "Persian cultural tradition — Tajiks are Central Asia's only Persian-speaking people. Cultural pride in Persian poets Rudaki and Ibn Sina."},
                "writingSystem": {"zh": "西里尔字母。", "en": "Cyrillic alphabet."},
                "culturalAchievements": {"zh": "波斯文学传统、帕米尔高原自然遗产、传统音乐（shashmaqam与法拉比传统）。", "en": "Persian literary tradition, Pamir Plateau natural heritage, traditional music (shashmaqam and Falaki tradition)."},
                "languageFamily": {"zh": "塔吉克语（波斯语变体，印欧语系伊朗语族），俄语广泛使用。", "en": "Tajik (Persian variant, Indo-European Iranian branch), Russian widely used."}
            },
            "economy": {
                "level": 2,
                "gdpEstimate": {"amount": 10000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "gdpPerCapita": {"amount": 1000, "unit": {"zh": "美元/人", "en": "US dollars per capita"}},
                "gdpDescription": {"zh": "中亚最贫困国家之一。经济严重依赖海外劳工汇款（主要在俄罗斯务工，占GDP约30%）和铝业出口。罗贡大坝项目是最大基建工程。", "en": "One of Central Asia's poorest countries. Economy heavily dependent on overseas worker remittances (mainly working in Russia, ~30% of GDP) and aluminum exports. Rogun Dam is largest infrastructure project."},
                "mainIndustries": {"zh": "铝冶炼、水电、棉花、农业", "en": "Aluminum smelting, hydropower, cotton, agriculture"},
                "tradeGoods": {"zh": "铝、棉花、电力、农产品", "en": "Aluminum, cotton, electricity, agricultural products"},
                "currency": {"name": {"zh": "塔吉克斯坦索莫尼", "en": "Tajik Somoni"}, "type": "fiat", "metalBasis": "none", "unitName": {"zh": "索莫尼", "en": "TJS"}},
                "averageIncome": {"amount": 800, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "foreignTradeVolume": {"amount": 6000000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "economicSystem": {"zh": "国家主导经济，铝业由国有企业TALCO垄断。高度依赖外国援助与劳工汇款。", "en": "State-dominated economy, aluminum industry monopolized by SOE TALCO. Highly dependent on foreign aid and remittances."}
            },
            "finances": {
                "annualRevenue": {"amount": 3500000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "annualExpenditure": {"amount": 4000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "surplus": {"amount": -500000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "treasury": {"amount": 2000000000, "unit": {"zh": "美元", "en": "US dollars"}},
                "debtLevel": {"zh": "公共债务约40%GDP。罗贡大坝为最大财政负担。", "en": "Public debt ~40% GDP. Rogun Dam as biggest fiscal burden."},
                "fiscalPolicy": {"zh": "依赖国际贷款（中国/世界银行）与外国援助。罗贡大坝建设消耗大量财政资源。", "en": "Dependent on international loans (China/World Bank) and foreign aid. Rogun Dam construction consuming significant fiscal resources."}
            },
            "military": {
                "level": 2,
                "totalTroops": 20000,
                "standingArmy": 15000,
                "reserves": 5000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 10000, "description": {"zh": "苏联遗留装备，维护水平低。阿富汗边境防御为重点。", "en": "Soviet-era equipment, low maintenance. Afghan border defense as priority."}},
                    {"name": {"zh": "安全部队", "en": "Security Forces"}, "count": 10000, "description": {"zh": "边防与国内安全力量。帕米尔地区维稳为重点。", "en": "Border and domestic security. Pamir region stability as priority."}}
                ],
                "commandStructure": {"totalGenerals": 12, "commanderInChief": {"zh": "总统兼任武装力量最高统帅", "en": "President serves as supreme commander"}},
                "annualMilitarySpending": {"amount": 200000000, "unit": {"zh": "美元/年", "en": "US dollars per year"}},
                "militarySpendingPctGdp": 2.0,
                "threats": {"zh": "阿富汗塔利班外溢风险（1400公里边境）、吉尔吉斯斯坦边境冲突、帕米尔地区不稳定、伊斯兰极端主义渗透。", "en": "Afghan Taliban spillover risk (1,400km border), Kyrgyzstan border conflicts, Pamir region instability, Islamic extremism infiltration."},
                "recentBattles": {"zh": "2022年与吉尔吉斯斯坦边境武装冲突。2022年戈尔诺-巴达赫尚自治州骚乱镇压。", "en": "2022 border armed conflict with Kyrgyzstan. 2022 Gorno-Badakhshan unrest suppression."}
            },
            "demographics": {
                "population": 10100000,
                "populationDescription": {"zh": "人口约1010万。塔吉克族约84%。中亚人口增长率最高，中位年龄最年轻（约22岁）。", "en": "Population ~10.1M. Tajiks ~84%. Highest population growth and youngest median age (~22) in Central Asia."},
                "urbanPopulation": 2800000,
                "urbanizationRate": 28,
                "majorCities": [
                    {"name": {"zh": "杜尚别", "en": "Dushanbe"}, "population": 950000},
                    {"name": {"zh": "苦盏", "en": "Khujand"}, "population": 200000}
                ],
                "ethnicGroups": {"zh": "塔吉克族（约84%）、乌兹别克族（约14%）等。", "en": "Tajiks (~84%), Uzbeks (~14%), etc."},
                "literacyRate": 99.8,
                "lifeExpectancy": {"zh": "71岁", "en": "71 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（CSTO成员/军事基地所在国）、中国（经济与基建伙伴/上合组织成员）。", "en": "Russia (CSTO member/military base host), China (economic/infrastructure partner/SCO member)."},
                "enemies": {"zh": "无正式敌国。与吉尔吉斯斯坦存在边境争端。对阿富汗塔利班高度警惕。", "en": "No formal enemies. Border disputes with Kyrgyzstan. Highly vigilant toward Afghan Taliban."},
                "foreignPolicy": {"zh": "高度依赖俄罗斯安全保障（第201军事基地驻扎）和中国经济援助。", "en": "Highly dependent on Russian security guarantee (201st military base) and Chinese economic aid."}
            },
            "technology": {
                "level": 2,
                "era": {"zh": "发展中", "en": "Developing"},
                "keyInnovations": {"zh": "罗贡大坝建设（建成后将是世界最高大坝335米）、水电技术。", "en": "Rogun Dam construction (will be world's tallest at 335m when complete), hydropower technology."},
                "infrastructure": {"zh": "基础设施落后，山地地形严重制约交通。互联网普及率约40%。冬季能源短缺严重。", "en": "Underdeveloped infrastructure, mountainous terrain severely constrains transport. Internet penetration ~40%. Severe winter energy shortages."}
            },
            "aiSector": {
                "level": 0,
                "policy": {"zh": "无专门AI政策。数字化发展极为滞后。", "en": "No AI-specific policies. Digital development extremely lagging."},
                "outlook": {"zh": "AI发展条件极为匮乏，短期内不具备发展基础。", "en": "Extremely lacking AI development conditions, no development basis in short term."}
            },
            "assessment": {
                "strengths": {"zh": "水电资源潜力巨大（罗贡大坝）、年轻人口、与中俄战略合作。", "en": "Enormous hydropower potential (Rogun Dam), young population, strategic cooperation with China and Russia."},
                "weaknesses": {"zh": "极度贫困、威权统治近30年、阿富汗边境安全威胁、内战创伤未愈、人才大量外流。", "en": "Extreme poverty, nearly 30 years of authoritarian rule, Afghan border security threats, unhealed civil war scars, massive brain drain."},
                "outlook": {"zh": "罗贡大坝如能建成将是经济转型希望，但政治封闭与贫困仍是长期障碍。", "en": "Rogun Dam completion would be hope for economic transformation, but political closure and poverty remain long-term obstacles."}
            },
            "status": "fragile",
            "description": {
                "zh": "2023年的塔吉克斯坦是中亚最贫困国家之一，拉赫蒙总统执政近30年。经济严重依赖海外劳工汇款（主要在俄罗斯务工）和铝业出口。与阿富汗共享1400公里边境，塔利班回归后安全压力加大。罗贡大坝——计划中的世界最高大坝——是最大国家工程。1992-1997年内战的创伤仍影响着社会结构。塔吉克人作为中亚唯一波斯语系民族，拥有深厚的波斯文化传统。",
                "en": "Tajikistan in 2023 is one of Central Asia's poorest countries, with President Rahmon in power for nearly 30 years. Economy heavily dependent on overseas worker remittances (mainly in Russia) and aluminum exports. Shares 1,400km border with Afghanistan, with increased security pressure after Taliban return. Rogun Dam — planned as world's tallest — is the largest national project. Scars from the 1992-1997 civil war still affect social structures. Tajiks as Central Asia's only Persian-speaking people possess deep Persian cultural traditions."
            }
        }
    ]


def create_modern_era_countries():
    """Create 5 individual Central Asian country entries for the Modern Era (~2000)."""
    return [
        {
            "id": "modern_kazakhstan",
            "name": {"zh": "哈萨克斯坦", "en": "Kazakhstan"},
            "territoryId": "kazakhstan",
            "territoryScale": "xl",
            "civilization": {
                "name": {"zh": "哈萨克斯坦共和国", "en": "Republic of Kazakhstan"},
                "type": "republic",
                "ruler": {"zh": "努尔苏丹·纳扎尔巴耶夫", "en": "Nursultan Nazarbayev"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "纳扎尔巴耶夫总统制", "en": "Nazarbayev presidential system"},
                "capital": {"zh": "阿斯塔纳", "en": "Astana"},
                "governmentForm": {"zh": "超级总统制共和国。纳扎尔巴耶夫自1991年独立以来执政，权力高度集中。1997年迁都阿斯塔纳。", "en": "Super-presidential republic. Nazarbayev in power since 1991 independence, highly concentrated power. Capital moved to Astana in 1997."},
                "socialStructure": {"zh": "以大、中、小三个玉兹（жүз）部族联盟为基础，权贵精英与能源寡头主导社会上层。", "en": "Based on three zhuz (Great, Middle, Lesser) tribal confederations, ruling elites and energy oligarchs dominating upper society."},
                "rulingClass": {"zh": "纳扎尔巴耶夫家族与亲信网络、安全机构高层、能源与矿业寡头。", "en": "Nazarbayev family and inner circle, security apparatus leadership, energy and mining oligarchs."},
                "succession": {"zh": "纳扎尔巴耶夫无明确继承人安排，总统选举为控制性选举。", "en": "Nazarbayev had no clear succession arrangements, presidential elections controlled."}
            },
            "government": {
                "structure": {"zh": "强总统制政府，议会功能弱化。总统任命总理和州长。", "en": "Strong presidential government, weakened parliament. President appoints PM and governors."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家权力核心。", "en": "Core of state power."}, "headCount": 2000},
                    {"name": {"zh": "国家安全委员会", "en": "National Security Committee"}, "function": {"zh": "管理国内安全与情报。", "en": "Managing domestic security and intelligence."}, "headCount": 10000}
                ],
                "totalOfficials": 350000,
                "localAdmin": {"zh": "分14个州（含2个直辖市），州长由总统任命。", "en": "14 regions (including 2 cities), governors appointed by president."},
                "legalSystem": {"zh": "大陆法系与苏联遗产混合。", "en": "Mix of civil law and Soviet legacy."},
                "taxationSystem": {"zh": "石油天然气出口收入为主要财源，推进税制改革以吸引外资。", "en": "Oil and gas export revenue as main fiscal source, tax reform to attract FDI."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教为主，世俗国家体制。俄罗斯东正教徒占少数。", "en": "Sunni Islam predominant, secular state. Russian Orthodox minority."},
                "philosophy": {"zh": "后苏联民族建构与「欧亚桥梁」国家定位。", "en": "Post-Soviet nation-building and 'Eurasian bridge' national positioning."},
                "writingSystem": {"zh": "西里尔字母。", "en": "Cyrillic alphabet."},
                "culturalAchievements": {"zh": "拜科努尔航天基地、游牧文化传统、阿斯塔纳新首都建设。", "en": "Baikonur Cosmodrome, nomadic cultural traditions, Astana new capital construction."},
                "languageFamily": {"zh": "哈萨克语（突厥语族）为国语，俄语广泛使用。", "en": "Kazakh (Turkic) as national language, Russian widely used."}
            },
            "economy": {
                "level": 5,
                "gdpEstimate": {"amount": 18000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}, "goldKg": 610000, "silverKg": 48000000},
                "gdpPerCapita": {"amount": 1230, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "gdpDescription": {"zh": "中亚最大经济体（2000年GDP约180亿美元），油气出口为支柱。正推进大型油气项目开发（田吉兹、卡沙甘）。", "en": "Largest Central Asian economy (~$18B GDP in 2000), oil and gas exports as pillar. Developing major projects (Tengiz, Kashagan)."},
                "mainIndustries": {"zh": "石油天然气、铀矿、金属冶炼、粮食生产", "en": "Oil and gas, uranium, metal smelting, grain production"},
                "tradeGoods": {"zh": "原油、天然气、铀、金属、粮食", "en": "Crude oil, natural gas, uranium, metals, grain"},
                "currency": {"name": {"zh": "坚戈", "en": "Tenge"}, "type": "fiat", "unitName": {"zh": "坚戈", "en": "KZT"}},
                "averageIncome": {"amount": 1000, "unit": {"zh": "2000年美元/年", "en": "2000 USD/year"}},
                "foreignTradeVolume": {"amount": 20000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "economicSystem": {"zh": "国家资本主义，能源领域国有化与外资合作并行。", "en": "State capitalism, nationalization and FDI cooperation in energy sector."}
            },
            "finances": {
                "annualRevenue": {"amount": 5000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "annualExpenditure": {"amount": 4800000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "surplus": {"amount": 200000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "treasury": {"amount": 5000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "debtLevel": {"zh": "外债适中。", "en": "Moderate external debt."},
                "fiscalPolicy": {"zh": "建立石油基金稳定财政。", "en": "Establishing oil fund for fiscal stabilization."}
            },
            "military": {
                "level": 5,
                "totalTroops": 80000,
                "standingArmy": 55000,
                "reserves": 25000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 40000, "description": {"zh": "苏联遗留装备为主，包括T-72坦克与BMP战车。", "en": "Primarily Soviet-era equipment, including T-72 tanks and BMPs."}},
                    {"name": {"zh": "空军", "en": "Air Force"}, "count": 15000, "description": {"zh": "苏制米格-29与苏-27战斗机。", "en": "Soviet MiG-29 and Su-27 fighters."}},
                    {"name": {"zh": "边防军与内卫部队", "en": "Border Guards and Internal Troops"}, "count": 25000, "description": {"zh": "边境防御与国内安全。", "en": "Border defense and domestic security."}}
                ],
                "commandStructure": {"totalGenerals": 40, "commanderInChief": {"zh": "总统兼任最高统帅", "en": "President as supreme commander"}},
                "technology": {"zh": "苏联遗留装备为主，拜科努尔航天基地（租借给俄罗斯）。", "en": "Primarily Soviet-era equipment, Baikonur Cosmodrome (leased to Russia)."},
                "annualMilitarySpending": {"amount": 800000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "militarySpendingPctGdp": 4.4,
                "threats": {"zh": "阿富汗方向不稳定、边境划界争端。", "en": "Afghan instability, border demarcation disputes."}
            },
            "demographics": {
                "population": 14900000,
                "populationDescription": {"zh": "人口约1490万。哈萨克族约53%（苏联解体后回升），俄罗斯族约30%（大量外迁）。", "en": "Population ~14.9M. Kazakhs ~53% (rising post-independence), Russians ~30% (emigrating)."},
                "urbanPopulation": 8500000,
                "urbanizationRate": 57,
                "majorCities": [
                    {"name": {"zh": "阿拉木图", "en": "Almaty"}, "population": 1130000},
                    {"name": {"zh": "阿斯塔纳", "en": "Astana"}, "population": 380000},
                    {"name": {"zh": "卡拉干达", "en": "Karaganda"}, "population": 440000}
                ],
                "ethnicGroups": {"zh": "哈萨克族（约53%）、俄罗斯族（约30%）、乌兹别克族、乌克兰族、德意志裔等。", "en": "Kazakhs (~53%), Russians (~30%), Uzbeks, Ukrainians, ethnic Germans, etc."},
                "socialClasses": {"zh": "权贵精英、能源产业管理层、城市知识分子、工人、农牧民。", "en": "Ruling elites, energy industry management, urban intellectuals, workers, farmers and herders."},
                "literacyRate": 99.5,
                "lifeExpectancy": {"zh": "66岁", "en": "66 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（CIS/安全合作）、中国（边境和解/经贸）、美国（能源投资伙伴）、土耳其。", "en": "Russia (CIS/security cooperation), China (border settlement/trade), US (energy investment partner), Turkey."},
                "enemies": {"zh": "无正式敌国。", "en": "No formal enemies."},
                "foreignPolicy": {"zh": "纳扎尔巴耶夫的「多向外交」——在俄、中、美之间保持平衡。推动中亚区域合作。", "en": "Nazarbayev's 'multi-vector diplomacy' — balancing Russia, China, and the US. Promoting Central Asian regional cooperation."}
            },
            "technology": {
                "level": 5,
                "era": {"zh": "现代世界", "en": "Modern World"},
                "keyInnovations": {"zh": "拜科努尔航天基地、石油勘探开发技术（田吉兹/卡沙甘项目）。", "en": "Baikonur Cosmodrome, oil exploration and development (Tengiz/Kashagan projects)."},
                "infrastructure": {"zh": "苏联遗留铁路与公路网络。阿斯塔纳新首都大规模基建。", "en": "Soviet-era rail and road network. Massive Astana new capital construction."}
            },
            "assessment": {
                "strengths": {"zh": "丰富油气与铀矿资源、战略位置、较高教育水平。", "en": "Rich oil/gas and uranium resources, strategic location, relatively high education level."},
                "weaknesses": {"zh": "威权政治、荷兰病风险、俄族人口地缘隐患。", "en": "Authoritarian politics, Dutch disease risk, Russian minority geosecurity concerns."},
                "outlook": {"zh": "随着油气项目投产，经济增长前景较强。但政治继承与多民族管理是长期挑战。", "en": "Strong growth prospects with oil/gas projects coming online. Political succession and multi-ethnic management as long-term challenges."}
            },
            "status": "stable",
            "description": {
                "zh": "2000年的哈萨克斯坦在纳扎尔巴耶夫总统领导下推进国家建设与经济发展。作为全球第九大国和中亚最大经济体，哈萨克斯坦正开发田吉兹、卡沙甘等超大型油气项目。1997年迁都阿斯塔纳的宏大工程正在推进中。纳扎尔巴耶夫的「多向外交」在俄中美之间保持平衡。拜科努尔航天基地继续作为俄罗斯主要太空发射场运营。",
                "en": "Kazakhstan in 2000, under President Nazarbayev, advanced nation-building and economic development. As the world's 9th largest country and Central Asia's biggest economy, Kazakhstan was developing mega oil/gas projects like Tengiz and Kashagan. The grand Astana capital relocation from 1997 was underway. Nazarbayev's 'multi-vector diplomacy' balanced Russia, China, and the US. Baikonur Cosmodrome continued operating as Russia's primary space launch facility."
            }
        },
        {
            "id": "modern_uzbekistan",
            "name": {"zh": "乌兹别克斯坦", "en": "Uzbekistan"},
            "territoryId": "uzbekistan",
            "territoryScale": "lg",
            "civilization": {
                "name": {"zh": "乌兹别克斯坦共和国", "en": "Republic of Uzbekistan"},
                "type": "republic",
                "ruler": {"zh": "伊斯兰·卡里莫夫", "en": "Islam Karimov"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "卡里莫夫威权统治", "en": "Karimov authoritarian rule"},
                "capital": {"zh": "塔什干", "en": "Tashkent"},
                "governmentForm": {"zh": "高度威权总统制。卡里莫夫自苏联时期即掌权，独立后延续统治。严厉打压反对派与宗教组织。", "en": "Highly authoritarian presidential system. Karimov held power since Soviet era, continued rule after independence. Harsh suppression of opposition and religious organizations."},
                "socialStructure": {"zh": "以地区氏族网络为基础，塔什干、撒马尔罕、费尔干纳三大区域精英竞争。", "en": "Based on regional clan networks, competition among Tashkent, Samarkand, and Fergana regional elites."},
                "rulingClass": {"zh": "卡里莫夫及撒马尔罕派系、安全机构（SNB）、棉花与能源国企管理层。", "en": "Karimov and Samarkand faction, security apparatus (SNB), cotton and energy SOE management."},
                "succession": {"zh": "卡里莫夫不容许继承人安排讨论，权力完全个人化。", "en": "Karimov tolerated no succession planning discussions, fully personalized power."}
            },
            "government": {
                "structure": {"zh": "强总统制，安全机构（SNB）权力极大。", "en": "Strong presidency, security apparatus (SNB) extremely powerful."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家权力核心。", "en": "Core of state power."}, "headCount": 2000},
                    {"name": {"zh": "国家安全局（SNB）", "en": "National Security Service (SNB)"}, "function": {"zh": "管理安全、情报与政治控制。", "en": "Managing security, intelligence, and political control."}, "headCount": 8000}
                ],
                "totalOfficials": 300000,
                "localAdmin": {"zh": "12个州与1个自治共和国（卡拉卡尔帕克斯坦）。", "en": "12 regions and 1 autonomous republic (Karakalpakstan)."},
                "legalSystem": {"zh": "苏联遗产法律体系，司法受行政强烈控制。", "en": "Soviet-legacy legal system, judiciary strongly controlled by executive."},
                "taxationSystem": {"zh": "国家控制经济为主，棉花出口为重要财源。税制复杂且不透明。", "en": "State-controlled economy dominant, cotton exports as important revenue. Complex and opaque tax system."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教（约90%），世俗国家体制但严厉打压非官方宗教活动。", "en": "Sunni Islam (~90%), secular state but harsh crackdown on unofficial religious activities."},
                "philosophy": {"zh": "帖木儿被奉为国家象征。后苏联民族建构与世俗伊斯兰传统结合。", "en": "Tamerlane elevated as national symbol. Post-Soviet nation-building combined with secular Islamic tradition."},
                "writingSystem": {"zh": "西里尔与拉丁字母并行（1993年开始转换）。", "en": "Cyrillic and Latin alphabets in parallel (transition began 1993)."},
                "culturalAchievements": {"zh": "撒马尔罕/布哈拉/希瓦历史古城保护、丝绸之路文化遗产。", "en": "Samarkand/Bukhara/Khiva historic city preservation, Silk Road cultural heritage."},
                "languageFamily": {"zh": "乌兹别克语（突厥语族），俄语仍广泛使用。", "en": "Uzbek (Turkic), Russian still widely used."}
            },
            "economy": {
                "level": 4,
                "gdpEstimate": {"amount": 13500000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}, "goldKg": 458000, "silverKg": 36000000},
                "gdpPerCapita": {"amount": 550, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "gdpDescription": {"zh": "中亚人口最多国家，经济以棉花、黄金、天然气出口与国有工业为基础。实行严格外汇管制。", "en": "Most populous Central Asian country, economy based on cotton, gold, gas exports and state industry. Strict foreign exchange controls."},
                "mainIndustries": {"zh": "棉花种植（世界前五大出口国）、黄金开采、天然气、纺织、汽车组装", "en": "Cotton (top 5 world exporter), gold mining, natural gas, textiles, auto assembly"},
                "tradeGoods": {"zh": "棉花、黄金、天然气、纺织品", "en": "Cotton, gold, natural gas, textiles"},
                "currency": {"name": {"zh": "苏姆", "en": "Som"}, "type": "fiat", "unitName": {"zh": "苏姆", "en": "UZS"}},
                "averageIncome": {"amount": 400, "unit": {"zh": "2000年美元/年", "en": "2000 USD/year"}},
                "foreignTradeVolume": {"amount": 8000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "economicSystem": {"zh": "国家控制经济，棉花强制收购体系（受国际批评的强制劳动）。外汇管制严格。", "en": "State-controlled economy, cotton forced procurement system (internationally criticized forced labor). Strict forex controls."}
            },
            "finances": {
                "annualRevenue": {"amount": 4500000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "annualExpenditure": {"amount": 4300000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "surplus": {"amount": 200000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "treasury": {"amount": 3000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "fiscalPolicy": {"zh": "国家高度控制财政，棉花与黄金出口为支柱。", "en": "Highly state-controlled fiscal policy, cotton and gold exports as pillars."}
            },
            "military": {
                "level": 5,
                "totalTroops": 160000,
                "standingArmy": 110000,
                "reserves": 50000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 80000, "description": {"zh": "中亚最大常备军。苏联遗留装备。", "en": "Largest standing army in Central Asia. Soviet-era equipment."}},
                    {"name": {"zh": "空军", "en": "Air Force"}, "count": 15000, "description": {"zh": "苏制战机，注重阿富汗方向防御。", "en": "Soviet aircraft, focused on Afghan defense."}},
                    {"name": {"zh": "安全部队与边防军", "en": "Security Forces and Border Guards"}, "count": 65000, "description": {"zh": "费尔干纳盆地安全与阿富汗边境防御。", "en": "Fergana Valley security and Afghan border defense."}}
                ],
                "commandStructure": {"totalGenerals": 50, "commanderInChief": {"zh": "总统兼任最高统帅", "en": "President as supreme commander"}},
                "annualMilitarySpending": {"amount": 900000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "militarySpendingPctGdp": 6.7,
                "threats": {"zh": "阿富汗塔利班（1999年乌兹别克斯坦伊斯兰运动袭击）、费尔干纳盆地极端主义。", "en": "Afghan Taliban (1999 IMU attacks), Fergana Valley extremism."}
            },
            "demographics": {
                "population": 24800000,
                "populationDescription": {"zh": "中亚人口最多（约2480万），乌兹别克族约80%。", "en": "Most populous Central Asian country (~24.8M), Uzbeks ~80%."},
                "urbanPopulation": 9200000,
                "urbanizationRate": 37,
                "majorCities": [
                    {"name": {"zh": "塔什干", "en": "Tashkent"}, "population": 2200000},
                    {"name": {"zh": "撒马尔罕", "en": "Samarkand"}, "population": 360000}
                ],
                "ethnicGroups": {"zh": "乌兹别克族（约80%）、塔吉克族（约5%）、俄罗斯族（约6%）等。", "en": "Uzbeks (~80%), Tajiks (~5%), Russians (~6%), etc."},
                "literacyRate": 99.3,
                "lifeExpectancy": {"zh": "69岁", "en": "69 years"}
            },
            "diplomacy": {
                "allies": {"zh": "美国（反恐合作）、俄罗斯（传统关系但卡里莫夫保持独立性）、中国。", "en": "US (counter-terrorism cooperation), Russia (traditional ties but Karimov maintained independence), China."},
                "enemies": {"zh": "阿富汗塔利班/乌兹别克斯坦伊斯兰运动（IMU）。", "en": "Afghan Taliban / Islamic Movement of Uzbekistan (IMU)."},
                "foreignPolicy": {"zh": "卡里莫夫坚持独立自主，拒绝加入俄主导军事联盟。与美国在反恐领域合作。", "en": "Karimov insisted on independence, refused to join Russian-led military alliances. Counter-terrorism cooperation with the US."}
            },
            "technology": {
                "level": 4,
                "era": {"zh": "现代世界", "en": "Modern World"},
                "keyInnovations": {"zh": "苏联遗留工业基础、棉花加工技术、GM合资汽车工厂。", "en": "Soviet-era industrial base, cotton processing technology, GM JV auto plant."}
            },
            "assessment": {
                "strengths": {"zh": "中亚最大人口、较完整工业基础、丰富文化遗产、战略位置。", "en": "Largest Central Asian population, relatively complete industrial base, rich cultural heritage, strategic location."},
                "weaknesses": {"zh": "高度威权、棉花强制劳动、封闭经济、人权状况恶劣。", "en": "Highly authoritarian, cotton forced labor, closed economy, poor human rights."},
                "outlook": {"zh": "卡里莫夫统治下经济封闭但基本稳定，长期发展取决于政治继承与改革意愿。", "en": "Under Karimov economically closed but basically stable, long-term depends on political succession and reform willingness."}
            },
            "status": "stable",
            "description": {
                "zh": "2000年的乌兹别克斯坦在卡里莫夫总统的威权统治下保持基本稳定。作为中亚人口最多的国家（2480万），经济以棉花、黄金和天然气出口为支柱，但实行严格外汇管制与国家控制。1999年乌兹别克斯坦伊斯兰运动（IMU）的恐怖袭击加剧了安全管控。撒马尔罕、布哈拉、希瓦等丝绸之路古城保存着辉煌的文明遗产。",
                "en": "Uzbekistan in 2000 maintained basic stability under President Karimov's authoritarian rule. As Central Asia's most populous country (24.8M), the economy was based on cotton, gold, and gas exports, but with strict forex controls and state dominance. The 1999 Islamic Movement of Uzbekistan (IMU) attacks intensified security controls. Silk Road cities like Samarkand, Bukhara, and Khiva preserved magnificent civilizational heritage."
            }
        },
        {
            "id": "modern_turkmenistan",
            "name": {"zh": "土库曼斯坦", "en": "Turkmenistan"},
            "territoryId": "turkmenistan",
            "territoryScale": "md",
            "civilization": {
                "name": {"zh": "土库曼斯坦", "en": "Turkmenistan"},
                "type": "republic",
                "ruler": {"zh": "萨帕尔穆拉特·尼亚佐夫", "en": "Saparmurat Niyazov"},
                "rulerTitle": {"zh": "「土库曼巴希」（土库曼之父）", "en": "'Turkmenbashi' (Father of all Turkmen)"},
                "dynasty": {"zh": "尼亚佐夫个人崇拜统治", "en": "Niyazov personality cult rule"},
                "capital": {"zh": "阿什哈巴德", "en": "Ashgabat"},
                "governmentForm": {"zh": "极端个人崇拜式独裁。尼亚佐夫自封「土库曼巴希」（土库曼之父），被授予终身总统。以《鲁赫纳玛》为国家意识形态基础。", "en": "Extreme personality cult dictatorship. Niyazov self-titled 'Turkmenbashi' (Father of Turkmen), granted lifelong presidency. Ruhnama as state ideological foundation."},
                "socialStructure": {"zh": "部族结构影响深远，阿哈尔部族主导。极端个人崇拜渗透社会各层面。", "en": "Tribal structure deeply influential, Akhal tribe dominant. Extreme personality cult permeating all social levels."},
                "rulingClass": {"zh": "尼亚佐夫个人独裁，阿哈尔部族精英、安全机构。", "en": "Niyazov's personal dictatorship, Akhal tribal elites, security apparatus."},
                "succession": {"zh": "尼亚佐夫为终身总统，无继承人安排。", "en": "Niyazov as lifetime president, no succession arrangements."}
            },
            "government": {
                "structure": {"zh": "极端总统独裁制。《鲁赫纳玛》为必读国家教材。以月份与星期重新命名为尼亚佐夫家族名。", "en": "Extreme presidential dictatorship. Ruhnama as mandatory national textbook. Months and days renamed after Niyazov's family."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家唯一决策中心。", "en": "Sole decision-making center."}, "headCount": 1000},
                    {"name": {"zh": "天然气工业部门", "en": "Gas Industry Departments"}, "function": {"zh": "管理天然气开采与出口。", "en": "Managing gas extraction and export."}, "headCount": 20000}
                ],
                "totalOfficials": 150000,
                "localAdmin": {"zh": "5个州，州长完全听命于总统。", "en": "5 provinces, governors fully subordinate to president."},
                "legalSystem": {"zh": "总统凌驾于一切法律之上。", "en": "President above all laws."},
                "taxationSystem": {"zh": "高度国有化，居民享有免费天然气、水电补贴。", "en": "Highly nationalized, citizens receive free gas, subsidized water and electricity."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教，但世俗化程度极高。尼亚佐夫将《鲁赫纳玛》置于《古兰经》同等地位。", "en": "Sunni Islam, but extremely secularized. Niyazov placed Ruhnama on equal footing with the Quran."},
                "philosophy": {"zh": "尼亚佐夫个人崇拜意识形态，《鲁赫纳玛》为核心。土库曼民族主义。", "en": "Niyazov personality cult ideology, Ruhnama as core. Turkmen nationalism."},
                "writingSystem": {"zh": "拉丁字母（1993年改革）。", "en": "Latin alphabet (1993 reform)."},
                "culturalAchievements": {"zh": "阿什哈巴德大规模建设、汗血宝马传统。", "en": "Ashgabat massive construction, Akhal-Teke horse tradition."},
                "languageFamily": {"zh": "土库曼语（突厥语族）。", "en": "Turkmen (Turkic)."}
            },
            "economy": {
                "level": 4,
                "gdpEstimate": {"amount": 5000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}, "goldKg": 170000, "silverKg": 13300000},
                "gdpPerCapita": {"amount": 1100, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "gdpDescription": {"zh": "经济几乎完全依赖天然气出口（全球第四大储量）。数据不透明。", "en": "Economy almost entirely dependent on gas exports (world's 4th largest reserves). Opaque data."},
                "mainIndustries": {"zh": "天然气、石油、棉花", "en": "Natural gas, oil, cotton"},
                "tradeGoods": {"zh": "天然气、石油、棉花", "en": "Natural gas, oil, cotton"},
                "currency": {"name": {"zh": "马纳特", "en": "Manat"}, "type": "fiat", "unitName": {"zh": "马纳特", "en": "TMT"}},
                "averageIncome": {"amount": 700, "unit": {"zh": "2000年美元/年", "en": "2000 USD/year"}},
                "foreignTradeVolume": {"amount": 5000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "economicSystem": {"zh": "完全国家控制经济，天然气收入用于维持庞大补贴体系。", "en": "Fully state-controlled economy, gas revenue sustaining massive subsidy system."}
            },
            "finances": {
                "annualRevenue": {"amount": 2500000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "annualExpenditure": {"amount": 2400000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "surplus": {"amount": 100000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "treasury": {"amount": 3000000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "fiscalPolicy": {"zh": "天然气收入为财政唯一支柱。大量资金用于阿什哈巴德面子工程。", "en": "Gas revenue as sole fiscal pillar. Large funds spent on Ashgabat vanity projects."}
            },
            "military": {
                "level": 3,
                "totalTroops": 26000,
                "standingArmy": 18000,
                "reserves": 8000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 15000, "description": {"zh": "苏联遗留装备。", "en": "Soviet-era equipment."}},
                    {"name": {"zh": "安全部队", "en": "Security Forces"}, "count": 11000, "description": {"zh": "政权保卫与边防。", "en": "Regime protection and border defense."}}
                ],
                "commandStructure": {"totalGenerals": 15, "commanderInChief": {"zh": "总统兼任最高统帅", "en": "President as supreme commander"}},
                "annualMilitarySpending": {"amount": 300000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "militarySpendingPctGdp": 6.0,
                "threats": {"zh": "阿富汗边境安全、里海划界争端。", "en": "Afghan border security, Caspian demarcation disputes."}
            },
            "demographics": {
                "population": 4500000,
                "populationDescription": {"zh": "人口约450万。土库曼族约77%。", "en": "Population ~4.5M. Turkmens ~77%."},
                "urbanPopulation": 2000000,
                "urbanizationRate": 44,
                "majorCities": [
                    {"name": {"zh": "阿什哈巴德", "en": "Ashgabat"}, "population": 540000}
                ],
                "ethnicGroups": {"zh": "土库曼族（约77%）、乌兹别克族（约9%）、俄罗斯族（约7%）等。", "en": "Turkmens (~77%), Uzbeks (~9%), Russians (~7%), etc."},
                "literacyRate": 98,
                "lifeExpectancy": {"zh": "65岁", "en": "65 years"}
            },
            "diplomacy": {
                "allies": {"zh": "维持永久中立国地位。与俄罗斯保持天然气贸易关系。", "en": "Maintained permanent neutrality. Gas trade relations with Russia."},
                "enemies": {"zh": "无正式敌国。", "en": "No formal enemies."},
                "foreignPolicy": {"zh": "1995年联合国承认的永久中立国。外交极为封闭。", "en": "UN-recognized permanent neutrality since 1995. Extremely closed diplomacy."}
            },
            "technology": {
                "level": 3,
                "era": {"zh": "现代世界", "en": "Modern World"},
                "keyInnovations": {"zh": "天然气管道技术。", "en": "Gas pipeline technology."}
            },
            "assessment": {
                "strengths": {"zh": "巨量天然气储量、永久中立国地位。", "en": "Massive gas reserves, permanent neutrality status."},
                "weaknesses": {"zh": "极端个人崇拜、经济数据不透明、信息完全封锁。", "en": "Extreme personality cult, opaque economic data, total information blockade."},
                "outlook": {"zh": "在尼亚佐夫统治下，国家完全封闭。天然气是唯一经济生命线。", "en": "Under Niyazov, the country was completely closed. Gas is the only economic lifeline."}
            },
            "status": "stable",
            "description": {
                "zh": "2000年的土库曼斯坦处于尼亚佐夫「土库曼巴希」的极端个人崇拜统治下，是全球最封闭的国家之一。经济完全依赖天然气出口。尼亚佐夫以《鲁赫纳玛》为国家意识形态基础，将月份重新以自己和母亲的名字命名。居民享有免费天然气和水电补贴，但信息完全封锁，出国受严格限制。",
                "en": "Turkmenistan in 2000 was under the extreme personality cult of Niyazov 'Turkmenbashi', one of the world's most isolated countries. Economy entirely dependent on gas exports. Niyazov used Ruhnama as state ideology, renamed months after himself and his mother. Citizens received free gas and utility subsidies, but information was completely blocked and travel severely restricted."
            }
        },
        {
            "id": "modern_kyrgyzstan",
            "name": {"zh": "吉尔吉斯斯坦", "en": "Kyrgyzstan"},
            "territoryId": "kyrgyzstan",
            "territoryScale": "sm",
            "civilization": {
                "name": {"zh": "吉尔吉斯共和国", "en": "Kyrgyz Republic"},
                "type": "republic",
                "ruler": {"zh": "阿斯卡尔·阿卡耶夫", "en": "Askar Akayev"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "阿卡耶夫时代", "en": "Akayev era"},
                "capital": {"zh": "比什凯克", "en": "Bishkek"},
                "governmentForm": {"zh": "总统制共和国。阿卡耶夫初期被视为中亚最民主的领导人，但逐渐走向威权。", "en": "Presidential republic. Akayev initially seen as Central Asia's most democratic leader, but gradually turning authoritarian."},
                "socialStructure": {"zh": "南北部族对立。游牧传统深刻影响。公民社会在中亚最为活跃。", "en": "North-south tribal rivalry. Deep nomadic tradition influence. Most active civil society in Central Asia."},
                "rulingClass": {"zh": "阿卡耶夫家族、北方部族精英、学术界出身的技术官僚。", "en": "Akayev family, northern tribal elites, academic-origin technocrats."},
                "succession": {"zh": "名义上民主选举，但阿卡耶夫通过修宪延长任期。", "en": "Nominally democratic elections, but Akayev extended terms through constitutional amendments."}
            },
            "government": {
                "structure": {"zh": "议会制与总统制混合，但阿卡耶夫逐渐集权。", "en": "Mix of parliamentary and presidential systems, but Akayev gradually centralizing power."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家决策核心。", "en": "Core of state decisions."}, "headCount": 800}
                ],
                "totalOfficials": 60000,
                "localAdmin": {"zh": "7个州与首都比什凯克。地方自治在中亚最为发展。", "en": "7 regions and capital Bishkek. Most developed local autonomy in Central Asia."},
                "legalSystem": {"zh": "苏联遗产法律体系，但较邻国略有司法独立性。", "en": "Soviet-legacy legal system, but slightly more judicial independence than neighbors."},
                "taxationSystem": {"zh": "税基狭窄，高度依赖外国援助。", "en": "Narrow tax base, highly dependent on foreign aid."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教为主，世俗传统强。", "en": "Sunni Islam predominant, strong secular tradition."},
                "philosophy": {"zh": "《玛纳斯》史诗为民族精神核心。游牧自由传统。", "en": "Manas epic as core of national spirit. Nomadic freedom tradition."},
                "writingSystem": {"zh": "西里尔字母。", "en": "Cyrillic alphabet."},
                "culturalAchievements": {"zh": "《玛纳斯》史诗、毡房文化、天山自然遗产、作家钦吉斯·艾特马托夫文学遗产。", "en": "Manas epic, yurt culture, Tian Shan heritage, writer Chingiz Aitmatov's literary legacy."},
                "languageFamily": {"zh": "吉尔吉斯语（突厥语族），俄语为官方语言。", "en": "Kyrgyz (Turkic), Russian as official language."}
            },
            "economy": {
                "level": 3,
                "gdpEstimate": {"amount": 1370000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}, "goldKg": 46400, "silverKg": 3650000},
                "gdpPerCapita": {"amount": 280, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "gdpDescription": {"zh": "中亚最贫困国家之一。经济依赖黄金（库姆托金矿）、水电和外国援助。被称为中亚「民主实验室」。", "en": "One of Central Asia's poorest. Economy dependent on gold (Kumtor), hydropower, and foreign aid. Called Central Asia's 'democracy lab'."},
                "mainIndustries": {"zh": "黄金开采（库姆托金矿）、水电、农牧业", "en": "Gold mining (Kumtor), hydropower, agriculture and livestock"},
                "tradeGoods": {"zh": "黄金、电力、农产品", "en": "Gold, electricity, agricultural products"},
                "currency": {"name": {"zh": "索姆", "en": "Som"}, "type": "fiat", "unitName": {"zh": "索姆", "en": "KGS"}},
                "averageIncome": {"amount": 250, "unit": {"zh": "2000年美元/年", "en": "2000 USD/year"}},
                "foreignTradeVolume": {"amount": 1200000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "economicSystem": {"zh": "中亚最开放的经济体。WTO成员（1998年加入）。高度依赖外国援助。", "en": "Most open economy in Central Asia. WTO member (joined 1998). Highly dependent on foreign aid."}
            },
            "finances": {
                "annualRevenue": {"amount": 500000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "annualExpenditure": {"amount": 550000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "surplus": {"amount": -50000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "treasury": {"amount": 300000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "fiscalPolicy": {"zh": "严重依赖国际援助与贷款。", "en": "Heavily dependent on international aid and loans."}
            },
            "military": {
                "level": 3,
                "totalTroops": 13000,
                "standingArmy": 9000,
                "reserves": 4000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 7000, "description": {"zh": "中亚最小规模军队之一。", "en": "One of Central Asia's smallest militaries."}},
                    {"name": {"zh": "边防军", "en": "Border Guards"}, "count": 6000, "description": {"zh": "边防与国内安全。", "en": "Border and domestic security."}}
                ],
                "commandStructure": {"totalGenerals": 10, "commanderInChief": {"zh": "总统兼任最高统帅", "en": "President as supreme commander"}},
                "annualMilitarySpending": {"amount": 50000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "militarySpendingPctGdp": 3.6,
                "threats": {"zh": "费尔干纳盆地族群紧张、1999年IMU武装分子入侵巴特肯。", "en": "Fergana Valley ethnic tensions, 1999 IMU militants invasion of Batken."}
            },
            "demographics": {
                "population": 4900000,
                "populationDescription": {"zh": "人口约490万。吉尔吉斯族约65%、俄罗斯族约13%、乌兹别克族约14%。", "en": "Population ~4.9M. Kyrgyz ~65%, Russians ~13%, Uzbeks ~14%."},
                "urbanPopulation": 1700000,
                "urbanizationRate": 34,
                "majorCities": [
                    {"name": {"zh": "比什凯克", "en": "Bishkek"}, "population": 770000},
                    {"name": {"zh": "奥什", "en": "Osh"}, "population": 230000}
                ],
                "ethnicGroups": {"zh": "吉尔吉斯族（约65%）、乌兹别克族（约14%）、俄罗斯族（约13%）等。", "en": "Kyrgyz (~65%), Uzbeks (~14%), Russians (~13%), etc."},
                "literacyRate": 99,
                "lifeExpectancy": {"zh": "68岁", "en": "68 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（安全合作/军事基地）、中国（经贸）、美国（援助与反恐合作）。", "en": "Russia (security/military base), China (trade), US (aid and counter-terrorism cooperation)."},
                "enemies": {"zh": "无正式敌国。费尔干纳盆地族群紧张。", "en": "No formal enemies. Fergana Valley ethnic tensions."},
                "foreignPolicy": {"zh": "在俄中美之间平衡的多向外交。中亚最亲西方的国家。", "en": "Multi-vector diplomacy balancing Russia, China, and the US. Most pro-Western Central Asian country."}
            },
            "technology": {
                "level": 3,
                "era": {"zh": "现代世界", "en": "Modern World"},
                "keyInnovations": {"zh": "水电技术、库姆托金矿（加拿大合资）。", "en": "Hydropower technology, Kumtor gold mine (Canadian JV)."}
            },
            "assessment": {
                "strengths": {"zh": "中亚最开放社会与经济、水电资源、WTO成员。", "en": "Most open society and economy in Central Asia, hydropower resources, WTO member."},
                "weaknesses": {"zh": "极度贫困、政治脆弱、南北分裂、外援依赖。", "en": "Extreme poverty, political fragility, north-south divide, aid dependence."},
                "outlook": {"zh": "政治不稳定是最大风险，但公民社会活力为长远发展提供可能。", "en": "Political instability as biggest risk, but civil society vitality offers long-term potential."}
            },
            "status": "fragile",
            "description": {
                "zh": "2000年的吉尔吉斯斯坦在阿卡耶夫总统领导下被称为中亚「民主之岛」，但民主化正在退步。作为中亚最贫困和最开放的国家，经济依赖库姆托金矿和外国援助。1999年乌兹别克斯坦伊斯兰运动（IMU）武装入侵巴特肯地区暴露了安全脆弱性。钦吉斯·艾特马托夫的文学成就和《玛纳斯》史诗代表了深厚的文化传统。",
                "en": "Kyrgyzstan in 2000 under President Akayev was called Central Asia's 'island of democracy', but democratization was backsliding. As Central Asia's poorest and most open country, the economy depended on Kumtor gold mine and foreign aid. The 1999 IMU armed invasion of Batken exposed security vulnerabilities. Chingiz Aitmatov's literary achievements and the Manas epic represented deep cultural traditions."
            }
        },
        {
            "id": "modern_tajikistan",
            "name": {"zh": "塔吉克斯坦", "en": "Tajikistan"},
            "territoryId": "tajikistan",
            "territoryScale": "sm",
            "civilization": {
                "name": {"zh": "塔吉克斯坦共和国", "en": "Republic of Tajikistan"},
                "type": "republic",
                "ruler": {"zh": "埃莫马利·拉赫莫诺夫", "en": "Emomali Rakhmonov"},
                "rulerTitle": {"zh": "总统", "en": "President"},
                "dynasty": {"zh": "拉赫莫诺夫（后改名拉赫蒙）统治", "en": "Rakhmonov (later Rahmon) rule"},
                "capital": {"zh": "杜尚别", "en": "Dushanbe"},
                "governmentForm": {"zh": "总统制共和国。1997年内战结束后，拉赫莫诺夫巩固权力。前反对派部分整合入政府。", "en": "Presidential republic. After 1997 civil war end, Rakhmonov consolidated power. Some former opposition integrated into government."},
                "socialStructure": {"zh": "内战（1992-1997）创伤深远，库利亚布派掌权，北方列宁纳巴德派和伊斯兰反对派被边缘化。", "en": "Civil war (1992-1997) left deep scars, Kulyab faction in power, northern Leninabad and Islamic opposition marginalized."},
                "rulingClass": {"zh": "拉赫莫诺夫与库利亚布派系、安全机构、内战军阀转型精英。", "en": "Rakhmonov and Kulyab faction, security apparatus, warlord-turned-elites from civil war."},
                "succession": {"zh": "拉赫莫诺夫巩固权力中，无继承安排。", "en": "Rakhmonov consolidating power, no succession arrangements."}
            },
            "government": {
                "structure": {"zh": "强总统制。安全机构权力庞大。1997年和平协议框架下部分反对派参与政府。", "en": "Strong presidency. Powerful security apparatus. Some opposition participation under 1997 peace agreement."},
                "departments": [
                    {"name": {"zh": "总统办公厅", "en": "Presidential Administration"}, "function": {"zh": "国家决策核心。", "en": "Core of state decisions."}, "headCount": 700}
                ],
                "totalOfficials": 70000,
                "localAdmin": {"zh": "4个州（含戈尔诺-巴达赫尚自治州）。中央对山区控制力有限。", "en": "4 regions (including Gorno-Badakhshan). Limited central control over mountainous areas."},
                "legalSystem": {"zh": "苏联遗产法律体系，内战后重建中。", "en": "Soviet-legacy legal system, rebuilding after civil war."},
                "taxationSystem": {"zh": "税基极窄，依赖铝业收入和外国援助。", "en": "Extremely narrow tax base, dependent on aluminum revenue and foreign aid."}
            },
            "culture": {
                "religion": {"zh": "逊尼派伊斯兰教为主。帕米尔地区有伊斯玛仪派。1997年和平协议后伊斯兰复兴党合法化。", "en": "Sunni Islam predominant. Ismaili in Pamir. Islamic Renaissance Party legalized after 1997 peace agreement."},
                "philosophy": {"zh": "波斯文化传统。塔吉克人以萨曼王朝、鲁达基、伊本·西那为文化骄傲。内战后民族和解进程中。", "en": "Persian cultural tradition. Tajiks take pride in Samanid dynasty, Rudaki, Ibn Sina. Post-civil war national reconciliation underway."},
                "writingSystem": {"zh": "西里尔字母。", "en": "Cyrillic alphabet."},
                "culturalAchievements": {"zh": "波斯文学传统、帕米尔高原遗产。", "en": "Persian literary tradition, Pamir Plateau heritage."},
                "languageFamily": {"zh": "塔吉克语（波斯语变体），俄语广泛使用。", "en": "Tajik (Persian variant), Russian widely used."}
            },
            "economy": {
                "level": 2,
                "gdpEstimate": {"amount": 860000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}, "goldKg": 29100, "silverKg": 2290000},
                "gdpPerCapita": {"amount": 140, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "gdpDescription": {"zh": "中亚最贫困国家。内战摧毁了经济基础。依赖铝业（TALCO）、棉花和海外劳工汇款。", "en": "Central Asia's poorest country. Civil war destroyed economic base. Dependent on aluminum (TALCO), cotton, and overseas worker remittances."},
                "mainIndustries": {"zh": "铝冶炼（TALCO）、水电、棉花", "en": "Aluminum smelting (TALCO), hydropower, cotton"},
                "tradeGoods": {"zh": "铝、棉花、电力", "en": "Aluminum, cotton, electricity"},
                "currency": {"name": {"zh": "塔吉克卢布/索莫尼（2000年转换中）", "en": "Tajik Ruble/Somoni (transitioning in 2000)"}, "type": "fiat", "unitName": {"zh": "索莫尼", "en": "TJS"}},
                "averageIncome": {"amount": 100, "unit": {"zh": "2000年美元/年", "en": "2000 USD/year"}},
                "foreignTradeVolume": {"amount": 1500000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "economicSystem": {"zh": "战后重建经济，高度依赖外国援助与劳工汇款。", "en": "Post-war reconstruction economy, highly dependent on foreign aid and remittances."}
            },
            "finances": {
                "annualRevenue": {"amount": 250000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "annualExpenditure": {"amount": 300000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "surplus": {"amount": -50000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "treasury": {"amount": 100000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "fiscalPolicy": {"zh": "战后重建依赖国际援助。", "en": "Post-war reconstruction dependent on international aid."}
            },
            "military": {
                "level": 3,
                "totalTroops": 15000,
                "standingArmy": 10000,
                "reserves": 5000,
                "branches": [
                    {"name": {"zh": "陆军", "en": "Army"}, "count": 7000, "description": {"zh": "内战后重组。苏联装备。俄罗斯第201摩步师驻扎。", "en": "Reorganized after civil war. Soviet equipment. Russian 201st Division stationed."}},
                    {"name": {"zh": "边防军", "en": "Border Guards"}, "count": 8000, "description": {"zh": "阿富汗边境防御（俄罗斯边防军协助）。", "en": "Afghan border defense (Russian border guards assisting)."}}
                ],
                "commandStructure": {"totalGenerals": 8, "commanderInChief": {"zh": "总统兼任最高统帅", "en": "President as supreme commander"}},
                "annualMilitarySpending": {"amount": 50000000, "unit": {"zh": "2000年美元", "en": "2000 USD"}},
                "militarySpendingPctGdp": 5.8,
                "threats": {"zh": "阿富汗塔利班外溢、毒品走私、内战后前军阀势力、帕米尔地区不稳定。", "en": "Afghan Taliban spillover, narcotics trafficking, post-civil war warlord factions, Pamir instability."}
            },
            "demographics": {
                "population": 6200000,
                "populationDescription": {"zh": "人口约620万。塔吉克族约80%。内战造成约10万人死亡、数十万难民。", "en": "Population ~6.2M. Tajiks ~80%. Civil war caused ~100,000 deaths, hundreds of thousands displaced."},
                "urbanPopulation": 1700000,
                "urbanizationRate": 27,
                "majorCities": [
                    {"name": {"zh": "杜尚别", "en": "Dushanbe"}, "population": 560000},
                    {"name": {"zh": "苦盏", "en": "Khujand"}, "population": 160000}
                ],
                "ethnicGroups": {"zh": "塔吉克族（约80%）、乌兹别克族（约15%）等。", "en": "Tajiks (~80%), Uzbeks (~15%), etc."},
                "literacyRate": 99,
                "lifeExpectancy": {"zh": "63岁", "en": "63 years"}
            },
            "diplomacy": {
                "allies": {"zh": "俄罗斯（安全保障国/第201摩步师驻扎/边防军协助）、伊朗（文化与语言纽带）。", "en": "Russia (security guarantor/201st Division/border guard assistance), Iran (cultural and linguistic ties)."},
                "enemies": {"zh": "阿富汗塔利班（边境安全威胁）。", "en": "Afghan Taliban (border security threat)."},
                "foreignPolicy": {"zh": "高度依赖俄罗斯安全保障。与伊朗维持文化联系。", "en": "Highly dependent on Russian security guarantee. Cultural ties with Iran."}
            },
            "technology": {
                "level": 2,
                "era": {"zh": "现代世界", "en": "Modern World"},
                "keyInnovations": {"zh": "水电技术（努列克大坝——当时世界最高大坝）。", "en": "Hydropower (Nurek Dam — then world's tallest dam)."}
            },
            "assessment": {
                "strengths": {"zh": "水电资源潜力巨大、年轻人口、波斯文化遗产。", "en": "Enormous hydropower potential, young population, Persian cultural heritage."},
                "weaknesses": {"zh": "内战创伤、极度贫困、阿富汗边境威胁、军阀势力残余。", "en": "Civil war scars, extreme poverty, Afghan border threats, residual warlord factions."},
                "outlook": {"zh": "内战后和平脆弱，经济重建漫长。水电资源是长远希望。", "en": "Fragile post-civil war peace, long economic reconstruction. Hydropower as long-term hope."}
            },
            "status": "fragile",
            "description": {
                "zh": "2000年的塔吉克斯坦刚从毁灭性的内战（1992-1997年，约10万人死亡）中恢复。拉赫莫诺夫总统在1997年和平协议框架下与伊斯兰反对派达成权力分享安排，但实际权力向其集中。作为前苏联最贫困的加盟共和国，经济在内战后几乎从废墟中重建，依赖铝业出口和海外劳工汇款。俄罗斯第201摩步师驻扎杜尚别，俄罗斯边防军协助守卫与阿富汗的漫长边境。",
                "en": "Tajikistan in 2000 was just recovering from a devastating civil war (1992-1997, ~100,000 killed). President Rakhmonov reached a power-sharing arrangement with Islamic opposition under the 1997 peace agreement, but power was concentrating toward him. As the poorest former Soviet republic, the economy was rebuilding from ruins, dependent on aluminum exports and overseas worker remittances. Russia's 201st Division was stationed in Dushanbe, with Russian border guards helping defend the long Afghan border."
            }
        }
    ]


def main():
    """Main function to split Central Asia in both era files."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for era_file, create_func, old_id in [
        ("src/data/seed/era-ai-age.json", create_ai_age_countries, "central_asia_post_soviet_states"),
        ("src/data/seed/era-modern-era.json", create_modern_era_countries, "central_asia_post_soviet_states"),
    ]:
        filepath = os.path.join(base_dir, era_file)
        print(f"Processing {era_file}...")

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        regions = data["regions"]
        new_regions = []
        replaced = False

        for region in regions:
            if region["id"] == old_id:
                new_countries = create_func()
                new_regions.extend(new_countries)
                replaced = True
                print(f"  Replaced '{old_id}' with {len(new_countries)} individual countries")
            else:
                new_regions.append(region)

        if not replaced:
            print(f"  WARNING: '{old_id}' not found in {era_file}")
            continue

        data["regions"] = new_regions

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  Done. Total regions: {len(new_regions)} (was {len(regions)})")


if __name__ == "__main__":
    main()
