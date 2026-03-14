/**
 * Region ID → flag emoji / display mapping.
 *
 * Modern nations use ISO 3166-1 alpha-2 → regional indicator emoji.
 * Historical civilizations are mapped to a successor-state flag or
 * a curated symbol string.
 */

function isoToEmoji(iso: string): string {
  const upper = iso.toUpperCase();
  const a = 0x1f1e6;
  return String.fromCodePoint(
    a + upper.charCodeAt(0) - 65,
    a + upper.charCodeAt(1) - 65,
  );
}

/**
 * Canonical country-name → ISO code map.
 * Used for ai_, modern_, east_asia_, north_america_, south_america_,
 * south_asia_ prefixes AND bare country names with year suffixes.
 */
const COUNTRY_ISO: Record<string, string> = {
  afghanistan: "AF",
  albania: "AL",
  algeria: "DZ",
  angola: "AO",
  argentina: "AR",
  armenia: "AM",
  australia: "AU",
  austria: "AT",
  azerbaijan: "AZ",
  bahamas: "BS",
  bahrain: "BH",
  bangladesh: "BD",
  belarus: "BY",
  belgium: "BE",
  belize: "BZ",
  benin: "BJ",
  bhutan: "BT",
  bolivia: "BO",
  bosnia: "BA",
  botswana: "BW",
  brazil: "BR",
  brunei: "BN",
  bulgaria: "BG",
  burkina_faso: "BF",
  burundi: "BI",
  cambodia: "KH",
  cameroon: "CM",
  canada: "CA",
  car: "CF",
  chad: "TD",
  chile: "CL",
  china: "CN",
  china_prc: "CN",
  colombia: "CO",
  congo_brazzaville: "CG",
  congo_drc: "CD",
  costa_rica: "CR",
  croatia: "HR",
  cuba: "CU",
  cyprus: "CY",
  czech: "CZ",
  denmark: "DK",
  djibouti: "DJ",
  dominican_republic: "DO",
  east_timor: "TL",
  ecuador: "EC",
  egypt: "EG",
  el_salvador: "SV",
  eq_guinea: "GQ",
  eritrea: "ER",
  estonia: "EE",
  eswatini: "SZ",
  ethiopia: "ET",
  ethiopia_2000: "ET",
  fiji: "FJ",
  finland: "FI",
  france: "FR",
  french_guiana: "GF",
  gabon: "GA",
  gambia: "GM",
  georgia: "GE",
  germany: "DE",
  ghana: "GH",
  greece: "GR",
  greenland: "GL",
  guatemala: "GT",
  guinea: "GN",
  guinea_bissau: "GW",
  guyana: "GY",
  haiti: "HT",
  honduras: "HN",
  hong_kong: "HK",
  hungary: "HU",
  iceland: "IS",
  india: "IN",
  indonesia: "ID",
  iran: "IR",
  iraq: "IQ",
  ireland: "IE",
  israel: "IL",
  italy: "IT",
  ivory_coast: "CI",
  jamaica: "JM",
  japan: "JP",
  jordan: "JO",
  kazakhstan: "KZ",
  kenya: "KE",
  kuwait: "KW",
  kyrgyzstan: "KG",
  laos: "LA",
  latvia: "LV",
  lebanon: "LB",
  lesotho: "LS",
  liberia: "LR",
  libya: "LY",
  lithuania: "LT",
  luxembourg: "LU",
  macedonia: "MK",
  madagascar: "MG",
  malawi: "MW",
  malaysia: "MY",
  maldives: "MV",
  mali: "ML",
  malta: "MT",
  mauritania: "MR",
  mexico: "MX",
  moldova: "MD",
  mongolia: "MN",
  montenegro: "ME",
  morocco: "MA",
  mozambique: "MZ",
  myanmar: "MM",
  namibia: "NA",
  nepal: "NP",
  netherlands: "NL",
  new_zealand: "NZ",
  nicaragua: "NI",
  niger: "NE",
  nigeria: "NG",
  north_korea: "KP",
  norway: "NO",
  oman: "OM",
  pakistan: "PK",
  palestine: "PS",
  panama: "PA",
  papua_new_guinea: "PG",
  paraguay: "PY",
  peru: "PE",
  philippines: "PH",
  poland: "PL",
  portugal: "PT",
  puerto_rico: "PR",
  qatar: "QA",
  romania: "RO",
  russia: "RU",
  rwanda: "RW",
  samoa: "WS",
  saudi_arabia: "SA",
  senegal: "SN",
  serbia: "RS",
  sierra_leone: "SL",
  singapore: "SG",
  slovakia: "SK",
  slovenia: "SI",
  solomon_islands: "SB",
  somalia: "SO",
  south_africa: "ZA",
  south_korea: "KR",
  south_sudan: "SS",
  spain: "ES",
  sri_lanka: "LK",
  sudan: "SD",
  suriname: "SR",
  sweden: "SE",
  switzerland: "CH",
  syria: "SY",
  taiwan: "TW",
  tajikistan: "TJ",
  tanzania: "TZ",
  thailand: "TH",
  togo: "TG",
  tonga: "TO",
  trinidad: "TT",
  tunisia: "TN",
  turkey: "TR",
  turkmenistan: "TM",
  uae: "AE",
  uganda: "UG",
  uk: "GB",
  ukraine: "UA",
  uruguay: "UY",
  usa: "US",
  uzbekistan: "UZ",
  vanuatu: "VU",
  venezuela: "VE",
  vietnam: "VN",
  western_sahara: "EH",
  yemen: "YE",
  zambia: "ZM",
  zimbabwe: "ZW",
};

