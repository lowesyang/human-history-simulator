#!/usr/bin/env python3
"""
Add subdivisions and notable city tags to era seed files.
Uses real census/historical data for major regions, estimates for smaller ones.

Usage: python3 scripts/add-subdivisions.py <era-file>
"""

import json
import sys
import os

# ── Notable city tag definitions for modern era (2023) ──
# Tags: economic, political, cultural, tourism, tech, port, religious

MODERN_CITY_TAGS = {
    # USA
    "New York": {"tags": ["economic", "cultural"], "desc": {"zh": "全球金融中心与文化之都", "en": "Global financial center and cultural capital"}},
    "Los Angeles": {"tags": ["cultural", "tech"], "desc": {"zh": "好莱坞所在地，全球娱乐与科技中心", "en": "Home of Hollywood, global entertainment and tech hub"}},
    "San Francisco Bay Area": {"tags": ["tech", "economic"], "desc": {"zh": "硅谷所在地，全球科技创新中心", "en": "Home of Silicon Valley, global tech innovation center"}},
    "Washington, D.C.": {"tags": ["political"], "desc": {"zh": "美国首都，全球政治决策中心", "en": "US capital, global political decision-making center"}},
    "Seattle": {"tags": ["tech"], "desc": {"zh": "亚马逊、微软总部所在地", "en": "Headquarters of Amazon and Microsoft"}},
    "Chicago": {"tags": ["economic"], "desc": {"zh": "美国中西部经济中心", "en": "Economic hub of the American Midwest"}},
    "Houston": {"tags": ["economic"], "desc": {"zh": "全球能源产业中心", "en": "Global energy industry center"}},
    "Miami": {"tags": ["tourism", "economic"], "desc": {"zh": "拉美金融门户与度假胜地", "en": "Latin American financial gateway and resort destination"}},
    # China
    "Shanghai": {"tags": ["economic", "port"], "desc": {"zh": "中国经济中心，世界最大港口", "en": "China's economic center, world's largest port"}},
    "Beijing": {"tags": ["political", "cultural"], "desc": {"zh": "中国首都，政治与文化中心", "en": "China's capital, political and cultural center"}},
    "Shenzhen": {"tags": ["tech", "economic"], "desc": {"zh": "中国科技创新之都", "en": "China's technology innovation capital"}},
    "Guangzhou": {"tags": ["economic", "port"], "desc": {"zh": "华南经济中心与贸易枢纽", "en": "South China economic center and trade hub"}},
    "Hangzhou": {"tags": ["tech", "economic"], "desc": {"zh": "阿里巴巴总部所在地，数字经济之城", "en": "Home of Alibaba, city of digital economy"}},
    "Chengdu": {"tags": ["economic", "cultural"], "desc": {"zh": "西南经济中心，天府之国", "en": "Southwest economic center, Land of Abundance"}},
    "Hong Kong": {"tags": ["economic", "port"], "desc": {"zh": "国际金融中心与自由港", "en": "International financial center and free port"}},
    # Japan
    "Tokyo": {"tags": ["economic", "political", "tech"], "desc": {"zh": "日本首都，亚洲最大经济中心", "en": "Japan's capital, Asia's largest economic center"}},
    "Osaka": {"tags": ["economic", "cultural"], "desc": {"zh": "日本第二大经济圈，美食之都", "en": "Japan's second-largest economic zone, food capital"}},
    "Kyoto": {"tags": ["cultural", "tourism", "religious"], "desc": {"zh": "日本古都，千年文化遗产之城", "en": "Japan's ancient capital, city of millennium heritage"}},
    # India
    "Mumbai": {"tags": ["economic", "port"], "desc": {"zh": "印度金融首都与宝莱坞所在地", "en": "India's financial capital and home of Bollywood"}},
    "New Delhi": {"tags": ["political"], "desc": {"zh": "印度首都，国家政治中心", "en": "India's capital, national political center"}},
    "Bangalore": {"tags": ["tech"], "desc": {"zh": "印度硅谷，IT与创新中心", "en": "India's Silicon Valley, IT and innovation hub"}},
    "Bengaluru": {"tags": ["tech"], "desc": {"zh": "印度硅谷，IT与创新中心", "en": "India's Silicon Valley, IT and innovation hub"}},
    # Russia
    "Moscow": {"tags": ["political", "economic", "cultural"], "desc": {"zh": "俄罗斯首都，政治经济文化中心", "en": "Russia's capital, political, economic and cultural center"}},
    "St. Petersburg": {"tags": ["cultural", "tourism"], "desc": {"zh": "俄罗斯文化之都，世界遗产之城", "en": "Russia's cultural capital, city of world heritage"}},
    "Saint Petersburg": {"tags": ["cultural", "tourism"], "desc": {"zh": "俄罗斯文化之都，世界遗产之城", "en": "Russia's cultural capital, city of world heritage"}},
    # UK
    "London": {"tags": ["economic", "political", "cultural"], "desc": {"zh": "全球金融中心与文化之都", "en": "Global financial center and cultural capital"}},
    "Edinburgh": {"tags": ["cultural", "tourism"], "desc": {"zh": "苏格兰首府，世界文化遗产之城", "en": "Scottish capital, world heritage city"}},
    # France
    "Paris": {"tags": ["cultural", "tourism", "political"], "desc": {"zh": "法国首都，全球时尚与艺术之都", "en": "France's capital, global fashion and art capital"}},
    # Germany
    "Berlin": {"tags": ["political", "cultural"], "desc": {"zh": "德国首都，欧洲文化与政治中心", "en": "Germany's capital, European cultural and political center"}},
    "Frankfurt": {"tags": ["economic"], "desc": {"zh": "欧洲央行所在地，欧洲金融中心", "en": "Home of ECB, European financial center"}},
    "Munich": {"tags": ["tech", "economic"], "desc": {"zh": "德国南部科技与经济中心", "en": "South German tech and economic center"}},
    # Others
    "Dubai": {"tags": ["economic", "tourism"], "desc": {"zh": "中东商业与旅游中心", "en": "Middle Eastern business and tourism hub"}},
    "Abu Dhabi": {"tags": ["economic", "political"], "desc": {"zh": "阿联酋首都，石油与主权财富中心", "en": "UAE capital, oil and sovereign wealth center"}},
    "Singapore": {"tags": ["economic", "port", "tech"], "desc": {"zh": "亚洲金融中心与全球航运枢纽", "en": "Asian financial center and global shipping hub"}},
    "Sydney": {"tags": ["economic", "cultural", "tourism"], "desc": {"zh": "澳大利亚最大城市，经济与文化中心", "en": "Australia's largest city, economic and cultural center"}},
    "Istanbul": {"tags": ["cultural", "economic", "tourism"], "desc": {"zh": "横跨欧亚的历史名城", "en": "Historic city spanning Europe and Asia"}},
    "Rome": {"tags": ["cultural", "tourism", "religious"], "desc": {"zh": "永恒之城，天主教中心", "en": "Eternal city, center of Catholicism"}},
    "Vatican City": {"tags": ["religious"], "desc": {"zh": "天主教全球中心", "en": "Global center of Catholicism"}},
    "Jerusalem": {"tags": ["religious", "political", "cultural"], "desc": {"zh": "三大宗教圣城", "en": "Holy city of three major religions"}},
    "Mecca": {"tags": ["religious"], "desc": {"zh": "伊斯兰教最神圣的城市", "en": "Holiest city in Islam"}},
    "Medina": {"tags": ["religious"], "desc": {"zh": "伊斯兰教第二圣城", "en": "Second holiest city in Islam"}},
    "Seoul": {"tags": ["tech", "economic", "cultural"], "desc": {"zh": "韩国首都，K-文化与科技中心", "en": "South Korea's capital, K-culture and tech center"}},
    "Tel Aviv": {"tags": ["tech", "economic"], "desc": {"zh": "以色列科技与创业中心", "en": "Israel's tech and startup hub"}},
    "Bangkok": {"tags": ["tourism", "economic"], "desc": {"zh": "东南亚旅游与经济中心", "en": "Southeast Asian tourism and economic center"}},
    "Cairo": {"tags": ["cultural", "political"], "desc": {"zh": "阿拉伯世界最大城市", "en": "Largest city in the Arab world"}},
    "São Paulo": {"tags": ["economic"], "desc": {"zh": "南美洲最大经济中心", "en": "South America's largest economic center"}},
    "Rio de Janeiro": {"tags": ["cultural", "tourism"], "desc": {"zh": "巴西文化之都与旅游胜地", "en": "Brazil's cultural capital and tourist destination"}},
    "Mexico City": {"tags": ["political", "cultural", "economic"], "desc": {"zh": "拉丁美洲最大都市", "en": "Latin America's largest metropolitan area"}},
    "Lagos": {"tags": ["economic"], "desc": {"zh": "非洲最大经济中心", "en": "Africa's largest economic center"}},
    "Nairobi": {"tags": ["tech", "economic"], "desc": {"zh": "东非科技与金融中心", "en": "East African tech and financial hub"}},
    "Johannesburg": {"tags": ["economic"], "desc": {"zh": "南非经济中心", "en": "South Africa's economic center"}},
    "Cape Town": {"tags": ["tourism", "cultural"], "desc": {"zh": "南非旅游与文化名城", "en": "South African tourism and cultural city"}},
    "Amsterdam": {"tags": ["cultural", "economic"], "desc": {"zh": "荷兰首都，欧洲文化与贸易中心", "en": "Dutch capital, European cultural and trade center"}},
    "Zurich": {"tags": ["economic"], "desc": {"zh": "全球财富管理与银行业中心", "en": "Global wealth management and banking center"}},
    "Geneva": {"tags": ["political"], "desc": {"zh": "联合国欧洲总部所在地", "en": "Home of UN European headquarters"}},
    "Vienna": {"tags": ["cultural", "political"], "desc": {"zh": "音乐之都与国际组织中心", "en": "City of music and international organizations"}},
    "Brussels": {"tags": ["political"], "desc": {"zh": "欧盟与北约总部所在地", "en": "Home of EU and NATO headquarters"}},
    "Taipei": {"tags": ["tech"], "desc": {"zh": "全球半导体产业中心", "en": "Global semiconductor industry center"}},
    "Ho Chi Minh City": {"tags": ["economic"], "desc": {"zh": "越南经济中心", "en": "Vietnam's economic center"}},
    "Kuala Lumpur": {"tags": ["economic", "tourism"], "desc": {"zh": "马来西亚首都，东南亚新兴经济中心", "en": "Malaysian capital, emerging Southeast Asian economic center"}},
    "Jakarta": {"tags": ["political", "economic"], "desc": {"zh": "印尼首都，东南亚最大城市", "en": "Indonesian capital, Southeast Asia's largest city"}},
    "Manila": {"tags": ["economic"], "desc": {"zh": "菲律宾首都与经济中心", "en": "Philippine capital and economic center"}},
    "Riyadh": {"tags": ["political", "economic"], "desc": {"zh": "沙特首都，中东政治与经济中心", "en": "Saudi capital, Middle Eastern political and economic center"}},
    "Doha": {"tags": ["economic"], "desc": {"zh": "卡塔尔首都，天然气财富之城", "en": "Qatar's capital, city of natural gas wealth"}},
    "Buenos Aires": {"tags": ["cultural", "political"], "desc": {"zh": "阿根廷首都，南美文化名城", "en": "Argentine capital, South American cultural city"}},
    "Bogotá": {"tags": ["political", "economic"], "desc": {"zh": "哥伦比亚首都与经济中心", "en": "Colombian capital and economic center"}},
    "Lima": {"tags": ["political", "cultural"], "desc": {"zh": "秘鲁首都，南美历史名城", "en": "Peruvian capital, South American historic city"}},
    "Santiago": {"tags": ["economic", "political"], "desc": {"zh": "智利首都与经济中心", "en": "Chilean capital and economic center"}},
    "Addis Ababa": {"tags": ["political"], "desc": {"zh": "非盟总部所在地", "en": "Home of African Union headquarters"}},
    "Athens": {"tags": ["cultural", "tourism"], "desc": {"zh": "西方文明发源地", "en": "Birthplace of Western civilization"}},
    "Warsaw": {"tags": ["political", "economic"], "desc": {"zh": "波兰首都，中东欧经济中心", "en": "Polish capital, Central-Eastern European economic center"}},
    "Prague": {"tags": ["cultural", "tourism"], "desc": {"zh": "百塔之城，中欧文化明珠", "en": "City of a Hundred Spires, Central European cultural gem"}},
    "Budapest": {"tags": ["cultural", "tourism"], "desc": {"zh": "多瑙河明珠", "en": "Pearl of the Danube"}},
    "Lisbon": {"tags": ["tourism", "cultural"], "desc": {"zh": "大航海时代起点", "en": "Starting point of the Age of Discovery"}},
    "Barcelona": {"tags": ["cultural", "tourism"], "desc": {"zh": "高迪之城，地中海文化中心", "en": "City of Gaudí, Mediterranean cultural center"}},
    "Madrid": {"tags": ["political", "cultural"], "desc": {"zh": "西班牙首都，伊比利亚政治文化中心", "en": "Spanish capital, Iberian political and cultural center"}},
    "Milan": {"tags": ["economic", "cultural"], "desc": {"zh": "全球时尚之都与意大利经济中心", "en": "Global fashion capital and Italian economic center"}},
    "Venice": {"tags": ["tourism", "cultural"], "desc": {"zh": "水上之城，世界文化遗产", "en": "City on water, world heritage site"}},
    "Florence": {"tags": ["cultural", "tourism"], "desc": {"zh": "文艺复兴发源地", "en": "Birthplace of the Renaissance"}},
    "Kyiv": {"tags": ["political"], "desc": {"zh": "乌克兰首都", "en": "Ukrainian capital"}},
    "Tehran": {"tags": ["political"], "desc": {"zh": "伊朗首都，西亚政治中心", "en": "Iranian capital, West Asian political center"}},
    "Ankara": {"tags": ["political"], "desc": {"zh": "土耳其首都", "en": "Turkish capital"}},
    "Hanoi": {"tags": ["political"], "desc": {"zh": "越南首都", "en": "Vietnamese capital"}},
    "Havana": {"tags": ["cultural", "political"], "desc": {"zh": "古巴首都，加勒比文化名城", "en": "Cuban capital, Caribbean cultural city"}},
    "Marrakech": {"tags": ["tourism", "cultural"], "desc": {"zh": "摩洛哥旅游与文化名城", "en": "Moroccan tourism and cultural city"}},
    "Varanasi": {"tags": ["religious"], "desc": {"zh": "印度教圣城", "en": "Holy city of Hinduism"}},
    "Lhasa": {"tags": ["religious", "cultural"], "desc": {"zh": "藏传佛教圣城", "en": "Holy city of Tibetan Buddhism"}},
    "Kathmandu": {"tags": ["religious", "tourism"], "desc": {"zh": "尼泊尔首都，喜马拉雅文化中心", "en": "Nepali capital, Himalayan cultural center"}},
}

# ── Notable city tag definitions for historical eras (antiquity – ~1900) ──
# Tags: economic, political, cultural, tourism, religious, port