/**
 * Known prefixes that prepend a geographic qualifier before the country
 * name. After stripping these, the remainder is looked up in COUNTRY_ISO.
 */
const GEO_PREFIXES = [
  "ai_",
  "modern_",
  "east_asia_",
  "south_asia_",
  "north_america_",
  "south_america_",
  "southeast_asia_",
  "central_asia_",
  "west_asia_",
  "east_africa_",
  "west_africa_",
  "north_africa_",
  "south_africa_country_",
];

/**
 * Direct mapping for specific region IDs that don't match prefix or
 * keyword patterns. Exact full region-ID → ISO.
 */
const EXACT_ID_MAP: Record<string, string> = {
  prc: "CN",
  ussr: "RU",
  soviet_union: "RU",
  holy_roman_empire: "DE",
  hre: "DE",
  al_andalus: "ES",
  papal_states: "VA",
  knights_hospitaller: "MT",
  viking_settlement: "NO",
  norse_greenland: "GL",
  vinland: "CA",
  us_1840: "US",
  roc_taiwan_1962: "TW",
  east_germany_1962: "DE",
  west_germany_1962: "DE",
  north_korea_1962: "KP",
  south_korea_1962: "KR",
  north_vietnam_1962: "VN",
  south_vietnam_1962: "VN",
  north_yemen_1962: "YE",
  manchukuo_1939: "CN",
  xinjiang_1939: "CN",
  yugoslavia_1939: "RS",
  yugoslavia_1962: "RS",
  zaire_1962: "CD",
  malaya_1962: "MY",
  scandinavia_1939: "SE",
  communist_base_areas_1939: "CN",
  latin_america_1939: "MX",
  aden_1962: "YE",
  pakistan_1962: "PK",
  singapore_1962: "SG",
  dominion_newfoundland_1939: "CA",
  hawaii_1840: "US",
  hawaii_1900: "US",
  english_commonwealth: "GB",
  kalmar_union_1500: "SE",

  // Kingdoms with "kingdom_" prefix
  kingdom_kashmir: "IN",
  kingdom_kongo: "CD",
  kingdom_kush: "SD",
  kingdom_of_dahomey: "BJ",
  kingdom_of_jerusalem: "IL",

  // Ancient / tribal regions mapped to modern successors
  sun_wu_220: "CN",
  dian_kingdom_100: "CN",
  dian_kingdom_220: "CN",
  pegu_1500: "MM",
  taungoo: "MM",
  taungoo_burma: "MM",
  shan_states_1648: "MM",
  mon_state_1200: "MM",
  mon_khmer_peoples: "KH",

  // European sub-regions
  brittany_1200: "FR",
  brittany_1280: "FR",
  brittany_1500: "FR",
  toulouse_1200: "FR",
  crete_1648: "GR",
  trebizond_1280: "TR",
  saxony_1500: "DE",
  saxony_1648: "DE",
  saxony_1750: "DE",
  saxony_1840: "DE",
  syagrius_domain_476: "FR",

  // Ancient civilizations
  troy_wilusa: "TR",
  urartu_800bce: "AM",
  mitanni_kingdom: "SY",
  kassite_babylonia_rising: "IQ",
  yamkhad_remnants: "SY",
  jerusalem_shechem_canaan: "IL",
  media_persis_satrapies: "IR",
  suren_kingdom: "IR",
  suren_kingdom_220: "IR",
  osrhoene_220: "SY",

  // Illyria / Balkans
  illyria_221: "AL",
  illyrian_axial: "AL",
  illyrian_tribes: "AL",

  // Thrace
  thrace_500bce: "BG",
  thrace_tribal_kingdoms: "BG",
  thracian_tribes: "BG",

  // Steppe peoples in modern Russia
  bashkirs_750: "RU",
  mordvins_750: "RU",
  permians_750: "RU",
  mari_750: "RU",
  tungus_750: "RU",
  tungus_early: "RU",
  samoyedic_750: "RU",

  // Sub-Roman / early medieval
  lombard_kingdom: "IT",
  lombard_duchy_south_750: "IT",
  lombards_476: "IT",
  thuringians_476: "DE",
  burgundian_kingdom_476: "FR",
  suebi_kingdom_476: "ES",
  vandal_kingdom_476: "TN",

  // Finno-Ugric = Finland / Estonia area
  frisian_750: "NL",
  frisians_476: "NL",

  // Armenia related
  cilician_armenia: "AM",
  atropatene_323: "AZ",

  // African
  bornu_1648: "NG",
  bornu_1750: "NG",
  bornu_1840: "NG",
  bornu_kanem_1500: "NG",
  masina_1840: "ML",
  oromo_1648: "ET",
  oromo_1750: "ET",
  oromo_1840: "ET",
  oromo_1900: "ET",
  yeke_1900: "CD",
  rozvi_1750: "ZW",
  islamic_city_states_ea: "KE",
  sikkim_1840: "IN",

  // Numidia = modern Algeria/Tunisia
  numidia_221_bce: "DZ",
  numidia_323: "DZ",

  // Porus = India
  porus_kingdom: "IN",
  yadava_dynasty: "IN",
  videha_800bce: "IN",

  // India-era
  hadramawt_100: "YE",
  hadramawt_220: "YE",

  // South America
  chimor: "PE",

  // Greco-Bactria
  greco_bactria_221_bce: "AF",

  // Southeast Asia
  funan_220: "KH",
  funan_476: "KH",
  funan_proto: "KH",
  funan_proto_221_bce: "KH",
  funan_proto_sea_500bce: "KH",

  // Colonial Africa
  east_africa_colonial_1939: "KE",
  west_africa_independent_1939: "GH",
  south_america_states_1939: "AR",
  southeast_asia_mainland_1939: "TH",
  southeast_asia_maritime_1939: "ID",

  kashmir_1280: "IN",
  syro_hittite_states: "TR",
  vishnu_kundins_476: "IN",
  west_african_tribes: "NG",
};