HISTORICAL_CITY_TAGS = {
    # ── Ancient cities ──
    "Rome": {"tags": ["political", "cultural", "religious"], "desc": {"zh": "永恒之城，罗马帝国首都", "en": "Eternal City, capital of the Roman Empire"}},
    "Athens": {"tags": ["cultural", "political"], "desc": {"zh": "西方文明与民主的发源地", "en": "Birthplace of Western civilization and democracy"}},
    "Alexandria": {"tags": ["cultural", "economic", "port"], "desc": {"zh": "古代学术中心与地中海大港", "en": "Ancient center of learning and great Mediterranean port"}},
    "Constantinople": {"tags": ["political", "economic", "religious", "port"], "desc": {"zh": "拜占庭帝国首都，东西方交汇之城", "en": "Byzantine capital, city at the crossroads of East and West"}},
    "Carthage": {"tags": ["economic", "port"], "desc": {"zh": "北非强大贸易帝国的首都", "en": "Capital of a powerful North African trading empire"}},
    "Babylon": {"tags": ["political", "cultural"], "desc": {"zh": "美索不达米亚古城，空中花园所在地", "en": "Ancient Mesopotamian city, home of the Hanging Gardens"}},
    "Memphis": {"tags": ["political", "religious"], "desc": {"zh": "古埃及首都，法老权力中心", "en": "Ancient Egyptian capital, center of pharaonic power"}},
    "Thebes": {"tags": ["religious", "political", "cultural"], "desc": {"zh": "古埃及宗教圣城，卡纳克神庙所在地", "en": "Sacred city of ancient Egypt, home of Karnak Temple"}},
    "Persepolis": {"tags": ["political", "cultural"], "desc": {"zh": "波斯帝国仪式首都", "en": "Ceremonial capital of the Persian Empire"}},
    "Pataliputra": {"tags": ["political", "economic"], "desc": {"zh": "孔雀帝国首都，古代世界最大城市之一", "en": "Mauryan capital, one of the largest cities of the ancient world"}},
    "Luoyang": {"tags": ["political", "cultural", "economic"], "desc": {"zh": "东汉首都，丝绸之路东端", "en": "Eastern Han capital, eastern terminus of the Silk Road"}},
    "Chang'an": {"tags": ["political", "cultural", "economic"], "desc": {"zh": "汉唐帝国首都，丝绸之路起点", "en": "Han-Tang capital, starting point of the Silk Road"}},
    "Xianyang": {"tags": ["political"], "desc": {"zh": "秦帝国首都，中国第一个统一王朝", "en": "Qin capital, China's first unified dynasty"}},
    "Antioch": {"tags": ["economic", "cultural", "religious"], "desc": {"zh": "古代叙利亚大都市，早期基督教中心", "en": "Great Syrian metropolis, early Christian center"}},
    "Ephesus": {"tags": ["cultural", "religious", "port"], "desc": {"zh": "古代小亚细亚名城，阿尔忒弥斯神庙所在地", "en": "Famed city of Asia Minor, home of Temple of Artemis"}},
    "Syracuse": {"tags": ["cultural", "economic", "port"], "desc": {"zh": "古希腊西西里最强大城邦", "en": "Most powerful Greek city-state in Sicily"}},
    "Sparta": {"tags": ["political"], "desc": {"zh": "古希腊军事强国", "en": "Ancient Greek military power"}},
    "Tyre": {"tags": ["economic", "port"], "desc": {"zh": "腓尼基航海贸易中心", "en": "Phoenician maritime trading center"}},
    "Varanasi": {"tags": ["religious", "cultural"], "desc": {"zh": "印度教最古老圣城", "en": "Oldest holy city of Hinduism"}},
    "Taxila": {"tags": ["cultural", "economic"], "desc": {"zh": "犍陀罗学术与贸易中心", "en": "Gandharan center of learning and trade"}},
    "Corinth": {"tags": ["economic", "port"], "desc": {"zh": "古希腊重要贸易港口", "en": "Major Greek trading port"}},
    # ── Medieval cities ──
    "Baghdad": {"tags": ["cultural", "economic", "political"], "desc": {"zh": "阿拔斯王朝首都，伊斯兰黄金时代中心", "en": "Abbasid capital, center of the Islamic Golden Age"}},
    "Córdoba": {"tags": ["cultural", "economic", "religious"], "desc": {"zh": "安达卢斯文化之都，欧洲最大中世纪城市", "en": "Cultural capital of Al-Andalus, largest medieval European city"}},
    "Cordoba": {"tags": ["cultural", "economic", "religious"], "desc": {"zh": "安达卢斯文化之都，欧洲最大中世纪城市", "en": "Cultural capital of Al-Andalus, largest medieval European city"}},
    "Venice": {"tags": ["economic", "port", "cultural"], "desc": {"zh": "中世纪海洋贸易帝国，水上之城", "en": "Medieval maritime trading empire, city on water"}},
    "Florence": {"tags": ["cultural", "economic"], "desc": {"zh": "文艺复兴发源地，美第奇家族之城", "en": "Birthplace of the Renaissance, city of the Medici"}},
    "Samarkand": {"tags": ["economic", "cultural"], "desc": {"zh": "丝绸之路明珠，帖木儿帝国首都", "en": "Pearl of the Silk Road, Timurid capital"}},
    "Kaifeng": {"tags": ["political", "economic"], "desc": {"zh": "北宋首都，当时世界最大城市", "en": "Northern Song capital, then the world's largest city"}},
    "Lin'an": {"tags": ["political", "economic", "cultural"], "desc": {"zh": "南宋首都（今杭州），繁华商业之都", "en": "Southern Song capital (modern Hangzhou), prosperous commercial center"}},
    "Hangzhou": {"tags": ["political", "economic", "cultural"], "desc": {"zh": "南宋首都，人间天堂", "en": "Southern Song capital, paradise on earth"}},
    "Cairo": {"tags": ["political", "economic", "cultural"], "desc": {"zh": "法蒂玛/马穆鲁克首都，伊斯兰世界中心", "en": "Fatimid-Mamluk capital, center of the Islamic world"}},
    "Damascus": {"tags": ["political", "economic", "cultural"], "desc": {"zh": "倭马亚王朝首都，世界最古老连续有人居住的城市", "en": "Umayyad capital, world's oldest continuously inhabited city"}},
    "Jerusalem": {"tags": ["religious", "political", "cultural"], "desc": {"zh": "三大宗教圣城，十字军争夺焦点", "en": "Holy city of three faiths, focal point of the Crusades"}},
    "Timbuktu": {"tags": ["cultural", "economic"], "desc": {"zh": "撒哈拉贸易与学术中心", "en": "Saharan trade and scholarly center"}},
    "Angkor": {"tags": ["political", "cultural", "religious"], "desc": {"zh": "高棉帝国首都，世界最大前工业城市", "en": "Khmer capital, world's largest pre-industrial city"}},
    "Palermo": {"tags": ["cultural", "political", "port"], "desc": {"zh": "诺曼-阿拉伯文化交融之城", "en": "City of Norman-Arab cultural fusion"}},
    "Fez": {"tags": ["cultural", "religious"], "desc": {"zh": "摩洛哥精神之都，世界最古老大学所在地", "en": "Spiritual capital of Morocco, home of world's oldest university"}},
    "Kyoto": {"tags": ["political", "cultural", "religious"], "desc": {"zh": "日本千年古都", "en": "Japan's thousand-year capital"}},
    "Nanjing": {"tags": ["political", "cultural"], "desc": {"zh": "六朝古都", "en": "Capital of six dynasties"}},
    "Guangzhou": {"tags": ["economic", "port"], "desc": {"zh": "中国南方贸易大港", "en": "Great southern Chinese trading port"}},
    "Quanzhou": {"tags": ["economic", "port"], "desc": {"zh": "宋元时期世界最大港口", "en": "World's largest port during Song-Yuan era"}},
    "Kilwa": {"tags": ["economic", "port"], "desc": {"zh": "东非斯瓦希里海岸贸易中心", "en": "Swahili Coast trading center of East Africa"}},
    "Genoa": {"tags": ["economic", "port"], "desc": {"zh": "中世纪海洋贸易强国", "en": "Medieval maritime trading power"}},
    "Bruges": {"tags": ["economic", "cultural"], "desc": {"zh": "中世纪北欧商业中心", "en": "Medieval northern European commercial center"}},
    "Novgorod": {"tags": ["economic", "political"], "desc": {"zh": "中世纪俄罗斯商业共和国", "en": "Medieval Russian commercial republic"}},
    "Kiev": {"tags": ["political", "religious"], "desc": {"zh": "基辅罗斯首都", "en": "Capital of Kievan Rus'"}},
    "Kyiv": {"tags": ["political", "religious"], "desc": {"zh": "基辅罗斯首都", "en": "Capital of Kievan Rus'"}},
    "Cusco": {"tags": ["political", "religious"], "desc": {"zh": "印加帝国首都", "en": "Capital of the Inca Empire"}},
    "Tenochtitlan": {"tags": ["political", "economic"], "desc": {"zh": "阿兹特克帝国首都", "en": "Capital of the Aztec Empire"}},
    # ── Early Modern cities ──
    "London": {"tags": ["economic", "political", "port"], "desc": {"zh": "大英帝国首都，全球贸易与金融中心", "en": "Capital of the British Empire, global trade and financial center"}},
    "Paris": {"tags": ["cultural", "political"], "desc": {"zh": "法国首都，欧洲启蒙运动中心", "en": "French capital, center of the European Enlightenment"}},
    "Amsterdam": {"tags": ["economic", "port", "cultural"], "desc": {"zh": "荷兰黄金时代商业中心", "en": "Commercial center of the Dutch Golden Age"}},
    "Istanbul": {"tags": ["political", "economic", "religious", "port"], "desc": {"zh": "奥斯曼帝国首都，横跨欧亚", "en": "Ottoman capital, spanning Europe and Asia"}},
    "Lisbon": {"tags": ["economic", "port"], "desc": {"zh": "大航海时代起点，葡萄牙帝国首都", "en": "Starting point of the Age of Discovery, Portuguese capital"}},
    "Seville": {"tags": ["economic", "port"], "desc": {"zh": "新大陆贸易垄断港", "en": "Monopoly port for New World trade"}},
    "Vienna": {"tags": ["political", "cultural"], "desc": {"zh": "哈布斯堡帝国首都，欧洲音乐之都", "en": "Habsburg capital, European city of music"}},
    "Beijing": {"tags": ["political", "cultural"], "desc": {"zh": "明清帝国首都，紫禁城所在地", "en": "Ming-Qing capital, home of the Forbidden City"}},
    "Edo": {"tags": ["political", "economic"], "desc": {"zh": "德川幕府所在地（今东京）", "en": "Seat of the Tokugawa Shogunate (modern Tokyo)"}},
    "Tokyo": {"tags": ["political", "economic"], "desc": {"zh": "德川幕府所在地", "en": "Seat of the Tokugawa Shogunate"}},
    "Delhi": {"tags": ["political", "cultural"], "desc": {"zh": "莫卧儿帝国首都", "en": "Mughal Empire capital"}},
    "Isfahan": {"tags": ["cultural", "economic", "religious"], "desc": {"zh": "萨法维王朝首都，世界之半", "en": "Safavid capital, 'half the world'"}},
    "Agra": {"tags": ["political", "cultural"], "desc": {"zh": "莫卧儿帝国首都，泰姬陵所在地", "en": "Mughal capital, home of the Taj Mahal"}},
    "Lahore": {"tags": ["cultural", "political"], "desc": {"zh": "莫卧儿帝国文化名城", "en": "Cultural city of the Mughal Empire"}},
    "Moscow": {"tags": ["political"], "desc": {"zh": "莫斯科公国/沙俄首都", "en": "Capital of Muscovy/Tsardom of Russia"}},
    "St. Petersburg": {"tags": ["political", "cultural"], "desc": {"zh": "俄罗斯帝国首都，彼得大帝之城", "en": "Capital of the Russian Empire, city of Peter the Great"}},
    "Saint Petersburg": {"tags": ["political", "cultural"], "desc": {"zh": "俄罗斯帝国首都", "en": "Capital of the Russian Empire"}},
    "Madrid": {"tags": ["political"], "desc": {"zh": "西班牙帝国首都", "en": "Capital of the Spanish Empire"}},
    "Bruges": {"tags": ["economic", "cultural"], "desc": {"zh": "佛兰德商业中心", "en": "Flemish commercial center"}},
    "Antwerp": {"tags": ["economic", "port"], "desc": {"zh": "16世纪欧洲最大港口与金融中心", "en": "16th-century Europe's largest port and financial center"}},
    "Manila": {"tags": ["economic", "port"], "desc": {"zh": "西班牙-中国丝银贸易枢纽", "en": "Spanish-Chinese silk-silver trade hub"}},
    "Malacca": {"tags": ["economic", "port"], "desc": {"zh": "东南亚最重要海峡贸易港", "en": "Most important strait-trade port in Southeast Asia"}},
    "Goa": {"tags": ["economic", "port", "religious"], "desc": {"zh": "葡属印度首府", "en": "Capital of Portuguese India"}},
    "Mecca": {"tags": ["religious"], "desc": {"zh": "伊斯兰教最神圣的城市", "en": "Holiest city in Islam"}},
    "Medina": {"tags": ["religious"], "desc": {"zh": "伊斯兰教第二圣城", "en": "Second holiest city in Islam"}},
    "Lhasa": {"tags": ["religious", "cultural"], "desc": {"zh": "藏传佛教圣城", "en": "Holy city of Tibetan Buddhism"}},
    "Prague": {"tags": ["cultural", "political"], "desc": {"zh": "波西米亚首都，中欧文化明珠", "en": "Bohemian capital, Central European cultural gem"}},
    "Krakow": {"tags": ["cultural", "political"], "desc": {"zh": "波兰古都", "en": "Ancient capital of Poland"}},
    "Kraków": {"tags": ["cultural", "political"], "desc": {"zh": "波兰古都", "en": "Ancient capital of Poland"}},
    "Mexico City": {"tags": ["political", "economic"], "desc": {"zh": "新西班牙总督府首都", "en": "Capital of the Viceroyalty of New Spain"}},
    "Lima": {"tags": ["political", "economic"], "desc": {"zh": "秘鲁总督府首都", "en": "Capital of the Viceroyalty of Peru"}},
    "Potosí": {"tags": ["economic"], "desc": {"zh": "世界最大银矿所在地", "en": "Site of the world's largest silver mine"}},
    "Canton": {"tags": ["economic", "port"], "desc": {"zh": "清代唯一对外贸易港口", "en": "Qing's sole foreign trade port"}},
    "Nagasaki": {"tags": ["economic", "port"], "desc": {"zh": "日本锁国时期唯一对外窗口", "en": "Japan's only window to the outside during Sakoku"}},
    "Zanzibar": {"tags": ["economic", "port"], "desc": {"zh": "东非海上贸易中心", "en": "East African maritime trade center"}},
}

# ── Subdivisions data for major modern countries (2023 census) ──