/**
 * Regex-based mapping for historical region IDs to successor-state ISO codes.
 * Checked in order; first match wins. Tested on the *stripped* id (after
 * prefix removal). More specific patterns should come before generic ones.
 */
const COUNTRY_KEYWORD_MAP: [RegExp, string][] = [
  // ── East Asia ──
  [/^(han_|qin_|tang_|song_|ming_|qing_|zhou_|shang_|sui_|yuan_|china|chinese|prc|northern_wei|southern_song|southern_ming|eastern_han|warring_states|spring_autumn|three_kingdoms|shu_han|eastern_wu|cao_wei|jin_dynasty|northern_qi|liao_dynasty|western_xia|taiping|boxer|warlord_era|kuomintang|peoples_republic|xia_dynasty|erlitou|longshan|yangshao|liu_song|northern_zhou|dali_kingdom|nanzhao|hainan|nanyue|southern_yue|southern_china|minyue|yue_south|chin_(chu|han|lu|qi|qin|song|wei|yan|zhao)|shu_bronze)/, "CN"],
  [/^state_(of_)?(qi|chu|zhao|wei|yan|han|qin|lu|zheng|song|jin|wu|yue|ba|shu|zhongshan|wey|cai|cao|chen)/, "CN"],
  [/^(japan|tokugawa|meiji|yamato|ashikaga|kamakura|heian|nara_japan|nara_period|edo_|shogunate|muromachi|wa_japan|wa_states|ryukyu|jin_proto_japan|yayoi)/, "JP"],
  [/^(korea|joseon|goryeo|silla|goguryeo|baekje|balhae|unified_silla|buyeo|gaya|gija_joseon|gogojoseon|gogoseon)/, "KR"],
  [/^(mongol|genghis|golden_horde|chagatai|ilkhanate|yuan_dynasty|timurid|dzungar|rouran|xianbei|xiongnu|wusun|kangju|uyghur_khaganate|kara_khitai|karasuk)/, "MN"],
  [/^(taiwan|formosa|roc_taiwan)/, "TW"],

  // ── South / Southeast Asia ──
  [/^(india|mughal|maurya|gupta|maratha|delhi_sultanate|vijayanagara|chola|pallava|rashtrakuta|pala_|chandela|rajput|sikh_|bengal|hyderabad|mysore|travancore|gandhar|magadha|nanda|satavahana|kushan|chalukya|kakatiya|hoysala|pandya|madurai|bahmani|deccan|ahom|assam|maldiv|chera|kosala|kuru_panchala|vedic|later_vedic|iron_age_megalith_india|northwest_indian|south_indian|ikshvaku|vakataka|kadamba|eastern_ganga|paramara|kamarupa|sena_|western_kshatrapas|western_gangas|chutu|kalinga|gurjara|chaulukya|mewar|awadh|carnatic|cochin|golconda|gujarat_sultanate|bijapur|indus_post|kingdom_sind)/, "IN"],
  [/^(vatsa|vajji)/, "IN"],
  [/^(sri_lanka|ceylon|anuradhapura|sinhal|kandy|simhala)/, "LK"],
  [/^(myanmar|burma|pagan|bagan|ava_kingdom|toungoo|konbaung|pyu|hanthawaddy|burmese|arakan)/, "MM"],
  [/^(thai|siam|ayutthaya|sukhothai|rattanakosin|lanna|thonburi|dvaravati)/, "TH"],
  [/^(vietnam|dai_viet|champa|ly_dynasty|tran_dynasty|le_dynasty|nguyen|trinh_lords|tay_son|annam|cochinchina|tonkin|dong_son|linyi)/, "VN"],
  [/^(cambodia|khmer|angkor)/, "KH"],
  [/^(laos|lan_xang|luang_prabang|lao_|vientiane_kingdom|lan_na)/, "LA"],
  [/^(indonesia|majapahit|srivijaya|mataram|demak|aceh|java|banten|dutch_east_indies|makassar|singhasari)/, "ID"],
  [/^(malaysia|malacca|melaka|johor|perak|malays)/, "MY"],
  [/^(philippines|spanish_philippines|manila)/, "PH"],
  [/^(nepal|licchavi|malla_nepal|gorkhali)/, "NP"],
  [/^(tibet|tibetan_empire|zhangzhung)/, "CN"],
  [/^(bhutan)/, "BT"],

  // ── Middle East ──
  [/^(iran|persia|achaemenid|sassanid|sasanian|safavid|qajar|pahlavi|afsharid|zand|seljuk_iran|parthia|median|elamite|elam|ilkhanate)/, "IR"],
  [/^(iraq|babylon|assyria|sumeri|akkad|abbasid|mesopotamia|ur_third|ur_|neo_assyri|neo_babylon|seleucid|assur_city|characene|hatra)/, "IQ"],
  [/^(turkey|ottoman|rum_seljuk|seljuk_rum|hittite|lydia|phrygia|anatolia|bithynia|pontus|pergamon|galat|arzawa|kizzuwatna|ugarit|cappadocia|aq_qoyunlu)/, "TR"],
  [/^(saudi|hejaz|najd|rashidi|al_rashid|qasimi)/, "SA"],
  [/^(israel|judah|judea|hasmonean|israelite|hebrew|kingdom_of_israel|hazor)/, "IL"],
  [/^(egypt|ptolem|mamluk|fatimid|ayyubid|khediv|pharao|new_kingdom|old_kingdom|middle_kingdom|ptolemaic|cleopatra|hyksos|egypt_satrapy|egypt_second)/, "EG"],
  [/^(syria|umayyad|palmyra|seleucid_syria|aramaean|levant|ifriqiya_egypt_umayyad)/, "SY"],
  [/^(lebanon|phoenici|tyre|sidon|byblos)/, "LB"],
  [/^(jordan|nabatae|petra|transjordan)/, "JO"],
  [/^(yemen|saba|sheba|himyar|qataban|hadramaut|mutawakkil)/, "YE"],
  [/^(oman|muscat|magan_oman)/, "OM"],
  [/^(kuwait|emirate_of_kuwait)/, "KW"],
  [/^(uae|trucial|abu_dhabi)/, "AE"],
  [/^(bahrain|dilmun)/, "BH"],
  [/^(qatar)/, "QA"],
  [/^(palestine|gaza)/, "PS"],
  [/^(armenia)/, "AM"],
  [/^(georgia_|georgian|tao_klarjeti|colchis)/, "GE"],
  [/^(azerbaijan)/, "AZ"],
  [/^(arabia)/, "SA"],

  // ── Europe ──
  [/^(roman_|rome_|rome$|latin_league|spqr|roman$|western_roman|eastern_roman(?!_empire))/, "IT"],
  [/^(byzantine|eastern_roman_empire|constantinople)/, "GR"],
  [/^(france_|france$|gaul|merovingian|carolingian|capetian|valois|bourbon_france|napoleon|vichy|kingdom_of?_france|kingdom_france|french_(?!guiana|eq_|west_|somaliland|indochina|cameroon|morocco)|county_of_tripoli|principality_of_antioch)/, "FR"],
  [/^(frankish|franks)/, "FR"],
  [/^(england|britain|british|anglo_saxon|uk_|united_kingdom|plantagenet|tudor|stuart|hanoverian|welsh|wales|cornwall|wessex|mercia|northumbria|east_anglia|kent_anglo|scotland|kingdom_of_(england|great_britain|scotland)|kingdom_ireland|picts|scotti|sub_roman_britain|angles_jutes|armorica)/, "GB"],
  [/^(spain|castile|aragon|al_andalus|visigothic|iberian|navarre|leon_|catalan|habsburg_spain|bourbon_spain|kingdom_of_spain|kingdom_of_castile|crown_of_aragon|nasrid|asturias|spanish_(?!philippines|morocco))/, "ES"],
  [/^(portugal|lusitania|portuguese|kingdom_of_portugal)/, "PT"],
  [/^(germany|prussia|holy_roman|habsburg(?!_austria)|bavari|saxon(?!y)|teutonic|weimar|nazi_|german_|rhineland|hanover|brandenburg|hesse|wurttemberg|wuerttemberg|ostrogoth|baden_|odoacer)/, "DE"],
  [/^(italy|venice|genoa|florence|papal_states|lombardy|naples|sicily|sardinia|tuscany|piedmont|milan$|milan_|savoy|two_sicilies|etruscan|kingdom_of_naples|kingdom_two_sicilies|medici|ragusa|corsica|samnit|latin_sabine|sabines)/, "IT"],
  [/^(austria|habsburg_austria|austro_hungarian)/, "AT"],
  [/^(hungary|magyar|kingdom_of_hungary)/, "HU"],
  [/^(poland|polish|commonwealth_poland|kingdom_of_poland)/, "PL"],
  [/^(russia|muscovy|kievan_rus|novgorod|soviet|ussr|tsardom|russian_|bolshevik|grand_duchy_moscow|moscow_|vladimir_suzdal|ryazan|smolensk|tver)/, "RU"],
  [/^(ukraine|cossack|hetmanate|zaporizhian|ruthenian)/, "UA"],
  [/^(sweden|swedish|kingdom_of_sweden|swedes)/, "SE"],
  [/^(norway|norwegian|norse_|viking_norway|norsemen|kingdom_of_norway)/, "NO"],
  [/^(denmark|danish|viking_denmark|kingdom_of_denmark)/, "DK"],
  [/^(finland|finnish)/, "FI"],
  [/^(netherlands|dutch|holland|batavian|burgundian_netherlands)/, "NL"],
  [/^(belgium|belgian|flanders|burgundy)/, "BE"],
  [/^(switzerland|swiss|helvetic)/, "CH"],
  [/^(greece|greek|athen|sparta|thebes_greek|corinth|mycenae|minoan|delian|peloponnesian|epirus|achaean_league|aetolian_league|bosporan|cyrene|massalia)/, "GR"],
  [/^(macedonia|macedon)/, "MK"],
  [/^(romania|wallachia|moldavia_(?!1)|transylvania|dacian|dacia|free_dacia)/, "RO"],
  [/^(bulgaria|bulgar|second_bulgarian)/, "BG"],
  [/^(serbia|serbian|kingdom_of_serbia|dardania)/, "RS"],
  [/^(croatia|croatian)/, "HR"],
  [/^(bosnia)/, "BA"],
  [/^(montenegro)/, "ME"],
  [/^(czech|bohemia|moravia)/, "CZ"],
  [/^(slovakia|slovak)/, "SK"],
  [/^(lithuania|lithuanian|grand_duchy_lithuania)/, "LT"],
  [/^(latvia|latvian|livonian)/, "LV"],
  [/^(estonia|estonian)/, "EE"],
  [/^(iceland)/, "IS"],
  [/^(ireland|irish)/, "IE"],
  [/^(albania|albanian)/, "AL"],
  [/^(malta|maltese|knights_of_malta)/, "MT"],
  [/^(luxembourg)/, "LU"],
  [/^(cyprus)/, "CY"],
  [/^(slovenia)/, "SI"],
  [/^(moldova|moldavia)/, "MD"],
  [/^(san_marino)/, "SM"],
  [/^(crimean_khanate)/, "UA"],

  // ── Africa ──
  [/^(ethiopia|aksum|aksumite|abyssini|zagwe|solomonic|derg|ethiopian|axum|shoa)/, "ET"],
  [/^(nigeria|nigerian|oyo_|benin_kingdom|hausa|sokoto|borno|kanem|igbo|yoruba|nupe|ife_|nok_|borgu)/, "NG"],
  [/^(ghana_|ashanti|asante|gold_coast|akan_|fante|dagbon)/, "GH"],
  [/^(mali_|malian|mali$|manding|songhai|timbuktu|gao_|keita_|mansa_|wagadou|segu_bambara|kaarta|takrur)/, "ML"],
  [/^(south_africa|zulu|boer|cape_colony|natal|transvaal|orange_free|xhosa|ndebele|ngwato)/, "ZA"],
  [/^(kenya|swahili_coast|kilwa|mombasa_|lamu|swahili_early)/, "KE"],
  [/^(tanzania|zanzibar|tanganyika|nyamwezi|sultanate_of_kilwa|sultanate_of_zanzibar)/, "TZ"],
  [/^(sudan|nubia|kush|meroe|funj|mahdist|darfur|meroitic|kingdom_of_nubia|makuria|nobatia|alodia|anglo_egyptian_sudan|kerma|d_mt)/, "SD"],
  [/^(congo|kongo|luba|lunda(?!_angola))/, "CD"],
  [/^(morocco|morocc|marinid|wattasid|saadi|alaouite|idrisid|almoravid|almohad)/, "MA"],
  [/^(tunisia|tunis|carthag|aghlabid|hafsid|zirid|beylik_of_tunis)/, "TN"],
  [/^(algeria|algier|zayyanid|regency_of_algiers|dey_)/, "DZ"],
  [/^(libya|tripoli|fezzan|cyrenaica|garamantes)/, "LY"],
  [/^(senegal|wolof|jolof|cayor|tekrur|futa_toro|futa_jallon|futa_jalon|tukular)/, "SN"],
  [/^(cameroon)/, "CM"],
  [/^(uganda|buganda|bunyoro|ankole|busoga|nkore)/, "UG"],
  [/^(mozambique|monomotapa|mutapa|swahili_south)/, "MZ"],
  [/^(zimbabwe|great_zimbabwe|rozwi|rhodesia|shona|mwenemutapa)/, "ZW"],
  [/^(madagascar|merina|sakalava|imerina)/, "MG"],
  [/^(angola|ndongo|matamba|lunda_angola|ovimbundu)/, "AO"],
  [/^(somalia|somali|ajuran|geledi|majeerteen|adal|mogadishu|harer|italian_somaliland)/, "SO"],
  [/^(eritrea)/, "ER"],
  [/^(rwanda|tutsi|hutu)/, "RW"],
  [/^(burundi)/, "BI"],
  [/^(mossi)/, "BF"],
  [/^(dahomey|benin_1)/, "BJ"],
  [/^(kong_empire)/, "CI"],
  [/^(ivory_coast)/, "CI"],
  [/^(sierra_leone)/, "SL"],
  [/^(liberia)/, "LR"],
  [/^(basotho|basutoland|lesotho)/, "LS"],
  [/^(swazi|swaziland|eswatini)/, "SZ"],
  [/^(bechuanaland|botswana)/, "BW"],
  [/^(namibia|south_west_africa)/, "NA"],
  [/^(togo)/, "TG"],
  [/^(niger_1)/, "NE"],
  [/^(chad)/, "TD"],
  [/^(djibouti|french_somaliland)/, "DJ"],
  [/^(mauritius)/, "MU"],
  [/^(mauritania)/, "MR"],
  [/^(gabon)/, "GA"],
  [/^(gambia)/, "GM"],
  [/^(guinea_bissau)/, "GW"],
  [/^(guinea)/, "GN"],
  [/^(eq_guinea)/, "GQ",],
  [/^(central_african_republic)/, "CF"],
  [/^(burkina_faso)/, "BF"],
  [/^(malawi|nyasaland)/, "MW"],
  [/^(samori)/, "GN"],
  [/^(wadai|bagirmi)/, "TD"],
  [/^(damagaram)/, "NE"],
  [/^(lozi|north_rhodesia)/, "ZM"],
  [/^(south_rhodesia)/, "ZW"],
  [/^(kuba|teke|yaka|imbangala)/, "CD"],
  [/^(delagoa_bay)/, "MZ"],
  [/^(kazembe)/, "ZM"],
  [/^(loango)/, "CG"],
  [/^(air_sultanate)/, "NE"],
  [/^(ifat)/, "ET"],
  [/^(touareg|tuareg)/, "NE"],
  [/^(punt|azania|beja|blemmyes)/, "ER"],
  [/^(awsa_sultanate)/, "ET"],
  [/^(ghurid)/, "AF"],
  [/^(modern_afghanistan|afghan)/, "AF"],
  [/^(durrani)/, "AF"],

  // ── Americas ──
  [/^(usa|united_states|american|thirteen_colonies|confederate|new_england)/, "US"],
  [/^(canada|canadian|hudson_bay|new_france|quebec_|nova_scotia|rupert)/, "CA"],
  [/^(mexico|aztec|mexica|tenochtitlan|toltec|zapotec|mixtec|olmec|maya|teotihuacan|nueva_espana|new_spain|monte_alban|viceroyalty_new_spain|tarascan)/, "MX"],
  [/^(brazil|portuguese_brazil|empire_of_brazil)/, "BR"],
  [/^(argentina|argentine|rio_de_la_plata|buenos_aires)/, "AR"],
  [/^(peru|inca|tawantinsuyu|chimu|moche|nazca|wari_|chavin|viceroyalty_peru|kingdom_of_cusco|recuay|tiwanaku|wankarani|nasca|paracas)/, "PE"],
  [/^(colombia|colombian|new_granada|gran_colombia|muisca)/, "CO"],
  [/^(chile|chilean|mapuche|araucan)/, "CL"],
  [/^(venezuela|venezuelan)/, "VE"],
  [/^(cuba|cuban)/, "CU"],
  [/^(haiti|haitian|saint_domingue)/, "HT"],
  [/^(dominican)/, "DO"],
  [/^(jamaica)/, "JM"],
  [/^(panama|panamanian)/, "PA"],
  [/^(ecuador)/, "EC"],
  [/^(bolivia|bolivian|upper_peru)/, "BO"],
  [/^(paraguay|paraguayan)/, "PY"],
  [/^(uruguay|uruguayan|banda_oriental)/, "UY"],
  [/^(guatemala|guatemalan)/, "GT"],
  [/^(honduras)/, "HN"],
  [/^(el_salvador)/, "SV"],
  [/^(nicaragua)/, "NI"],
  [/^(costa_rica)/, "CR"],
  [/^(trinidad)/, "TT"],
  [/^(guiana|guyana|suriname)/, "GY"],
  [/^(bahamas)/, "BS"],
  [/^(puerto_rico)/, "PR"],
  [/^(miskito)/, "NI"],
  [/^(central_american_republic)/, "GT"],

  // ── Central Asia ──
  [/^(uzbekistan|uzbek|bukhara|samarkand|khwarezm|khwarazmian|khiva|kokand|sogdiana|bactria)/, "UZ"],
  [/^(kazakhstan|kazakh)/, "KZ"],
  [/^(turkmenistan|turkmen)/, "TM"],
  [/^(kyrgyzstan|kyrgyz|turgesh)/, "KG"],
  [/^(tajikistan|tajik)/, "TJ"],
  [/^(tarim_oasis)/, "CN"],

  // ── Oceania ──
  [/^(australia|australian|aboriginal_australia|tasmanian)/, "AU"],
  [/^(new_zealand|maori|aotearoa)/, "NZ"],
  [/^(papua)/, "PG"],
  [/^(fiji)/, "FJ"],
  [/^(samoa|samoan)/, "WS"],
  [/^(tonga|tongan|tui_tonga)/, "TO"],
  [/^(polynesian|ancestral_polynesian|lapita)/, "NZ"],
  [/^(vanuatu)/, "VU"],
  [/^(solomon_islands)/, "SB"],

  // ── Steppe / Nomadic catch-alls ──
  [/^(khazar)/, "KZ"],
  [/^(volga_bulgar)/, "RU"],
  [/^(avars)/, "HU"],
  [/^(gepids)/, "HU"],
  [/^(cuman)/, "UA"],
  [/^(old_turkic)/, "TR"],

  // ── Colonial era catch-alls ──
  [/^french_(eq_africa|west_africa|indochina|cameroon|morocco)/, "FR"],
  [/^(north_west_africa)/, "DZ"],

  // ── Generic regional catch-alls ──
  [/^(ainu)/, "JP"],
  [/^(algonquin|iroquois|cherokee|navajo|apache|comanche|huron|cree|creek|powhatan|athabaskan|mississippian|hopewell|adena|poverty_point|plain_bison|plateau_fishers|subarctic_hunters|east_na_|na_pacific|innu)/, "US"],
  [/^(taino)/, "CU"],
  [/^(guarani_tupi|manioc_farmers|pampas|patagonian_hunters|amazonian|amazonia|andean|aymara|chinchorro|chorrera|el_paraiso)/, "BR"],
  [/^(maize_farmers|west_mexico)/, "MX"],
  [/^(arctic_hunters|arctic_marine|thule|dorset|paleo_inuit)/, "CA"],
  [/^(austronesian)/, "PH"],
  [/^(bantu)/, "CD"],
  [/^(khoisan|shellfish_gatherers)/, "ZA"],
  [/^(savanna_hunter|savanna_1|savanna_2|savanna_4|savanna_7|savanna_ax|savanna_han|savanna_hel|savanna_ia|savanna_qin)/, "KE"],
  [/^(saharan_pastoralist|saharan_cattle|sahel_polities|desert_hunter|west_african_tribal|west_african_chiefdom|west_african_sahel|west_africa_nok|maghreb_berber|berber)/, "NG"],
  [/^(caribbean)/, "CU"],
  [/^(paleo_siberian)/, "RU"],
  [/^(finno_ugric)/, "FI"],
  [/^(slavic_tribes|slavonic_tribes|east_slavic)/, "RU"],
  [/^(germanic_(?!tribes_221)|germanic_tribes$)/, "DE"],
  [/^(germanic_tribes_221)/, "DE"],
  [/^(nordic_bronze|northern_europe_tribes|urnfield|central_europe_tumulus|lusatian|la_tene)/, "DE"],
  [/^(baltic_tribes)/, "LT"],
  [/^(brittonic_tribes|celtiberian)/, "GB"],
  [/^(guanches)/, "ES"],
  [/^(sami|saami)/, "NO"],
  [/^(boii)/, "CZ"],
  [/^(alans|sarmatian|sarmatians|heruli|hephthalites|kidarites|yueban|yuezhi)/, "KZ"],
  [/^(bmac_remnants)/, "UZ"],
  [/^(steppe_sintashta|cimmerian|karasuk)/, "KZ"],
  [/^(ghassanids|lakhmids|kindah|arabian)/, "SA"],
  [/^(alamanni)/, "DE"],
  [/^(gaoche)/, "MN"],
  [/^(crusader_remnants)/, "IL"],
  [/^(southeast_asia_ban_chiang|southeast_asia_chiefdom|southeast_asia_dongson)/, "TH"],
  [/^(south_indian|tamil_chiefdoms)/, "IN"],
  [/^(caucasus_albania)/, "AZ"],
  [/^(caucasus_iberia)/, "GE"],
  [/^(punt|azania)/, "SO"],
  [/^(polynesian|ancestral_polynesian)/, "NZ"],
  [/^(southern_xiongnu|xiongnu)/, "MN"],
  [/^(avatni)/, "IN"],
  [/^(dian_kingdom)/, "CN"],
  [/^(khanate_sibir)/, "RU"],
];

/**
 * Historical civilizations with curated symbol when no modern
 * successor flag is appropriate.
 */
const HISTORICAL_SYMBOLS: Record<string, string> = {
  viking: "⚔️",
  celtic: "☘️",
  hallstatt: "☘️",
  scythian: "🏹",
  hunnic: "🏇",
  saka_kingdom: "🏹",
};

/**
 * Strip known geographic/era prefixes and year suffixes to extract the
 * core country name, then look it up in COUNTRY_ISO.
 */
function stripAndLookup(id: string): string | null {
  let core = id;

  for (const pfx of GEO_PREFIXES) {
    if (core.startsWith(pfx)) {
      core = core.slice(pfx.length);
      break;
    }
  }

  // Try exact match first (handles "ethiopia_2000", "china_prc", etc.)
  if (COUNTRY_ISO[core]) return COUNTRY_ISO[core];

  // Strip trailing year suffix like _1840, _1900, _1939, _1962, _2000
  const withoutYear = core.replace(/_\d{3,4}(bce)?$/, "");
  if (withoutYear !== core && COUNTRY_ISO[withoutYear]) {
    return COUNTRY_ISO[withoutYear];
  }

  // Strip common suffixes like _third_republic, _july_monarchy, etc.
  const baseCountry = core.split("_")[0];
  if (baseCountry.length >= 3 && COUNTRY_ISO[baseCountry]) {
    return COUNTRY_ISO[baseCountry];
  }

  return null;
}