SUBDIVISIONS_2023 = {
    "north_america_usa": [
        {"name": {"zh": "加利福尼亚州", "en": "California"}, "population": 39029000, "capital": {"zh": "萨克拉门托", "en": "Sacramento"}},
        {"name": {"zh": "得克萨斯州", "en": "Texas"}, "population": 30503000, "capital": {"zh": "奥斯汀", "en": "Austin"}},
        {"name": {"zh": "佛罗里达州", "en": "Florida"}, "population": 22610000, "capital": {"zh": "塔拉哈西", "en": "Tallahassee"}},
        {"name": {"zh": "纽约州", "en": "New York"}, "population": 19677000, "capital": {"zh": "奥尔巴尼", "en": "Albany"}},
        {"name": {"zh": "宾夕法尼亚州", "en": "Pennsylvania"}, "population": 12973000, "capital": {"zh": "哈里斯堡", "en": "Harrisburg"}},
        {"name": {"zh": "伊利诺伊州", "en": "Illinois"}, "population": 12582000, "capital": {"zh": "斯普林菲尔德", "en": "Springfield"}},
        {"name": {"zh": "俄亥俄州", "en": "Ohio"}, "population": 11780000, "capital": {"zh": "哥伦布", "en": "Columbus"}},
        {"name": {"zh": "佐治亚州", "en": "Georgia"}, "population": 10912000, "capital": {"zh": "亚特兰大", "en": "Atlanta"}},
        {"name": {"zh": "北卡罗来纳州", "en": "North Carolina"}, "population": 10698000, "capital": {"zh": "罗利", "en": "Raleigh"}},
        {"name": {"zh": "密歇根州", "en": "Michigan"}, "population": 10037000, "capital": {"zh": "兰辛", "en": "Lansing"}},
        {"name": {"zh": "新泽西州", "en": "New Jersey"}, "population": 9290000, "capital": {"zh": "特伦顿", "en": "Trenton"}},
        {"name": {"zh": "弗吉尼亚州", "en": "Virginia"}, "population": 8643000, "capital": {"zh": "里士满", "en": "Richmond"}},
        {"name": {"zh": "华盛顿州", "en": "Washington"}, "population": 7812000, "capital": {"zh": "奥林匹亚", "en": "Olympia"}},
        {"name": {"zh": "亚利桑那州", "en": "Arizona"}, "population": 7359000, "capital": {"zh": "菲尼克斯", "en": "Phoenix"}},
        {"name": {"zh": "马萨诸塞州", "en": "Massachusetts"}, "population": 7030000, "capital": {"zh": "波士顿", "en": "Boston"}},
    ],
    "east_asia_china_prc": [
        {"name": {"zh": "广东省", "en": "Guangdong"}, "population": 126800000, "capital": {"zh": "广州", "en": "Guangzhou"}},
        {"name": {"zh": "山东省", "en": "Shandong"}, "population": 101530000, "capital": {"zh": "济南", "en": "Jinan"}},
        {"name": {"zh": "河南省", "en": "Henan"}, "population": 98830000, "capital": {"zh": "郑州", "en": "Zhengzhou"}},
        {"name": {"zh": "江苏省", "en": "Jiangsu"}, "population": 85150000, "capital": {"zh": "南京", "en": "Nanjing"}},
        {"name": {"zh": "四川省", "en": "Sichuan"}, "population": 83670000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "河北省", "en": "Hebei"}, "population": 74100000, "capital": {"zh": "石家庄", "en": "Shijiazhuang"}},
        {"name": {"zh": "湖南省", "en": "Hunan"}, "population": 66440000, "capital": {"zh": "长沙", "en": "Changsha"}},
        {"name": {"zh": "浙江省", "en": "Zhejiang"}, "population": 65770000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "安徽省", "en": "Anhui"}, "population": 61270000, "capital": {"zh": "合肥", "en": "Hefei"}},
        {"name": {"zh": "湖北省", "en": "Hubei"}, "population": 57700000, "capital": {"zh": "武汉", "en": "Wuhan"}},
        {"name": {"zh": "广西壮族自治区", "en": "Guangxi"}, "population": 50370000, "capital": {"zh": "南宁", "en": "Nanning"}},
        {"name": {"zh": "云南省", "en": "Yunnan"}, "population": 47120000, "capital": {"zh": "昆明", "en": "Kunming"}},
        {"name": {"zh": "江西省", "en": "Jiangxi"}, "population": 45190000, "capital": {"zh": "南昌", "en": "Nanchang"}},
        {"name": {"zh": "辽宁省", "en": "Liaoning"}, "population": 42150000, "capital": {"zh": "沈阳", "en": "Shenyang"}},
        {"name": {"zh": "福建省", "en": "Fujian"}, "population": 41880000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "陕西省", "en": "Shaanxi"}, "population": 39530000, "capital": {"zh": "西安", "en": "Xi'an"}},
        {"name": {"zh": "黑龙江省", "en": "Heilongjiang"}, "population": 31230000, "capital": {"zh": "哈尔滨", "en": "Harbin"}},
        {"name": {"zh": "山西省", "en": "Shanxi"}, "population": 34920000, "capital": {"zh": "太原", "en": "Taiyuan"}},
        {"name": {"zh": "贵州省", "en": "Guizhou"}, "population": 38530000, "capital": {"zh": "贵阳", "en": "Guiyang"}},
        {"name": {"zh": "重庆市", "en": "Chongqing"}, "population": 32050000, "capital": {"zh": "重庆", "en": "Chongqing"}},
        {"name": {"zh": "吉林省", "en": "Jilin"}, "population": 23830000, "capital": {"zh": "长春", "en": "Changchun"}},
        {"name": {"zh": "甘肃省", "en": "Gansu"}, "population": 24940000, "capital": {"zh": "兰州", "en": "Lanzhou"}},
        {"name": {"zh": "内蒙古自治区", "en": "Inner Mongolia"}, "population": 24050000, "capital": {"zh": "呼和浩特", "en": "Hohhot"}},
        {"name": {"zh": "新疆维吾尔自治区", "en": "Xinjiang"}, "population": 25890000, "capital": {"zh": "乌鲁木齐", "en": "Urumqi"}},
        {"name": {"zh": "上海市", "en": "Shanghai"}, "population": 24870000, "capital": {"zh": "上海", "en": "Shanghai"}},
        {"name": {"zh": "北京市", "en": "Beijing"}, "population": 21540000, "capital": {"zh": "北京", "en": "Beijing"}},
        {"name": {"zh": "天津市", "en": "Tianjin"}, "population": 13630000, "capital": {"zh": "天津", "en": "Tianjin"}},
        {"name": {"zh": "海南省", "en": "Hainan"}, "population": 10080000, "capital": {"zh": "海口", "en": "Haikou"}},
        {"name": {"zh": "宁夏回族自治区", "en": "Ningxia"}, "population": 7250000, "capital": {"zh": "银川", "en": "Yinchuan"}},
        {"name": {"zh": "青海省", "en": "Qinghai"}, "population": 5950000, "capital": {"zh": "西宁", "en": "Xining"}},
        {"name": {"zh": "西藏自治区", "en": "Tibet"}, "population": 3650000, "capital": {"zh": "拉萨", "en": "Lhasa"}},
    ],
    "south_asia_india": [
        {"name": {"zh": "北方邦", "en": "Uttar Pradesh"}, "population": 231502000, "capital": {"zh": "勒克瑙", "en": "Lucknow"}},
        {"name": {"zh": "马哈拉施特拉邦", "en": "Maharashtra"}, "population": 124904000, "capital": {"zh": "孟买", "en": "Mumbai"}},
        {"name": {"zh": "比哈尔邦", "en": "Bihar"}, "population": 127000000, "capital": {"zh": "巴特那", "en": "Patna"}},
        {"name": {"zh": "西孟加拉邦", "en": "West Bengal"}, "population": 99609000, "capital": {"zh": "加尔各答", "en": "Kolkata"}},
        {"name": {"zh": "中央邦", "en": "Madhya Pradesh"}, "population": 85003000, "capital": {"zh": "博帕尔", "en": "Bhopal"}},
        {"name": {"zh": "泰米尔纳德邦", "en": "Tamil Nadu"}, "population": 77841000, "capital": {"zh": "金奈", "en": "Chennai"}},
        {"name": {"zh": "拉贾斯坦邦", "en": "Rajasthan"}, "population": 79503000, "capital": {"zh": "斋浦尔", "en": "Jaipur"}},
        {"name": {"zh": "卡纳塔克邦", "en": "Karnataka"}, "population": 67563000, "capital": {"zh": "班加罗尔", "en": "Bengaluru"}},
        {"name": {"zh": "古吉拉特邦", "en": "Gujarat"}, "population": 63872000, "capital": {"zh": "甘地讷格尔", "en": "Gandhinagar"}},
        {"name": {"zh": "安得拉邦", "en": "Andhra Pradesh"}, "population": 52221000, "capital": {"zh": "阿马拉瓦蒂", "en": "Amaravati"}},
        {"name": {"zh": "奥里萨邦", "en": "Odisha"}, "population": 45429000, "capital": {"zh": "布巴内什瓦尔", "en": "Bhubaneswar"}},
        {"name": {"zh": "特伦甘纳邦", "en": "Telangana"}, "population": 39362000, "capital": {"zh": "海得拉巴", "en": "Hyderabad"}},
        {"name": {"zh": "喀拉拉邦", "en": "Kerala"}, "population": 35559000, "capital": {"zh": "特里凡得琅", "en": "Thiruvananthapuram"}},
        {"name": {"zh": "阿萨姆邦", "en": "Assam"}, "population": 35607000, "capital": {"zh": "迪斯布尔", "en": "Dispur"}},
        {"name": {"zh": "旁遮普邦", "en": "Punjab"}, "population": 30452000, "capital": {"zh": "昌迪加尔", "en": "Chandigarh"}},
    ],
    "east_asia_japan": [
        {"name": {"zh": "东京都", "en": "Tokyo"}, "population": 14048000, "capital": {"zh": "东京", "en": "Tokyo"}},
        {"name": {"zh": "神奈川县", "en": "Kanagawa"}, "population": 9237000, "capital": {"zh": "横滨", "en": "Yokohama"}},
        {"name": {"zh": "大阪府", "en": "Osaka"}, "population": 8809000, "capital": {"zh": "大阪", "en": "Osaka"}},
        {"name": {"zh": "爱知县", "en": "Aichi"}, "population": 7483000, "capital": {"zh": "名古屋", "en": "Nagoya"}},
        {"name": {"zh": "埼玉县", "en": "Saitama"}, "population": 7345000, "capital": {"zh": "埼玉", "en": "Saitama"}},
        {"name": {"zh": "千叶县", "en": "Chiba"}, "population": 6284000, "capital": {"zh": "千叶", "en": "Chiba"}},
        {"name": {"zh": "兵库县", "en": "Hyogo"}, "population": 5435000, "capital": {"zh": "神户", "en": "Kobe"}},
        {"name": {"zh": "北海道", "en": "Hokkaido"}, "population": 5140000, "capital": {"zh": "札幌", "en": "Sapporo"}},
        {"name": {"zh": "福冈县", "en": "Fukuoka"}, "population": 5104000, "capital": {"zh": "福冈", "en": "Fukuoka"}},
        {"name": {"zh": "静冈县", "en": "Shizuoka"}, "population": 3582000, "capital": {"zh": "静冈", "en": "Shizuoka"}},
    ],
    "ai_russia": [
        {"name": {"zh": "莫斯科市", "en": "Moscow City"}, "population": 13010000, "capital": {"zh": "莫斯科", "en": "Moscow"}},
        {"name": {"zh": "莫斯科州", "en": "Moscow Oblast"}, "population": 8525000, "capital": {"zh": "克拉斯诺戈尔斯克", "en": "Krasnogorsk"}},
        {"name": {"zh": "圣彼得堡市", "en": "Saint Petersburg"}, "population": 5377000, "capital": {"zh": "圣彼得堡", "en": "Saint Petersburg"}},
        {"name": {"zh": "克拉斯诺达尔边疆区", "en": "Krasnodar Krai"}, "population": 5838000, "capital": {"zh": "克拉斯诺达尔", "en": "Krasnodar"}},
        {"name": {"zh": "斯维尔德洛夫斯克州", "en": "Sverdlovsk Oblast"}, "population": 4268000, "capital": {"zh": "叶卡捷琳堡", "en": "Yekaterinburg"}},
        {"name": {"zh": "鞑靼斯坦共和国", "en": "Tatarstan"}, "population": 3903000, "capital": {"zh": "喀山", "en": "Kazan"}},
        {"name": {"zh": "巴什科尔托斯坦共和国", "en": "Bashkortostan"}, "population": 4038000, "capital": {"zh": "乌法", "en": "Ufa"}},
        {"name": {"zh": "车里雅宾斯克州", "en": "Chelyabinsk Oblast"}, "population": 3442000, "capital": {"zh": "车里雅宾斯克", "en": "Chelyabinsk"}},
        {"name": {"zh": "新西伯利亚州", "en": "Novosibirsk Oblast"}, "population": 2798000, "capital": {"zh": "新西伯利亚", "en": "Novosibirsk"}},
        {"name": {"zh": "下诺夫哥罗德州", "en": "Nizhny Novgorod Oblast"}, "population": 3119000, "capital": {"zh": "下诺夫哥罗德", "en": "Nizhny Novgorod"}},
    ],
    "ai_germany": [
        {"name": {"zh": "北莱茵-威斯特法伦", "en": "North Rhine-Westphalia"}, "population": 17926000, "capital": {"zh": "杜塞尔多夫", "en": "Düsseldorf"}},
        {"name": {"zh": "巴伐利亚", "en": "Bavaria"}, "population": 13177000, "capital": {"zh": "慕尼黑", "en": "Munich"}},
        {"name": {"zh": "巴登-符腾堡", "en": "Baden-Württemberg"}, "population": 11124000, "capital": {"zh": "斯图加特", "en": "Stuttgart"}},
        {"name": {"zh": "下萨克森", "en": "Lower Saxony"}, "population": 8028000, "capital": {"zh": "汉诺威", "en": "Hanover"}},
        {"name": {"zh": "黑森", "en": "Hesse"}, "population": 6294000, "capital": {"zh": "威斯巴登", "en": "Wiesbaden"}},
        {"name": {"zh": "萨克森", "en": "Saxony"}, "population": 4043000, "capital": {"zh": "德累斯顿", "en": "Dresden"}},
        {"name": {"zh": "柏林", "en": "Berlin"}, "population": 3677000, "capital": {"zh": "柏林", "en": "Berlin"}},
        {"name": {"zh": "莱茵兰-普法尔茨", "en": "Rhineland-Palatinate"}, "population": 4107000, "capital": {"zh": "美因茨", "en": "Mainz"}},
        {"name": {"zh": "石勒苏益格-荷尔斯泰因", "en": "Schleswig-Holstein"}, "population": 2922000, "capital": {"zh": "基尔", "en": "Kiel"}},
        {"name": {"zh": "汉堡", "en": "Hamburg"}, "population": 1892000, "capital": {"zh": "汉堡", "en": "Hamburg"}},
    ],
    "ai_france": [
        {"name": {"zh": "法兰西岛", "en": "Île-de-France"}, "population": 12262000, "capital": {"zh": "巴黎", "en": "Paris"}},
        {"name": {"zh": "奥弗涅-罗讷-阿尔卑斯", "en": "Auvergne-Rhône-Alpes"}, "population": 8092000, "capital": {"zh": "里昂", "en": "Lyon"}},
        {"name": {"zh": "新阿基坦", "en": "Nouvelle-Aquitaine"}, "population": 6033000, "capital": {"zh": "波尔多", "en": "Bordeaux"}},
        {"name": {"zh": "奥克西塔尼", "en": "Occitanie"}, "population": 5985000, "capital": {"zh": "图卢兹", "en": "Toulouse"}},
        {"name": {"zh": "上法兰西", "en": "Hauts-de-France"}, "population": 5998000, "capital": {"zh": "里尔", "en": "Lille"}},
        {"name": {"zh": "普罗旺斯-阿尔卑斯-蓝色海岸", "en": "Provence-Alpes-Côte d'Azur"}, "population": 5098000, "capital": {"zh": "马赛", "en": "Marseille"}},
        {"name": {"zh": "大东部", "en": "Grand Est"}, "population": 5560000, "capital": {"zh": "斯特拉斯堡", "en": "Strasbourg"}},
        {"name": {"zh": "卢瓦尔河地区", "en": "Pays de la Loire"}, "population": 3838000, "capital": {"zh": "南特", "en": "Nantes"}},
        {"name": {"zh": "布列塔尼", "en": "Brittany"}, "population": 3394000, "capital": {"zh": "雷恩", "en": "Rennes"}},
        {"name": {"zh": "诺曼底", "en": "Normandy"}, "population": 3325000, "capital": {"zh": "鲁昂", "en": "Rouen"}},
    ],
    "ai_uk": [
        {"name": {"zh": "英格兰", "en": "England"}, "population": 56490000, "capital": {"zh": "伦敦", "en": "London"}},
        {"name": {"zh": "苏格兰", "en": "Scotland"}, "population": 5480000, "capital": {"zh": "爱丁堡", "en": "Edinburgh"}},
        {"name": {"zh": "威尔士", "en": "Wales"}, "population": 3130000, "capital": {"zh": "加的夫", "en": "Cardiff"}},
        {"name": {"zh": "北爱尔兰", "en": "Northern Ireland"}, "population": 1900000, "capital": {"zh": "贝尔法斯特", "en": "Belfast"}},
    ],
    "ai_brazil": [
        {"name": {"zh": "圣保罗州", "en": "São Paulo"}, "population": 46289000, "capital": {"zh": "圣保罗", "en": "São Paulo"}},
        {"name": {"zh": "米纳斯吉拉斯州", "en": "Minas Gerais"}, "population": 21412000, "capital": {"zh": "贝洛奥里藏特", "en": "Belo Horizonte"}},
        {"name": {"zh": "里约热内卢州", "en": "Rio de Janeiro"}, "population": 17503000, "capital": {"zh": "里约热内卢", "en": "Rio de Janeiro"}},
        {"name": {"zh": "巴伊亚州", "en": "Bahia"}, "population": 14986000, "capital": {"zh": "萨尔瓦多", "en": "Salvador"}},
        {"name": {"zh": "巴拉那州", "en": "Paraná"}, "population": 11597000, "capital": {"zh": "库里蒂巴", "en": "Curitiba"}},
        {"name": {"zh": "南里奥格兰德州", "en": "Rio Grande do Sul"}, "population": 11467000, "capital": {"zh": "阿雷格里港", "en": "Porto Alegre"}},
        {"name": {"zh": "伯南布哥州", "en": "Pernambuco"}, "population": 9674000, "capital": {"zh": "累西腓", "en": "Recife"}},
        {"name": {"zh": "塞阿拉州", "en": "Ceará"}, "population": 9188000, "capital": {"zh": "福塔雷萨", "en": "Fortaleza"}},
    ],
    "ai_south_korea": [
        {"name": {"zh": "京畿道", "en": "Gyeonggi"}, "population": 13596000, "capital": {"zh": "水原", "en": "Suwon"}},
        {"name": {"zh": "首尔特别市", "en": "Seoul"}, "population": 9428000, "capital": {"zh": "首尔", "en": "Seoul"}},
        {"name": {"zh": "釜山广域市", "en": "Busan"}, "population": 3350000, "capital": {"zh": "釜山", "en": "Busan"}},
        {"name": {"zh": "庆尚南道", "en": "South Gyeongsang"}, "population": 3314000, "capital": {"zh": "昌原", "en": "Changwon"}},
        {"name": {"zh": "仁川广域市", "en": "Incheon"}, "population": 2980000, "capital": {"zh": "仁川", "en": "Incheon"}},
        {"name": {"zh": "庆尚北道", "en": "North Gyeongsang"}, "population": 2626000, "capital": {"zh": "安东", "en": "Andong"}},
        {"name": {"zh": "大邱广域市", "en": "Daegu"}, "population": 2385000, "capital": {"zh": "大邱", "en": "Daegu"}},
        {"name": {"zh": "忠清南道", "en": "South Chungcheong"}, "population": 2119000, "capital": {"zh": "洪城", "en": "Hongseong"}},
    ],
    "south_america_brazil": [
        {"name": {"zh": "圣保罗州", "en": "São Paulo"}, "population": 46289000, "capital": {"zh": "圣保罗", "en": "São Paulo"}},
        {"name": {"zh": "米纳斯吉拉斯州", "en": "Minas Gerais"}, "population": 21412000, "capital": {"zh": "贝洛奥里藏特", "en": "Belo Horizonte"}},
        {"name": {"zh": "里约热内卢州", "en": "Rio de Janeiro"}, "population": 17503000, "capital": {"zh": "里约热内卢", "en": "Rio de Janeiro"}},
        {"name": {"zh": "巴伊亚州", "en": "Bahia"}, "population": 14986000, "capital": {"zh": "萨尔瓦多", "en": "Salvador"}},
        {"name": {"zh": "巴拉那州", "en": "Paraná"}, "population": 11597000, "capital": {"zh": "库里蒂巴", "en": "Curitiba"}},
        {"name": {"zh": "南里奥格兰德州", "en": "Rio Grande do Sul"}, "population": 11467000, "capital": {"zh": "阿雷格里港", "en": "Porto Alegre"}},
        {"name": {"zh": "伯南布哥州", "en": "Pernambuco"}, "population": 9674000, "capital": {"zh": "累西腓", "en": "Recife"}},
        {"name": {"zh": "塞阿拉州", "en": "Ceará"}, "population": 9188000, "capital": {"zh": "福塔雷萨", "en": "Fortaleza"}},
    ],
    "north_america_canada": [
        {"name": {"zh": "安大略省", "en": "Ontario"}, "population": 15110000, "capital": {"zh": "多伦多", "en": "Toronto"}},
        {"name": {"zh": "魁北克省", "en": "Quebec"}, "population": 8815000, "capital": {"zh": "魁北克城", "en": "Quebec City"}},
        {"name": {"zh": "不列颠哥伦比亚省", "en": "British Columbia"}, "population": 5368000, "capital": {"zh": "维多利亚", "en": "Victoria"}},
        {"name": {"zh": "艾伯塔省", "en": "Alberta"}, "population": 4647000, "capital": {"zh": "埃德蒙顿", "en": "Edmonton"}},
        {"name": {"zh": "马尼托巴省", "en": "Manitoba"}, "population": 1432000, "capital": {"zh": "温尼伯", "en": "Winnipeg"}},
        {"name": {"zh": "萨斯喀彻温省", "en": "Saskatchewan"}, "population": 1214000, "capital": {"zh": "里贾纳", "en": "Regina"}},
    ],
    "north_america_mexico": [
        {"name": {"zh": "墨西哥州", "en": "State of Mexico"}, "population": 17427000, "capital": {"zh": "托卢卡", "en": "Toluca"}},
        {"name": {"zh": "墨西哥城", "en": "Mexico City"}, "population": 9210000, "capital": {"zh": "墨西哥城", "en": "Mexico City"}},
        {"name": {"zh": "哈利斯科州", "en": "Jalisco"}, "population": 8348000, "capital": {"zh": "瓜达拉哈拉", "en": "Guadalajara"}},
        {"name": {"zh": "韦拉克鲁斯州", "en": "Veracruz"}, "population": 8063000, "capital": {"zh": "哈拉帕", "en": "Xalapa"}},
        {"name": {"zh": "普埃布拉州", "en": "Puebla"}, "population": 6584000, "capital": {"zh": "普埃布拉", "en": "Puebla"}},
        {"name": {"zh": "瓜纳华托州", "en": "Guanajuato"}, "population": 6167000, "capital": {"zh": "瓜纳华托", "en": "Guanajuato"}},
        {"name": {"zh": "新莱昂州", "en": "Nuevo León"}, "population": 5785000, "capital": {"zh": "蒙特雷", "en": "Monterrey"}},
        {"name": {"zh": "奇瓦瓦州", "en": "Chihuahua"}, "population": 3742000, "capital": {"zh": "奇瓦瓦", "en": "Chihuahua"}},
    ],
    "ai_australia": [
        {"name": {"zh": "新南威尔士州", "en": "New South Wales"}, "population": 8166000, "capital": {"zh": "悉尼", "en": "Sydney"}},
        {"name": {"zh": "维多利亚州", "en": "Victoria"}, "population": 6614000, "capital": {"zh": "墨尔本", "en": "Melbourne"}},
        {"name": {"zh": "昆士兰州", "en": "Queensland"}, "population": 5322000, "capital": {"zh": "布里斯班", "en": "Brisbane"}},
        {"name": {"zh": "西澳大利亚州", "en": "Western Australia"}, "population": 2812000, "capital": {"zh": "珀斯", "en": "Perth"}},
        {"name": {"zh": "南澳大利亚州", "en": "South Australia"}, "population": 1821000, "capital": {"zh": "阿德莱德", "en": "Adelaide"}},
        {"name": {"zh": "首都领地", "en": "Australian Capital Territory"}, "population": 457000, "capital": {"zh": "堪培拉", "en": "Canberra"}},
    ],
    "ai_italy": [
        {"name": {"zh": "伦巴第", "en": "Lombardy"}, "population": 10019000, "capital": {"zh": "米兰", "en": "Milan"}},
        {"name": {"zh": "拉齐奥", "en": "Lazio"}, "population": 5730000, "capital": {"zh": "罗马", "en": "Rome"}},
        {"name": {"zh": "坎帕尼亚", "en": "Campania"}, "population": 5624000, "capital": {"zh": "那不勒斯", "en": "Naples"}},
        {"name": {"zh": "西西里", "en": "Sicily"}, "population": 4834000, "capital": {"zh": "巴勒莫", "en": "Palermo"}},
        {"name": {"zh": "威尼托", "en": "Veneto"}, "population": 4852000, "capital": {"zh": "威尼斯", "en": "Venice"}},
        {"name": {"zh": "艾米利亚-罗马涅", "en": "Emilia-Romagna"}, "population": 4438000, "capital": {"zh": "博洛尼亚", "en": "Bologna"}},
        {"name": {"zh": "皮埃蒙特", "en": "Piedmont"}, "population": 4256000, "capital": {"zh": "都灵", "en": "Turin"}},
        {"name": {"zh": "普利亚", "en": "Apulia"}, "population": 3900000, "capital": {"zh": "巴里", "en": "Bari"}},
        {"name": {"zh": "托斯卡纳", "en": "Tuscany"}, "population": 3692000, "capital": {"zh": "佛罗伦萨", "en": "Florence"}},
    ],
    "ai_spain": [
        {"name": {"zh": "安达卢西亚", "en": "Andalusia"}, "population": 8472000, "capital": {"zh": "塞维利亚", "en": "Seville"}},
        {"name": {"zh": "加泰罗尼亚", "en": "Catalonia"}, "population": 7763000, "capital": {"zh": "巴塞罗那", "en": "Barcelona"}},
        {"name": {"zh": "马德里自治区", "en": "Community of Madrid"}, "population": 6752000, "capital": {"zh": "马德里", "en": "Madrid"}},
        {"name": {"zh": "瓦伦西亚", "en": "Valencia"}, "population": 5058000, "capital": {"zh": "瓦伦西亚", "en": "Valencia"}},
        {"name": {"zh": "加利西亚", "en": "Galicia"}, "population": 2695000, "capital": {"zh": "圣地亚哥-德孔波斯特拉", "en": "Santiago de Compostela"}},
        {"name": {"zh": "巴斯克", "en": "Basque Country"}, "population": 2214000, "capital": {"zh": "维多利亚-加斯泰兹", "en": "Vitoria-Gasteiz"}},
    ],
    "ai_indonesia": [
        {"name": {"zh": "西爪哇省", "en": "West Java"}, "population": 49563000, "capital": {"zh": "万隆", "en": "Bandung"}},
        {"name": {"zh": "东爪哇省", "en": "East Java"}, "population": 40665000, "capital": {"zh": "泗水", "en": "Surabaya"}},
        {"name": {"zh": "中爪哇省", "en": "Central Java"}, "population": 36516000, "capital": {"zh": "三宝垄", "en": "Semarang"}},
        {"name": {"zh": "北苏门答腊省", "en": "North Sumatra"}, "population": 14799000, "capital": {"zh": "棉兰", "en": "Medan"}},
        {"name": {"zh": "万丹省", "en": "Banten"}, "population": 11904000, "capital": {"zh": "西冷", "en": "Serang"}},
        {"name": {"zh": "雅加达首都特区", "en": "Jakarta"}, "population": 10562000, "capital": {"zh": "雅加达", "en": "Jakarta"}},
        {"name": {"zh": "南苏拉威西省", "en": "South Sulawesi"}, "population": 9073000, "capital": {"zh": "望加锡", "en": "Makassar"}},
        {"name": {"zh": "南苏门答腊省", "en": "South Sumatra"}, "population": 8468000, "capital": {"zh": "巨港", "en": "Palembang"}},
    ],
    "ai_turkey": [
        {"name": {"zh": "伊斯坦布尔省", "en": "Istanbul"}, "population": 15908000, "capital": {"zh": "伊斯坦布尔", "en": "Istanbul"}},
        {"name": {"zh": "安卡拉省", "en": "Ankara"}, "population": 5747000, "capital": {"zh": "安卡拉", "en": "Ankara"}},
        {"name": {"zh": "伊兹密尔省", "en": "Izmir"}, "population": 4462000, "capital": {"zh": "伊兹密尔", "en": "Izmir"}},
        {"name": {"zh": "布尔萨省", "en": "Bursa"}, "population": 3147000, "capital": {"zh": "布尔萨", "en": "Bursa"}},
        {"name": {"zh": "安塔利亚省", "en": "Antalya"}, "population": 2619000, "capital": {"zh": "安塔利亚", "en": "Antalya"}},
        {"name": {"zh": "科尼亚省", "en": "Konya"}, "population": 2277000, "capital": {"zh": "科尼亚", "en": "Konya"}},
    ],
    "ai_egypt": [
        {"name": {"zh": "开罗省", "en": "Cairo"}, "population": 10025000, "capital": {"zh": "开罗", "en": "Cairo"}},
        {"name": {"zh": "吉萨省", "en": "Giza"}, "population": 9200000, "capital": {"zh": "吉萨", "en": "Giza"}},
        {"name": {"zh": "亚历山大省", "en": "Alexandria"}, "population": 7500000, "capital": {"zh": "亚历山大", "en": "Alexandria"}},
        {"name": {"zh": "达卡利亚省", "en": "Dakahlia"}, "population": 6800000, "capital": {"zh": "曼苏拉", "en": "Mansoura"}},
        {"name": {"zh": "沙基亚省", "en": "Sharqia"}, "population": 7700000, "capital": {"zh": "扎加齐格", "en": "Zagazig"}},
        {"name": {"zh": "盖卢比亚省", "en": "Qalyubia"}, "population": 5900000, "capital": {"zh": "本哈", "en": "Benha"}},
    ],
    "ai_nigeria": [
        {"name": {"zh": "拉各斯州", "en": "Lagos"}, "population": 15388000, "capital": {"zh": "伊凯贾", "en": "Ikeja"}},
        {"name": {"zh": "卡诺州", "en": "Kano"}, "population": 13077000, "capital": {"zh": "卡诺", "en": "Kano"}},
        {"name": {"zh": "河流州", "en": "Rivers"}, "population": 7304000, "capital": {"zh": "哈科特港", "en": "Port Harcourt"}},
        {"name": {"zh": "卡杜纳州", "en": "Kaduna"}, "population": 8252000, "capital": {"zh": "卡杜纳", "en": "Kaduna"}},
        {"name": {"zh": "奥贡州", "en": "Ogun"}, "population": 5218000, "capital": {"zh": "阿贝奥库塔", "en": "Abeokuta"}},
    ],
    "ai_poland": [
        {"name": {"zh": "马佐夫舍省", "en": "Masovia"}, "population": 5425000, "capital": {"zh": "华沙", "en": "Warsaw"}},
        {"name": {"zh": "西里西亚省", "en": "Silesia"}, "population": 4492000, "capital": {"zh": "卡托维兹", "en": "Katowice"}},
        {"name": {"zh": "大波兰省", "en": "Greater Poland"}, "population": 3498000, "capital": {"zh": "波兹南", "en": "Poznań"}},
        {"name": {"zh": "小波兰省", "en": "Lesser Poland"}, "population": 3410000, "capital": {"zh": "克拉科夫", "en": "Kraków"}},
        {"name": {"zh": "下西里西亚省", "en": "Lower Silesia"}, "population": 2891000, "capital": {"zh": "弗罗茨瓦夫", "en": "Wrocław"}},
        {"name": {"zh": "罗兹省", "en": "Łódź"}, "population": 2437000, "capital": {"zh": "罗兹", "en": "Łódź"}},
    ],
    "south_asia_pakistan": [
        {"name": {"zh": "旁遮普省", "en": "Punjab"}, "population": 127400000, "capital": {"zh": "拉合尔", "en": "Lahore"}},
        {"name": {"zh": "信德省", "en": "Sindh"}, "population": 55700000, "capital": {"zh": "卡拉奇", "en": "Karachi"}},
        {"name": {"zh": "开伯尔-普赫图赫瓦省", "en": "Khyber Pakhtunkhwa"}, "population": 40500000, "capital": {"zh": "白沙瓦", "en": "Peshawar"}},
        {"name": {"zh": "俾路支省", "en": "Balochistan"}, "population": 14900000, "capital": {"zh": "奎达", "en": "Quetta"}},
        {"name": {"zh": "伊斯兰堡首都区", "en": "Islamabad Capital Territory"}, "population": 2360000, "capital": {"zh": "伊斯兰堡", "en": "Islamabad"}},
    ],
    "ai_vietnam": [
        {"name": {"zh": "胡志明市", "en": "Ho Chi Minh City"}, "population": 9166000, "capital": {"zh": "胡志明市", "en": "Ho Chi Minh City"}},
        {"name": {"zh": "河内市", "en": "Hanoi"}, "population": 8246000, "capital": {"zh": "河内", "en": "Hanoi"}},
        {"name": {"zh": "同奈省", "en": "Dong Nai"}, "population": 3230000, "capital": {"zh": "边和", "en": "Bien Hoa"}},
        {"name": {"zh": "平阳省", "en": "Binh Duong"}, "population": 2596000, "capital": {"zh": "土龙木", "en": "Thu Dau Mot"}},
        {"name": {"zh": "清化省", "en": "Thanh Hoa"}, "population": 3641000, "capital": {"zh": "清化", "en": "Thanh Hoa"}},
        {"name": {"zh": "义安省", "en": "Nghe An"}, "population": 3327000, "capital": {"zh": "荣市", "en": "Vinh"}},
    ],
    "ai_thailand": [
        {"name": {"zh": "曼谷", "en": "Bangkok"}, "population": 5527000, "capital": {"zh": "曼谷", "en": "Bangkok"}},
        {"name": {"zh": "呵叻府", "en": "Nakhon Ratchasima"}, "population": 2634000, "capital": {"zh": "呵叻", "en": "Nakhon Ratchasima"}},
        {"name": {"zh": "乌汶府", "en": "Ubon Ratchathani"}, "population": 1878000, "capital": {"zh": "乌汶", "en": "Ubon Ratchathani"}},
        {"name": {"zh": "清迈府", "en": "Chiang Mai"}, "population": 1779000, "capital": {"zh": "清迈", "en": "Chiang Mai"}},
        {"name": {"zh": "孔敬府", "en": "Khon Kaen"}, "population": 1802000, "capital": {"zh": "孔敬", "en": "Khon Kaen"}},
    ],
    "ai_south_africa": [
        {"name": {"zh": "豪登省", "en": "Gauteng"}, "population": 15810000, "capital": {"zh": "约翰内斯堡", "en": "Johannesburg"}},
        {"name": {"zh": "夸祖鲁-纳塔尔省", "en": "KwaZulu-Natal"}, "population": 11513000, "capital": {"zh": "彼得马里茨堡", "en": "Pietermaritzburg"}},
        {"name": {"zh": "西开普省", "en": "Western Cape"}, "population": 7113000, "capital": {"zh": "开普敦", "en": "Cape Town"}},
        {"name": {"zh": "东开普省", "en": "Eastern Cape"}, "population": 6735000, "capital": {"zh": "比绍", "en": "Bhisho"}},
        {"name": {"zh": "林波波省", "en": "Limpopo"}, "population": 5853000, "capital": {"zh": "波罗瓜尼", "en": "Polokwane"}},
        {"name": {"zh": "普马兰加省", "en": "Mpumalanga"}, "population": 4679000, "capital": {"zh": "内尔斯普雷特", "en": "Mbombela"}},
    ],
    "ai_ukraine": [
        {"name": {"zh": "基辅市", "en": "Kyiv City"}, "population": 2952000, "capital": {"zh": "基辅", "en": "Kyiv"}},
        {"name": {"zh": "第聂伯罗彼得罗夫斯克州", "en": "Dnipropetrovsk Oblast"}, "population": 3177000, "capital": {"zh": "第聂伯", "en": "Dnipro"}},
        {"name": {"zh": "哈尔科夫州", "en": "Kharkiv Oblast"}, "population": 2658000, "capital": {"zh": "哈尔科夫", "en": "Kharkiv"}},
        {"name": {"zh": "敖德萨州", "en": "Odesa Oblast"}, "population": 2377000, "capital": {"zh": "敖德萨", "en": "Odesa"}},
        {"name": {"zh": "利沃夫州", "en": "Lviv Oblast"}, "population": 2497000, "capital": {"zh": "利沃夫", "en": "Lviv"}},
    ],
    "ai_iran": [
        {"name": {"zh": "德黑兰省", "en": "Tehran"}, "population": 14160000, "capital": {"zh": "德黑兰", "en": "Tehran"}},
        {"name": {"zh": "拉扎维呼罗珊省", "en": "Razavi Khorasan"}, "population": 6850000, "capital": {"zh": "马什哈德", "en": "Mashhad"}},
        {"name": {"zh": "伊斯法罕省", "en": "Isfahan"}, "population": 5325000, "capital": {"zh": "伊斯法罕", "en": "Isfahan"}},
        {"name": {"zh": "法尔斯省", "en": "Fars"}, "population": 4850000, "capital": {"zh": "设拉子", "en": "Shiraz"}},
        {"name": {"zh": "东阿塞拜疆省", "en": "East Azerbaijan"}, "population": 3910000, "capital": {"zh": "大不里士", "en": "Tabriz"}},
        {"name": {"zh": "霍齐斯坦省", "en": "Khuzestan"}, "population": 4710000, "capital": {"zh": "阿瓦士", "en": "Ahvaz"}},
    ],
    "ai_philippines": [
        {"name": {"zh": "马尼拉大都会", "en": "Metro Manila"}, "population": 13484000, "capital": {"zh": "马尼拉", "en": "Manila"}},
        {"name": {"zh": "甲拉巴松大区", "en": "CALABARZON"}, "population": 16195000, "capital": {"zh": "卡兰巴", "en": "Calamba"}},
        {"name": {"zh": "中央吕宋大区", "en": "Central Luzon"}, "population": 12422000, "capital": {"zh": "圣费尔南多", "en": "San Fernando"}},
        {"name": {"zh": "西米沙鄢大区", "en": "Western Visayas"}, "population": 7954000, "capital": {"zh": "伊洛伊洛", "en": "Iloilo City"}},
        {"name": {"zh": "达沃大区", "en": "Davao"}, "population": 5243000, "capital": {"zh": "达沃", "en": "Davao City"}},
    ],
}