/**
 * Resolve a region ID to a two-char ISO code, or null if no match.
 */
function resolveISO(regionId: string): string | null {
  const id = regionId.toLowerCase();

  if (EXACT_ID_MAP[id]) return EXACT_ID_MAP[id];

  const prefixMatch = stripAndLookup(id);
  if (prefixMatch) return prefixMatch;

  for (const [re, iso] of COUNTRY_KEYWORD_MAP) {
    if (re.test(id)) return iso;
  }

  return null;
}

/**
 * Get a display-ready flag string for a region.
 * Returns { emoji, type } where type is "flag" | "symbol" | "fallback".
 */
export function getRegionFlag(regionId: string): {
  emoji: string;
  type: "flag" | "symbol" | "fallback";
} {
  const iso = resolveISO(regionId);
  if (iso) {
    return { emoji: isoToEmoji(iso), type: "flag" };
  }

  const lower = regionId.toLowerCase();
  for (const [keyword, sym] of Object.entries(HISTORICAL_SYMBOLS)) {
    if (lower.includes(keyword)) {
      return { emoji: sym, type: "symbol" };
    }
  }

  return { emoji: "🏛️", type: "fallback" };
}

/**
 * Convenience: just get the emoji string.
 */
export function getFlagEmoji(regionId: string): string {
  return getRegionFlag(regionId).emoji;
}