# ── Subdivisions data for major modern countries (2000 census) ──
# Uses the region IDs from era-modern-era.json (year 2000)

SUBDIVISIONS_2000 = {
    "north_america_usa": [
        {"name": {"zh": "加利福尼亚州", "en": "California"}, "population": 33872000, "capital": {"zh": "萨克拉门托", "en": "Sacramento"}},
        {"name": {"zh": "得克萨斯州", "en": "Texas"}, "population": 20852000, "capital": {"zh": "奥斯汀", "en": "Austin"}},
        {"name": {"zh": "纽约州", "en": "New York"}, "population": 18976000, "capital": {"zh": "奥尔巴尼", "en": "Albany"}},
        {"name": {"zh": "佛罗里达州", "en": "Florida"}, "population": 15982000, "capital": {"zh": "塔拉哈西", "en": "Tallahassee"}},
        {"name": {"zh": "伊利诺伊州", "en": "Illinois"}, "population": 12419000, "capital": {"zh": "斯普林菲尔德", "en": "Springfield"}},
        {"name": {"zh": "宾夕法尼亚州", "en": "Pennsylvania"}, "population": 12281000, "capital": {"zh": "哈里斯堡", "en": "Harrisburg"}},
        {"name": {"zh": "俄亥俄州", "en": "Ohio"}, "population": 11353000, "capital": {"zh": "哥伦布", "en": "Columbus"}},
        {"name": {"zh": "密歇根州", "en": "Michigan"}, "population": 9938000, "capital": {"zh": "兰辛", "en": "Lansing"}},
        {"name": {"zh": "新泽西州", "en": "New Jersey"}, "population": 8414000, "capital": {"zh": "特伦顿", "en": "Trenton"}},
        {"name": {"zh": "佐治亚州", "en": "Georgia"}, "population": 8186000, "capital": {"zh": "亚特兰大", "en": "Atlanta"}},
        {"name": {"zh": "北卡罗来纳州", "en": "North Carolina"}, "population": 8049000, "capital": {"zh": "罗利", "en": "Raleigh"}},
        {"name": {"zh": "弗吉尼亚州", "en": "Virginia"}, "population": 7079000, "capital": {"zh": "里士满", "en": "Richmond"}},
        {"name": {"zh": "马萨诸塞州", "en": "Massachusetts"}, "population": 6349000, "capital": {"zh": "波士顿", "en": "Boston"}},
        {"name": {"zh": "华盛顿州", "en": "Washington"}, "population": 5894000, "capital": {"zh": "奥林匹亚", "en": "Olympia"}},
        {"name": {"zh": "亚利桑那州", "en": "Arizona"}, "population": 5131000, "capital": {"zh": "菲尼克斯", "en": "Phoenix"}},
    ],
    "modern_usa": [
        {"name": {"zh": "加利福尼亚州", "en": "California"}, "population": 33872000, "capital": {"zh": "萨克拉门托", "en": "Sacramento"}},
        {"name": {"zh": "得克萨斯州", "en": "Texas"}, "population": 20852000, "capital": {"zh": "奥斯汀", "en": "Austin"}},
        {"name": {"zh": "纽约州", "en": "New York"}, "population": 18976000, "capital": {"zh": "奥尔巴尼", "en": "Albany"}},
        {"name": {"zh": "佛罗里达州", "en": "Florida"}, "population": 15982000, "capital": {"zh": "塔拉哈西", "en": "Tallahassee"}},
        {"name": {"zh": "伊利诺伊州", "en": "Illinois"}, "population": 12419000, "capital": {"zh": "斯普林菲尔德", "en": "Springfield"}},
        {"name": {"zh": "宾夕法尼亚州", "en": "Pennsylvania"}, "population": 12281000, "capital": {"zh": "哈里斯堡", "en": "Harrisburg"}},
        {"name": {"zh": "俄亥俄州", "en": "Ohio"}, "population": 11353000, "capital": {"zh": "哥伦布", "en": "Columbus"}},
        {"name": {"zh": "密歇根州", "en": "Michigan"}, "population": 9938000, "capital": {"zh": "兰辛", "en": "Lansing"}},
        {"name": {"zh": "新泽西州", "en": "New Jersey"}, "population": 8414000, "capital": {"zh": "特伦顿", "en": "Trenton"}},
        {"name": {"zh": "佐治亚州", "en": "Georgia"}, "population": 8186000, "capital": {"zh": "亚特兰大", "en": "Atlanta"}},
        {"name": {"zh": "北卡罗来纳州", "en": "North Carolina"}, "population": 8049000, "capital": {"zh": "罗利", "en": "Raleigh"}},
        {"name": {"zh": "弗吉尼亚州", "en": "Virginia"}, "population": 7079000, "capital": {"zh": "里士满", "en": "Richmond"}},
        {"name": {"zh": "马萨诸塞州", "en": "Massachusetts"}, "population": 6349000, "capital": {"zh": "波士顿", "en": "Boston"}},
        {"name": {"zh": "华盛顿州", "en": "Washington"}, "population": 5894000, "capital": {"zh": "奥林匹亚", "en": "Olympia"}},
        {"name": {"zh": "亚利桑那州", "en": "Arizona"}, "population": 5131000, "capital": {"zh": "菲尼克斯", "en": "Phoenix"}},
    ],
    "east_asia_china_prc": [
        {"name": {"zh": "广东省", "en": "Guangdong"}, "population": 86420000, "capital": {"zh": "广州", "en": "Guangzhou"}},
        {"name": {"zh": "河南省", "en": "Henan"}, "population": 92560000, "capital": {"zh": "郑州", "en": "Zhengzhou"}},
        {"name": {"zh": "山东省", "en": "Shandong"}, "population": 90790000, "capital": {"zh": "济南", "en": "Jinan"}},
        {"name": {"zh": "四川省", "en": "Sichuan"}, "population": 83290000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "江苏省", "en": "Jiangsu"}, "population": 73630000, "capital": {"zh": "南京", "en": "Nanjing"}},
        {"name": {"zh": "河北省", "en": "Hebei"}, "population": 66840000, "capital": {"zh": "石家庄", "en": "Shijiazhuang"}},
        {"name": {"zh": "湖北省", "en": "Hubei"}, "population": 60280000, "capital": {"zh": "武汉", "en": "Wuhan"}},
        {"name": {"zh": "湖南省", "en": "Hunan"}, "population": 63280000, "capital": {"zh": "长沙", "en": "Changsha"}},
        {"name": {"zh": "安徽省", "en": "Anhui"}, "population": 59860000, "capital": {"zh": "合肥", "en": "Hefei"}},
        {"name": {"zh": "浙江省", "en": "Zhejiang"}, "population": 46770000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "广西壮族自治区", "en": "Guangxi"}, "population": 44890000, "capital": {"zh": "南宁", "en": "Nanning"}},
        {"name": {"zh": "云南省", "en": "Yunnan"}, "population": 42880000, "capital": {"zh": "昆明", "en": "Kunming"}},
        {"name": {"zh": "辽宁省", "en": "Liaoning"}, "population": 42380000, "capital": {"zh": "沈阳", "en": "Shenyang"}},
        {"name": {"zh": "江西省", "en": "Jiangxi"}, "population": 41400000, "capital": {"zh": "南昌", "en": "Nanchang"}},
        {"name": {"zh": "黑龙江省", "en": "Heilongjiang"}, "population": 36890000, "capital": {"zh": "哈尔滨", "en": "Harbin"}},
        {"name": {"zh": "陕西省", "en": "Shaanxi"}, "population": 36050000, "capital": {"zh": "西安", "en": "Xi'an"}},
        {"name": {"zh": "福建省", "en": "Fujian"}, "population": 34710000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "贵州省", "en": "Guizhou"}, "population": 35250000, "capital": {"zh": "贵阳", "en": "Guiyang"}},
        {"name": {"zh": "山西省", "en": "Shanxi"}, "population": 32970000, "capital": {"zh": "太原", "en": "Taiyuan"}},
        {"name": {"zh": "重庆市", "en": "Chongqing"}, "population": 30900000, "capital": {"zh": "重庆", "en": "Chongqing"}},
        {"name": {"zh": "吉林省", "en": "Jilin"}, "population": 27280000, "capital": {"zh": "长春", "en": "Changchun"}},
        {"name": {"zh": "甘肃省", "en": "Gansu"}, "population": 25620000, "capital": {"zh": "兰州", "en": "Lanzhou"}},
        {"name": {"zh": "内蒙古自治区", "en": "Inner Mongolia"}, "population": 23760000, "capital": {"zh": "呼和浩特", "en": "Hohhot"}},
        {"name": {"zh": "新疆维吾尔自治区", "en": "Xinjiang"}, "population": 19250000, "capital": {"zh": "乌鲁木齐", "en": "Urumqi"}},
        {"name": {"zh": "上海市", "en": "Shanghai"}, "population": 16740000, "capital": {"zh": "上海", "en": "Shanghai"}},
        {"name": {"zh": "北京市", "en": "Beijing"}, "population": 13820000, "capital": {"zh": "北京", "en": "Beijing"}},
        {"name": {"zh": "天津市", "en": "Tianjin"}, "population": 10010000, "capital": {"zh": "天津", "en": "Tianjin"}},
        {"name": {"zh": "海南省", "en": "Hainan"}, "population": 7870000, "capital": {"zh": "海口", "en": "Haikou"}},
        {"name": {"zh": "宁夏回族自治区", "en": "Ningxia"}, "population": 5620000, "capital": {"zh": "银川", "en": "Yinchuan"}},
        {"name": {"zh": "青海省", "en": "Qinghai"}, "population": 5180000, "capital": {"zh": "西宁", "en": "Xining"}},
        {"name": {"zh": "西藏自治区", "en": "Tibet"}, "population": 2620000, "capital": {"zh": "拉萨", "en": "Lhasa"}},
    ],
    "south_asia_india": [
        {"name": {"zh": "北方邦", "en": "Uttar Pradesh"}, "population": 166198000, "capital": {"zh": "勒克瑙", "en": "Lucknow"}},
        {"name": {"zh": "马哈拉施特拉邦", "en": "Maharashtra"}, "population": 96878000, "capital": {"zh": "孟买", "en": "Mumbai"}},
        {"name": {"zh": "比哈尔邦", "en": "Bihar"}, "population": 82999000, "capital": {"zh": "巴特那", "en": "Patna"}},
        {"name": {"zh": "西孟加拉邦", "en": "West Bengal"}, "population": 80176000, "capital": {"zh": "加尔各答", "en": "Kolkata"}},
        {"name": {"zh": "安得拉邦", "en": "Andhra Pradesh"}, "population": 76210000, "capital": {"zh": "海得拉巴", "en": "Hyderabad"}},
        {"name": {"zh": "泰米尔纳德邦", "en": "Tamil Nadu"}, "population": 62406000, "capital": {"zh": "金奈", "en": "Chennai"}},
        {"name": {"zh": "中央邦", "en": "Madhya Pradesh"}, "population": 60348000, "capital": {"zh": "博帕尔", "en": "Bhopal"}},
        {"name": {"zh": "拉贾斯坦邦", "en": "Rajasthan"}, "population": 56507000, "capital": {"zh": "斋浦尔", "en": "Jaipur"}},
        {"name": {"zh": "卡纳塔克邦", "en": "Karnataka"}, "population": 52851000, "capital": {"zh": "班加罗尔", "en": "Bengaluru"}},
        {"name": {"zh": "古吉拉特邦", "en": "Gujarat"}, "population": 50671000, "capital": {"zh": "甘地讷格尔", "en": "Gandhinagar"}},
        {"name": {"zh": "奥里萨邦", "en": "Odisha"}, "population": 36805000, "capital": {"zh": "布巴内什瓦尔", "en": "Bhubaneswar"}},
        {"name": {"zh": "喀拉拉邦", "en": "Kerala"}, "population": 31841000, "capital": {"zh": "特里凡得琅", "en": "Thiruvananthapuram"}},
        {"name": {"zh": "阿萨姆邦", "en": "Assam"}, "population": 26656000, "capital": {"zh": "迪斯布尔", "en": "Dispur"}},
        {"name": {"zh": "旁遮普邦", "en": "Punjab"}, "population": 24359000, "capital": {"zh": "昌迪加尔", "en": "Chandigarh"}},
        {"name": {"zh": "哈里亚纳邦", "en": "Haryana"}, "population": 21145000, "capital": {"zh": "昌迪加尔", "en": "Chandigarh"}},
    ],
    "east_asia_japan": [
        {"name": {"zh": "东京都", "en": "Tokyo"}, "population": 12064000, "capital": {"zh": "东京", "en": "Tokyo"}},
        {"name": {"zh": "大阪府", "en": "Osaka"}, "population": 8805000, "capital": {"zh": "大阪", "en": "Osaka"}},
        {"name": {"zh": "神奈川县", "en": "Kanagawa"}, "population": 8490000, "capital": {"zh": "横滨", "en": "Yokohama"}},
        {"name": {"zh": "爱知县", "en": "Aichi"}, "population": 7043000, "capital": {"zh": "名古屋", "en": "Nagoya"}},
        {"name": {"zh": "埼玉县", "en": "Saitama"}, "population": 6938000, "capital": {"zh": "埼玉", "en": "Saitama"}},
        {"name": {"zh": "千叶县", "en": "Chiba"}, "population": 5926000, "capital": {"zh": "千叶", "en": "Chiba"}},
        {"name": {"zh": "北海道", "en": "Hokkaido"}, "population": 5683000, "capital": {"zh": "札幌", "en": "Sapporo"}},
        {"name": {"zh": "兵库县", "en": "Hyogo"}, "population": 5551000, "capital": {"zh": "神户", "en": "Kobe"}},
        {"name": {"zh": "福冈县", "en": "Fukuoka"}, "population": 5016000, "capital": {"zh": "福冈", "en": "Fukuoka"}},
        {"name": {"zh": "静冈县", "en": "Shizuoka"}, "population": 3767000, "capital": {"zh": "静冈", "en": "Shizuoka"}},
    ],
    "south_asia_pakistan": [
        {"name": {"zh": "旁遮普省", "en": "Punjab"}, "population": 73621000, "capital": {"zh": "拉合尔", "en": "Lahore"}},
        {"name": {"zh": "信德省", "en": "Sindh"}, "population": 30440000, "capital": {"zh": "卡拉奇", "en": "Karachi"}},
        {"name": {"zh": "开伯尔-普赫图赫瓦省", "en": "Khyber Pakhtunkhwa"}, "population": 17744000, "capital": {"zh": "白沙瓦", "en": "Peshawar"}},
        {"name": {"zh": "俾路支省", "en": "Balochistan"}, "population": 6566000, "capital": {"zh": "奎达", "en": "Quetta"}},
        {"name": {"zh": "伊斯兰堡首都区", "en": "Islamabad Capital Territory"}, "population": 805000, "capital": {"zh": "伊斯兰堡", "en": "Islamabad"}},
    ],
    "south_america_brazil": [
        {"name": {"zh": "圣保罗州", "en": "São Paulo"}, "population": 37032000, "capital": {"zh": "圣保罗", "en": "São Paulo"}},
        {"name": {"zh": "米纳斯吉拉斯州", "en": "Minas Gerais"}, "population": 17892000, "capital": {"zh": "贝洛奥里藏特", "en": "Belo Horizonte"}},
        {"name": {"zh": "里约热内卢州", "en": "Rio de Janeiro"}, "population": 14391000, "capital": {"zh": "里约热内卢", "en": "Rio de Janeiro"}},
        {"name": {"zh": "巴伊亚州", "en": "Bahia"}, "population": 13071000, "capital": {"zh": "萨尔瓦多", "en": "Salvador"}},
        {"name": {"zh": "南里奥格兰德州", "en": "Rio Grande do Sul"}, "population": 10187000, "capital": {"zh": "阿雷格里港", "en": "Porto Alegre"}},
        {"name": {"zh": "巴拉那州", "en": "Paraná"}, "population": 9563000, "capital": {"zh": "库里蒂巴", "en": "Curitiba"}},
        {"name": {"zh": "伯南布哥州", "en": "Pernambuco"}, "population": 7919000, "capital": {"zh": "累西腓", "en": "Recife"}},
        {"name": {"zh": "塞阿拉州", "en": "Ceará"}, "population": 7431000, "capital": {"zh": "福塔雷萨", "en": "Fortaleza"}},
    ],
    "north_america_canada": [
        {"name": {"zh": "安大略省", "en": "Ontario"}, "population": 11410000, "capital": {"zh": "多伦多", "en": "Toronto"}},
        {"name": {"zh": "魁北克省", "en": "Quebec"}, "population": 7237000, "capital": {"zh": "魁北克城", "en": "Quebec City"}},
        {"name": {"zh": "不列颠哥伦比亚省", "en": "British Columbia"}, "population": 3907000, "capital": {"zh": "维多利亚", "en": "Victoria"}},
        {"name": {"zh": "艾伯塔省", "en": "Alberta"}, "population": 2974000, "capital": {"zh": "埃德蒙顿", "en": "Edmonton"}},
        {"name": {"zh": "马尼托巴省", "en": "Manitoba"}, "population": 1119000, "capital": {"zh": "温尼伯", "en": "Winnipeg"}},
        {"name": {"zh": "萨斯喀彻温省", "en": "Saskatchewan"}, "population": 978000, "capital": {"zh": "里贾纳", "en": "Regina"}},
    ],
    "north_america_mexico": [
        {"name": {"zh": "墨西哥州", "en": "State of Mexico"}, "population": 13097000, "capital": {"zh": "托卢卡", "en": "Toluca"}},
        {"name": {"zh": "墨西哥城", "en": "Mexico City"}, "population": 8605000, "capital": {"zh": "墨西哥城", "en": "Mexico City"}},
        {"name": {"zh": "韦拉克鲁斯州", "en": "Veracruz"}, "population": 6909000, "capital": {"zh": "哈拉帕", "en": "Xalapa"}},
        {"name": {"zh": "哈利斯科州", "en": "Jalisco"}, "population": 6322000, "capital": {"zh": "瓜达拉哈拉", "en": "Guadalajara"}},
        {"name": {"zh": "普埃布拉州", "en": "Puebla"}, "population": 5077000, "capital": {"zh": "普埃布拉", "en": "Puebla"}},
        {"name": {"zh": "瓜纳华托州", "en": "Guanajuato"}, "population": 4663000, "capital": {"zh": "瓜纳华托", "en": "Guanajuato"}},
        {"name": {"zh": "新莱昂州", "en": "Nuevo León"}, "population": 3835000, "capital": {"zh": "蒙特雷", "en": "Monterrey"}},
    ],
    "modern_russia": [
        {"name": {"zh": "莫斯科市", "en": "Moscow City"}, "population": 10126000, "capital": {"zh": "莫斯科", "en": "Moscow"}},
        {"name": {"zh": "莫斯科州", "en": "Moscow Oblast"}, "population": 6627000, "capital": {"zh": "莫斯科", "en": "Moscow"}},
        {"name": {"zh": "圣彼得堡市", "en": "Saint Petersburg"}, "population": 4662000, "capital": {"zh": "圣彼得堡", "en": "Saint Petersburg"}},
        {"name": {"zh": "克拉斯诺达尔边疆区", "en": "Krasnodar Krai"}, "population": 5125000, "capital": {"zh": "克拉斯诺达尔", "en": "Krasnodar"}},
        {"name": {"zh": "斯维尔德洛夫斯克州", "en": "Sverdlovsk Oblast"}, "population": 4486000, "capital": {"zh": "叶卡捷琳堡", "en": "Yekaterinburg"}},
        {"name": {"zh": "鞑靼斯坦共和国", "en": "Tatarstan"}, "population": 3779000, "capital": {"zh": "喀山", "en": "Kazan"}},
    ],
    "modern_germany": [
        {"name": {"zh": "北莱茵-威斯特法伦", "en": "North Rhine-Westphalia"}, "population": 18000000, "capital": {"zh": "杜塞尔多夫", "en": "Düsseldorf"}},
        {"name": {"zh": "巴伐利亚", "en": "Bavaria"}, "population": 12230000, "capital": {"zh": "慕尼黑", "en": "Munich"}},
        {"name": {"zh": "巴登-符腾堡", "en": "Baden-Württemberg"}, "population": 10524000, "capital": {"zh": "斯图加特", "en": "Stuttgart"}},
        {"name": {"zh": "下萨克森", "en": "Lower Saxony"}, "population": 7926000, "capital": {"zh": "汉诺威", "en": "Hanover"}},
        {"name": {"zh": "黑森", "en": "Hesse"}, "population": 6068000, "capital": {"zh": "威斯巴登", "en": "Wiesbaden"}},
        {"name": {"zh": "柏林", "en": "Berlin"}, "population": 3382000, "capital": {"zh": "柏林", "en": "Berlin"}},
    ],
    "modern_france": [
        {"name": {"zh": "法兰西岛", "en": "Île-de-France"}, "population": 11000000, "capital": {"zh": "巴黎", "en": "Paris"}},
        {"name": {"zh": "罗讷-阿尔卑斯", "en": "Rhône-Alpes"}, "population": 5646000, "capital": {"zh": "里昂", "en": "Lyon"}},
        {"name": {"zh": "普罗旺斯-阿尔卑斯-蓝色海岸", "en": "Provence-Alpes-Côte d'Azur"}, "population": 4506000, "capital": {"zh": "马赛", "en": "Marseille"}},
        {"name": {"zh": "北部-加来海峡", "en": "Nord-Pas-de-Calais"}, "population": 3997000, "capital": {"zh": "里尔", "en": "Lille"}},
        {"name": {"zh": "卢瓦尔河地区", "en": "Pays de la Loire"}, "population": 3222000, "capital": {"zh": "南特", "en": "Nantes"}},
        {"name": {"zh": "阿基坦", "en": "Aquitaine"}, "population": 2908000, "capital": {"zh": "波尔多", "en": "Bordeaux"}},
    ],
    "modern_uk": [
        {"name": {"zh": "英格兰", "en": "England"}, "population": 49139000, "capital": {"zh": "伦敦", "en": "London"}},
        {"name": {"zh": "苏格兰", "en": "Scotland"}, "population": 5063000, "capital": {"zh": "爱丁堡", "en": "Edinburgh"}},
        {"name": {"zh": "威尔士", "en": "Wales"}, "population": 2903000, "capital": {"zh": "加的夫", "en": "Cardiff"}},
        {"name": {"zh": "北爱尔兰", "en": "Northern Ireland"}, "population": 1686000, "capital": {"zh": "贝尔法斯特", "en": "Belfast"}},
    ],
    "modern_indonesia": [
        {"name": {"zh": "西爪哇省", "en": "West Java"}, "population": 35724000, "capital": {"zh": "万隆", "en": "Bandung"}},
        {"name": {"zh": "东爪哇省", "en": "East Java"}, "population": 34766000, "capital": {"zh": "泗水", "en": "Surabaya"}},
        {"name": {"zh": "中爪哇省", "en": "Central Java"}, "population": 31229000, "capital": {"zh": "三宝垄", "en": "Semarang"}},
        {"name": {"zh": "北苏门答腊省", "en": "North Sumatra"}, "population": 11649000, "capital": {"zh": "棉兰", "en": "Medan"}},
        {"name": {"zh": "雅加达首都特区", "en": "Jakarta"}, "population": 8384000, "capital": {"zh": "雅加达", "en": "Jakarta"}},
    ],
}

# ── Subdivisions data for major historical civilizations ──

SUBDIVISIONS_HISTORICAL = {
    # ── Roman Empire (various IDs across eras) ──
    "roman_empire": [
        {"name": {"zh": "意大利", "en": "Italia"}, "population": 7000000, "capital": {"zh": "罗马", "en": "Rome"}},
        {"name": {"zh": "高卢行省", "en": "Gallia"}, "population": 5000000, "capital": {"zh": "卢格杜努姆", "en": "Lugdunum"}},
        {"name": {"zh": "西班牙行省", "en": "Hispania"}, "population": 4000000, "capital": {"zh": "塔拉科", "en": "Tarraco"}},
        {"name": {"zh": "不列颠行省", "en": "Britannia"}, "population": 2000000, "capital": {"zh": "伦敦尼姆", "en": "Londinium"}},
        {"name": {"zh": "埃及行省", "en": "Aegyptus"}, "population": 5000000, "capital": {"zh": "亚历山大里亚", "en": "Alexandria"}},
        {"name": {"zh": "叙利亚行省", "en": "Syria"}, "population": 4000000, "capital": {"zh": "安条克", "en": "Antioch"}},
        {"name": {"zh": "小亚细亚行省", "en": "Asia"}, "population": 6000000, "capital": {"zh": "以弗所", "en": "Ephesus"}},
        {"name": {"zh": "阿非利加行省", "en": "Africa Proconsularis"}, "population": 3000000, "capital": {"zh": "迦太基", "en": "Carthage"}},
        {"name": {"zh": "达尔马提亚行省", "en": "Dalmatia"}, "population": 600000, "capital": {"zh": "萨洛纳", "en": "Salona"}},
        {"name": {"zh": "潘诺尼亚行省", "en": "Pannonia"}, "population": 800000, "capital": {"zh": "卡努恩图姆", "en": "Carnuntum"}},
        {"name": {"zh": "日耳曼行省", "en": "Germania"}, "population": 1200000, "capital": {"zh": "科隆", "en": "Colonia Agrippina"}},
        {"name": {"zh": "希腊行省", "en": "Achaea"}, "population": 2000000, "capital": {"zh": "科林斯", "en": "Corinth"}},
    ],
    "roman_empire_220": [
        {"name": {"zh": "意大利", "en": "Italia"}, "population": 6500000, "capital": {"zh": "罗马", "en": "Rome"}},
        {"name": {"zh": "高卢行省", "en": "Gallia"}, "population": 5500000, "capital": {"zh": "卢格杜努姆", "en": "Lugdunum"}},
        {"name": {"zh": "西班牙行省", "en": "Hispania"}, "population": 4500000, "capital": {"zh": "塔拉科", "en": "Tarraco"}},
        {"name": {"zh": "不列颠行省", "en": "Britannia"}, "population": 2500000, "capital": {"zh": "伦敦尼姆", "en": "Londinium"}},
        {"name": {"zh": "埃及行省", "en": "Aegyptus"}, "population": 5000000, "capital": {"zh": "亚历山大里亚", "en": "Alexandria"}},
        {"name": {"zh": "叙利亚行省", "en": "Syria"}, "population": 4000000, "capital": {"zh": "安条克", "en": "Antioch"}},
        {"name": {"zh": "小亚细亚行省", "en": "Asia"}, "population": 6000000, "capital": {"zh": "以弗所", "en": "Ephesus"}},
        {"name": {"zh": "阿非利加行省", "en": "Africa Proconsularis"}, "population": 3500000, "capital": {"zh": "迦太基", "en": "Carthage"}},
        {"name": {"zh": "希腊行省", "en": "Achaea"}, "population": 2000000, "capital": {"zh": "科林斯", "en": "Corinth"}},
        {"name": {"zh": "日耳曼行省", "en": "Germania"}, "population": 1500000, "capital": {"zh": "科隆", "en": "Colonia Agrippina"}},
    ],
    "eastern_roman_empire_476": [
        {"name": {"zh": "色雷斯", "en": "Thrace"}, "population": 2000000, "capital": {"zh": "君士坦丁堡", "en": "Constantinople"}},
        {"name": {"zh": "小亚细亚", "en": "Anatolia"}, "population": 8000000, "capital": {"zh": "尼科米底亚", "en": "Nicomedia"}},
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 4000000, "capital": {"zh": "安条克", "en": "Antioch"}},
        {"name": {"zh": "埃及", "en": "Egypt"}, "population": 5000000, "capital": {"zh": "亚历山大里亚", "en": "Alexandria"}},
        {"name": {"zh": "希腊", "en": "Greece"}, "population": 2000000, "capital": {"zh": "塞萨洛尼基", "en": "Thessalonica"}},
        {"name": {"zh": "巴尔干", "en": "Illyricum"}, "population": 1500000, "capital": {"zh": "塞尔迪卡", "en": "Serdica"}},
    ],
    "byzantine_empire": [
        {"name": {"zh": "色雷斯", "en": "Thrace"}, "population": 1500000, "capital": {"zh": "君士坦丁堡", "en": "Constantinople"}},
        {"name": {"zh": "小亚细亚", "en": "Anatolia"}, "population": 6000000, "capital": {"zh": "安卡拉", "en": "Ancyra"}},
        {"name": {"zh": "希腊", "en": "Greece"}, "population": 2000000, "capital": {"zh": "塞萨洛尼基", "en": "Thessalonica"}},
        {"name": {"zh": "南意大利", "en": "Southern Italy"}, "population": 1500000, "capital": {"zh": "巴里", "en": "Bari"}},
        {"name": {"zh": "克里特", "en": "Crete"}, "population": 300000, "capital": {"zh": "伊拉克利翁", "en": "Heraklion"}},
        {"name": {"zh": "塞浦路斯", "en": "Cyprus"}, "population": 200000, "capital": {"zh": "尼科西亚", "en": "Nicosia"}},
    ],
    # ── Han Dynasty ──
    "eastern_han": [
        {"name": {"zh": "司隶校尉部", "en": "Sili (Capital Region)"}, "population": 5000000, "capital": {"zh": "洛阳", "en": "Luoyang"}},
        {"name": {"zh": "豫州", "en": "Yuzhou"}, "population": 5600000, "capital": {"zh": "谯", "en": "Qiao"}},
        {"name": {"zh": "冀州", "en": "Jizhou"}, "population": 6000000, "capital": {"zh": "邺", "en": "Ye"}},
        {"name": {"zh": "兖州", "en": "Yanzhou"}, "population": 4000000, "capital": {"zh": "昌邑", "en": "Changyi"}},
        {"name": {"zh": "徐州", "en": "Xuzhou"}, "population": 3000000, "capital": {"zh": "下邳", "en": "Xiapi"}},
        {"name": {"zh": "青州", "en": "Qingzhou"}, "population": 3700000, "capital": {"zh": "临淄", "en": "Linzi"}},
        {"name": {"zh": "荆州", "en": "Jingzhou"}, "population": 6300000, "capital": {"zh": "襄阳", "en": "Xiangyang"}},
        {"name": {"zh": "扬州", "en": "Yangzhou"}, "population": 4300000, "capital": {"zh": "建业", "en": "Jianye"}},
        {"name": {"zh": "益州", "en": "Yizhou"}, "population": 7200000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "凉州", "en": "Liangzhou"}, "population": 500000, "capital": {"zh": "武威", "en": "Wuwei"}},
        {"name": {"zh": "幽州", "en": "Youzhou"}, "population": 2500000, "capital": {"zh": "蓟", "en": "Ji"}},
        {"name": {"zh": "并州", "en": "Bingzhou"}, "population": 700000, "capital": {"zh": "晋阳", "en": "Jinyang"}},
        {"name": {"zh": "交州", "en": "Jiaozhou"}, "population": 2000000, "capital": {"zh": "番禺", "en": "Panyu"}},
    ],
    # ── Tang Dynasty ──
    "tang_dynasty": [
        {"name": {"zh": "关内道", "en": "Guannei Circuit"}, "population": 5000000, "capital": {"zh": "长安", "en": "Chang'an"}},
        {"name": {"zh": "河南道", "en": "Henan Circuit"}, "population": 8000000, "capital": {"zh": "洛阳", "en": "Luoyang"}},
        {"name": {"zh": "河北道", "en": "Hebei Circuit"}, "population": 7000000, "capital": {"zh": "魏州", "en": "Weizhou"}},
        {"name": {"zh": "河东道", "en": "Hedong Circuit"}, "population": 3500000, "capital": {"zh": "太原", "en": "Taiyuan"}},
        {"name": {"zh": "山南道", "en": "Shannan Circuit"}, "population": 3000000, "capital": {"zh": "荆州", "en": "Jingzhou"}},
        {"name": {"zh": "陇右道", "en": "Longyou Circuit"}, "population": 1500000, "capital": {"zh": "鄯州", "en": "Shanzhou"}},
        {"name": {"zh": "淮南道", "en": "Huainan Circuit"}, "population": 4500000, "capital": {"zh": "扬州", "en": "Yangzhou"}},
        {"name": {"zh": "江南道", "en": "Jiangnan Circuit"}, "population": 7000000, "capital": {"zh": "苏州", "en": "Suzhou"}},
        {"name": {"zh": "剑南道", "en": "Jiannan Circuit"}, "population": 4000000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "岭南道", "en": "Lingnan Circuit"}, "population": 2500000, "capital": {"zh": "广州", "en": "Guangzhou"}},
    ],
    # ── Song Dynasty ──
    "southern_song": [
        {"name": {"zh": "两浙路", "en": "Liangzhe Circuit"}, "population": 10000000, "capital": {"zh": "临安", "en": "Lin'an"}},
        {"name": {"zh": "江南东路", "en": "Jiangnan East Circuit"}, "population": 5000000, "capital": {"zh": "建康", "en": "Jiankang"}},
        {"name": {"zh": "江南西路", "en": "Jiangnan West Circuit"}, "population": 4500000, "capital": {"zh": "洪州", "en": "Hongzhou"}},
        {"name": {"zh": "荆湖南路", "en": "Jinghu South Circuit"}, "population": 3800000, "capital": {"zh": "潭州", "en": "Tanzhou"}},
        {"name": {"zh": "荆湖北路", "en": "Jinghu North Circuit"}, "population": 3000000, "capital": {"zh": "江陵", "en": "Jiangling"}},
        {"name": {"zh": "福建路", "en": "Fujian Circuit"}, "population": 4500000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "成都府路", "en": "Chengdu Circuit"}, "population": 3500000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "广南东路", "en": "Guangnan East Circuit"}, "population": 2500000, "capital": {"zh": "广州", "en": "Guangzhou"}},
    ],
    # ── Yuan Dynasty ──
    "yuan_dynasty": [
        {"name": {"zh": "腹里（中书省直辖）", "en": "Central Secretariat"}, "population": 8000000, "capital": {"zh": "大都", "en": "Dadu"}},
        {"name": {"zh": "辽阳行省", "en": "Liaoyang Province"}, "population": 2000000, "capital": {"zh": "辽阳", "en": "Liaoyang"}},
        {"name": {"zh": "河南江北行省", "en": "Henan-Jiangbei Province"}, "population": 10000000, "capital": {"zh": "汴梁", "en": "Bianliang"}},
        {"name": {"zh": "江浙行省", "en": "Jiangzhe Province"}, "population": 15000000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "江西行省", "en": "Jiangxi Province"}, "population": 8000000, "capital": {"zh": "龙兴", "en": "Longxing"}},
        {"name": {"zh": "湖广行省", "en": "Huguang Province"}, "population": 6000000, "capital": {"zh": "武昌", "en": "Wuchang"}},
        {"name": {"zh": "四川行省", "en": "Sichuan Province"}, "population": 3000000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "云南行省", "en": "Yunnan Province"}, "population": 2000000, "capital": {"zh": "中庆", "en": "Zhongqing"}},
        {"name": {"zh": "陕西行省", "en": "Shaanxi Province"}, "population": 4000000, "capital": {"zh": "奉元", "en": "Fengyuan"}},
        {"name": {"zh": "甘肃行省", "en": "Gansu Province"}, "population": 1000000, "capital": {"zh": "甘州", "en": "Ganzhou"}},
    ],
    # ── Ming China ──
    "ming_china": [
        {"name": {"zh": "北直隶", "en": "Northern Zhili"}, "population": 8000000, "capital": {"zh": "北京", "en": "Beijing"}},
        {"name": {"zh": "南直隶", "en": "Southern Zhili"}, "population": 18000000, "capital": {"zh": "南京", "en": "Nanjing"}},
        {"name": {"zh": "浙江", "en": "Zhejiang"}, "population": 10000000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "江西", "en": "Jiangxi"}, "population": 8500000, "capital": {"zh": "南昌", "en": "Nanchang"}},
        {"name": {"zh": "湖广", "en": "Huguang"}, "population": 12000000, "capital": {"zh": "武昌", "en": "Wuchang"}},
        {"name": {"zh": "四川", "en": "Sichuan"}, "population": 6500000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "福建", "en": "Fujian"}, "population": 5000000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "广东", "en": "Guangdong"}, "population": 5500000, "capital": {"zh": "广州", "en": "Guangzhou"}},
        {"name": {"zh": "山东", "en": "Shandong"}, "population": 7500000, "capital": {"zh": "济南", "en": "Jinan"}},
        {"name": {"zh": "山西", "en": "Shanxi"}, "population": 4500000, "capital": {"zh": "太原", "en": "Taiyuan"}},
        {"name": {"zh": "河南", "en": "Henan"}, "population": 6000000, "capital": {"zh": "开封", "en": "Kaifeng"}},
        {"name": {"zh": "陕西", "en": "Shaanxi"}, "population": 4500000, "capital": {"zh": "西安", "en": "Xi'an"}},
        {"name": {"zh": "广西", "en": "Guangxi"}, "population": 2500000, "capital": {"zh": "桂林", "en": "Guilin"}},
        {"name": {"zh": "云南", "en": "Yunnan"}, "population": 3000000, "capital": {"zh": "昆明", "en": "Kunming"}},
        {"name": {"zh": "贵州", "en": "Guizhou"}, "population": 1500000, "capital": {"zh": "贵阳", "en": "Guiyang"}},
    ],
    # ── Qing Dynasty ──
    "qing_dynasty": [
        {"name": {"zh": "直隶", "en": "Zhili"}, "population": 25000000, "capital": {"zh": "保定", "en": "Baoding"}},
        {"name": {"zh": "江苏", "en": "Jiangsu"}, "population": 30000000, "capital": {"zh": "南京", "en": "Nanjing"}},
        {"name": {"zh": "浙江", "en": "Zhejiang"}, "population": 20000000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "安徽", "en": "Anhui"}, "population": 17000000, "capital": {"zh": "安庆", "en": "Anqing"}},
        {"name": {"zh": "江西", "en": "Jiangxi"}, "population": 15000000, "capital": {"zh": "南昌", "en": "Nanchang"}},
        {"name": {"zh": "湖北", "en": "Hubei"}, "population": 18000000, "capital": {"zh": "武昌", "en": "Wuchang"}},
        {"name": {"zh": "湖南", "en": "Hunan"}, "population": 16000000, "capital": {"zh": "长沙", "en": "Changsha"}},
        {"name": {"zh": "四川", "en": "Sichuan"}, "population": 40000000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "福建", "en": "Fujian"}, "population": 14000000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "广东", "en": "Guangdong"}, "population": 18000000, "capital": {"zh": "广州", "en": "Guangzhou"}},
        {"name": {"zh": "广西", "en": "Guangxi"}, "population": 6000000, "capital": {"zh": "桂林", "en": "Guilin"}},
        {"name": {"zh": "云南", "en": "Yunnan"}, "population": 7000000, "capital": {"zh": "昆明", "en": "Kunming"}},
        {"name": {"zh": "贵州", "en": "Guizhou"}, "population": 5000000, "capital": {"zh": "贵阳", "en": "Guiyang"}},
        {"name": {"zh": "山东", "en": "Shandong"}, "population": 25000000, "capital": {"zh": "济南", "en": "Jinan"}},
        {"name": {"zh": "山西", "en": "Shanxi"}, "population": 12000000, "capital": {"zh": "太原", "en": "Taiyuan"}},
        {"name": {"zh": "河南", "en": "Henan"}, "population": 20000000, "capital": {"zh": "开封", "en": "Kaifeng"}},
        {"name": {"zh": "陕西", "en": "Shaanxi"}, "population": 8000000, "capital": {"zh": "西安", "en": "Xi'an"}},
        {"name": {"zh": "甘肃", "en": "Gansu"}, "population": 5000000, "capital": {"zh": "兰州", "en": "Lanzhou"}},
    ],
    "qing_empire_1840": [
        {"name": {"zh": "直隶", "en": "Zhili"}, "population": 28000000, "capital": {"zh": "保定", "en": "Baoding"}},
        {"name": {"zh": "江苏", "en": "Jiangsu"}, "population": 36000000, "capital": {"zh": "南京", "en": "Nanjing"}},
        {"name": {"zh": "浙江", "en": "Zhejiang"}, "population": 26000000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "安徽", "en": "Anhui"}, "population": 22000000, "capital": {"zh": "安庆", "en": "Anqing"}},
        {"name": {"zh": "湖北", "en": "Hubei"}, "population": 21000000, "capital": {"zh": "武昌", "en": "Wuchang"}},
        {"name": {"zh": "四川", "en": "Sichuan"}, "population": 45000000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "广东", "en": "Guangdong"}, "population": 22000000, "capital": {"zh": "广州", "en": "Guangzhou"}},
        {"name": {"zh": "山东", "en": "Shandong"}, "population": 30000000, "capital": {"zh": "济南", "en": "Jinan"}},
        {"name": {"zh": "河南", "en": "Henan"}, "population": 24000000, "capital": {"zh": "开封", "en": "Kaifeng"}},
        {"name": {"zh": "福建", "en": "Fujian"}, "population": 18000000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "江西", "en": "Jiangxi"}, "population": 18000000, "capital": {"zh": "南昌", "en": "Nanchang"}},
        {"name": {"zh": "湖南", "en": "Hunan"}, "population": 20000000, "capital": {"zh": "长沙", "en": "Changsha"}},
        {"name": {"zh": "云南", "en": "Yunnan"}, "population": 9000000, "capital": {"zh": "昆明", "en": "Kunming"}},
        {"name": {"zh": "广西", "en": "Guangxi"}, "population": 8000000, "capital": {"zh": "桂林", "en": "Guilin"}},
        {"name": {"zh": "山西", "en": "Shanxi"}, "population": 15000000, "capital": {"zh": "太原", "en": "Taiyuan"}},
        {"name": {"zh": "陕西", "en": "Shaanxi"}, "population": 10000000, "capital": {"zh": "西安", "en": "Xi'an"}},
        {"name": {"zh": "甘肃", "en": "Gansu"}, "population": 6000000, "capital": {"zh": "兰州", "en": "Lanzhou"}},
        {"name": {"zh": "贵州", "en": "Guizhou"}, "population": 6000000, "capital": {"zh": "贵阳", "en": "Guiyang"}},
    ],
    "qing_empire_1900": [
        {"name": {"zh": "直隶", "en": "Zhili"}, "population": 30000000, "capital": {"zh": "保定", "en": "Baoding"}},
        {"name": {"zh": "江苏", "en": "Jiangsu"}, "population": 32000000, "capital": {"zh": "南京", "en": "Nanjing"}},
        {"name": {"zh": "浙江", "en": "Zhejiang"}, "population": 22000000, "capital": {"zh": "杭州", "en": "Hangzhou"}},
        {"name": {"zh": "安徽", "en": "Anhui"}, "population": 20000000, "capital": {"zh": "安庆", "en": "Anqing"}},
        {"name": {"zh": "湖北", "en": "Hubei"}, "population": 24000000, "capital": {"zh": "武昌", "en": "Wuchang"}},
        {"name": {"zh": "四川", "en": "Sichuan"}, "population": 50000000, "capital": {"zh": "成都", "en": "Chengdu"}},
        {"name": {"zh": "广东", "en": "Guangdong"}, "population": 28000000, "capital": {"zh": "广州", "en": "Guangzhou"}},
        {"name": {"zh": "山东", "en": "Shandong"}, "population": 36000000, "capital": {"zh": "济南", "en": "Jinan"}},
        {"name": {"zh": "河南", "en": "Henan"}, "population": 28000000, "capital": {"zh": "开封", "en": "Kaifeng"}},
        {"name": {"zh": "福建", "en": "Fujian"}, "population": 15000000, "capital": {"zh": "福州", "en": "Fuzhou"}},
        {"name": {"zh": "江西", "en": "Jiangxi"}, "population": 16000000, "capital": {"zh": "南昌", "en": "Nanchang"}},
        {"name": {"zh": "湖南", "en": "Hunan"}, "population": 22000000, "capital": {"zh": "长沙", "en": "Changsha"}},
    ],
    # ── Ottoman Empire (various IDs) ──
    "ottoman_empire": [
        {"name": {"zh": "鲁梅利亚", "en": "Rumelia"}, "population": 5000000, "capital": {"zh": "索非亚", "en": "Sofia"}},
        {"name": {"zh": "安纳托利亚", "en": "Anatolia"}, "population": 6000000, "capital": {"zh": "安卡拉", "en": "Ankara"}},
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 2000000, "capital": {"zh": "大马士革", "en": "Damascus"}},
        {"name": {"zh": "埃及", "en": "Egypt"}, "population": 3500000, "capital": {"zh": "开罗", "en": "Cairo"}},
        {"name": {"zh": "伊拉克", "en": "Iraq"}, "population": 1500000, "capital": {"zh": "巴格达", "en": "Baghdad"}},
        {"name": {"zh": "汉志", "en": "Hejaz"}, "population": 800000, "capital": {"zh": "麦加", "en": "Mecca"}},
        {"name": {"zh": "也门", "en": "Yemen"}, "population": 600000, "capital": {"zh": "萨那", "en": "Sana'a"}},
        {"name": {"zh": "的黎波里塔尼亚", "en": "Tripolitania"}, "population": 500000, "capital": {"zh": "的黎波里", "en": "Tripoli"}},
        {"name": {"zh": "突尼斯", "en": "Tunis"}, "population": 1000000, "capital": {"zh": "突尼斯", "en": "Tunis"}},
        {"name": {"zh": "希腊", "en": "Greece"}, "population": 1500000, "capital": {"zh": "雅典", "en": "Athens"}},
    ],
    "ottoman_empire_1648": [
        {"name": {"zh": "鲁梅利亚", "en": "Rumelia"}, "population": 6000000, "capital": {"zh": "索非亚", "en": "Sofia"}},
        {"name": {"zh": "安纳托利亚", "en": "Anatolia"}, "population": 8000000, "capital": {"zh": "安卡拉", "en": "Ankara"}},
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 2500000, "capital": {"zh": "大马士革", "en": "Damascus"}},
        {"name": {"zh": "埃及", "en": "Egypt"}, "population": 4000000, "capital": {"zh": "开罗", "en": "Cairo"}},
        {"name": {"zh": "伊拉克", "en": "Iraq"}, "population": 2000000, "capital": {"zh": "巴格达", "en": "Baghdad"}},
        {"name": {"zh": "汉志", "en": "Hejaz"}, "population": 1000000, "capital": {"zh": "麦加", "en": "Mecca"}},
        {"name": {"zh": "的黎波里塔尼亚", "en": "Tripolitania"}, "population": 600000, "capital": {"zh": "的黎波里", "en": "Tripoli"}},
        {"name": {"zh": "突尼斯", "en": "Tunis"}, "population": 1200000, "capital": {"zh": "突尼斯", "en": "Tunis"}},
        {"name": {"zh": "克里特", "en": "Crete"}, "population": 300000, "capital": {"zh": "伊拉克利翁", "en": "Heraklion"}},
        {"name": {"zh": "希腊", "en": "Greece"}, "population": 2000000, "capital": {"zh": "雅典", "en": "Athens"}},
        {"name": {"zh": "波斯尼亚", "en": "Bosnia"}, "population": 800000, "capital": {"zh": "萨拉热窝", "en": "Sarajevo"}},
    ],
    "ottoman_empire_1840": [
        {"name": {"zh": "鲁梅利亚", "en": "Rumelia"}, "population": 4000000, "capital": {"zh": "索非亚", "en": "Sofia"}},
        {"name": {"zh": "安纳托利亚", "en": "Anatolia"}, "population": 10000000, "capital": {"zh": "安卡拉", "en": "Ankara"}},
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 3000000, "capital": {"zh": "大马士革", "en": "Damascus"}},
        {"name": {"zh": "伊拉克", "en": "Iraq"}, "population": 2500000, "capital": {"zh": "巴格达", "en": "Baghdad"}},
        {"name": {"zh": "汉志", "en": "Hejaz"}, "population": 1200000, "capital": {"zh": "麦加", "en": "Mecca"}},
        {"name": {"zh": "阿尔巴尼亚", "en": "Albania"}, "population": 600000, "capital": {"zh": "地拉那", "en": "Tirana"}},
        {"name": {"zh": "波斯尼亚", "en": "Bosnia"}, "population": 1000000, "capital": {"zh": "萨拉热窝", "en": "Sarajevo"}},
    ],
    # ── Mughal Empire ──
    "mughal_empire": [
        {"name": {"zh": "德里苏巴", "en": "Subah of Delhi"}, "population": 8000000, "capital": {"zh": "德里", "en": "Delhi"}},
        {"name": {"zh": "孟加拉苏巴", "en": "Subah of Bengal"}, "population": 15000000, "capital": {"zh": "达卡", "en": "Dhaka"}},
        {"name": {"zh": "拉合尔苏巴", "en": "Subah of Lahore"}, "population": 5000000, "capital": {"zh": "拉合尔", "en": "Lahore"}},
        {"name": {"zh": "阿格拉苏巴", "en": "Subah of Agra"}, "population": 7000000, "capital": {"zh": "阿格拉", "en": "Agra"}},
        {"name": {"zh": "奥德苏巴", "en": "Subah of Awadh"}, "population": 6000000, "capital": {"zh": "勒克瑙", "en": "Lucknow"}},
        {"name": {"zh": "古吉拉特苏巴", "en": "Subah of Gujarat"}, "population": 5000000, "capital": {"zh": "艾哈迈达巴德", "en": "Ahmedabad"}},
        {"name": {"zh": "马尔瓦苏巴", "en": "Subah of Malwa"}, "population": 4000000, "capital": {"zh": "乌贾因", "en": "Ujjain"}},
        {"name": {"zh": "旁遮普苏巴", "en": "Subah of Punjab"}, "population": 3000000, "capital": {"zh": "锡尔辛德", "en": "Sirhind"}},
        {"name": {"zh": "比哈尔苏巴", "en": "Subah of Bihar"}, "population": 5000000, "capital": {"zh": "巴特那", "en": "Patna"}},
        {"name": {"zh": "克什米尔苏巴", "en": "Subah of Kashmir"}, "population": 800000, "capital": {"zh": "斯利那加", "en": "Srinagar"}},
        {"name": {"zh": "德干苏巴", "en": "Subah of Deccan"}, "population": 10000000, "capital": {"zh": "奥兰加巴德", "en": "Aurangabad"}},
        {"name": {"zh": "信德苏巴", "en": "Subah of Sindh"}, "population": 1500000, "capital": {"zh": "塔达", "en": "Thatta"}},
    ],
    "mughal_empire_1648": [
        {"name": {"zh": "德里苏巴", "en": "Subah of Delhi"}, "population": 9000000, "capital": {"zh": "德里", "en": "Delhi"}},
        {"name": {"zh": "孟加拉苏巴", "en": "Subah of Bengal"}, "population": 18000000, "capital": {"zh": "达卡", "en": "Dhaka"}},
        {"name": {"zh": "拉合尔苏巴", "en": "Subah of Lahore"}, "population": 6000000, "capital": {"zh": "拉合尔", "en": "Lahore"}},
        {"name": {"zh": "阿格拉苏巴", "en": "Subah of Agra"}, "population": 8000000, "capital": {"zh": "阿格拉", "en": "Agra"}},
        {"name": {"zh": "奥德苏巴", "en": "Subah of Awadh"}, "population": 7000000, "capital": {"zh": "勒克瑙", "en": "Lucknow"}},
        {"name": {"zh": "古吉拉特苏巴", "en": "Subah of Gujarat"}, "population": 6000000, "capital": {"zh": "艾哈迈达巴德", "en": "Ahmedabad"}},
        {"name": {"zh": "马尔瓦苏巴", "en": "Subah of Malwa"}, "population": 5000000, "capital": {"zh": "乌贾因", "en": "Ujjain"}},
        {"name": {"zh": "比哈尔苏巴", "en": "Subah of Bihar"}, "population": 6000000, "capital": {"zh": "巴特那", "en": "Patna"}},
        {"name": {"zh": "旁遮普苏巴", "en": "Subah of Punjab"}, "population": 4000000, "capital": {"zh": "锡尔辛德", "en": "Sirhind"}},
        {"name": {"zh": "德干苏巴", "en": "Subah of Deccan"}, "population": 12000000, "capital": {"zh": "奥兰加巴德", "en": "Aurangabad"}},
        {"name": {"zh": "克什米尔苏巴", "en": "Subah of Kashmir"}, "population": 1000000, "capital": {"zh": "斯利那加", "en": "Srinagar"}},
        {"name": {"zh": "信德苏巴", "en": "Subah of Sindh"}, "population": 2000000, "capital": {"zh": "塔达", "en": "Thatta"}},
    ],
    # ── Abbasid Caliphate ──
    "abbasid_caliphate": [
        {"name": {"zh": "伊拉克", "en": "Iraq"}, "population": 4000000, "capital": {"zh": "巴格达", "en": "Baghdad"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 5000000, "capital": {"zh": "尼沙布尔", "en": "Nishapur"}},
        {"name": {"zh": "波斯", "en": "Fars"}, "population": 3000000, "capital": {"zh": "设拉子", "en": "Shiraz"}},
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 3000000, "capital": {"zh": "大马士革", "en": "Damascus"}},
        {"name": {"zh": "贾兹拉", "en": "Jazira"}, "population": 2000000, "capital": {"zh": "摩苏尔", "en": "Mosul"}},
    ],
    "umayyad_caliphate": [
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 3500000, "capital": {"zh": "大马士革", "en": "Damascus"}},
        {"name": {"zh": "伊拉克", "en": "Iraq"}, "population": 4000000, "capital": {"zh": "库法", "en": "Kufa"}},
        {"name": {"zh": "埃及", "en": "Egypt"}, "population": 4000000, "capital": {"zh": "福斯塔特", "en": "Fustat"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 5000000, "capital": {"zh": "梅尔夫", "en": "Merv"}},
        {"name": {"zh": "马格里布", "en": "Maghreb"}, "population": 3000000, "capital": {"zh": "凯鲁万", "en": "Kairouan"}},
        {"name": {"zh": "安达卢斯", "en": "Al-Andalus"}, "population": 2000000, "capital": {"zh": "科尔多巴", "en": "Córdoba"}},
        {"name": {"zh": "希贾兹", "en": "Hejaz"}, "population": 800000, "capital": {"zh": "麦加", "en": "Mecca"}},
    ],
    # ── Maurya Empire ──
    "maurya_empire_221_bce": [
        {"name": {"zh": "摩揭陀", "en": "Magadha"}, "population": 8000000, "capital": {"zh": "华氏城", "en": "Pataliputra"}},
        {"name": {"zh": "犍陀罗", "en": "Gandhara"}, "population": 2000000, "capital": {"zh": "塔克西拉", "en": "Taxila"}},
        {"name": {"zh": "阿般提", "en": "Avanti"}, "population": 3000000, "capital": {"zh": "乌贾因", "en": "Ujjain"}},
        {"name": {"zh": "卡林加", "en": "Kalinga"}, "population": 2500000, "capital": {"zh": "陀里", "en": "Tosali"}},
        {"name": {"zh": "达克希那帕塔", "en": "Dakshinapatha"}, "population": 5000000, "capital": {"zh": "素万那", "en": "Suvarnagiri"}},
    ],
    # ── Seleucid Empire ──
    "seleucid_empire_221_bce": [
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 3000000, "capital": {"zh": "安条克", "en": "Antioch"}},
        {"name": {"zh": "美索不达米亚", "en": "Mesopotamia"}, "population": 3500000, "capital": {"zh": "塞琉西亚", "en": "Seleucia"}},
        {"name": {"zh": "米底亚", "en": "Media"}, "population": 2000000, "capital": {"zh": "埃克巴坦那", "en": "Ecbatana"}},
        {"name": {"zh": "波斯本土", "en": "Persis"}, "population": 1500000, "capital": {"zh": "波斯波利斯", "en": "Persepolis"}},
        {"name": {"zh": "巴克特里亚", "en": "Bactria"}, "population": 2000000, "capital": {"zh": "巴克特拉", "en": "Bactra"}},
    ],
    # ── Achaemenid / Persian Empire ──
    "achaemenid_empire_500bce": [
        {"name": {"zh": "波斯本土", "en": "Persis"}, "population": 2000000, "capital": {"zh": "波斯波利斯", "en": "Persepolis"}},
        {"name": {"zh": "米底亚", "en": "Media"}, "population": 3000000, "capital": {"zh": "埃克巴坦那", "en": "Ecbatana"}},
        {"name": {"zh": "巴比伦尼亚", "en": "Babylonia"}, "population": 4000000, "capital": {"zh": "巴比伦", "en": "Babylon"}},
        {"name": {"zh": "埃及", "en": "Egypt"}, "population": 4000000, "capital": {"zh": "孟菲斯", "en": "Memphis"}},
        {"name": {"zh": "吕底亚", "en": "Lydia"}, "population": 2000000, "capital": {"zh": "萨迪斯", "en": "Sardis"}},
        {"name": {"zh": "巴克特里亚", "en": "Bactria"}, "population": 2000000, "capital": {"zh": "巴克特拉", "en": "Bactra"}},
        {"name": {"zh": "犍陀罗", "en": "Gandhara"}, "population": 1500000, "capital": {"zh": "塔克西拉", "en": "Taxila"}},
        {"name": {"zh": "阿拉霍西亚", "en": "Arachosia"}, "population": 800000, "capital": {"zh": "坎大哈", "en": "Kandahar"}},
        {"name": {"zh": "索格底亚那", "en": "Sogdiana"}, "population": 1000000, "capital": {"zh": "撒马尔罕", "en": "Samarkand"}},
    ],
    # ── Mongol / Golden Horde / Ilkhanate ──
    "golden_horde": [
        {"name": {"zh": "钦察草原", "en": "Kipchak Steppe"}, "population": 3000000, "capital": {"zh": "萨莱", "en": "Sarai"}},
        {"name": {"zh": "保加尔", "en": "Bulgar"}, "population": 1000000, "capital": {"zh": "保加尔", "en": "Bulgar"}},
        {"name": {"zh": "克里米亚", "en": "Crimea"}, "population": 500000, "capital": {"zh": "苏达克", "en": "Sudak"}},
        {"name": {"zh": "花剌子模", "en": "Khwarazm"}, "population": 1500000, "capital": {"zh": "乌尔根奇", "en": "Urgench"}},
        {"name": {"zh": "罗斯附庸", "en": "Rus' Vassals"}, "population": 5000000, "capital": {"zh": "弗拉基米尔", "en": "Vladimir"}},
    ],
    "ilkhanate": [
        {"name": {"zh": "伊拉克-阿拉伯", "en": "Iraq-e Arab"}, "population": 2000000, "capital": {"zh": "巴格达", "en": "Baghdad"}},
        {"name": {"zh": "伊拉克-阿贾姆", "en": "Iraq-e Ajam"}, "population": 2500000, "capital": {"zh": "伊斯法罕", "en": "Isfahan"}},
        {"name": {"zh": "法尔斯", "en": "Fars"}, "population": 2000000, "capital": {"zh": "设拉子", "en": "Shiraz"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 3000000, "capital": {"zh": "图斯", "en": "Tus"}},
        {"name": {"zh": "阿塞拜疆", "en": "Azerbaijan"}, "population": 1500000, "capital": {"zh": "大不里士", "en": "Tabriz"}},
        {"name": {"zh": "安纳托利亚", "en": "Anatolia"}, "population": 3000000, "capital": {"zh": "科尼亚", "en": "Konya"}},
    ],
    # ── Safavid Iran ──
    "safavid_iran": [
        {"name": {"zh": "阿塞拜疆", "en": "Azerbaijan"}, "population": 1500000, "capital": {"zh": "大不里士", "en": "Tabriz"}},
        {"name": {"zh": "伊拉克-阿贾姆", "en": "Iraq-e Ajam"}, "population": 2000000, "capital": {"zh": "伊斯法罕", "en": "Isfahan"}},
        {"name": {"zh": "法尔斯", "en": "Fars"}, "population": 1500000, "capital": {"zh": "设拉子", "en": "Shiraz"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 2500000, "capital": {"zh": "马什哈德", "en": "Mashhad"}},
        {"name": {"zh": "克尔曼", "en": "Kerman"}, "population": 500000, "capital": {"zh": "克尔曼", "en": "Kerman"}},
        {"name": {"zh": "胡齐斯坦", "en": "Khuzestan"}, "population": 800000, "capital": {"zh": "舒什塔尔", "en": "Shushtar"}},
        {"name": {"zh": "吉兰", "en": "Gilan"}, "population": 600000, "capital": {"zh": "拉什特", "en": "Rasht"}},
    ],
    # ── Kushan Empire ──
    "kushan_empire": [
        {"name": {"zh": "巴克特里亚", "en": "Bactria"}, "population": 2000000, "capital": {"zh": "巴尔赫", "en": "Balkh"}},
        {"name": {"zh": "犍陀罗", "en": "Gandhara"}, "population": 2500000, "capital": {"zh": "布路沙布逻", "en": "Purushapura"}},
        {"name": {"zh": "索格底亚那", "en": "Sogdiana"}, "population": 1000000, "capital": {"zh": "撒马尔罕", "en": "Samarkand"}},
        {"name": {"zh": "北印度平原", "en": "Northern Plains"}, "population": 5000000, "capital": {"zh": "马图拉", "en": "Mathura"}},
    ],
    # ── Sasanian Empire ──
    "sasanian_empire_220": [
        {"name": {"zh": "波斯本土", "en": "Persis"}, "population": 2000000, "capital": {"zh": "伊斯塔赫尔", "en": "Istakhr"}},
        {"name": {"zh": "美索不达米亚", "en": "Mesopotamia"}, "population": 3000000, "capital": {"zh": "泰西封", "en": "Ctesiphon"}},
        {"name": {"zh": "米底亚", "en": "Media"}, "population": 2000000, "capital": {"zh": "哈马丹", "en": "Hamadan"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 2500000, "capital": {"zh": "梅尔夫", "en": "Merv"}},
        {"name": {"zh": "胡齐斯坦", "en": "Khuzestan"}, "population": 1500000, "capital": {"zh": "贡迪沙普尔", "en": "Gundeshapur"}},
        {"name": {"zh": "阿塞拜疆", "en": "Azerbaijan"}, "population": 1000000, "capital": {"zh": "甘扎克", "en": "Ganzak"}},
    ],
    "sasanian_empire_476": [
        {"name": {"zh": "波斯本土", "en": "Persis"}, "population": 2000000, "capital": {"zh": "伊斯塔赫尔", "en": "Istakhr"}},
        {"name": {"zh": "美索不达米亚", "en": "Mesopotamia"}, "population": 3000000, "capital": {"zh": "泰西封", "en": "Ctesiphon"}},
        {"name": {"zh": "米底亚", "en": "Media"}, "population": 2000000, "capital": {"zh": "哈马丹", "en": "Hamadan"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 2500000, "capital": {"zh": "梅尔夫", "en": "Merv"}},
        {"name": {"zh": "胡齐斯坦", "en": "Khuzestan"}, "population": 1500000, "capital": {"zh": "贡迪沙普尔", "en": "Gundeshapur"}},
        {"name": {"zh": "阿塞拜疆", "en": "Azerbaijan"}, "population": 1200000, "capital": {"zh": "甘扎克", "en": "Ganzak"}},
    ],
    # ── Gupta Empire ──
    "gupta_empire_476": [
        {"name": {"zh": "摩揭陀", "en": "Magadha"}, "population": 5000000, "capital": {"zh": "华氏城", "en": "Pataliputra"}},
        {"name": {"zh": "北方平原", "en": "Northern Plains"}, "population": 8000000, "capital": {"zh": "阿约提亚", "en": "Ayodhya"}},
        {"name": {"zh": "马尔瓦", "en": "Malwa"}, "population": 3000000, "capital": {"zh": "乌贾因", "en": "Ujjain"}},
        {"name": {"zh": "孟加拉", "en": "Bengal"}, "population": 4000000, "capital": {"zh": "普恩德拉瓦尔达纳", "en": "Pundravardhana"}},
    ],
    # ── Holy Roman Empire (various eras) ──
    "holy_roman_empire": [
        {"name": {"zh": "萨克森", "en": "Saxony"}, "population": 1500000, "capital": {"zh": "维滕贝格", "en": "Wittenberg"}},
        {"name": {"zh": "巴伐利亚", "en": "Bavaria"}, "population": 2000000, "capital": {"zh": "慕尼黑", "en": "Munich"}},
        {"name": {"zh": "奥地利", "en": "Austria"}, "population": 2500000, "capital": {"zh": "维也纳", "en": "Vienna"}},
        {"name": {"zh": "勃兰登堡", "en": "Brandenburg"}, "population": 800000, "capital": {"zh": "柏林", "en": "Berlin"}},
        {"name": {"zh": "波西米亚", "en": "Bohemia"}, "population": 3000000, "capital": {"zh": "布拉格", "en": "Prague"}},
        {"name": {"zh": "莱茵兰", "en": "Rhineland"}, "population": 2000000, "capital": {"zh": "科隆", "en": "Cologne"}},
        {"name": {"zh": "士瓦本", "en": "Swabia"}, "population": 1500000, "capital": {"zh": "奥格斯堡", "en": "Augsburg"}},
    ],
    # ── Delhi Sultanate ──
    "delhi_sultanate": [
        {"name": {"zh": "德里", "en": "Delhi"}, "population": 5000000, "capital": {"zh": "德里", "en": "Delhi"}},
        {"name": {"zh": "旁遮普", "en": "Punjab"}, "population": 3000000, "capital": {"zh": "拉合尔", "en": "Lahore"}},
        {"name": {"zh": "古吉拉特", "en": "Gujarat"}, "population": 4000000, "capital": {"zh": "艾哈迈达巴德", "en": "Ahmedabad"}},
        {"name": {"zh": "孟加拉", "en": "Bengal"}, "population": 6000000, "capital": {"zh": "拉赫瑙蒂", "en": "Lakhnauti"}},
        {"name": {"zh": "马尔瓦", "en": "Malwa"}, "population": 3000000, "capital": {"zh": "乌贾因", "en": "Ujjain"}},
        {"name": {"zh": "德干", "en": "Deccan"}, "population": 5000000, "capital": {"zh": "道拉塔巴德", "en": "Daulatabad"}},
    ],
    # ── Ptolemaic Egypt ──
    "ptolemaic_egypt_221_bce": [
        {"name": {"zh": "下埃及", "en": "Lower Egypt"}, "population": 3000000, "capital": {"zh": "亚历山大里亚", "en": "Alexandria"}},
        {"name": {"zh": "上埃及", "en": "Upper Egypt"}, "population": 2500000, "capital": {"zh": "底比斯", "en": "Thebes"}},
        {"name": {"zh": "法尤姆", "en": "Fayum"}, "population": 800000, "capital": {"zh": "克罗科迪洛波利斯", "en": "Crocodilopolis"}},
        {"name": {"zh": "昔兰尼加", "en": "Cyrenaica"}, "population": 400000, "capital": {"zh": "昔兰尼", "en": "Cyrene"}},
    ],
    # ── Khmer Empire ──
    "khmer_empire": [
        {"name": {"zh": "吴哥核心区", "en": "Angkor Core"}, "population": 1000000, "capital": {"zh": "吴哥", "en": "Angkor"}},
        {"name": {"zh": "暹粒地区", "en": "Siem Reap Region"}, "population": 500000, "capital": {"zh": "暹粒", "en": "Siem Reap"}},
        {"name": {"zh": "磅湛", "en": "Kampong Cham"}, "population": 400000, "capital": {"zh": "磅湛", "en": "Kampong Cham"}},
        {"name": {"zh": "马德望", "en": "Battambang"}, "population": 300000, "capital": {"zh": "马德望", "en": "Battambang"}},
        {"name": {"zh": "洞里萨湖区", "en": "Tonle Sap Region"}, "population": 600000, "capital": {"zh": "磅通", "en": "Kampong Thom"}},
    ],
    # ── Mali Empire ──
    "mali_empire": [
        {"name": {"zh": "尼阿尼核心", "en": "Niani Core"}, "population": 1500000, "capital": {"zh": "尼阿尼", "en": "Niani"}},
        {"name": {"zh": "廷巴克图地区", "en": "Timbuktu Region"}, "population": 500000, "capital": {"zh": "廷巴克图", "en": "Timbuktu"}},
        {"name": {"zh": "杰内地区", "en": "Jenne Region"}, "population": 600000, "capital": {"zh": "杰内", "en": "Jenne"}},
        {"name": {"zh": "加奥地区", "en": "Gao Region"}, "population": 400000, "capital": {"zh": "加奥", "en": "Gao"}},
        {"name": {"zh": "塞内加尔河地区", "en": "Senegal River Region"}, "population": 800000, "capital": {"zh": "塔克鲁尔", "en": "Takrur"}},
    ],
    # ── Inca Empire ──
    "inca_empire": [
        {"name": {"zh": "库斯科区", "en": "Cusco District"}, "population": 2000000, "capital": {"zh": "库斯科", "en": "Cusco"}},
        {"name": {"zh": "钦察苏尤（北区）", "en": "Chinchaysuyu"}, "population": 3000000, "capital": {"zh": "通贝斯", "en": "Tumbes"}},
        {"name": {"zh": "安蒂苏尤（东区）", "en": "Antisuyu"}, "population": 1000000, "capital": {"zh": "皮尔科帕塔", "en": "Pilcopata"}},
        {"name": {"zh": "昆蒂苏尤（西区）", "en": "Cuntisuyu"}, "population": 1500000, "capital": {"zh": "阿雷基帕", "en": "Arequipa"}},
        {"name": {"zh": "科利亚苏尤（南区）", "en": "Collasuyu"}, "population": 2500000, "capital": {"zh": "科帕卡巴纳", "en": "Copacabana"}},
    ],
    # ── Aztec Empire ──
    "aztec_empire": [
        {"name": {"zh": "特诺奇蒂特兰", "en": "Tenochtitlan"}, "population": 200000, "capital": {"zh": "特诺奇蒂特兰", "en": "Tenochtitlan"}},
        {"name": {"zh": "特斯科科", "en": "Texcoco"}, "population": 150000, "capital": {"zh": "特斯科科", "en": "Texcoco"}},
        {"name": {"zh": "特拉科潘", "en": "Tlacopan"}, "population": 100000, "capital": {"zh": "特拉科潘", "en": "Tlacopan"}},
        {"name": {"zh": "特拉斯卡拉进贡区", "en": "Tribute Provinces"}, "population": 4000000, "capital": {"zh": "各省进贡城镇", "en": "Various tribute towns"}},
    ],
    # ── Parthian Empire ──
    "parthian_empire": [
        {"name": {"zh": "美索不达米亚", "en": "Mesopotamia"}, "population": 3000000, "capital": {"zh": "泰西封", "en": "Ctesiphon"}},
        {"name": {"zh": "米底亚", "en": "Media"}, "population": 2000000, "capital": {"zh": "埃克巴坦那", "en": "Ecbatana"}},
        {"name": {"zh": "帕提亚本土", "en": "Parthia Proper"}, "population": 1500000, "capital": {"zh": "赫卡通皮洛斯", "en": "Hecatompylos"}},
        {"name": {"zh": "呼罗珊", "en": "Khorasan"}, "population": 2000000, "capital": {"zh": "梅尔夫", "en": "Merv"}},
        {"name": {"zh": "波斯本土", "en": "Persis"}, "population": 1500000, "capital": {"zh": "波斯波利斯", "en": "Persepolis"}},
        {"name": {"zh": "胡齐斯坦", "en": "Khuzestan"}, "population": 1000000, "capital": {"zh": "苏萨", "en": "Susa"}},
    ],
    # ── Mamluk Sultanate ──
    "mamluk_sultanate": [
        {"name": {"zh": "埃及", "en": "Egypt"}, "population": 4500000, "capital": {"zh": "开罗", "en": "Cairo"}},
        {"name": {"zh": "叙利亚", "en": "Syria"}, "population": 2500000, "capital": {"zh": "大马士革", "en": "Damascus"}},
        {"name": {"zh": "汉志", "en": "Hejaz"}, "population": 800000, "capital": {"zh": "麦加", "en": "Mecca"}},
        {"name": {"zh": "巴勒斯坦", "en": "Palestine"}, "population": 500000, "capital": {"zh": "耶路撒冷", "en": "Jerusalem"}},
    ],
    # ── Tokugawa Shogunate / Muromachi Japan ──
    "tokugawa_shogunate": [
        {"name": {"zh": "关东（江户）", "en": "Kanto (Edo)"}, "population": 4000000, "capital": {"zh": "江户", "en": "Edo"}},
        {"name": {"zh": "近畿", "en": "Kinki"}, "population": 5000000, "capital": {"zh": "大坂", "en": "Osaka"}},
        {"name": {"zh": "中部", "en": "Chubu"}, "population": 3000000, "capital": {"zh": "名古屋", "en": "Nagoya"}},
        {"name": {"zh": "中国", "en": "Chugoku"}, "population": 2500000, "capital": {"zh": "广岛", "en": "Hiroshima"}},
        {"name": {"zh": "九州", "en": "Kyushu"}, "population": 3000000, "capital": {"zh": "长崎", "en": "Nagasaki"}},
        {"name": {"zh": "东北", "en": "Tohoku"}, "population": 2000000, "capital": {"zh": "仙台", "en": "Sendai"}},
        {"name": {"zh": "四国", "en": "Shikoku"}, "population": 1500000, "capital": {"zh": "松山", "en": "Matsuyama"}},
    ],
    "muromachi_japan": [
        {"name": {"zh": "近畿", "en": "Kinki"}, "population": 3500000, "capital": {"zh": "京都", "en": "Kyoto"}},
        {"name": {"zh": "关东", "en": "Kanto"}, "population": 2000000, "capital": {"zh": "镰仓", "en": "Kamakura"}},
        {"name": {"zh": "中部", "en": "Chubu"}, "population": 2000000, "capital": {"zh": "名古屋", "en": "Nagoya"}},
        {"name": {"zh": "中国", "en": "Chugoku"}, "population": 1800000, "capital": {"zh": "广岛", "en": "Hiroshima"}},
        {"name": {"zh": "九州", "en": "Kyushu"}, "population": 2200000, "capital": {"zh": "博多", "en": "Hakata"}},
    ],
    # ── Joseon Korea ──
    "joseon_korea": [
        {"name": {"zh": "汉城府", "en": "Hanseong"}, "population": 200000, "capital": {"zh": "汉城", "en": "Hanseong"}},
        {"name": {"zh": "京畿道", "en": "Gyeonggi"}, "population": 1500000, "capital": {"zh": "水原", "en": "Suwon"}},
        {"name": {"zh": "忠清道", "en": "Chungcheong"}, "population": 1800000, "capital": {"zh": "公州", "en": "Gongju"}},
        {"name": {"zh": "全罗道", "en": "Jeolla"}, "population": 2200000, "capital": {"zh": "全州", "en": "Jeonju"}},
        {"name": {"zh": "庆尚道", "en": "Gyeongsang"}, "population": 2500000, "capital": {"zh": "大邱", "en": "Daegu"}},
        {"name": {"zh": "平安道", "en": "Pyeongan"}, "population": 1200000, "capital": {"zh": "平壤", "en": "Pyongyang"}},
        {"name": {"zh": "咸镜道", "en": "Hamgyeong"}, "population": 800000, "capital": {"zh": "咸兴", "en": "Hamhung"}},
        {"name": {"zh": "江原道", "en": "Gangwon"}, "population": 600000, "capital": {"zh": "原州", "en": "Wonju"}},
        {"name": {"zh": "黄海道", "en": "Hwanghae"}, "population": 1000000, "capital": {"zh": "海州", "en": "Haeju"}},
    ],
    # ── Poland-Lithuania ──
    "poland_lithuania": [
        {"name": {"zh": "大波兰", "en": "Greater Poland"}, "population": 2000000, "capital": {"zh": "波兹南", "en": "Poznań"}},
        {"name": {"zh": "小波兰", "en": "Lesser Poland"}, "population": 2500000, "capital": {"zh": "克拉科夫", "en": "Kraków"}},
        {"name": {"zh": "马佐夫舍", "en": "Masovia"}, "population": 1500000, "capital": {"zh": "华沙", "en": "Warsaw"}},
        {"name": {"zh": "立陶宛", "en": "Lithuania"}, "population": 1800000, "capital": {"zh": "维尔纽斯", "en": "Vilnius"}},
        {"name": {"zh": "乌克兰", "en": "Ukraine"}, "population": 3000000, "capital": {"zh": "基辅", "en": "Kyiv"}},
        {"name": {"zh": "普鲁士", "en": "Prussia"}, "population": 800000, "capital": {"zh": "柯尼斯堡", "en": "Königsberg"}},
    ],
    "polish_lithuanian_commonwealth": [
        {"name": {"zh": "大波兰", "en": "Greater Poland"}, "population": 2500000, "capital": {"zh": "波兹南", "en": "Poznań"}},
        {"name": {"zh": "小波兰", "en": "Lesser Poland"}, "population": 3000000, "capital": {"zh": "克拉科夫", "en": "Kraków"}},
        {"name": {"zh": "马佐夫舍", "en": "Masovia"}, "population": 2000000, "capital": {"zh": "华沙", "en": "Warsaw"}},
        {"name": {"zh": "立陶宛", "en": "Lithuania"}, "population": 2000000, "capital": {"zh": "维尔纽斯", "en": "Vilnius"}},
        {"name": {"zh": "乌克兰", "en": "Ukraine"}, "population": 3500000, "capital": {"zh": "基辅", "en": "Kyiv"}},
        {"name": {"zh": "利沃尼亚", "en": "Livonia"}, "population": 500000, "capital": {"zh": "里加", "en": "Riga"}},
    ],
    # ── Vijayanagara Empire ──
    "vijayanagara": [
        {"name": {"zh": "卡纳达核心", "en": "Kannada Core"}, "population": 4000000, "capital": {"zh": "维查耶纳伽尔", "en": "Vijayanagara"}},
        {"name": {"zh": "泰卢固区", "en": "Telugu Region"}, "population": 3000000, "capital": {"zh": "贡都尔", "en": "Kondavidu"}},
        {"name": {"zh": "泰米尔区", "en": "Tamil Region"}, "population": 3500000, "capital": {"zh": "马杜赖", "en": "Madurai"}},
        {"name": {"zh": "马拉巴尔海岸", "en": "Malabar Coast"}, "population": 1500000, "capital": {"zh": "卡利卡特", "en": "Calicut"}},
    ],
    # ── Spanish Empire ──
    "spain": [
        {"name": {"zh": "卡斯蒂利亚", "en": "Castile"}, "population": 5000000, "capital": {"zh": "巴利亚多利德", "en": "Valladolid"}},
        {"name": {"zh": "阿拉贡", "en": "Aragon"}, "population": 1500000, "capital": {"zh": "萨拉戈萨", "en": "Zaragoza"}},
        {"name": {"zh": "安达卢西亚", "en": "Andalusia"}, "population": 2000000, "capital": {"zh": "塞维利亚", "en": "Seville"}},
        {"name": {"zh": "加泰罗尼亚", "en": "Catalonia"}, "population": 1200000, "capital": {"zh": "巴塞罗那", "en": "Barcelona"}},
        {"name": {"zh": "加利西亚", "en": "Galicia"}, "population": 800000, "capital": {"zh": "圣地亚哥", "en": "Santiago de Compostela"}},
        {"name": {"zh": "纳瓦拉", "en": "Navarre"}, "population": 200000, "capital": {"zh": "潘普洛纳", "en": "Pamplona"}},
    ],
    "spanish_monarchy": [
        {"name": {"zh": "卡斯蒂利亚", "en": "Castile"}, "population": 6000000, "capital": {"zh": "马德里", "en": "Madrid"}},
        {"name": {"zh": "阿拉贡", "en": "Aragon"}, "population": 1500000, "capital": {"zh": "萨拉戈萨", "en": "Zaragoza"}},
        {"name": {"zh": "安达卢西亚", "en": "Andalusia"}, "population": 2500000, "capital": {"zh": "塞维利亚", "en": "Seville"}},
        {"name": {"zh": "加泰罗尼亚", "en": "Catalonia"}, "population": 1200000, "capital": {"zh": "巴塞罗那", "en": "Barcelona"}},
        {"name": {"zh": "西属尼德兰", "en": "Spanish Netherlands"}, "population": 1800000, "capital": {"zh": "布鲁塞尔", "en": "Brussels"}},
        {"name": {"zh": "那不勒斯", "en": "Naples"}, "population": 2500000, "capital": {"zh": "那不勒斯", "en": "Naples"}},
        {"name": {"zh": "西西里", "en": "Sicily"}, "population": 1000000, "capital": {"zh": "巴勒莫", "en": "Palermo"}},
    ],
    # ── Kingdom of France ──
    "kingdom_france": [
        {"name": {"zh": "法兰西岛", "en": "Île-de-France"}, "population": 2000000, "capital": {"zh": "巴黎", "en": "Paris"}},
        {"name": {"zh": "朗格多克", "en": "Languedoc"}, "population": 1500000, "capital": {"zh": "图卢兹", "en": "Toulouse"}},
        {"name": {"zh": "诺曼底", "en": "Normandy"}, "population": 1200000, "capital": {"zh": "鲁昂", "en": "Rouen"}},
        {"name": {"zh": "布列塔尼", "en": "Brittany"}, "population": 1000000, "capital": {"zh": "雷恩", "en": "Rennes"}},
        {"name": {"zh": "普罗旺斯", "en": "Provence"}, "population": 800000, "capital": {"zh": "艾克斯", "en": "Aix-en-Provence"}},
        {"name": {"zh": "阿基坦", "en": "Aquitaine"}, "population": 1300000, "capital": {"zh": "波尔多", "en": "Bordeaux"}},
    ],
    "kingdom_of_france": [
        {"name": {"zh": "法兰西岛", "en": "Île-de-France"}, "population": 2500000, "capital": {"zh": "巴黎", "en": "Paris"}},
        {"name": {"zh": "朗格多克", "en": "Languedoc"}, "population": 1800000, "capital": {"zh": "图卢兹", "en": "Toulouse"}},
        {"name": {"zh": "诺曼底", "en": "Normandy"}, "population": 1500000, "capital": {"zh": "鲁昂", "en": "Rouen"}},
        {"name": {"zh": "布列塔尼", "en": "Brittany"}, "population": 1200000, "capital": {"zh": "雷恩", "en": "Rennes"}},
        {"name": {"zh": "普罗旺斯", "en": "Provence"}, "population": 1000000, "capital": {"zh": "艾克斯", "en": "Aix-en-Provence"}},
        {"name": {"zh": "阿基坦", "en": "Aquitaine"}, "population": 1500000, "capital": {"zh": "波尔多", "en": "Bordeaux"}},
        {"name": {"zh": "勃艮第", "en": "Burgundy"}, "population": 1200000, "capital": {"zh": "第戎", "en": "Dijon"}},
    ],
    # ── Kingdom of England ──
    "kingdom_of_england": [
        {"name": {"zh": "英格兰", "en": "England"}, "population": 3500000, "capital": {"zh": "伦敦", "en": "London"}},
        {"name": {"zh": "威尔士", "en": "Wales"}, "population": 300000, "capital": {"zh": "加的夫", "en": "Cardiff"}},
    ],
    "england": [
        {"name": {"zh": "英格兰", "en": "England"}, "population": 3000000, "capital": {"zh": "伦敦", "en": "London"}},
        {"name": {"zh": "威尔士", "en": "Wales"}, "population": 250000, "capital": {"zh": "加的夫", "en": "Cardiff"}},
    ],
    # ── Russian Empire / Tsardom ──
    "tsardom_russia": [
        {"name": {"zh": "莫斯科", "en": "Moscow"}, "population": 3000000, "capital": {"zh": "莫斯科", "en": "Moscow"}},
        {"name": {"zh": "诺夫哥罗德", "en": "Novgorod"}, "population": 1000000, "capital": {"zh": "诺夫哥罗德", "en": "Novgorod"}},
        {"name": {"zh": "喀山", "en": "Kazan"}, "population": 800000, "capital": {"zh": "喀山", "en": "Kazan"}},
        {"name": {"zh": "西伯利亚", "en": "Siberia"}, "population": 500000, "capital": {"zh": "托博尔斯克", "en": "Tobolsk"}},
        {"name": {"zh": "乌克兰", "en": "Ukraine"}, "population": 2000000, "capital": {"zh": "基辅", "en": "Kyiv"}},
    ],
    "russian_empire": [
        {"name": {"zh": "莫斯科", "en": "Moscow"}, "population": 5000000, "capital": {"zh": "莫斯科", "en": "Moscow"}},
        {"name": {"zh": "圣彼得堡", "en": "Saint Petersburg"}, "population": 2000000, "capital": {"zh": "圣彼得堡", "en": "Saint Petersburg"}},
        {"name": {"zh": "乌克兰", "en": "Ukraine"}, "population": 8000000, "capital": {"zh": "基辅", "en": "Kyiv"}},
        {"name": {"zh": "波兰", "en": "Poland"}, "population": 5000000, "capital": {"zh": "华沙", "en": "Warsaw"}},
        {"name": {"zh": "西伯利亚", "en": "Siberia"}, "population": 3000000, "capital": {"zh": "托木斯克", "en": "Tomsk"}},
        {"name": {"zh": "高加索", "en": "Caucasus"}, "population": 4000000, "capital": {"zh": "第比利斯", "en": "Tiflis"}},
        {"name": {"zh": "中亚", "en": "Central Asia"}, "population": 5000000, "capital": {"zh": "塔什干", "en": "Tashkent"}},
        {"name": {"zh": "芬兰", "en": "Finland"}, "population": 2500000, "capital": {"zh": "赫尔辛基", "en": "Helsinki"}},
        {"name": {"zh": "波罗的海", "en": "Baltic"}, "population": 3000000, "capital": {"zh": "里加", "en": "Riga"}},
    ],
    # ── Songhai Empire ──
    "songhai": [
        {"name": {"zh": "加奥核心", "en": "Gao Core"}, "population": 500000, "capital": {"zh": "加奥", "en": "Gao"}},
        {"name": {"zh": "廷巴克图地区", "en": "Timbuktu Region"}, "population": 400000, "capital": {"zh": "廷巴克图", "en": "Timbuktu"}},
        {"name": {"zh": "杰内地区", "en": "Jenne Region"}, "population": 500000, "capital": {"zh": "杰内", "en": "Jenne"}},
        {"name": {"zh": "登迪地区", "en": "Dendi Region"}, "population": 300000, "capital": {"zh": "登迪", "en": "Dendi"}},
    ],
}


def apply_city_tags(cities, tag_map):
    """Add tags and descriptions to major cities that match the tag map."""
    for city in cities:
        if not isinstance(city, dict):
            continue
        name_obj = city.get("name")
        if isinstance(name_obj, dict):
            name_en = name_obj.get("en", "")
        elif isinstance(name_obj, str):
            name_en = name_obj
        else:
            continue
        if name_en in tag_map:
            city["tags"] = tag_map[name_en]["tags"]
            city["description"] = tag_map[name_en]["desc"]
    return cities


ERA_SPECIFIC_ALIASES = {
    # Cold War (1962)
    "usa_1962": "north_america_usa",
    "prc_1962": "east_asia_china_prc",
    "ussr_1962": "ai_russia",
    "japan_1962": "east_asia_japan",
    "india_1962": "south_asia_india",
    "france_1962": "ai_france",
    "uk_1962": "ai_uk",
    "west_germany_1962": "ai_germany",
    "brazil_1962": "south_america_brazil",
    # WWII (1939)
    "united_kingdom_1939": "ai_uk",
    "france_1939": "ai_france",
    "germany_1939": "ai_germany",
    "japan_1939": "east_asia_japan",
    "soviet_union_1939": "ai_russia",
    "china_republic_1939": "east_asia_china_prc",
    "brazil_1939": "south_america_brazil",
    # Imperialism (1900)
    "usa_1900": "north_america_usa",
    "russian_empire_1900": "ai_russia",
    "british_empire_home_1900": "ai_uk",
    "france_third_republic_1900": "ai_france",
    "meiji_japan_1900": "east_asia_japan",
    "brazil_1900": "south_america_brazil",
    "qing_empire_1900": "qing_empire_1900",
    "ottoman_empire_1900": "ottoman_empire_1900",
    "british_india_1900": "south_asia_india",
    # Industrial (1840)
    "united_kingdom_1840": "ai_uk",
    "france_july_monarchy_1840": "ai_france",
    "russian_empire_1840": "ai_russia",
    "prussia_1840": "ai_germany",
    "qing_empire_1840": "qing_empire_1840",
    "ottoman_empire_1840": "ottoman_empire_1840",
    "tokugawa_japan_1840": "east_asia_japan",
    "brazil_empire_1840": "south_america_brazil",
    "british_india_company_1840": "south_asia_india",
}


def find_subdivisions(rid, year):
    """Look up subdivisions for a region ID, cascading through data sources."""
    if rid in SUBDIVISIONS_2023:
        return SUBDIVISIONS_2023[rid]
    if rid in SUBDIVISIONS_2000:
        return SUBDIVISIONS_2000[rid]
    if rid in SUBDIVISIONS_HISTORICAL:
        return SUBDIVISIONS_HISTORICAL[rid]
    alias = ERA_SPECIFIC_ALIASES.get(rid)
    if alias:
        if alias in SUBDIVISIONS_2023:
            return SUBDIVISIONS_2023[alias]
        if alias in SUBDIVISIONS_2000:
            return SUBDIVISIONS_2000[alias]
        if alias in SUBDIVISIONS_HISTORICAL:
            return SUBDIVISIONS_HISTORICAL[alias]
    return None


def process_era_file(filepath):
    """Process a single era seed file, adding subdivisions and city tags."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    year = data.get("timestamp", {}).get("year", 0)
    modified = False

    tag_map = {**HISTORICAL_CITY_TAGS, **MODERN_CITY_TAGS} if year >= 1900 else HISTORICAL_CITY_TAGS

    for region in data.get("regions", []):
        rid = region.get("id", "")
        demo = region.get("demographics")
        if not demo:
            continue

        cities = demo.get("majorCities", [])
        if cities:
            apply_city_tags(cities, tag_map)
            modified = True

        if not demo.get("subdivisions"):
            subs = find_subdivisions(rid, year)
            if subs:
                demo["subdivisions"] = subs
                modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated: {filepath}")
    else:
        print(f"No changes: {filepath}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Process all era files
        seed_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data", "seed")
        import glob
        files = sorted(glob.glob(os.path.join(seed_dir, "era-*.json")))
        for f in files:
            process_era_file(f)
    else:
        for f in sys.argv[1:]:
            process_era_file(f)
