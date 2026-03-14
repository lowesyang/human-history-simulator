/**
 * Maps region IDs from our era seed files to country/entity NAMEs
 * used in the aourednik/historical-basemaps GeoJSON files.
 *
 * Structure: regionId -> array of basemap NAME strings (tried in order).
 * When a region maps to multiple polygons (e.g. colonial empires with
 * separate territories), list the primary NAME first; the build script
 * will merge all matched geometries into a single MultiPolygon.
 *
 * Some mappings are era-range-specific: the same region ID may need
 * different basemap names depending on the snapshot year. For those
 * cases, use YEAR_RANGE_OVERRIDES at the bottom.
 */

// ---------- Primary region-to-basemap NAME mapping ----------
// This covers the "best guess" mapping. The build script tries each
// name in order and picks the first match found in the snapshot.

export const REGION_NAME_MAP: Record<string, string[]> = {
  // ==================== EAST ASIA ====================
  shang_dynasty: ["Sinic", "Zhoa"],
  zhou_western: ["Zhoa", "Sinic"],
  zhou_royal_domain: ["Zhoa", "Zhou states"],
  state_of_qin_500bce: ["Zhou states", "Qin"],
  state_of_jin_500bce: ["Zhou states"],
  state_of_chu_500bce: ["Zhou states"],
  state_of_qi_500bce: ["Zhou states"],
  state_of_song_500bce: ["Zhou states"],
  state_of_lu_500bce: ["Zhou states"],
  state_of_yue_500bce: ["Zhou states", "Yue"],
  state_of_wu_500bce: ["Zhou states", "Wu"],
  state_of_yan_500bce: ["Zhou states"],
  state_of_zheng_500bce: ["Zhou states"],
  state_of_wey_500bce: ["Zhou states"],
  state_of_zhongshan_500bce: ["Zhou states"],
  state_qi_800bce: ["Sinic", "Zhoa"],
  state_yan_800bce: ["Sinic", "Zhoa"],
  state_qin_800bce: ["Sinic", "Zhoa"],
  state_song_800bce: ["Sinic", "Zhoa"],
  state_wu_800bce: ["Wu", "Sinic"],
  state_lu_800bce: ["Sinic", "Zhoa"],
  state_chu_800bce: ["Sinic", "Zhoa"],
  state_jin_800bce: ["Sinic", "Zhoa"],
  state_zheng_800bce: ["Sinic", "Zhoa"],
  state_wei_800bce: ["Sinic", "Zhoa"],
  state_chen_800bce: ["Sinic", "Zhoa"],
  state_cai_800bce: ["Sinic", "Zhoa"],
  state_cao_800bce: ["Sinic", "Zhoa"],
  state_yue_800bce: ["Wu", "Yue", "Sinic"],
  chin_qin: ["Qin", "Zhou states"],
  chin_chu: ["Zhou states", "Zhow states"],
  chin_zhao: ["Zhou states", "Zhow states"],
  chin_qi: ["Zhou states", "Zhow states"],
  chin_wei: ["Zhou states", "Zhow states"],
  chin_han: ["Zhou states", "Zhow states"],
  chin_yan: ["Zhou states", "Zhow states"],
  chin_song: ["Zhou states", "Zhow states"],
  chin_lu: ["Zhou states", "Zhow states"],
  qin_empire_221_bce: ["Qin", "Han Empire"],
  eastern_han: ["Han", "Han Empire"],
  cao_wei_220: ["Han"],
  sun_wu_220: ["Han"],
  shu_han_220: ["Han"],
  liu_song_476: ["Jin Empire"],
  northern_wei_476: ["Toba Wei"],
  tang_dynasty: ["Tang Empire", "Sui Empire"],
  southern_song: ["Song Empire"],
  jin_dynasty: ["Liao"],
  western_xia: ["Xixia"],
  yuan_dynasty: ["Great Khanate"],
  ming_china: ["Ming Chinese Empire"],
  qing_dynasty: ["Manchu Empire", "Qing Empire"],
  qing_empire_1840: ["Manchu Empire", "Qing Empire"],
  qing_empire_1900: ["Manchu Empire"],
  china_republic_1939: ["Chinese warlords"],
  prc_1962: ["China"],
  east_asia_china_prc: ["China"],
  southern_ming: ["Post-Ming Warlords"],
  shu_bronze_polity: ["Sinic"],
  shu_bronze_800bce: ["Sinic"],
  southern_china_yue_clusters: ["Yue", "Wu"],
  southern_yue_800bce: ["Yue", "Wu"],
  yue_south_china_peoples: ["Yue"],
  minyue_polity_221_bce: ["Min-Yue"],
  nanyue_proto_polities_221_bce: ["Nan-Yue"],
  nanzhao: ["Nan Chao", "Nan-Zhao"],
  dali_kingdom: ["Nan Chao"],
  wang_jingwei_regime_1939: ["Chinese warlords"],
  communist_base_areas_1939: ["Chinese warlords"],

  // --- Taiwan ---
  roc_taiwan_1962: ["Taiwan"],
  east_asia_taiwan: ["Taiwan"],

  // --- Japan ---
  japan_jomon_chiefdoms: ["Late Jomon culture", "Ainu"],
  yayoi_japan_500bce: ["Late Jomon culture"],
  yayoi_transition_japan: ["Late Jomon culture"],
  yayoi_prestate_japan: ["Yayoi", "Ainu"],
  jin_proto_japan_221_bce: ["Yayoi"],
  wa_japan: ["Yayoi", "Yamato"],
  wa_japan_476: ["Yamato"],
  wa_states_220: ["Yayoi"],
  nara_japan: ["Japan", "Yamato"],
  kamakura_shogunate: ["Shogun Japan (Kamakura)", "Imperial Japan (Fujiwara)"],
  muromachi_japan: ["Japan"],
  tokugawa_shogunate: ["Tokugawa Shogunate", "Japan"],
  tokugawa_japan_1840: ["Japan"],
  meiji_japan_1900: ["Imperial Japan"],
  japan_1939: ["Empire of Japan"],
  japan_1962: ["Japan"],
  east_asia_japan: ["Japan"],

  // --- Korea ---
  gija_joseon_proto_state: ["Paleo-Koreans"],
  korean_early_states_500bce: ["Paleo-Koreans"],
  korean_tribal_states: ["Paleo-Koreans", "Brushed Pottery culture"],
  gogoseon_800bce: ["Paleo-Koreans"],
  gogojoseon_221_bce: ["Paleo-Koreans"],
  goguryeo: ["Koguryo"],
  goguryeo_220: ["Koguryo"],
  goguryeo_476: ["Koguryo"],
  baekje: ["Paekche"],
  baekje_220: ["Paekche"],
  baekje_476: ["Paekche"],
  silla: ["Silla"],
  silla_220: ["Silla"],
  silla_476: ["Silla"],
  gaya_220: ["Gaya"],
  buyeo: ["Koguryo"],
  unified_silla: ["Silla"],
  balhae: ["Parhae", "Koguryo"],
  goryeo: ["Goryeo", "Korea"],
  joseon_korea: ["Korea"],
  ryukyu_kingdom: ["Japan", "Taiwan"],
  joseon_1840: ["Korea"],
  joseon_korean_empire_1900: ["Korea"],
  korea_1939: ["Korea"],
  north_korea_1962: ["Korea, Democratic People's Republic of"],
  south_korea_1962: ["Korea, Republic of"],
  east_asia_koreas: ["Korea, Republic of", "Korea, Democratic People's Republic of"],

  // --- Mongolia ---
  xiongnu_confederation_221_bce: ["Xiongnu"],
  xiongnu_northern: ["Xiongnu", "Yueban"],
  xiongnu_southern: ["Southern Xiongnu"],
  xianbei_220: ["Yueban"],
  rouran_khaganate_476: ["Ruanruan"],
  gaoche_confederation_476: ["Ruanruan"],
  mongol_steppe: ["Mongol Empire"],
  mongolia_1939: ["Mongolia"],
  mongolia_1962: ["Mongolia"],
  east_asia_mongolia: ["Mongolia"],
  yuezhi_steppe_221_bce: ["Yuezhi"],
  wusun_220: ["Yueban"],

  // ==================== CENTRAL ASIA ====================
  steppe_sintashta_andronovo: ["Prot-Altaic pastoralists"],
  bmac_remnants: ["Iranian pastoralists"],
  bmac_remnants_800bce: ["Iranian pastoralists"],
  cimmerian_scynthian_steppe: ["Cimerians", "Proto-Scythian culture"],
  scythian_confederations_500bce: ["Scythians", "Proto-Scythian culture"],
  scythian_steppe: ["Scythians", "Paleo-Siberian hunter-gatherers"],
  sarmatians: ["Sarmates", "Scythians"],
  sarmatian_alan_220: ["Alans"],
  bactria_sogdia: ["Bactria", "Empire of Alexander"],
  greco_bactria_221_bce: ["Bactria"],
  khwarazmian_empire: ["Kwarizm-Shah"],
  chagatai_khanate: ["Chagatai Khanate"],
  golden_horde: ["Khanate of the Golden Horde"],
  ilkhanate: ["Ilkhanate"],
  timurids_khorasan: ["Timurid Emirates"],
  uzbek_khanate: ["Chagatai Khanate"],
  bukhara_khanate: ["central Asian khanates"],
  khiva_khanate: ["Khiva Khanate", "central Asian khanates"],
  bukharan_emirate_1900: ["central Asian khanates"],
  khiva_khanate_1900: ["central Asian khanates"],
  kazakh_juz: ["Quazaq Khanate", "central Asian khanates"],
  kazakh_horde_1840: ["central Asian khanates"],
  dzungar_khanate: ["Oirat Confederation", "central Asian khanates"],
  crimean_khanate: ["Crimean Khanate"],
  central_asia_post_soviet_states: ["Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan"],
  kazakhstan: ["Kazakhstan"],
  uzbekistan: ["Uzbekistan"],
  kyrgyzstan: ["Kyrgyzstan"],
  tajikistan: ["Tajikistan"],
  turkmenistan: ["Turkmenistan"],
  ai_kazakhstan: ["Kazakhstan"],
  ai_uzbekistan: ["Uzbekistan"],
  ai_kyrgyzstan: ["Kyrgyzstan"],
  ai_tajikistan: ["Tajikistan"],
  ai_turkmenistan: ["Turkmenistan"],
  ai_ethiopia_2000: ["Ethiopia"],
  ai_czech: ["Czech Republic"],
  ai_slovakia: ["Slovakia"],
  ai_uk: ["United Kingdom"],
  ai_iran: ["Iran", "Iran (Islamic Republic of)"],
  ai_guyana: ["Guyana"],
  ai_suriname: ["Suriname"],
  ai_french_guiana: ["French Guiana"],
  ai_trinidad: ["Trinidad"],
  ai_bahamas: ["Bahamas"],
  ai_samoa: ["Samoa"],
  ai_tonga: ["Tonga"],
  ai_vanuatu: ["Vanuatu", "New Hebrides"],
  ai_hong_kong: ["Hong Kong"],
  ai_puerto_rico: ["Puerto Rico"],
  ai_macedonia: ["Macedonia"],
  ai_belarus: ["Byelarus", "Belarus"],
  ai_belize: ["Belize"],
  ai_bhutan: ["Bhutan"],
  ai_costa_rica: ["Costa Rica"],
  ai_dominican_republic: ["Dominican Republic"],
  ai_el_salvador: ["El Salvador"],
  ai_estonia: ["Estonia"],
  ai_guatemala: ["Guatemala"],
  ai_haiti: ["Haiti"],
  ai_honduras: ["Honduras"],
  ai_iceland: ["Iceland"],
  ai_iraq: ["Iraq"],
  ai_jamaica: ["Jamaica"],
  ai_latvia: ["Latvia"],
  ai_lithuania: ["Lithuania"],
  ai_luxembourg: ["Luxembourg"],
  ai_maldives: ["Maldives"],
  ai_moldova: ["Moldova"],
  ai_nepal: ["Nepal"],
  ai_nicaragua: ["Nicaragua"],
  ai_north_korea: ["Korea, Democratic People's Republic of", "North Korea"],
  ai_palestine: ["Palestine", "Palestinian Territory"],
  ai_panama: ["Panama"],
  ai_solomon_islands: ["Solomon Islands"],
  ai_south_korea: ["Korea, Republic of", "South Korea"],
  ai_sri_lanka: ["Sri Lanka"],
  modern_belarus: ["Byelarus", "Belarus"],
  modern_belize: ["Belize"],
  modern_bhutan: ["Bhutan"],
  modern_congo_brazzaville: ["Republic of the Congo", "Congo"],
  modern_costa_rica: ["Costa Rica"],
  modern_dominican_republic: ["Dominican Republic"],
  modern_el_salvador: ["El Salvador"],
  modern_estonia: ["Estonia"],
  modern_guatemala: ["Guatemala"],
  modern_haiti: ["Haiti"],
  modern_honduras: ["Honduras"],
  modern_hungary: ["Hungary"],
  modern_iceland: ["Iceland"],
  modern_iraq: ["Iraq"],
  modern_israel: ["Israel"],
  modern_jamaica: ["Jamaica"],
  modern_latvia: ["Latvia"],
  modern_lithuania: ["Lithuania"],
  modern_luxembourg: ["Luxembourg"],
  modern_maldives: ["Maldives"],
  modern_moldova: ["Moldova"],
  modern_nepal: ["Nepal"],
  modern_nicaragua: ["Nicaragua"],
  modern_palestine: ["Palestine", "Palestinian Territory"],
  modern_panama: ["Panama"],
  modern_south_sudan: ["South Sudan"],
  modern_sri_lanka: ["Sri Lanka"],
  modern_uae: ["United Arab Emirates"],
  modern_kazakhstan: ["Kazakhstan"],
  modern_uzbekistan: ["Uzbekistan"],
  modern_kyrgyzstan: ["Kyrgyzstan"],
  modern_tajikistan: ["Tajikistan"],
  modern_turkmenistan: ["Turkmenistan"],
  turgesh: ["Göktürks"],
  uyghur_khaganate: ["Ouighurs", "Uyghurs"],
  old_turkic_remnants: ["Göktürks"],
  khazar_khaganate: ["Khazars"],

  // ==================== SOUTH ASIA ====================
  indus_post_harappan: ["Dravidians", "Vedic Aryans"],
  indus_post_harappan_800bce: ["Dravidians", "Vedic Aryans"],
  vedic_tribes_north_india: ["Vedic Aryans"],
  vedic_north_india_800bce: ["Vedic Aryans"],
  later_vedic_kuru: ["Vedic Aryans"],
  later_vedic_panchala: ["Vedic Aryans"],
  videha_800bce: ["Vedic Aryans"],
  gandhara_500bce: ["Gandhāra", "Gandhara grave culture"],
  gandhara_800bce: ["Gandhara grave culture"],
  magadha_500bce: ["Magadha"],
  vatsa_500bce: ["Vatsa"],
  kosala_500bce: ["Kosala"],
  avatni_500bce: ["Avanti"],
  vajji_confederacy_500bce: ["Magadha"],
  kuru_panchala_500bce: ["Kuru", "Pancala"],
  nanda_empire: ["Magadha"],
  porus_kingdom: ["Hindu kingdoms and republics"],
  northwest_indian_satrapies: ["Hindu kingdoms and republics"],
  south_indian_polities: ["Hindu kingdoms"],
  maurya_empire_221_bce: ["Mauryan Empire"],
  kushan_empire: ["Kushan Empire"],
  kushan_empire_220: ["Kushan Empire"],
  satavahana: ["Satavahanihara"],
  satavahana_220: ["Satavahanihara"],
  western_kshatrapas: ["Saka Kingdom"],
  western_kshatrapas_220: ["Saka Kingdom"],
  chera: ["Cheras", "Chera"],
  chera_220: ["Cheras", "Chola"],
  chera_221_bce: ["Hindu kingdoms"],
  chola: ["Chola", "Cholas"],
  chola_220: ["Chola"],
  chola_early_221_bce: ["Hindu kingdoms"],
  chola_empire: ["Chola state"],
  pandya: ["Pandyas", "Pandya"],
  pandya_220: ["Pandyas", "Pandya", "Hindu kingdoms"],
  pandya_221_bce: ["Hindu kingdoms"],
  pandya_empire: ["Pandya state"],
  gupta_empire_476: ["Gupta Empire"],
  vakataka_476: ["Vakataka"],
  kadamba_476: ["Kadambas"],
  pallava_476: ["Pallavas"],
  pallava: ["Pallavas", "Pallava state"],
  pala_empire: ["Palas"],
  rashtrakuta: ["Rashtrakuta state", "Hindu kingdoms"],
  gurjara_pratihara: ["Gurjara Pratihara", "Hindu kingdoms"],
  ikshvaku_220: ["Kalinga"],
  anuradhapura_221_bce: ["Simhala"],
  anuradhapura_476: ["Simhala"],
  delhi_sultanate: ["Sultanate of Delhi"],
  ghurid_sultanate: ["Ghaznavid Emirate"],
  hoysala_kingdom: ["Hindu kingdoms"],
  hoysala_empire: ["Hindu kingdoms"],
  paramara_kingdom: ["Hindu kingdoms"],
  chaulukya_gujarat: ["Hindu kingdoms"],
  sena_dynasty: ["Hindu kingdoms"],
  kakatiya_dynasty: ["minor Hindu kingdoms"],
  eastern_ganga: ["Orissa"],
  yadava_dynasty: ["minor Hindu kingdoms"],
  vijayanagara: ["Vijayanagara"],
  bahmani_sultanate: ["Bahmani Kingdom"],
  mughal_empire: ["Mughal Empire", "Islamic and Hindu states", "India"],
  bijapur_sultanate: ["Bijapur"],
  golconda_sultanate: ["Golkonda"],
  maratha_confederacy: ["Maratha Confederacy"],
  hyderabad_state: ["Nizam's Dominions", "Golconda", "India"],
  bengal_nawabate: ["Hindu kingdoms", "Bengal"],
  awadh_nawabate: ["Hindu kingdoms", "Oudh"],
  sikh_misls: ["Sikhs", "Lahore"],
  sikh_empire_1840: ["Sikhs", "Lahore"],
  travancore: ["Travancore"],
  mysore_kingdom: ["Mysore"],
  durrani_empire: ["Afghanistan"],
  british_india_company_1840: ["British Raj", "British East India Company"],
  awadh_1840: ["British Raj", "Oudh"],
  hyderabad_1840: ["British Raj", "Golconda", "India"],
  mysore_1840: ["Mysore", "Mysore (Indian princely state)"],
  british_india_1900: ["British Raj"],
  hyderabad_1900: ["British Raj"],
  mysore_1900: ["British Raj"],
  india_british_1939: ["British Raj", "India"],
  india_1962: ["India"],
  south_asia_india: ["India"],
  pakistan_1962: ["Pakistan"],
  south_asia_pakistan: ["Pakistan"],
  south_asia_bangladesh: ["Bangladesh"],
  ceylon_1962: ["Sri Lanka", "Ceylon"],
  south_asia_sri_lanka_nepal_bhutan_maldives: ["Sri Lanka", "Nepal", "Bhutan"],
  nepal_1840: ["Nepal"],
  bengal_sultanate: ["Bengal"],
  gujarat_sultanate: ["Rajastan"],
  mewar: ["Rajastan"],
  ahom_kingdom: ["Hindu states"],
  deccan_chalcolithic_polities: ["Dravidians"],
  deccan_megalithic_chiefdoms: ["Dravidians"],
  deccan_ashmaka_500bce: ["Hindu kingdoms"],
  tamil_chiefdoms_500bce: ["Hindu kingdoms", "Iron Age megalith cultures"],

  // ==================== SOUTHEAST ASIA ====================
  southeast_asia_ban_chiang_networks: ["Austro-Asiatic rice farmers"],
  southeast_asia_dongson_800bce: ["Austro-Asiatic rice farmers"],
  srivijaya_prestate_seasia: ["Austronesians"],
  funan_proto_sea_500bce: ["Austronesians"],
  funan_proto: ["Funan", "Khmer"],
  funan_proto_221_bce: ["Funan", "Khmer"],
  funan_220: ["Funan", "Khmer"],
  funan_476: ["Funan"],
  southeast_asia_chiefdoms: ["Austronesians", "Hindu kingdoms"],
  dong_son_lac_viet: ["Mon-Khmer"],
  pyu_city_states: ["Pyu state", "Burmese"],
  pyu_early_800bce: ["Pyu state", "Burmese"],
  pyu_city_states_476: ["Pyu state", "Pyu"],
  pyu_220: ["Pyu state", "Pyu"],
  linyi_220: ["Champa", "Linyi"],
  champa: ["Champa", "Champa City States"],
  champa_476: ["Champa"],
  khmer_chenla: ["Chen-La"],
  khmer_empire: ["Khmer Empire"],
  khmer_kingdom: ["Cambodia"],
  khmer_oudong: ["Cambodia"],
  khmer_1840: ["Cambodia"],
  dvaravati: ["Dvaravati"],
  srivijaya: ["Srivijaya Empire", "minor states under Indian influence"],
  pagan_kingdom: ["Pagan", "Bagan"],
  dai_viet: ["Đại Việt"],
  singhasari: ["East Java", "Kediri"],
  sukhothai_kingdom: ["Sukhothai"],
  lan_na: ["Lan Na", "Lanna"],
  ayutthaya_kingdom: ["Ayutthaya", "Rattanakosin Kingdom"],
  ayutthaya: ["Ayutthaya"],
  taungoo_burma: ["Ava"],
  taungoo: ["Ava", "Burmese kingdoms"],
  hanthawaddy: ["Burmese kingdoms"],
  malacca_sultanate: ["Malacca"],
  majapahit: ["East Java"],
  konbaung_dynasty: ["Burma"],
  konbaung_burma_1840: ["Burma"],
  nguyen_lords: ["Đại Việt"],
  trinh_lords_le_dynasty: ["Đại Việt"],
  nguyen_vietnam_1840: ["Cochin China", "Đại Việt"],
  lan_xang: ["Laos", "Laotian states"],
  lan_xang_luang_prabang: ["Laos", "Laotian states"],
  vientiane_kingdom: ["Laos", "Laotian states"],
  champasak_kingdom: ["Laos", "Laotian states"],
  lao_luang_prabang_1840: ["Laos", "Cochin China"],
  siam_1840: ["Siam", "Rattanakosin Kingdom"],
  siam_1900: ["Rattanakosin Kingdom"],
  french_indochina_1900: ["French Indochina", "French Indo-China"],
  dutch_east_indies_1840: ["Dutch East Indies"],
  dutch_east_indies_1900: ["Netherlands Indies"],
  brunei_1840: ["Brunei"],
  brunei_1900: ["Brunei"],
  aceh_sultanate: ["Aceh"],
  mataram_sultanate: ["Mataram"],
  makassar_gowa: ["Mataram"],
  north_vietnam_1962: ["Vietnam"],
  south_vietnam_1962: ["Vietnam"],
  cambodia_1962: ["Cambodia"],
  laos_1962: ["Laos"],
  thailand_1962: ["Thailand"],
  burma_1962: ["Burma"],
  malaya_1962: ["Malaysia"],
  singapore_1962: ["Singapore"],
  philippines_1962: ["Philippines"],
  indonesia_1962: ["Indonesia"],

  southeast_asia_mainland_1939: ["Siam", "French Indo-China", "Burma"],
  southeast_asia_maritime_1939: ["Dutch East Indies", "Malaysia", "Philippines"],
  johor_1900: ["Malaya"],

  // ==================== WEST ASIA / MIDDLE EAST ====================
  babylonian_empire: ["Babylonia"],
  kassite_babylonia_rising: ["Babylonia"],
  babylonia_mesopotamia: ["Empire of Alexander", "Seleucid Kingdom", "Babylonia", "Parthia"],
  assur_city_state: ["Assyria"],
  neo_assyrian_empire: ["Assyria"],
  babylonia_800bce: ["Babylonia"],
  urartu_800bce: ["Urartu"],
  mitanni_kingdom: ["Arameans", "state societies and Aramaean kingdoms"],
  yamkhad_remnants: ["state societies and Aramaean kingdoms"],
  ugarit_city_state: ["state societies and Aramaean kingdoms"],
  byblos_city_state: ["state societies and Aramaean kingdoms"],
  hazor_canaanite_kingdom: ["state societies and Aramaean kingdoms"],
  jerusalem_shechem_canaan: ["Kingdom of David and Solomon"],
  israel_kingdom_800bce: ["Kingdom of David and Solomon"],
  judah_kingdom_800bce: ["Kingdom of David and Solomon"],
  aramaean_damascus: ["Arameans", "state societies and Aramaean kingdoms"],
  syro_hittite_states: ["state societies and Aramaean kingdoms"],
  hittite_old_kingdom: ["Hittites"],
  kizzuwatna: ["Hittites"],
  arzawa_west_anatolia: ["Hittites"],
  phoenician_cities_800bce: ["state societies and Aramaean kingdoms"],
  achaemenid_empire_500bce: ["Achaemenid Empire"],
  persian_egypt_satrapy: ["Achaemenid Empire"],
  persian_levant_500bce: ["Achaemenid Empire"],
  persian_anatolia_500bce: ["Achaemenid Empire"],
  seleucid_empire_221_bce: ["Seleucid Kingdom"],
  parthia_arsacid_221_bce: ["Parthia"],
  parthian_empire: ["Parthian Empire", "Parthia"],
  sasanian_empire_220: ["Sasanian Empire", "Parthian Empire"],
  sasanian_empire_476: ["Sasanian Empire"],
  judea_hasmonean_221_bce: ["minor states"],
  judea_temple_state: ["minor states", "Empire of Alexander"],
  nabataea_221_bce: ["Nabatean Kingdom"],
  nabataean_kingdom: ["Nabatean Kingdom"],
  pergamon_221_bce: ["Pergamon"],
  cappadocia_221_bce: ["Cappadocia"],
  pontus_221_bce: ["minor states"],
  bithynia_221_bce: ["minor states"],
  armenia_221_bce: ["Armenia"],
  armenia_orontid: ["Armenia"],
  armenia_220: ["Armenia"],
  armenia_principality: ["Armenia"],
  armenian_cilicia: ["Armenia"],
  osrhoene_220: ["minor states"],
  hatra_220: ["minor states"],
  characene: ["minor states"],
  media_persis_satrapies: ["Achaemenid Empire", "Empire of Alexander"],
  anatolia_satrapies: ["Achaemenid Empire", "Empire of Alexander"],
  levant_coele_syria: ["Seleucid Kingdom", "Empire of Alexander"],
  persian_tribes_800bce: ["Iranian pastoralists"],
  median_tribes_800bce: ["Iranian pastoralists"],
  elam_800bce: ["Elam"],
  elam_sukkalmah: ["Elam"],
  iran_plateau_tribes: ["Iranian pastoralists", "Elam"],
  iran_plateau_800bce: ["Iranian pastoralists", "Elam"],
  dilmun: ["Arabian pastoral nomads"],
  arabian_interior_tribes: ["Arabian pastoral nomads"],
  magan_oman: ["Arabian pastoral nomads"],
  lydia_800bce: ["Phrygians"],
  phrygia_800bce: ["Phrygians"],

  // --- Ottoman and successors ---
  ottoman_empire: ["Ottoman Empire"],
  ottoman_empire_1840: ["Ottoman Empire"],
  ottoman_empire_1900: ["Ottoman Empire"],
  seljuk_rum: ["Seljuk Caliphate", "Seljuk Sultanate of Rum", "Rum"],
  byzantine_empire: ["Byzantine Empire", "Eastern Roman Empire"],
  eastern_roman_empire_476: ["Eastern Roman Empire"],
  turkey_1939: ["Turkey"],
  turkey_1962: ["Turkey"],
  west_asia_turkey_caucasus: ["Turkey", "Georgia", "Armenia", "Azerbaijan"],
  georgian_kingdom: ["Georgia"],

  // --- Iran ---
  safavid_iran: ["Safavid Empire"],
  safavid_order: ["Emirate of the White Sheep Turks", "Persia"],
  aq_qoyunlu: ["Emirate of the White Sheep Turks"],
  afsharid_iran: ["Persia"],
  qajar_iran_1840: ["Persia"],
  qajar_iran_1900: ["Persia"],
  iran_1939: ["Iran"],
  iran_1962: ["Iran"],
  west_asia_iran: ["Iran"],

  // --- Iraq ---
  iraq_1939: ["Mesopotamia (GB)", "Iraq"],
  iraq_1962: ["Iraq"],
  west_asia_iraq: ["Iraq"],

  // --- Arabian Peninsula ---
  arabian_tribes: ["Arabs", "Arabian pastoral nomads", "Hadramaut", "Saba"],
  arabian_tribes_500bce: ["Arabian pastoral nomads"],
  arabian_tribes_800bce: ["Arabian pastoral nomads"],
  arabian_tribal_polities: ["Arabs", "Muscat", "Yemen"],
  saba_500bce: ["Saba"],
  saba_himyar: ["Himyarite Kingdom", "Saba"],
  saba_himyar_arabia_221_bce: ["Saba"],
  saba_hadramawt_220: ["Himyarite Kingdom", "Hadramaut"],
  himyar_476: ["Himyarite Kingdom"],
  kindah_476: ["Himyarite Kingdom"],
  ghassanids_476: ["Himyarite Kingdom"],
  lakhmids_476: ["Sasanian dependencies", "Lakhmids"],
  yemen_hadramawt: ["Yemen", "Hadramaut"],
  yemen_zaydi_imamate: ["Yemen"],
  yemen_zaidi_imamate: ["Yemen"],
  saudi_imamate_oman: ["Oman"],
  saudi_diriyah: ["Arabia", "Nejd"],
  saudi_second_state_1840: ["Arabia", "Nejd"],
  saudi_emirate_1900: ["Arabia"],
  al_rashid_jabal_shammar_1900: ["Arabia"],
  mutawakkil_yemen_1900: ["Yemen", "Arabia"],
  oman_1840: ["Oman"],
  oman_empire: ["Oman"],
  emirate_of_kuwait_1900: ["Arabia"],
  qasimi_imamate: ["Oman"],
  saudi_1962: ["Saudi Arabia"],
  north_yemen_1962: ["Yemen"],
  aden_1962: ["Yemen"],
  israel_1962: ["Israel"],
  jordan_1962: ["Jordan"],
  syria_1962: ["Syria"],
  lebanon_1962: ["Lebanon"],
  levant_1939: ["Mandatory Palestine (GB)", "Jordan", "Syria (France)", "Lebanon"],
  arabia_1939: ["Saudi Arabia", "Yemen", "Muscat and Oman"],
  west_asia_levant_israel_palestine_jordan_lebanon_syria: ["Israel", "Jordan", "Syria", "Lebanon"],
  arabia_gulf_states: ["Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Oman", "Yemen"],

  // ==================== AFRICA ====================
  // --- Egypt ---
  egypt_second_intermediate: ["Egypt"],
  hyksos_avaris: ["Egypt"],
  egypt_22nd_dynasty: ["Egypt"],
  egypt_satrapy: ["Empire of Alexander", "Ptolemaic Kingdom"],
  ptolemaic_egypt_221_bce: ["Ptolemaic Kingdom"],
  roman_egypt: ["Roman Empire"],
  roman_egypt_220: ["Roman Empire"],
  ayyubid_sultanate_egypt: ["Fatimid Caliphate"],
  mamluk_sultanate: ["Mamluke Sultanate"],
  mamluk_beys_egypt: ["Egypt", "Mamluke Sultanate"],
  egypt_khedival_1840: ["Egypt"],
  khedivate_egypt_1900: ["Egypt"],
  egypt_1939: ["Egypt"],
  egypt_1962: ["Egypt"],

  // --- North Africa ---
  berber_north_africa: ["Berbers"],
  cyrenaica: ["Empire of Alexander", "Ptolemaic Kingdom", "Cyraneica (UK Lybia)"],
  berber_mauretanian_polities_476: ["Berbers"],
  libyan_tribes: ["Berbers"],
  numidia_221_bce: ["Numidia", "Berbers"],
  numidia_323: ["Numidia", "Berbers"],
  almohad_caliphate: ["Almohad Caliphate"],
  marinid_sultanate: ["Merinides"],
  hafsid_ifriqiya: ["Hafsid Caliphate"],
  hafsid_tunis: ["Hafsid Caliphate"],
  morocco_wattasid: ["Wattasid Caliphate"],
  morocco_alaouite: ["Morocco"],
  morocco_1840: ["Morocco"],
  morocco_1900: ["Morocco"],
  regency_of_algiers: ["Algiers"],
  beylik_of_tunis: ["Tunis"],
  algerian_resistance_1840: ["Algiers", "Algeria (FR)"],
  ifriqiya_egypt_umayyad: ["Umayyad Caliphate"],
  al_andalus: ["Emirate of Córdoba", "Umayyad Caliphate"],
  maghreb_berber_polities: ["Mauri", "Berber Tribes"],
  north_west_africa_1939: ["Algeria (France)", "Morocco (France)", "Tunisia"],
  africa_north_maghreb: ["Algeria", "Morocco", "Tunisia", "Libya"],

  // --- West Africa ---
  nok_culture_west_africa: ["West African cereal farmers"],
  nok_west_africa_500bce: ["West African cereal farmers"],
  west_africa_nok_prestate: ["West African cereal farmers"],
  west_african_tribal_polities: ["West African cereal farmers"],
  west_african_tribes: ["West African cereal farmers"],
  west_african_chiefdoms_220: ["West African cereal farmers"],
  west_african_sahel_polities_476: ["West African cereal farmers"],
  ghana_empire: ["Ghana", "Empire of Ghana"],
  mali_manden: ["Mali"],
  mali_empire: ["Mali"],
  songhai: ["Songhai"],
  oyo_empire: ["Oyo"],
  benin_kingdom: ["Benin"],
  asante_empire: ["Asante"],
  ashanti_confederacy_1900: ["Asante"],
  kingdom_of_dahomey: ["Dahomey"],
  sokoto_1840: ["Sokoto Caliphate", "Fulani Empire", "Hausa States"],
  sokoto_caliphate_1900: ["Sokoto Caliphate"],
  futa_jallon_imamate: ["Futa Jalon", "Futa Toro", "Senegal"],
  segu_bambara: ["Segu"],
  masina_1840: ["Segu", "Fulani Empire"],
  ghana_1962: ["Ghana"],
  nigeria_1962: ["Nigeria"],
  west_africa_independent_1939: ["Liberia"],
  africa_west_nigeria_ghana_sahel: ["Nigeria", "Ghana", "Mali", "Niger", "Burkina Faso", "Senegal", "Guinea", "Ivory Coast", "Togo", "Benin", "Sierra Leone", "Liberia", "Gambia, The"],
  ghana_successor_states: ["Ghana"],

  // --- East Africa ---
  kerma_kingdom: ["Kush"],
  kush_napata_800bce: ["Kush"],
  kush_meroitic_221_bce: ["Meroe"],
  kingdom_kush: ["Kush", "Meroe"],
  meroitic_kush: ["Meroe"],
  meroitic_kush_220: ["Meroe"],
  meroe_nubia_500bce: ["Meroe"],
  aksum_prestate_500bce: ["Ethiopian highland farmers"],
  aksum_proto_221_bce: ["Ethiopian highland farmers"],
  aksum: ["Axum"],
  aksum_220: ["Axum"],
  aksum_476: ["Axum"],
  aksum_prestate_east_africa: ["Ethiopian highland farmers"],
  ethiopian_kingdom: ["Ethiopia", "Abyssinia"],
  ethiopian_empire: ["Ethiopia"],
  ethiopia: ["Ethiopia"],
  ethiopian_empire_1900: ["Ethiopia"],
  ethiopia_1840: ["Ethiopia"],
  ethiopia_1939: ["Ethiopia (Italy)", "Ethiopia"],
  ethiopia_1962: ["Ethiopia"],
  makuria: ["Makkura"],
  makuria_476: ["Makkura"],
  nobatia_476: ["Nobatia", "Makkura"],
  blemmyes_476: ["Blemmyes"],
  kingdom_of_nubia_makuria: ["Makkura"],
  funj_sultanate: ["Funj"],
  darfur_sultanate: ["Darfur"],
  anglo_egyptian_sudan_1900: ["Sudan", "Egypt", "Harer (Egypt)"],
  mahdist_successor_darfur_1900: ["Sudan", "Egypt"],
  sudan_nubia_1939: ["Sudan"],
  sudan_1962: ["Sudan"],
  kilwa_sultanate: ["Islamic city-states"],
  sultanate_of_kilwa_omani: ["Zanzibar"],
  sultanate_of_zanzibar_1900: ["Sultinate of Zanzibar"],
  zanzibar_1840: ["Zanzibar"],
  ajuran_sultanate: ["Islamic city-states"],
  ajuran_geledi_successors: ["Islamic city-states"],
  adal_sultanate: ["Adal"],
  congo_free_state_1900: ["Belgian Congo", "Zaire", "Zaire (Belgium)", "Congo"],
  congo_1962: ["Zaire", "Congo"],
  kenya_colony_1962: ["Kenya"],
  somalia_1962: ["Somalia"],
  east_africa_colonial_1939: ["Kenya", "Tanzania, United Republic of", "Uganda"],
  africa_east_horn_swahili: ["Ethiopia", "Kenya", "Tanzania, United Republic of", "Somalia", "Uganda", "Djibouti", "Eritrea"],
  africa_central_congo_region: ["Congo", "Cameroon", "Central African Republic", "Gabon"],
  beja_polities: ["Bega"],
  punt_trade_chiefdoms: ["Ethiopian highland farmers"],
  punt_horn_polities: ["Ethiopian highland farmers"],
  alodia: ["Alwa"],
  garamantes: ["Guanches"],
  garamantes_220: ["Guanches"],
  garamantes_iron: ["Guanches", "Saharan pastoral nomads"],
  garamantes_500bce: ["Guanches", "Saharan pastoral nomads"],
  bantu_east_african_polities: ["Bantou", "Bantu"],
  bantu_east_africa_220: ["Bantou", "Bantu"],
  bantu_early_500bce: ["West African cereal farmers", "Bantou"],
  d_mt_500bce: ["Ethiopian highland farmers"],

  // --- Southern Africa ---
  south_africa_1939: ["Union of South Africa", "South Africa"],
  south_africa_1962: ["South Africa"],
  africa_southern_region: ["South Africa", "Zimbabwe", "Zambia", "Mozambique", "Botswana", "Namibia", "Malawi", "Lesotho", "Swaziland"],
  zulu_1840: ["Zululand", "Zulu"],
  merina_1840: ["Expansionist Kingdom of Merina", "Imerina"],
  ndongo_matamba: ["Ndongo"],
  kingdom_kongo: ["Congo"],
  kongo_kingdom: ["Congo"],
  liberia_1900: ["Liberia"],

  // ==================== EUROPE ====================
  // --- Greece ---
  greek_poleis_800bce: ["Greek city-states"],
  greek_city_states_500bce: ["Greek city-states"],
  athenian_polity: ["Greek city-states"],
  sparta: ["Greek city-states"],
  sparta_early_800: ["Greek city-states"],
  sparta_500bce: ["Greek city-states"],
  athens_500bce: ["Greek city-states"],
  macedon_500bce: ["Greek city-states", "Macedon and Hellenic League"],
  thrace_500bce: ["Thrace"],
  macedon_greece: ["Greek city-states"],
  macedonian_empire_323: ["Empire of Alexander"],
  macedon_221_bce: ["Macedon and Hellenic League"],
  achaean_league_221_bce: ["Macedon and Hellenic League"],
  aetolian_league_221_bce: ["Macedon and Hellenic League"],
  spartan_state_221_bce: ["Macedon and Hellenic League"],
  thrace_tribal_kingdoms: ["Thrace", "Celts"],
  minoan_crete: ["Greek city-states"],
  mycenaeans: ["Greek city-states"],
  troy_wilusa: ["Greek city-states"],
  sicily_iron: ["Sicily", "Greek city-states"],
  sicily_500bce: ["Sicily", "Greek city-states"],
  cyrene_500bce: ["Cyrene", "Greek city-states"],
  greece_1962: ["Greece"],

  // --- Rome ---
  etruscan_chiefdoms: ["Etrurians", "Etruria"],
  etruscan_cities: ["Etrurians", "Rome"],
  etruscan_league_500bce: ["Etrurians", "Rome"],
  rome_kingdom_800bce: ["Greek city-states"],
  roman_republic_500bce: ["Rome"],
  rome_republic: ["Rome"],
  rome_republic_221_bce: ["Rome"],
  samnite_confederation: ["Samnites", "Sabines"],
  greek_sicily_south_italy: ["Greek city-states"],
  carthage: ["Carthaginian Empire", "Carthage"],
  carthage_221_bce: ["Carthaginian Empire", "Carthage"],
  carthage_500bce: ["Carthaginian Empire"],
  carthage_800bce: ["Carthaginian Empire", "Carthage"],
  roman_empire: ["Roman Empire"],
  roman_empire_220: ["Roman Empire"],
  gaul_hispania_romanized: ["Roman Empire"],
  dacian_kingdom: ["Dacia"],
  dacia_323: ["Dacia", "Illyrians"],
  dacia_proto_800: ["Dacia", "Thrace"],
  dacia_500bce: ["Dacia", "Thrace"],
  sardinia_nuragic: ["Sardinia"],
  sardinia_500bce: ["Sardinia", "Greek city-states"],
  corsica_iron: ["Corsica", "Greek city-states"],
  cyprus_bronze: ["Cyprus", "Greek city-states"],
  cyprus_800bce: ["Cyprus", "Greek city-states"],
  italy_1939: ["Italy"],
  italy_1962: ["Italy"],
  italy_microstates: ["Italy"],

  // --- Western Europe ---
  celtic_europe_500bce: ["Celts", "Boii"],
  hallstatt_celtic_chiefdoms: ["Urnfield cultures"],
  central_europe_tumulus: ["Urnfield cultures"],
  gaulish_tribes: ["Celts"],
  gaul_tribes_221_bce: ["Celts"],
  gaul_celts_323: ["Celts", "Boii"],
  british_tribes: ["Celts"],
  brittonic_tribes: ["Celts"],
  brittonic_tribes_221_bce: ["Celts"],
  celtiberian_polities_221_bce: ["Celtiberians", "Celts"],
  iberian_polities_221_bce: ["Celtiberians", "Celts"],
  iberian_tartessos: ["Celtiberians", "Celts"],
  iberian_bronze_argar: ["Celtiberians", "Celts"],
  iberian_tribes: ["Celtiberians", "Celts"],
  maltese_temple_society_late: ["Greek city-states"],
  italy_terramare_apennine: ["Illyrians"],
  british_isles_wessex: ["N. European Bronze Age cultures"],
  irish_bronze_cultures: ["N. European Bronze Age cultures", "Celts"],
  nordic_bronze_networks: ["N. European Bronze Age cultures"],
  nordic_bronze_iron_transition: ["N. European Bronze Age cultures"],

  // --- Frankish/French ---
  frankish_salian_kingdom_476: ["Franks"],
  frankish_kingdom: ["Frankish Kingdom", "Carolingian Empire"],
  burgundian_kingdom_476: ["Burgunds"],
  syagrius_domain_476: ["Franks"],
  kingdom_of_france: ["Kingdom of France", "France"],
  kingdom_france: ["France"],
  france: ["France"],
  france_july_monarchy_1840: ["France"],
  france_third_republic_1900: ["France"],
  france_1939: ["France"],
  france_1962: ["France"],
  europe_west_eu_core: ["France", "Germany", "Netherlands", "Belgium", "Luxembourg", "Switzerland", "Austria"],

  // --- British ---
  anglo_saxon_england: ["Anglo-Saxons", "Wessex"],
  angles_jutes_britain_476: ["Anglo-Saxons"],
  saxons_476: ["Saxons"],
  sub_roman_britain_476: ["Celtic kingdoms", "Britons"],
  picts_476: ["Picts", "Pictland", "Celtic kingdoms"],
  scotti_dalriada_476: ["Scots", "Celtic kingdoms", "Dal Riata"],
  kingdom_of_england: ["Angevin Empire", "English territory", "England"],
  england: ["England"],
  english_commonwealth: ["England and Ireland"],
  kingdom_of_scotland: ["Scotland", "Scottland"],
  scotland: ["Scottland", "Scotland"],
  kingdom_of_great_britain: ["United Kingdom", "United Kingdom of Great Britain and Ireland"],
  united_kingdom_1840: ["United Kingdom of Great Britain and Ireland", "United Kingdom"],
  british_empire_home_1900: ["United Kingdom of Great Britain and Ireland", "United Kingdom"],
  united_kingdom_1939: ["United Kingdom"],
  uk_1962: ["United Kingdom"],

  // --- Germany / HRE ---
  germanic_tribes: ["Celts"],
  germanic_tribes_221_bce: ["Celts"],
  germanic_northern_tribes: ["Celts"],
  germanic_confederations_220: ["Heruli"],
  northern_europe_tribes_500bce: ["N. European Bronze Age cultures"],
  holy_roman_empire: ["Holy Roman Empire"],
  holy_roman_german_states: ["Holy Roman Empire"],
  german_empire_1900: ["Germany"],
  germany_1939: ["Germany"],
  west_germany_1962: ["West Germany"],
  east_germany_1962: ["East Germany"],

  // --- Iberian ---
  visigothic_kingdom_476: ["Visigoths", "Visigothic Kingdom"],
  suebi_kingdom_476: ["Sveves"],
  vandal_kingdom_476: ["Vandals"],
  asturias: ["Asturias", "Visigothic Kingdom"],
  kingdom_of_castile: ["Castilla", "Castile"],
  crown_of_aragon: ["Aragón"],
  nasrid_emirate: ["Granada"],
  kingdom_of_portugal: ["Portugal"],
  spain: ["Spain", "Castille", "Castilla"],
  spanish_monarchy: ["Spain"],
  kingdom_of_spain: ["Spain"],
  spain_1840: ["Spain"],
  spain_1900: ["Spain"],
  spain_1939: ["Spain"],
  spain_1962: ["Spain"],
  portugal: ["Portugal"],
  portugal_restoration: ["Portugal"],
  portuguese_kingdom: ["Portugal"],
  portugal_1840: ["Portugal"],
  portugal_1900: ["Portugal"],
  portugal_1939: ["Portugal"],
  portugal_1962: ["Portugal"],
  europe_south_iberia_balkans: ["Spain", "Portugal", "Greece", "Romania", "Bulgaria", "Serbia", "Croatia", "Albania", "Bosnia and Herzegovina"],

  // --- Italian states ---
  odoacer_kingdom_italy_476: ["Ostrogoths"],
  ostrogoths_pannonia_476: ["Ostrogoths"],
  gepids_476: ["Ostrogoths"],
  lombard_kingdom: ["Lombard principalities", "Lombard duchies"],
  venice: ["Venice", "Venetia"],
  venice_republic: ["Venice", "Venetia"],
  papal_states: ["Papal States", "Lombard principalities"],
  papal_states_1840: ["Papal States"],
  florence: ["Florence", "Tuscany"],
  medici_tuscany: ["Tuscany"],
  savoy: ["Sardinia-Piedmont"],
  sardinia_piedmont: ["Sardinia-Piedmont", "Kingdom of Sardinia"],
  sardinia_piedmont_1840: ["Kingdom of Sardinia"],
  kingdom_two_sicilies_1840: ["Kingdom of the Two Sicilies"],
  kingdom_of_naples_sicily: ["Kingdom of the Two Sicilies", "Naples"],
  sicily: ["Sicily", "Kingdom of Sicily"],
  milan: ["Milan", "Lombardy"],
  italy_kingdom_1900: ["Italy"],

  // --- Nordic ---
  danish_polities: ["Danes"],
  swedish_polities: ["Swedes", "Swedes and Goths"],
  kingdom_of_denmark: ["Denmark"],
  kingdom_of_norway: ["Norway"],
  kingdom_of_sweden: ["Sweden"],
  denmark_norway: ["Denmark-Norway"],
  sweden_age_of_liberty: ["Sweden"],
  swedish_empire: ["Sweden"],
  sweden_norway_1840: ["Sweden–Norway"],
  sweden_norway_1900: ["Sweden–Norway"],
  denmark_1840: ["Denmark"],
  denmark_1900: ["Denmark"],
  scandinavia_1939: ["Norway", "Sweden", "Denmark", "Finland"],
  sweden_1962: ["Sweden"],
  europe_north_nordic_baltic: ["Sweden", "Norway", "Denmark", "Finland", "Iceland", "Estonia", "Latvia", "Lithuania"],

  // --- Eastern Europe ---
  kingdom_of_poland: ["Poland"],
  kingdom_of_hungary: ["Hungary"],
  hungary: ["Hungary", "Imperial Hungary"],
  habsburg_monarchy: ["Austrian Empire", "Austria Hungary"],
  austrian_empire_1840: ["Austrian Empire"],
  austro_hungarian_empire_1900: ["Austria Hungary"],
  prussia: ["Prussia"],
  prussia_1840: ["Prussia"],
  second_bulgarian_empire: ["Bulgar Khanate"],
  bulgar_empire: ["Bulgars", "Danube Bulgars"],
  kingdom_of_serbia: ["Serbia"],
  poland_lithuania: ["Poland-Lithuania"],
  polish_lithuanian_commonwealth: ["Polish–Lithuanian Commonwealth", "Poland"],
  moscow_grand_principality: ["Grand Duchy of Moscow"],
  ruthenian_principalities: ["Principality of Galicia-Volhynia", "Principality of Kyiv", "Other Rus Principalities"],
  moravia_slavic_polities: ["Moravians", "Slavonic tribes"],
  tsardom_russia: ["Tsardom of Muscovy"],
  russian_empire: ["Russian Empire"],
  russian_empire_1840: ["Russian Empire"],
  russian_empire_1900: ["Russian Empire"],
  soviet_union_1939: ["USSR"],
  ussr_1962: ["USSR"],
  west_asia_russia: ["Russia", "USSR"],
  poland_1939: ["Poland"],
  poland_1962: ["Poland"],
  czechoslovakia_remnants_1939: ["Czechoslovakia"],
  czechoslovakia_1962: ["Czechoslovakia"],
  yugoslavia_1939: ["Yugoslavia"],
  yugoslavia_1962: ["Yugoslavia"],
  europe_east_ukraine_belarus_moldova: ["Ukraine", "Byelarus", "Moldova"],

  // --- Dutch / Belgium ---
  dutch_republic: ["Dutch Republic", "Netherlands"],
  netherlands_1900: ["Netherlands"],
  belgium_1900: ["Belgium"],

  // ==================== AMERICAS ====================
  // --- Mesoamerica ---
  olmec_precursors: ["Olmec"],
  olmec_san_lorenzo_laventa: ["Olmec"],
  olmec_epi_olmec_500bce: ["Olmec", "Maya chiefdoms and states"],
  olmec_epiolmec_successors: ["Olmec", "Maya chiefdoms and states"],
  teotihuacan: ["Teotihuacán", "Teotihuacàn"],
  teotihuacan_220: ["Teotihuacán", "Teotihuacàn"],
  teotihuacan_476: ["Teotihuacàn"],
  teotihuacan_successors: ["Mesoamerican city-states and chiefdoms", "Teotihuacàn", "Maya states"],
  maya_preclassic_early: ["Maya chiefdoms and states", "Olmec", "Maize farmers"],
  maya_preclassic: ["Maya chiefdoms and states"],
  maya_preclassic_chiefdoms: ["Maya chiefdoms and states", "Maize farmers", "Olmec"],
  maya_preclassic_221_bce: ["Maya chiefdoms and states"],
  maya_lowlands_220: ["Maya chiefdoms and states"],
  maya_calakmul_476: ["Maya states"],
  maya_tikal_476: ["Maya states"],
  maya_copan_476: ["Maya states"],
  maya_city_states: ["Maya city-states", "Maya states"],
  maya_politanies: ["Maya city-states"],
  maya_polities: ["Maya city-states", "Maya"],
  maya_postclassic: ["Maya city-states"],
  toltec_legacy: ["Toltec Empire"],
  aztec_empire: ["Aztec Empire"],
  monte_alban_476: ["Monte Albàn", "Monte Alb?n", "Monte Albán"],
  zapotec: ["Monte Albán", "Zapotec Empire"],
  zapotec_220: ["Monte Albán"],
  zapotec_221_bce: ["Monte Albán"],
  zapotec_monte_alban_500bce: ["Monte Albán", "Olmec", "Maya chiefdoms and states"],
  mexica_preimperial: ["Mesoamerican city-states and chiefdoms"],
  mixtec_polities: ["Mixtec Empire"],
  tarascan_proto_state: ["Mesoamerican city-states and chiefdoms"],
  tarascan_state: ["Mesoamerican city-states and chiefdoms"],
  mississippian_chiefdoms: ["Eastern North Amercian hunter-gatherers"],

  // --- South America ---
  andean_norte_chico_successors: ["Andean hunter-gatherers"],
  andean_regional_chiefdoms_500bce: ["Andean hunter-gatherers", "Chavin"],
  andean_highland_polities: ["Andean hunter-gatherers"],
  andean_formative_polities: ["Andean hunter-gatherers", "Chavin"],
  andean_chavin_successors: ["Chavin"],
  andean_regional_states: ["Andean states and chiefdoms", "Huari Empire", "Chimú Empire", "Andean hunter-gatherers"],
  chavin_500bce: ["Chavin"],
  chavin_horizon: ["Chavin"],
  chavin_successor_andes_221_bce: ["Chavin"],
  moche_early: ["Moche"],
  moche_220: ["Moche"],
  moche_476: ["Moche"],
  nasca_early: ["Nazca"],
  nazca_220: ["Nazca"],
  nazca_476: ["Nazca"],
  recuay_highland_polities_476: ["Moche"],
  chimor: ["Chimú Empire"],
  aymara_lordships: ["Aymara kingdoms"],
  kingdom_of_cusco: ["Andean states and chiefdoms"],
  inca_empire: ["Inca Empire"],
  muisca_confederation: ["Amazon hunter-gatherers"],
  amazonian_chiefdoms: ["Amazon hunter-gatherers"],
  amazonian_chiefdoms_220: ["Amazon hunter-gatherers"],
  amazonia_chiefdoms_221_bce: ["Amazon hunter-gatherers"],
  guarani_tupi_polities_476: ["Amazon hunter-gatherers"],
  west_mexico_chiefdoms_221_bce: ["Mesoamerican city-states and chiefdoms", "Maize farmers", "Maya chiefdoms and states"],
  wari_empire: ["Huari Empire"],
  tiwanaku: ["Tiahuanaco Empire"],
  mapuche: ["Pampas cultures"],
  mapuche_territories: ["Pampas cultures"],
  inca_remnant_vilcabamba_legacy: ["Pampas cultures"],
  inca_frontier_amazonian_polities_1900: ["Amazon hunter-gatherers"],

  // --- North America ---
  new_spain: ["Vice-Royalty of New Spain"],
  viceroyalty_new_spain: ["Vice-Royalty of New Spain", "Vice Royalty of New Spain"],
  viceroyalty_peru: ["Vice-Royalty of Peru", "Vice Royalty of Peru"],
  portuguese_brazil: ["Portuguese Brazil", "Vice-Royalty of Brazil"],
  dutch_brazil: ["Dutch Brazil"],
  iroquois_confederacy: ["Iroquois"],
  powhatan_remnants: ["Virginia"],
  miskito_kingdom: ["Belize"],
  usa_1900: ["United States of America"],
  us_1840: ["United States of America", "United States"],
  united_states_1939: ["United States"],
  usa_1962: ["United States"],
  north_america_usa: ["United States"],
  canada_1939: ["Canada"],
  north_america_canada: ["Canada"],
  mexico_1840: ["Mexico", "Vice-Royalty of New Spain"],
  mexico_1900: ["Mexico"],
  north_america_mexico: ["Mexico"],
  mexico_1962: ["Mexico"],
  cuba_us_occupation_1900: ["Cuba", "Kingdom of Hawaii"],
  cuba_1962: ["Cuba"],
  guatemala_1900: ["Guatemala"],
  central_american_republic_1840: ["Guatemala", "El Salvador", "Honduras", "Nicaragua", "Costa Rica", "Vice-Royalty of New Spain"],
  central_america_states: ["Guatemala", "El Salvador", "Honduras", "Nicaragua", "Costa Rica", "Panama", "Belize", "Cuba", "Dominican Republic", "Haiti", "Jamaica"],

  // --- South America (modern) ---
  brazil_empire_1840: ["Kingdom of Brazil", "Viceroyalty of Brazil", "Vice-Royalty of Brazil"],
  brazil_1900: ["Kingdom of Brazil", "Brazil"],
  brazil_1962: ["Brazil"],
  south_america_brazil: ["Brazil"],
  argentina_1900: ["Argentina"],
  argentina_1962: ["Argentina"],
  south_america_southern_cone: ["Argentina", "Chile", "Uruguay", "Paraguay"],
  argentine_confederation_1840: ["Argentina", "United Provinces of La Plata", "Viceroyalty of the Río de la Plata"],
  chile_1840: ["Chile", "Vice-Royalty of Peru"],
  chile_1900: ["Chile"],
  peru_1840: ["Peru", "Vice-Royalty of Peru"],
  peru_1900: ["Peru"],
  peru_1962: ["Peru"],
  south_america_andean_states: ["Peru", "Bolivia", "Ecuador", "Colombia", "Venezuela"],
  bolivia_1840: ["Bolivia", "Vice-Royalty of Peru"],
  bolivia_1900: ["Bolivia"],
  new_granada_1840: ["Colombia", "Vice-Royalty of New Granada"],
  ecuador_1840: ["Ecuador", "Vice-Royalty of New Granada"],
  uruguay_1840: ["Uruguay", "Viceroyalty of the Río de la Plata"],
  haiti_1840: ["Haiti"],
  latin_america_1939: ["Mexico", "Cuba", "Guatemala"],
  south_america_states_1939: ["Brazil", "Argentina", "Chile", "Peru", "Colombia", "Venezuela", "Bolivia", "Ecuador", "Paraguay", "Uruguay"],

  // ==================== OCEANIA ====================
  oceania_australia_new_zealand_pacific: ["Australia", "New Zealand", "Papua New Guinea", "Fiji"],
  modern_papua_new_guinea: ["Papua New Guinea"],
  modern_fiji: ["Fiji"],
  modern_solomon_islands: ["Solomon Islands"],
  modern_vanuatu: ["Vanuatu", "New Hebrides"],

  // ==================== TIBET ====================
  tibetan_empire: ["Tibetan Empire", "Tufan Empire", "Tibet"],

  // ==================== OTHER (Crusader states, etc.) ====================
  principality_of_antioch: ["Armenia"],
  kingdom_of_jerusalem: ["Armenia"],
  county_of_tripoli: ["Armenia"],
  crusader_remnants: ["Armenia"],
  cilician_armenia: ["Armenia"],
  mongol_khwarazm_frontier: ["Khanate of the Golden Horde"],
  oman_hormuz_trade: ["Muscat", "Oman"],
  tao_klarjeti: ["Georgian Kingdom"],
  abbasid_caliphate: ["Buwayhid Emirates", "Buyiids"],
  abbasid_revolution: ["Abbasid Caliphate", "Umayyad Caliphate"],
  umayyad_caliphate: ["Umayyad Caliphate"],

  // --- Steppe peoples ---
  hephthalites_476: ["Kushan Principalities"],
  northern_zhou_weishu_476: ["Toba Wei"],

  // --- Afghanistan ---
  afghanistan_1840: ["Afghanistan"],
  afghanistan_1900: ["Afghanistan"],
  afghanistan_1939: ["Afghanistan"],
  afghanistan_1962: ["Afghanistan"],

  // --- Cold War & Modern catch-alls ---
  kanem_bornu: ["Bornu-Kanem", "Kanem-Bornu"],
  carlo_remnant: [],

  // ============================================
  // Expanded civilizations — basemap name matches
  // ============================================

  // --- Ainu ---
  ainu_jomon: ["Ainu"],
  ainu_iron: ["Ainu"],
  ainu_220: ["Ainu"],
  ainu_476: ["Ainu"],
  ainu_750: ["Ainu"],
  ainu_han: ["Ainu"],

  // --- Austronesian ---
  austronesian_expansion: ["Austronesians"],
  austronesian_iron: ["Austronesians"],
  austronesian_axial: ["Austronesians"],
  austronesian_nusantara_220: ["Austronesians"],
  austronesian_476: ["Austronesians"],

  // --- Saharan & Desert ---
  saharan_pastoralists: ["Saharan pastoral nomads"],
  saharan_pastoralists_ia: ["Saharan pastoral nomads"],
  saharan_cattle_bronze: ["Saharan pastoral nomads"],
  desert_hunter_gatherers: ["Desert hunter-gatherers"],
  desert_hunter_gatherers_ia: ["Desert hunter-gatherers"],
  desert_hunter_axial: ["Desert hunter-gatherers"],
  desert_hunter_hellen: ["Desert hunter-gatherers"],
  desert_hunter_qin: ["Desert hunter-gatherers"],

  // --- Khoisan ---
  khoisan_peoples: ["Khoiasan"],
  khoisan_ia: ["Khoiasan"],
  khoisan_axial: ["Khoiasan"],
  khoisan_hellen: ["Khoiasan"],
  khoisan_qin: ["Khoiasan"],
  khoisan_han: ["Khoiasan"],
  khoisan_220: ["Khoiasan"],
  khoisan_476: ["Khoiasan"],
  khoisan_750: ["Khoiasan"],
  khoisan_1200: ["Khoiasan"],
  khoisan_1280: ["Khoiasan"],
  khoisan_1500: ["Khoiasan"],
  khoisan_1648: ["Khoiasan"],
  khoisan_1750: ["Khoiasan"],

  // --- Paleo-Siberian ---
  paleo_siberian_hunters: ["Paleo-Siberian hunter-gatherers"],
  paleo_siberian_ia: ["Paleo-Siberian hunter-gatherers"],
  paleo_siberian_axial: ["Paleo-Siberian hunter-gatherers"],
  paleo_siberian_hellen: ["Paleo-Siberian hunter-gatherers"],
  paleo_siberian_qin: ["Paleo-Siberian hunter-gatherers"],
  paleo_siberian_han: ["Paleo-Siberian hunter-gatherers"],
  paleo_siberian_476: ["Paleo-Siberian hunter-gatherers"],

  // --- Arctic marine ---
  arctic_marine_hunters: ["Arctic marine mammal hunters"],
  arctic_hunters_ia: ["Arctic marine mammal hunters"],
  arctic_hunters_axial: ["Arctic marine mammal hunters"],

  // --- Plains bison ---
  plain_bison_hunters: ["Plain bison hunters"],
  plain_bison_hunters_ia: ["Plain bison hunters"],
  plain_bison_axial: ["Plain bison hunters"],

  // --- Papuan ---
  papuan_farmers: ["Papuan neolithic farmers"],
  papuan_ia: ["Papuan neolithic farmers"],
  papuan_ax: ["Papuan neolithic farmers"],
  papuan_hel: ["Papuan neolithic farmers"],
  papuan_qin: ["Papuan neolithic farmers"],
  papuan_han: ["Papuan neolithic farmers"],
  papuan_220: ["Papuan neolithic farmers"],
  papuan_476: ["Papuan neolithic farmers"],
  papuan_750: ["Papuan neolithic farmers"],

  // --- Lapita ---
  lapita_ia: ["Austronesians", "Lapita", "Polynesians"],
  lapita_polynesian_ax: ["Austronesians", "Lapita", "Polynesians"],

  // --- Polynesian ---
  ancestral_polynesian_hel: ["Austronesians", "Polynesians"],
  polynesian_qin: ["Austronesians", "Polynesians"],
  polynesian_han: ["Austronesians", "Polynesians"],
  polynesian_220: ["Austronesians", "Polynesians"],
  polynesian_476: ["Austronesians", "Polynesians"],
  polynesian_750: ["Austronesians", "Polynesians"],

  // --- Caribbean ---
  caribbean_hunter_gatherers: ["Caribbean hunter-gatherers"],
  caribbean_ia: ["Caribbean hunter-gatherers"],
  caribbean_axial: ["Caribbean hunter-gatherers"],
  caribbean_hellen: ["Caribbean hunter-gatherers"],
  caribbean_qin: ["Caribbean hunter-gatherers"],
  caribbean_han: ["Caribbean hunter-gatherers"],
  caribbean_220: ["Caribbean hunter-gatherers"],
  caribbean_476: ["Caribbean hunter-gatherers"],
  caribbean_750: ["Caribbean hunter-gatherers"],

  // --- Saami ---
  saami_peoples: ["Saami"],
  saami_ia: ["Saami"],
  saami_axial: ["Saami"],

  // --- Maize/Manioc farmers ---
  maize_farmers_mesoamerica: ["Maize farmers"],
  maize_farmers_ia: ["Maize farmers"],
  manioc_farmers_amazonia: ["Manioc farmers"],

  // --- Finno-Ugric ---
  finno_ugric_hunters: ["Finno-Ugric taiga hunter-gatherers"],
  finno_ugric_ia: ["Finno-Ugric taiga hunter-gatherers"],
  finno_ugric_axial: ["Finno-Ugric taiga hunter-gatherers"],
  finno_ugric_hellen: ["Finno-Ugric taiga hunter-gatherers"],
  finno_ugric_qin: ["Finno-Ugric taiga hunter-gatherers"],
  finno_ugric_han: ["Finno-Ugric taiga hunter-gatherers"],
  finno_ugric_220: ["Finno-Ugric taiga hunter-gatherers"],

  // --- Pampas ---
  pampas_cultures_ba: ["Pampas cultures"],
  pampas_ia: ["Pampas cultures"],
  pampas_axial: ["Pampas cultures"],
  pampas_hellen: ["Pampas cultures"],
  pampas_qin: ["Pampas cultures"],
  pampas_han: ["Pampas cultures"],
  pampas_220: ["Pampas cultures"],
  pampas_476: ["Pampas cultures"],
  pampas_750: ["Pampas cultures"],
  pampas_1200: ["Pampas cultures"],
  pampas_1280: ["Pampas cultures"],
  pampas_1500: ["Pampas cultures"],
  pampas_1648: ["Pampas cultures"],
  pampas_1750: ["Pampas cultures"],
  pampas_1840: ["Pampas cultures"],

  // --- Savanna ---
  savanna_hunter_gatherers: ["Savanna hunter-gatherers"],
  savanna_ia: ["Savanna hunter-gatherers"],
  savanna_axial: ["Savanna hunter-gatherers"],
  savanna_hellen: ["Savanna hunter-gatherers"],
  savanna_qin: ["Savanna hunter-gatherers"],
  savanna_han: ["Savanna hunter-gatherers"],
  savanna_220: ["Savanna hunter-gatherers"],
  savanna_476: ["Savanna hunter-gatherers"],
  savanna_750: ["Savanna hunter-gatherers"],
  savanna_1200: ["Savanna hunter-gatherers"],
  savanna_1280: ["Savanna hunter-gatherers"],

  // --- Australian aboriginals ---
  australian_aboriginals_ba: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_ia: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_ax: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_hel: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_qin: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_han: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_220: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_476: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_750: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_1200: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_1280: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_1500: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_1648: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_1750: ["Australian aboriginal hunter-gatherers"],
  australian_aboriginals_1840: ["Australian aboriginal hunter-gatherers"],

  // --- Patagonian / Shellfish ---
  patagonian_hunters: ["Patagonian shellfish and marine mammal hunters"],
  shellfish_gatherers_sa: ["Shellfish gatherers"],

  // --- Eastern N. American ---
  east_na_hunter_gatherers: ["Eastern North Amercian hunter-gatherers"],
  east_na_ia: ["Eastern North Amercian hunter-gatherers"],

  // --- Subarctic / Pacific / Plateau ---
  subarctic_hunters: ["Subarctic forest hunter-gatherers"],
  na_pacific_foragers: ["North American Pacifi foraging, hunting and fishing peoples"],
  plateau_fishers: ["Plateau fichers and hunter gatherers"],

  // --- Tasmanian ---
  tasmanian_hunters: ["Tasmanian hunter-gatherers"],

  // --- Karasuk ---
  karasuk_culture: ["Karasuk culture"],
  karasuk_steppe_800bce: ["Karasuk culture"],

  // --- Tibetan ---
  tibetan_peoples_ba: ["Tibetans"],
  tibetan_qiang_800bce: ["Tibetans"],

  // --- Thracian / Illyrian ---
  thracian_tribes: ["Thrace"],
  illyrian_tribes: ["Illyrians"],
  illyrian_axial: ["Illyrians"],

  // --- Burmese ---
  burmese_early: ["Burmese"],
  burmese_ia: ["Burmese"],

  // --- Chinchorro ---
  chinchorro_culture: ["Chinchoros"],

  // --- Iron Age specific ---
  proto_scythian: ["Proto-Scythian culture"],
  chavin_culture: ["Chavin"],

  // --- Axial Age specific ---
  adena_culture: ["Adena Culture"],
  simhala_kingdom: ["Simhala"],
  boii_celts: ["Boii"],
  samnites_500bce: ["Samnites"],
  iron_age_megalith_india: ["Iron Age megalith cultures"],

  // --- Hellenistic specific ---
  paracas_culture: ["Paracas"],
  zhangzhung_kingdom: ["Zhangzhung Kingdom"],
  qataban_kingdom: ["Qataban"],
  bosporan_kingdom_323: ["Bosporan Kingdom"],
  sabines_323: ["Sabines"],

  // --- Qin-Rome specific ---
  mon_khmer_peoples: ["Mon-Khmer"],
  malays_prestate: ["Malays"],
  norsemen_early: ["Norsemen"],
  thai_early: ["Thai"],
  thai_early_800bce: ["Thai"],
  dardania_221: ["Dardania"],
  tungus_early: ["Tungus"],
  scythian_qin: ["Scythians"],

  // --- Han-Rome Peak ---
  hainan_100: ["Hainan"],
  alans_100: ["Alans"],
  suren_kingdom: ["Suren Kingdom"],
  hopewell_culture: ["Hopewell Culture"],
  himyarite_kingdom_100: ["Himyarite Kingdom"],
  hadramawt_100: ["Hadramaut"],
  simhala_100: ["Simhala"],
  // bosporan_100 removed: duplicate of bosporan_kingdom
  kalinga_100: ["Kalinga"],
  saka_kingdom: ["Saka Kingdom"],
  tibetan_qiang_100: ["Tibetans", "Qiang"],
  kangju_100: ["Kangju", "Scythians", "Yueban"],
  caucasus_iberia_100: ["Iberia", "Georgian Kingdom", "Armenia"],
  caucasus_albania_100: ["Albania", "Caucasian Albania", "Armenia"],
  sogdiana_100: ["Sogdians", "Sogdiana", "Kushan Empire"],
  wusun_100: ["Wusun", "Yueban", "Scythians"],
  tarim_oasis_100: ["Tocharians", "Yarkand", "Kushan Empire"],
  colchis_100: ["Colchis", "Lazica"],
  dian_kingdom_100: ["Dian", "Han"],

  // --- Three Kingdoms ---
  hainan_220: ["Hainan"],
  simhala_220: ["Simhala"],
  bosporan_220: ["Bosporian Kingdom", "Bosporan Kingdom"],
  // himyarite_220 removed: duplicate of himyar_220
  hopewell_220: ["Hopewell Culture"],
  heruli_220: ["Heruli"],
  hadramawt_220: ["Hadramaut"],
  tibetan_qiang_220: ["Tibetans", "Qiang"],
  kangju_220: ["Kangju", "Yueban", "Scythians"],
  sogdiana_220: ["Sogdians", "Sogdiana", "Kushan Empire"],
  caucasus_iberia_220: ["Iberia", "Georgian Kingdom", "Armenia"],
  dian_kingdom_220: ["Dian", "Han"],

  // --- Fall of Rome ---
  ghana_empire_476: ["Empire of Ghana"],
  cheras_476: ["Cheras"],
  cholas_476: ["Cholas"],
  pandyas_476: ["Pandyas"],
  swedes_476: ["Swedes"],
  western_gangas_476: ["Western Gangas"],
  simhala_476: ["Simhala"],
  tui_tonga_476: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  tibetan_tuyuhun_476: ["Tuyuhun", "Tibetans"],
  sogdiana_476: ["Sogdians", "Sogdiana", "Kushan Principalities"],
  caucasus_iberia_476: ["Iberia", "Georgian Kingdom", "Armenia"],
  tarim_oasis_476: ["Tocharians", "Yarkand", "Kushan Principalities"],
  kidarites_476: ["Kidarites", "Kushan Principalities"],

  // --- Tang Golden Age ---
  mataram_750: ["Mataram"],
  kingdom_kashmir: ["Kingdom of Kashmir"],
  kingdom_sind: ["Kingdom of Sind"],
  chalukyas_750: ["Chalukyas"],
  avars_750: ["Avars"],
  magyars_750: ["Magyars"],
  simhala_750: ["Simhala"],
  slavonic_tribes_750: ["Slavs", "Proto-Slavs", "Slavonic tribes"],
  champa_750: ["Champa"],
  tui_tonga_750: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  east_slavic_tribes_750: ["Kryvichs", "Polanes", "Severians", "Proto-Slavs", "Slavs"],
  baltic_tribes_750: ["Balts", "Baltic tribes"],
  sogdiana_750: ["Sogdians", "Kwarezm"],
  samoyedic_750: ["Samoyèdes", "Paleo-Siberian hunter-gatherers"],
  sogdiana_tang_750: ["Sogdians", "Kwarezm"],
  volga_bulgars_750: ["Bulgars", "Volga Bulgars"],
  finno_ugric_750: ["Finno-Ugric taiga hunter-gatherers"],
  permians_750: ["Permians", "Finno-Ugric taiga hunter-gatherers"],
  mordvins_750: ["Mordvinians", "Finno-Ugric taiga hunter-gatherers"],
  mari_750: ["Mari", "Finno-Ugric taiga hunter-gatherers"],
  bashkirs_750: ["Bashkirs", "Sabirs"],
  paleo_siberian_750: ["Paleo-Siberian hunter-gatherers"],
  tungus_750: ["Tungus"],
  // goturks_750 removed: Göktürk Khaganate dissolved by 744 CE
  wales_750: ["Celtic kingdoms", "Celts"],
  scotland_750: ["Celtic kingdoms", "Scotland", "Scottland", "Picts"],
  ireland_750: ["Celtic kingdoms", "Ireland"],
  lombard_duchy_south_750: ["Lombard principalities", "Lombard duchies"],
  bavaria_750: ["Bavaria", "Bavarians", "Francia"],
  kanem_750: ["Kanem", "West African cereal farmers"],
  swahili_early_750: ["Bantou", "Islamic city-states"],
  buganda_proto_750: ["Bantou", "Buganda"],
  takrur_750: ["Takrur", "West African cereal farmers"],
  igbo_ukwu_750: ["West African cereal farmers"],

  // --- Crusades ---
  polynesian_1200: ["Polynesians"],
  taino_1200: ["Taino"],
  great_zimbabwe: ["Great Zimbabwe"],
  tuareg_1200: ["Tuareg Nomadic Tribes"],
  cuman_khanates: ["Cuman Khanates"],
  novgorod_republic: ["Principality of Novgorod"],
  croatia_1200: ["Croatia"],
  nepal_1200: ["Nepal"],
  taiwanese_tribes: ["Taiwanese Tribes"],
  merina_1200: ["Expansionist Kingdom of Merina", "Merina"],
  tui_tonga_1200: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  kara_khitai: ["Kara Khitai Khaganate"],
  srivijaya_1200: ["Srivijaya Empire"],
  bhutan_1200: ["Bhutan"],
  volga_bulgars: ["Volga Bulgars"],
  vladimir_suzdal: ["Principality of Vladimir-Suzdal"],
  kiev_principality_1200: ["Principality of Kyiv", "Other Rus Principalities"],
  galicia_volhynia_1200: ["Principality of Galicia-Volhynia", "Other Rus Principalities"],
  ryazan_1200: ["Other Rus Principalities"],
  smolensk_1200: ["Other Rus Principalities"],
  lithuania_early_1200: ["Lithuania", "Balts", "Baltic tribes"],
  chernigov_1200: ["Other Rus Principalities"],
  polotsk_1200: ["Other Rus Principalities"],
  tibet_1200: ["Tibet"],

  // --- Mongol Empire ---
  sicily_1280: ["Sicily", "Kingdom of Sicily"],
  ireland_1280: ["Celtic kingdoms", "Ireland"],
  oyo_early_1280: ["West African cereal farmers", "Oyo"],
  swahili_coast_1280: ["Islamic city-states"],
  polynesian_1280: ["Polynesians"],
  great_zimbabwe_1280: ["Great Zimbabwe"],
  taino_1280: ["Taino"],
  merina_1280: ["Expansionist Kingdom of Merina", "Merina"],
  srivijaya_1280: ["Srivijaya Empire"],
  tui_tonga_1280: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  nepal_1280: ["Nepal"],
  ryazan_1280: ["Ryazan", "Other Rus Principalities"],
  moscow_early_1280: ["Other Rus Principalities"],
  tver_1280: ["Other Rus Principalities"],
  tibet_sakya_1280: ["Tibet"],
  smolensk_1280: ["Other Rus Principalities"],

  // --- Renaissance ---
  bavaria_1500: ["Bavaria", "Bavarians", "Holy Roman Empire"],
  saxony_1500: ["Saxony", "Saxons", "Holy Roman Empire"],
  dagbon_1500: ["West African cereal farmers"],
  loango_1500: ["Congo"],
  iroquois_1500: ["Iroquois"],
  crimean_khanate_1500: ["Crimean Khanate"],
  bornu_kanem_1500: ["Bornu-Kanem"],
  benin_1500: ["Benin"],
  // kongo_1500 removed: duplicate of kongo_kingdom
  merina_1500: ["Expansionist Kingdom of Merina", "Merina"],
  maori_1500: ["Maori"],
  arakan_1500: ["Arakan"],
  polynesian_1500: ["Polynesians"],
  hausa_states_1500: ["Hausa States"],
  oyo_1500: ["Oyo"],
  tui_tonga_1500: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  mossi_states_1500: ["Mossi States"],
  islamic_city_states_ea: ["Islamic city-states"],

  // --- Early Modern ---
  kongo_loango_1648: ["Congo"],
  wadai_1648: ["Wadai"],
  corsica_1648: ["Corsica"],
  crete_1648: ["Venice", "Crete"],
  cherokee_1648: ["Cherokee"],
  comanche_1648: ["Comanche"],
  cree_1648: ["Cree"],
  luba_kingdom: ["Luba"],
  lunda_empire: ["Lunda"],
  merina_1648: ["Expansionist Kingdom of Merina", "Merina"],
  bagirmi_1648: ["Bagirmi"],
  arakan_1648: ["Arakan"],
  polynesian_1648: ["Polynesians"],
  tui_tonga_1648: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  maori_1648: ["Maori"],
  ceylon_1648: ["Ceylon"],
  dzungar_khanate_1648: ["Oirat Confederation", "central Asian khanates"],
  kazakh_juz_1648: ["Quazaq Khanate", "central Asian khanates"],
  lan_xang_1648: ["Laos", "Laotian states"],
  tibet_ganden_phodrang_1648: ["Tibetan Empire", "Tibet"],
  ryukyu_kingdom_1648: ["Japan", "Taiwan"],
  darfur_sultanate_1648: ["Darfur"],

  // --- Enlightenment ---
  kongo_remnant_1750: ["Congo"],
  wadai_empire_1750: ["Wadai"],
  merina_1750: ["Expansionist Kingdom of Merina"],
  kazembe_1750: ["Kazembe", "Lunda"],
  portuguese_angola_1750: ["Angola", "Angola (Portugal)", "Portugal"],
  genoa_1750: ["Genoa"],
  tuscany_1750: ["Tuscany"],
  corsica_1750: ["Corsica"],
  malta_1750: ["Malta", "Knights of Saint John", "Sicily"],
  wallachia_1750: ["Wallachia", "Ottoman Empire"],
  moldavia_1750: ["Moldavia", "Ottoman Empire"],
  crimean_khanate_1750: ["Crimean Khanate"],
  bornu_1750: ["Bornu-Kanem", "Kanem-Bornu"],
  ashanti_1750: ["Asante"],
  dahomey_1750: ["Dahomey"],
  rozvi_1750: ["Rozwi"],
  buganda_1750: ["Buganda", "Bantou"],
  kanem_1750: ["Wadai"],
  tunis_1750: ["Tunis"],
  tripoli_1750: ["Tripolitania"],
  zanzibar_1750: ["Zanzibar", "Islamic city-states"],
  cape_colony_1750: ["Cape Colony"],
  assam_1750: ["Assam"],
  bhutan_1750: ["Bhutan"],
  nepal_1750: ["Nepal"],
  polynesian_1750: ["Polynesians"],
  maori_1750: ["Maori"],
  tui_tonga_1750: ["Tuʻi Tonga Empire", "Tu'i Tonga Empire"],
  luba_1750: ["Luba"],
  lunda_1750: ["Lunda"],
  lozi_1750: ["Lozi"],
  kong_empire_1750: ["Kong Empire"],
  ceylon_1750: ["Ceylon (Dutch)", "Ceylon"],

  // --- Industrial Revolution (1840) Africa gap-fill ---
  oyo_empire_1840: ["Oyo"],
  futa_jallon_1840: ["Futa Jalon", "Futa Jallon", "Futa Toro", "Senegal"],
  futa_toro_1840: ["Futa Toro", "Senegal"],
  kongo_remnant_1840: ["Congo"],
  mossi_states_1840: ["Mossi States"],
  darfur_sultanate_1840: ["Darfur"],
  egyptian_sudan_1840: ["Funj", "Sudan", "Harer (Egypt)"],
  luba_kingdom_1840: ["Luba"],
  ndebele_1840: ["Ndebele", "Zulu", "Zululand"],
  basotho_1840: ["Basutoland", "Zulu"],
  swazi_1840: ["Swaziland", "Zulu"],
  xhosa_1840: ["Xhosa"],
  sierra_leone_1840: ["Sierra Leone"],
  segu_bambara_1840: ["Segu"],
  kaarta_1840: ["Kaarta"],

  // --- Industrial Revolution (1840) Africa gap-fill batch 2 ---
  oromo_1840: ["Oromo", "Rift Valley States", "Ethiopian highland farmers"],
  bagirmi_1840: ["Bagirmi"],
  kong_empire_1840: ["Kong Empire", "Ivory Coast"],
  nkore_1840: ["Nkore", "Buganda"],
  imbangala_1840: ["Imbangala", "Angola"],
  somali_sultanates_1840: ["Somalia", "Islamic city-states"],
  fante_confederacy_1840: ["Fante", "Gold Coast (GB)", "Accra"],
  air_sultanate_1840: ["Air", "Tuareg Nomadic Tribes"],
  delagoa_bay_1840: ["Delagoa Bay", "Natal", "Nguni"],
  songhai_remnant_1840: ["Songhai", "Dendi Kingdom"],
  awsa_sultanate_1840: ["Awsa", "Adal"],
  teke_kingdom_1840: ["Teke", "Congo", "Gabon"],
  kuba_kingdom_1840: ["Kuba", "Congo"],
  yaka_kingdom_1840: ["Yaka", "Congo"],
  ovimbundu_1840: ["Ovimbundu", "Mbailundu", "Angola"],
  natal_boer_1840: ["Natal", "Delagoa Bay"],
  transvaal_boer_1840: ["Transvaal", "Orange Free State", "Zulu", "Cape Colony"],
  shona_states_1840: ["Shona", "Rozwi", "Great Zimbabwe"],

  // --- Industrial Revolution ---
  belgium_1840: ["Belgium", "Austrian Netherlands"],
  netherlands_1840: ["Netherlands"],
  switzerland_1840: ["Swiss Confederation", "Switzerland"],
  greece_1840: ["Greece", "Ottoman Empire"],
  serbia_1840: ["Serbia"],
  liberia_1840: ["Liberia", "West African cereal farmers"],
  tunis_1840: ["Tunis"],
  senegal_1840: ["Senegal"],
  ashanti_1840: ["Asante"],
  dahomey_1840: ["Dahomey"],
  bornu_1840: ["Bornu-Kanem", "Kanem-Bornu"],
  kanem_1840: ["Wadai"],
  hesse_1840: ["Hesse", "Holy Roman Empire"],
  wallachia_1840: ["Wallachia", "Romania", "Ottoman Empire"],
  moldavia_1840: ["Moldavia", "Moldova"],
  montenegro_1840: ["Montenegro", "Ottoman Empire"],
  wadai_1840: ["Wadai"],
  nyamwezi_1840: ["Bantou", "Mirambo"],
  madagascar_1840: ["Expansionist Kingdom of Merina", "Imerina"],
  oman_zanzibar_1840: ["Zanzibar", "Oman"],
  rozwi_1840: ["Rozwi", "Great Zimbabwe"],
  rwanda_1840: ["Rwanda"],
  buganda_1840: ["Buganda"],
  bunyoro_1840: ["Bunyoro"],
  lozi_1840: ["Lozi"],
  lunda_1840: ["Lunda"],
  cape_colony_1840: ["Cape Colony"],
  arakan_1840: ["Arakan"],
  assam_1840: ["Assam"],
  burundi_1840: ["Burundi"],
  kazembe_1840: ["Kazembe"],
  bhutan_1840: ["Bhutan"],

  // --- Imperialism ---
  buganda_1900: ["Buganda"],
  bunyoro_1900: ["Bunyoro"],
  rwanda_1900: ["Rwanda"],
  burundi_1900: ["Burundi"],
  luba_1900: ["Luba"],
  lunda_1900: ["Lunda"],
  lozi_1900: ["Barotse", "Lozi"],
  fiji_1900: ["Fiji"],
  hawaii_1900: ["Kingdom of Hawaii"],
  cape_colony_1900: ["Cape Colony"],
  ndebele_1900: ["Ndebele"],
  canada_1900: ["Canada"],
  colombia_1900: ["Colombia"],
  ecuador_1900: ["Ecuador"],
  venezuela_1900: ["Venezuela"],
  paraguay_1900: ["Paraguay"],
  uruguay_1900: ["Uruguay"],
  greece_1900: ["Greece"],
  bulgaria_1900: ["Bulgaria"],
  montenegro_1900: ["Montenegro"],
  finland_1900: ["Finland", "Russian Empire"],
  iceland_1900: ["Iceland", "Denmark"],
  wadai_1900: ["Wadai"],
  senegal_1900: ["Senegal"],

  // --- World War Era ---
  finland_1939: ["Finland"],
  ireland_1939: ["Ireland"],
  hungary_1939: ["Hungary"],
  romania_1939: ["Romania"],
  thailand_1939: ["Siam", "Thailand"],
  brazil_1939: ["Brazil"],
  argentina_1939: ["Argentina"],
  australia_1939: ["Australia"],
  new_zealand_1939: ["New Zealand"],
  greece_1939: ["Greece"],
  belgium_1939: ["Belgium"],
  netherlands_1939: ["Netherlands"],
  switzerland_1939: ["Switzerland"],
  albania_1939: ["Albania"],
  bulgaria_1939: ["Bulgaria"],
  estonia_1939: ["Estonia"],
  latvia_1939: ["Latvia"],
  lithuania_1939: ["Lithuania"],
  chile_1939: ["Chile"],
  peru_1939: ["Peru"],
  colombia_1939: ["Colombia"],
  venezuela_1939: ["Venezuela"],
  malta_1939: ["Malta"],
  french_morocco_1939: ["Morocco (France)", "Morocco"],

  // --- Cold War ---
  algeria_1962: ["Algeria"],
  morocco_1962: ["Morocco"],
  tunisia_1962: ["Tunisia"],
  libya_1962: ["Libya"],
  cameroon_1962: ["Cameroon"],
  mali_1962: ["Mali"],
  senegal_1962: ["Senegal"],
  ivory_coast_1962: ["Ivory Coast", "Côte d'Ivoire"],
  guinea_1962: ["Guinea"],
  madagascar_1962: ["Madagascar"],
  tanzania_1962: ["Tanzania, United Republic of", "Tanzania"],
  uganda_1962: ["Uganda"],
  malta_1962: ["Malta"],
  nepal_1962: ["Nepal"],
  finland_1962: ["Finland"],
  ireland_1962: ["Ireland"],
  austria_1962: ["Austria"],
  romania_1962: ["Romania"],
  hungary_1962: ["Hungary"],
  australia_1962: ["Australia"],
  new_zealand_1962: ["New Zealand"],
  colombia_1962: ["Colombia"],
  venezuela_1962: ["Venezuela"],
  chile_1962: ["Chile"],
  bolivia_1962: ["Bolivia"],
  ecuador_1962: ["Ecuador"],
  rwanda_1962: ["Rwanda"],
  chad_1962: ["Chad"],
  niger_1962: ["Niger"],

  // --- Modern Era ---
  modern_australia: ["Australia"],
  modern_new_zealand: ["New Zealand"],
  modern_egypt: ["Egypt"],
  modern_south_korea: ["Korea, Republic of", "South Korea"],
  modern_north_korea: ["Korea, Democratic People's Republic of", "North Korea"],
  modern_indonesia: ["Indonesia"],
  modern_thailand: ["Thailand"],
  modern_vietnam: ["Vietnam", "Viet Nam"],
  modern_philippines: ["Philippines"],
  modern_malaysia: ["Malaysia"],
  modern_singapore: ["Singapore", "Malaya"],
  modern_myanmar: ["Myanmar", "Burma"],
  modern_cambodia: ["Cambodia"],
  modern_laos: ["Laos", "Lao People's Democratic Republic"],
  modern_brunei: ["Brunei", "Brunei Darussalam"],
  modern_east_timor: ["East Timor", "Timor-Leste", "Indonesia"],
  modern_nigeria: ["Nigeria"],
  modern_south_africa: ["South Africa"],
  modern_kenya: ["Kenya"],
  modern_ethiopia_2000: ["Ethiopia"],
  modern_colombia: ["Colombia"],
  modern_argentina: ["Argentina"],
  modern_poland: ["Poland"],
  modern_ukraine: ["Ukraine"],
  modern_saudi_arabia: ["Saudi Arabia"],
  modern_iran: ["Iran", "Iran (Islamic Republic of)"],

  // --- Pre-existing regions previously unmapped ---
  axum_prestate_500bce: ["Ethiopian highland farmers", "Aksum", "Axum"],
  bosporan_kingdom: ["Bosporan Kingdom", "Bosporian Kingdom"],
  chutu_220: ["Chola", "Cholas", "Satavahana"],
  himyar_220: ["Himyarite Kingdom"],
  latin_sabine_polities: ["Latins", "Sabines", "Rome"],
  manchukuo_1939: ["Manchukuo", "Manchuria"],
  sahel_polities_221_bce: ["Sahelian kingdoms", "West African cereal farmers"],

  // --- Greenland ---
  greenland_1840: ["Greenland", "Denmark"],
  greenland_1900: ["Greenland"],
  greenland_1939: ["Greenland", "Denmark"],
  greenland_1962: ["Greenland"],
  modern_greenland: ["Greenland"],

  // ============================================
  // Gap-fill expansions — batch 2
  // ============================================

  // --- Modern Era (2000) ---
  modern_angola: ["Angola"],
  modern_czech: ["Czech Republic"],
  modern_slovakia: ["Slovakia"],
  modern_slovenia: ["Slovenia"],
  modern_cyprus: ["Cyprus"],
  modern_mauritania: ["Mauritania"],
  modern_guyana: ["Guyana"],
  modern_suriname: ["Suriname"],
  modern_french_guiana: ["French Guiana"],
  modern_guinea_bissau: ["Guinea-Bissau"],
  modern_western_sahara: ["Western Sahara"],
  modern_trinidad: ["Trinidad"],
  modern_bahamas: ["Bahamas"],
  modern_samoa: ["Samoa"],
  modern_tonga: ["Tonga"],
  modern_eq_guinea: ["Equatorial Guinea"],
  modern_hong_kong: ["Hong Kong"],
  modern_puerto_rico: ["Puerto Rico"],
  modern_macedonia: ["Macedonia"],
  modern_malta: ["Malta"],
  modern_croatia: ["Croatia"],
  modern_serbia: ["Serbia"],
  modern_albania: ["Albania"],
  modern_bosnia: ["Bosnia and Herzegovina"],
  modern_bulgaria: ["Bulgaria"],
  modern_montenegro: ["Montenegro"],

  // --- AI Age (2023) individual countries ---
  ai_france: ["France"],
  ai_germany: ["Germany"],
  ai_united_kingdom: ["United Kingdom"],
  ai_netherlands: ["Netherlands"],
  ai_belgium: ["Belgium"],
  ai_switzerland: ["Switzerland"],
  ai_austria: ["Austria"],
  ai_spain: ["Spain"],
  ai_italy: ["Italy"],
  ai_portugal: ["Portugal"],
  ai_greece: ["Greece"],
  ai_poland: ["Poland"],
  ai_romania: ["Romania"],
  ai_sweden: ["Sweden"],
  ai_norway: ["Norway"],
  ai_finland: ["Finland"],
  ai_denmark: ["Denmark"],
  ai_greenland: ["Greenland"],
  ai_ireland: ["Ireland"],
  ai_ukraine: ["Ukraine"],
  ai_israel: ["Israel"],
  ai_saudi_arabia: ["Saudi Arabia"],
  ai_uae: ["United Arab Emirates"],
  ai_nigeria: ["Nigeria"],
  ai_south_africa: ["South Africa"],
  ai_egypt: ["Egypt"],
  ai_kenya: ["Kenya"],
  ai_ethiopia: ["Ethiopia"],
  ai_morocco: ["Morocco"],
  ai_algeria: ["Algeria"],
  ai_congo_drc: ["Zaire", "Congo"],
  ai_argentina: ["Argentina"],
  ai_chile: ["Chile"],
  ai_colombia: ["Colombia"],
  ai_venezuela: ["Venezuela"],
  ai_peru: ["Peru"],
  ai_australia: ["Australia"],
  ai_new_zealand: ["New Zealand"],
  ai_papua_new_guinea: ["Papua New Guinea"],
  ai_fiji: ["Fiji"],
  ai_singapore: ["Singapore", "Malaya"],
  ai_vietnam: ["Vietnam", "Viet Nam"],
  ai_thailand: ["Thailand"],
  ai_philippines: ["Philippines"],
  ai_malaysia: ["Malaysia"],
  ai_indonesia: ["Indonesia"],
  ai_myanmar: ["Myanmar", "Burma"],
  ai_cambodia: ["Cambodia"],
  ai_laos: ["Laos", "Lao People's Democratic Republic"],
  ai_brunei: ["Brunei", "Brunei Darussalam"],
  ai_east_timor: ["East Timor", "Timor-Leste", "Indonesia"],

  // --- AI Age (2023) batch 2: additional individual countries ---
  ai_czech_republic: ["Czech Republic"],
  ai_hungary: ["Hungary"],
  ai_russia: ["Russia", "Russian Federation"],
  ai_turkey: ["Turkey", "Türkiye"],
  ai_ghana: ["Ghana"],
  ai_tanzania: ["Tanzania, United Republic of", "Tanzania", "United Republic of Tanzania"],
  ai_rwanda: ["Rwanda"],
  ai_senegal: ["Senegal"],
  ai_tunisia: ["Tunisia"],
  ai_congo_brazzaville: ["Republic of the Congo", "Congo, Republic of", "Congo"],
  ai_sudan: ["Sudan"],
  ai_libya: ["Libya"],
  ai_mozambique: ["Mozambique"],
  ai_cameroon: ["Cameroon"],
  ai_uganda: ["Uganda"],
  ai_zimbabwe: ["Zimbabwe"],
  ai_mali: ["Mali"],
  ai_somalia: ["Somalia"],
  ai_madagascar: ["Madagascar"],
  ai_croatia: ["Croatia"],
  ai_serbia: ["Serbia"],
  ai_albania: ["Albania"],
  ai_bosnia: ["Bosnia and Herzegovina"],
  ai_bulgaria: ["Bulgaria"],
  ai_montenegro: ["Montenegro"],
  ai_north_macedonia: ["Macedonia"],
  ai_slovenia: ["Slovenia"],
  ai_cyprus: ["Cyprus"],
  ai_malta: ["Malta"],

  // --- Modern Era (2000) batch 2: individual European & African countries ---
  modern_france: ["France"],
  modern_germany: ["Germany"],
  modern_uk: ["United Kingdom"],
  modern_italy: ["Italy"],
  modern_spain: ["Spain"],
  modern_netherlands: ["Netherlands"],
  modern_belgium: ["Belgium"],
  modern_switzerland: ["Switzerland"],
  modern_sweden: ["Sweden"],
  modern_norway: ["Norway"],
  modern_denmark: ["Denmark"],
  modern_finland: ["Finland"],
  modern_ireland: ["Ireland"],
  modern_austria: ["Austria"],
  modern_portugal: ["Portugal"],
  modern_greece: ["Greece"],
  modern_romania: ["Romania"],
  modern_turkey: ["Turkey", "Türkiye"],
  modern_russia: ["Russia", "Russian Federation"],
  modern_morocco: ["Morocco"],
  modern_algeria: ["Algeria"],
  modern_tunisia: ["Tunisia"],
  modern_libya: ["Libya"],
  modern_ghana: ["Ghana"],
  modern_congo_drc: ["Zaire", "Congo"],
  modern_tanzania: ["Tanzania, United Republic of", "Tanzania", "United Republic of Tanzania"],
  modern_uganda: ["Uganda"],
  modern_mozambique: ["Mozambique"],
  modern_zimbabwe: ["Zimbabwe"],
  modern_cameroon: ["Cameroon"],
  modern_senegal: ["Senegal"],
  modern_mali: ["Mali"],
  modern_sudan: ["Sudan"],
  modern_somalia: ["Somalia"],

  // --- Cold War (1962) ---
  angola_1962: ["Angola"],
  zaire_1962: ["Zaire"],
  mauritania_1962: ["Mauritania"],
  guinea_bissau_1962: ["Guinea-Bissau"],
  guyana_1962: ["Guyana"],
  suriname_1962: ["Suriname"],
  french_guiana_1962: ["French Guiana"],
  cyprus_1962: ["Cyprus"],
  western_sahara_1962: ["Western Sahara"],
  trinidad_1962: ["Trinidad"],
  bahamas_1962: ["Bahamas"],
  hong_kong_1962: ["Hong Kong"],
  puerto_rico_1962: ["Puerto Rico"],
  tonga_1962: ["Tonga"],
  samoa_1962: ["Samoa"],
  fiji_1962: ["Fiji"],
  papua_new_guinea_1962: ["Papua New Guinea", "Territory of New Guinea"],
  eq_guinea_1962: ["Equatorial Guinea"],

  // --- Cold War (1962) additional ---
  belgium_1962: ["Belgium"],
  netherlands_1962: ["Netherlands"],
  luxembourg_1962: ["Luxembourg"],
  switzerland_1962: ["Switzerland"],
  norway_1962: ["Norway"],
  denmark_1962: ["Denmark"],
  iceland_1962: ["Iceland"],
  albania_1962: ["Albania"],
  bulgaria_1962: ["Bulgaria"],
  zambia_1962: ["Zambia", "Northern Rhodesia"],
  zimbabwe_1962: ["Zimbabwe", "Southern Rhodesia"],
  malawi_1962: ["Malawi", "Nyasaland"],
  botswana_1962: ["Botswana", "Bechuanaland"],
  lesotho_1962: ["Lesotho", "Basutoland"],
  swaziland_1962: ["Swaziland"],
  namibia_1962: ["Namibia", "South West Africa"],
  mozambique_1962: ["Mozambique"],
  togo_1962: ["Togo"],
  benin_1962: ["Benin", "Dahomey"],
  burkina_faso_1962: ["Burkina Faso", "Upper Volta"],
  sierra_leone_1962: ["Sierra Leone"],
  gambia_1962: ["Gambia, The", "Gambia"],
  gabon_1962: ["Gabon"],
  central_african_republic_1962: ["Central African Republic"],
  congo_brazzaville_1962: ["Congo", "Republic of the Congo"],
  djibouti_1962: ["Djibouti", "French Somaliland"],
  eritrea_1962: ["Eritrea", "Ethiopia"],
  liberia_1962: ["Liberia"],
  mauritius_1962: ["Mauritius"],
  canada_1962: ["Canada"],

  // --- World War Era (1939) ---
  belgian_congo_1939: ["Belgian Congo"],
  angola_portugal_1939: ["Angola (Portugal)"],
  french_west_africa_1939: ["French West Africa"],
  french_eq_africa_1939: ["French Equatorial Africa"],
  gold_coast_1939: ["Gold Coast"],
  british_somaliland_1939: ["British Somaliland"],
  eritrea_italy_1939: ["Eritrea (Italy)"],
  italian_somaliland_1939: ["Italian Somaliland"],
  madagascar_france_1939: ["Madagascar (France)"],
  mozambique_portugal_1939: ["Mozambique (Portugal)"],
  french_guiana_1939: ["French Guiana"],
  guyana_1939: ["Guyana"],
  suriname_1939: ["Suriname"],
  hong_kong_1939: ["Hong Kong"],
  xinjiang_1939: ["Xinjiang"],
  north_rhodesia_1939: ["Northern Rhodesia"],
  south_rhodesia_1939: ["Southern Rhodesia"],
  french_cameroon_1939: ["French Cameroons"],
  congo_france_1939: ["Congo (France)"],
  guinea_bissau_1939: ["Guinea-Bissau"],
  eq_guinea_1939: ["Equatorial Guinea"],
  dominion_newfoundland_1939: ["Dominion of Newfoundland"],
  puerto_rico_1939: ["Puerto Rico"],
  trinidad_1939: ["Trinidad"],
  bahamas_1939: ["Bahamas"],
  tonga_1939: ["Tonga"],
  samoa_1939: ["Samoa"],
  fiji_1939: ["Fiji"],
  papua_1939: ["Papua New Guinea", "Territory of New Guinea", "Territory of Papua"],
  french_somaliland_1939: ["French Somaliland"],
  spanish_sahara_1939: ["Spanish Sahara"],
  iceland_1939: ["Iceland"],
  luxembourg_1939: ["Luxembourg"],
  norway_1939: ["Norway"],
  denmark_1939: ["Denmark"],
  liberia_1939: ["Liberia"],
  tanganyika_1939: ["Tanzania, United Republic of", "German E. Africa (Tanganyika)"],
  northern_rhodesia_1939: ["Northern Rhodesia"],
  southern_rhodesia_1939: ["Southern Rhodesia"],
  kenya_1939: ["Kenya"],
  uganda_1939: ["Uganda"],
  sierra_leone_1939: ["Sierra Leone"],
  gambia_1939: ["Gambia, The", "Gambia"],
  nigeria_1939: ["Nigeria"],
  togo_1939: ["Togo", "Togoland"],
  dahomey_1939: ["Dahomey"],
  tunisia_1939: ["Tunisia"],
  algeria_1939: ["Algeria (France)", "Algeria"],
  libya_1939: ["Libya"],
  bechuanaland_1939: ["Botswana", "Bechuanaland"],
  basutoland_1939: ["Lesotho", "Basutoland"],
  swaziland_1939: ["Swaziland"],
  south_west_africa_1939: ["Namibia", "German South-West Africa"],

  // --- WWII (1939) gap-fill ---
  slovakia_1939: ["Slovakia", "Czechoslovakia"],
  nepal_1939: ["Nepal"],
  ceylon_1939: ["Ceylon", "Sri Lanka"],
  tibet_1939: ["Tibet"],
  yemen_1939: ["Yemen"],
  oman_1939: ["Muscat and Oman", "Oman"],
  kuwait_1939: ["Kuwait"],
  panama_1939: ["Panama"],
  costa_rica_1939: ["Costa Rica"],
  guatemala_1939: ["Guatemala"],
  honduras_1939: ["Honduras"],
  el_salvador_1939: ["El Salvador"],
  nicaragua_1939: ["Nicaragua"],
  haiti_1939: ["Haiti"],
  dominican_republic_1939: ["Dominican Republic"],
  jamaica_1939: ["Jamaica"],
  nyasaland_1939: ["Nyasaland", "Malawi"],
  rwanda_urundi_1939: ["Ruanda-Urundi", "Rwanda", "Burundi"],
  zanzibar_1939: ["Zanzibar", "Tanzania, United Republic of"],

  // --- Imperialism (1900) Africa gap-fill ---
  dahomey_1900: ["Dahomey"],
  oyo_remnant_1900: ["Oyo", "Ibadan", "Lagos"],
  mossi_states_1900: ["Mossi States"],
  ivory_coast_1900: ["Ivory Coast", "Kong"],
  borgu_states_1900: ["Borgu States"],
  kanem_bornu_1900: ["Kanem-Bornu", "Rabih az-Zubayr"],
  futa_jalon_1900: ["Futa Jalon", "Futa Toro", "Senegal"],
  damagaram_1900: ["Sultanate of Damagaram", "Sokoto Caliphate"],
  teke_1900: ["Teke", "Gabon"],
  kuba_1900: ["Kuba", "Congo"],
  yeke_1900: ["Yeke", "Congo"],
  ovimbundu_1900: ["Ovimbundu", "Mbailundu", "Angola"],
  swaziland_1900: ["Swaziland"],
  zululand_1900: ["Zululand", "Zulu"],
  shona_1900: ["Shona", "Rozwi", "Rhodesia"],
  ngwato_1900: ["Ngwato", "Bechuanaland"],
  gaza_1900: ["Nguni", "Delagoa Bay"],
  oromo_1900: ["Oromo", "Rift Valley States", "Ethiopian highland farmers"],
  harer_1900: ["Harer (Egypt)", "Ethiopia"],

  // --- Imperialism (1900) ---
  angola_1900: ["Angola"],
  portuguese_ea_1900: ["Portuguese East Africa"],
  portuguese_guinea_1900: ["Portuguese Guinea"],
  dutch_guiana_1900: ["Dutch Guiana"],
  british_guiana_1900: ["British Guiana"],
  french_guiana_1900: ["French Guiana"],
  gambia_1900: ["Gambia"],
  bosnia_1900: ["Bosnia-Herzegovina"],
  hong_kong_1900: ["Hong Kong"],
  orange_free_state_1900: ["Orange Free State"],
  transvaal_1900: ["Transvaal"],
  natal_1900: ["Natal"],
  basutoland_1900: ["Basutoland"],
  malta_1900: ["Malta"],
  spanish_guinea_1900: ["Spanish Guinea"],
  tonga_1900: ["Tonga"],
  samoa_1900: ["Samoa"],
  australia_1900: ["South Australia (UK)", "New South Wales (UK)", "Queensland (UK)", "Victoria (UK)", "Western Australia (UK)", "Northern Territory (UK)", "Australia"],
  new_zealand_1900: ["New Zealand", "Maori"],
  trucial_oman_1900: ["Trucial Oman"],
  tukular_1900: ["Tukular Caliphate"],
  samori_1900: ["Second Samori Empire", "First Samori Empire"],
  switzerland_1900: ["Switzerland"],
  luxembourg_1900: ["Luxembourg"],
  serbia_1900: ["Serbia"],
  romania_1900: ["Romania"],
  albania_1900: ["Albania", "Ottoman Empire"],
  norway_1900: ["Sweden–Norway"],
  tunisia_1900: ["Tunisia"],
  french_west_africa_1900: ["French West Africa", "Senegal", "Ivory Coast", "Dahomey", "Futa Jalon", "Futa Toro"],
  french_eq_africa_1900: ["French Equatorial Africa", "Gabon"],
  german_east_africa_1900: ["German E. Africa (Tanganyika)", "Mirambo Unyanyembe Ukimbu", "Sultanate of Utetera"],
  british_east_africa_1900: ["British East Africa", "Buganda", "Bunyoro"],
  sierra_leone_1900: ["Sierra Leone"],
  gold_coast_1900: ["Gold Coast", "Gold Coast (GB)", "Accra"],
  madagascar_1900: ["Madagascar"],
  rhodesia_1900: ["Rhodesia", "Ndebele", "Shona"],
  bechuanaland_1900: ["Botswana", "Ngwato", "Bechuanaland"],
  italian_somaliland_1900: ["Italian Somaliland", "Somalia", "Islamic city-states"],
  british_somaliland_1900: ["British Somaliland", "Somalia"],
  eritrea_1900: ["Eritrea", "Harer (Egypt)", "Ethiopia"],
  german_south_west_africa_1900: ["German South-West Africa", "Ngwato"],
  german_cameroon_1900: ["Kamerun", "Gabon"],

  // --- Industrial Revolution (1840) ---
  angola_1840: ["Angola"],
  portuguese_ea_1840: ["Portuguese East Africa"],
  portuguese_guinea_1840: ["Portuguese Guinea"],
  hong_kong_1840: ["Hong Kong"],
  bavaria_1840: ["Bavaria"],
  saxony_1840: ["Saxony"],
  hanover_1840: ["Hanover"],
  wuerttemberg_1840: ["Württemberg"],
  baden_1840: ["Baden"],
  hawaii_1840: ["Kongldom of Hawaii", "Kingdom of Hawaii"],
  new_zealand_1840: ["New Zealand", "Maori"],
  tonga_1840: ["Tonga", "Polynesians"],
  fiji_1840: ["Fiji", "Polynesians"],
  samoa_1840: ["Samoa", "Polynesians"],
  sikkim_1840: ["Sikkim (Indian princely state)"],
  tripolitania_1840: ["Tripolitania"],
  cyrenaica_1840: ["Cyrenaica"],
  trinidad_1840: ["Trinidad"],
  san_marino_1840: ["San Marino"],
  guiana_1840: ["Guiana", "British Guiana"],
  canada_1840: ["Canada"],

  // --- Enlightenment (1750) ---
  austrian_netherlands_1750: ["Austrian Netherlands"],
  swiss_confederation_1750: ["Swiss Confederation"],
  carnatic_1750: ["Carnatic"],
  cochin_1750: ["Cochin"],
  british_guiana_1750: ["British Guiana"],
  portuguese_ea_1750: ["Portuguese East Africa"],
  portuguese_guinea_1750: ["Portuguese Guinea"],
  cyrenaica_1750: ["Cyrenaica"],
  oromo_1750: ["Oromo"],
  hong_kong_1750: ["Hong Kong"],
  kingdom_ireland_1750: ["Kingdom of Ireland"],
  bavaria_1750: ["Bavaria"],
  saxony_1750: ["Saxony"],
  hanover_1750: ["Hanover"],

  // --- Early Modern (1648) ---
  swiss_confederation_1648: ["Swiss Confederation"],
  portuguese_ea_1648: ["Portuguese East Africa"],
  portuguese_guinea_1648: ["Portuguese Guinea"],
  hong_kong_1648: ["Hong Kong"],
  kandy_1648: ["Kandy"],
  shan_states_1648: ["Shan states"],
  oromo_1648: ["Oromo"],
  rozwi_1648: ["Rozwi"],
  bavaria_1648: ["Bavaria", "Bavarians"],
  saxony_1648: ["Saxony", "Electorate of Saxony"],
  genoa_1648: ["Genoa"],
  sardinia_1648: ["Sardinia"],

  // --- Renaissance (1500) ---
  swiss_confederation_1500: ["Swiss Confederation"],
  kalmar_union_1500: ["Kalmar Union"],
  teutonic_knights_1500: ["Teutonic Knights"],
  navarre_1500: ["Navarre"],
  golden_horde_1500: ["Golden Horde"],
  cyprus_1500: ["Cyprus"],
  pegu_1500: ["Pegu"],
  sinhalese_1500: ["Sinhalese kingdoms"],
  algonquin_1500: ["Algonquin"],
  cherokee_1500: ["Cherookee", "Cherokee"],
  navajo_1500: ["Navajo"],
  apache_1500: ["Apache"],
  athabaskan_1500: ["Athabaskan"],
  innu_1500: ["Innu"],
  huron_1500: ["Huron"],
  khanate_sibir_1500: ["Khanate of Sibir"],
  sami_1500: ["Sámi"],
  zayyanid_1500: ["Zayyanid Caliphate"],
  mwenemutapa_1500: ["Mwenemutapa"],
  brittany_1500: ["Britany", "Brittany"],

  // --- Mongol Empire (1280) ---
  teutonic_knights_1280: ["Teutonic Knights"],
  navarre_1280: ["Navarre"],
  cyprus_1280: ["Cyprus"],
  brittany_1280: ["Britany", "Brittany"],
  trebizond_1280: ["Trebizond"],
  sardinia_1280: ["Sardinia"],
  corsica_1280: ["Corsica"],
  sinhalese_1280: ["Sinhalese kingdom"],
  thule_1280: ["Thule"],
  sami_1280: ["Sámi"],
  novgorod_1280: ["Novgorod"],
  innu_1280: ["Innu"],
  athabaskan_1280: ["Athabaskan"],
  ainu_1280: ["Ainus", "Ainu"],
  kashmir_1280: ["Kashmir and Ladakh"],
  shoa_1280: ["Shoa"],
  touareg_1280: ["Touareg"],
  wallachia_1280: ["Wallachia", "Walachia", "Hungary"],
  bosnia_1280: ["Bosnia", "Banate of Bosnia", "Hungary"],
  georgia_1280: ["Georgia", "Georgian Kingdom"],
  lithuania_1280: ["Lithuania", "Grand Duchy of Lithuania"],
  venice_1280: ["Venice", "Venetia"],
  genoa_1280: ["Genoa", "Holy Roman Empire"],
  papal_states_1280: ["Papal States", "Lombard principalities"],
  ajuran_1280: ["Islamic city-states"],
  benin_1280: ["Benin"],
  hausa_states_1280: ["Hausa States", "West African cereal farmers"],
  kanem_1280: ["Kanem", "Bornu-Kanem"],
  mogadishu_1280: ["Islamic city-states"],

  // --- Crusades (1200) ---
  cyprus_1200: ["Cyprus"],
  brittany_1200: ["Britany", "Brittany"],
  corsica_1200: ["Corsica"],
  sardinia_1200: ["Sardinia"],
  navarre_1200: ["Navarre"],
  leon_1200: ["León"],
  kanem_1200: ["Kanem"],
  ifat_1200: ["Ifat"],
  thule_1200: ["Thule"],
  sami_1200: ["Sámi"],
  mon_state_1200: ["Mon state"],
  innu_1200: ["Innu"],
  athabaskan_1200: ["Athabaskan"],
  rajput_1200: ["Rajput Kingdoms"],
  kamarupa_1200: ["Kamarupa"],
  takrur_1200: ["Takrur"],
  toulouse_1200: ["Comté de Toulouse"],
  burgundy_1200: ["Burgandy", "Burgundy"],
  crown_of_aragon_1200: ["Aragón"],
  kingdom_of_castile_1200: ["Castilla", "Castile"],
  kingdom_of_portugal_1200: ["Portugal"],
  kingdom_of_serbia_1200: ["Serbia"],
  bosnia_1200: ["Bosnia", "Banate of Bosnia", "Hungary"],
  genoa_1200: ["Genoa", "Holy Roman Empire"],
  pisa_1200: ["Pisa", "Holy Roman Empire"],
  benin_early_1200: ["Benin", "West African cereal farmers"],
  hausa_states_1200: ["Hausa States", "West African cereal farmers"],
  kilwa_1200: ["Islamic city-states"],
  mogadishu_1200: ["Islamic city-states"],
  ajuran_1200: ["Islamic city-states"],
  oyo_early_1200: ["Oyo", "West African cereal farmers"],
  swahili_cities_1200: ["Islamic city-states"],
  luba_early_1200: ["Luba", "Bantou"],

  // --- Tang Golden Age (750) duplicate entries removed ---
  // Kept: saxon_750, frisian_750 (distinct peoples, not duplicates)
  saxon_750: ["Saxons"],
  frisian_750: ["Frisians"],

  // --- Fall of Rome (476) ---
  // western_roman_476 removed: Western Roman Empire had already fallen by 476 CE
  dorset_476: ["Dorset"],
  vishnu_kundins_476: ["Vishnu-Kundins"],
  armorica_476: ["Armorica"],

  // --- Three Kingdoms (220) ---
  sami_220: ["Sámi"],
  paleo_inuit_220: ["Paleo-Inuit"],
  southern_xiongnu_220: ["Southern Xiongnu"],
  magadha_220: ["Magadha"],
  kalinga_220: ["Kalinga"],
  saka_kingdom_220: ["Saka Kingdom"],
  suren_kingdom_220: ["Suren Kingdom"],
  yueban_220: ["Yueban"],
  tarim_oasis_220: ["Saka Kingdom", "Suren Kingdom"],
  boii_220: ["Boihaenum"],
  blemmyes_220: ["Blemmyes"],
  guanches_220: ["Guanches"],
  tasmanian_220: ["Tasmanian hunter-gatherers"],

  // --- Han-Rome Peak (100) ---
  paleo_inuit_100: ["Paleo-Inuit"],

  // --- Hellenistic (-323) ---
  colchis_323: ["Colchis"],
  atropatene_323: ["Atropatene"],
  wankarani_323: ["Wankarani"],
  chorrera_323: ["Chorrera"],

  // --- Axial Age (-500) ---
  chorrera_500: ["Chorrera"],
  paleo_inuit_500: ["Paleo-Inuit"],

  // --- Iron Age (-800) ---
  chorrera_ia: ["Chorrera"],
  lusatian_culture_ia: ["Lusatian culture"],
  la_tene_ia: ["La Tène culture"],

  // --- Bronze Age (-1600) ---
  chorrera_ba: ["Chorrera"],
  poverty_point_ba: ["Poverty point culture"],
  el_paraiso_ba: ["El Paraiso"],
  urnfield_cultures: ["Urnfield cultures", "N. European Bronze Age cultures"],
  lusatian_bronze: ["Lusatian culture", "N. European Bronze Age cultures"],
  nubian_new_kingdom_allies: ["Kush", "Meroe", "Upper Nile valley farmers"],

  // --- Iron Age (-800) additions ---
  latin_sabine_800bce: ["Latins", "Sabines", "Rome", "Etrurians", "Greek city-states"],
  phrygia_europe_800bce: ["Thrace", "Celts", "Illyrians"],

  // --- Axial Age (-500) additions ---
  cyrene_axial: ["Cyrene", "Greek city-states"],
  massalia_500bce: ["Celts", "Greek city-states"],

  // --- Hellenistic (-323) additions ---
  pontus_hellenistic: ["minor states", "Greek city-states"],
  bithynia_hellenistic: ["minor states", "Greek city-states"],
  ptolemaic_egypt_323: ["Ptolemaic Kingdom", "Empire of Alexander", "Egypt"],

  // ============================================
  // Gap-fill: culture/tribe era clones
  // ============================================
  adena_culture_ia: ["Adena Culture", "Eastern North Amercian hunter-gatherers"],
  arctic_hunters_1200: ["Arctic marine mammal hunters"],
  arctic_hunters_220: ["Arctic marine mammal hunters"],
  arctic_hunters_476: ["Arctic marine mammal hunters"],
  arctic_hunters_750: ["Arctic marine mammal hunters"],
  arctic_hunters_han: ["Arctic marine mammal hunters"],
  arctic_hunters_ia_800: ["Arctic marine mammal hunters"],
  east_na_220: ["Eastern North Amercian hunter-gatherers"],
  east_na_476: ["Eastern North Amercian hunter-gatherers"],
  east_na_750: ["Eastern North Amercian hunter-gatherers"],
  east_na_han: ["Eastern North Amercian hunter-gatherers"],
  east_na_qin: ["Eastern North Amercian hunter-gatherers"],
  guarani_tupi_1200: ["Amazon hunter-gatherers"],
  guarani_tupi_220: ["Amazon hunter-gatherers"],
  guarani_tupi_750: ["Amazon hunter-gatherers"],
  maize_farmers_ax: ["Maize farmers"],
  maize_farmers_ia_800: ["Maize farmers"],
  manioc_farmers_1200: ["Manioc farmers"],
  manioc_farmers_220: ["Manioc farmers"],
  manioc_farmers_476: ["Manioc farmers"],
  manioc_farmers_750: ["Manioc farmers"],
  manioc_farmers_ax: ["Manioc farmers"],
  manioc_farmers_han: ["Manioc farmers"],
  manioc_farmers_hel: ["Manioc farmers"],
  manioc_farmers_ia: ["Manioc farmers"],
  manioc_farmers_qin: ["Manioc farmers"],
  na_pacific_foragers_1200: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_220: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_476: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_750: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_ax: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_han: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_hel: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_ia: ["North American Pacifi foraging, hunting and fishing peoples"],
  na_pacific_foragers_qin: ["North American Pacifi foraging, hunting and fishing peoples"],
  patagonian_hunters_1200: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_220: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_476: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_750: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_ax: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_han: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_hel: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_ia: ["Patagonian shellfish and marine mammal hunters"],
  patagonian_hunters_qin: ["Patagonian shellfish and marine mammal hunters"],
  plain_bison_1200: ["Plain bison hunters"],
  plain_bison_220: ["Plain bison hunters"],
  plain_bison_476: ["Plain bison hunters"],
  plain_bison_750: ["Plain bison hunters"],
  plain_bison_han: ["Plain bison hunters"],
  plain_bison_hellen: ["Plain bison hunters"],
  plateau_fishers_1200: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_220: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_476: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_750: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_ax: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_han: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_hel: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_ia: ["Plateau fichers and hunter gatherers"],
  plateau_fishers_qin: ["Plateau fichers and hunter gatherers"],
  shellfish_gatherers_ax: ["Shellfish gatherers"],
  shellfish_gatherers_ia: ["Shellfish gatherers"],
  subarctic_hunters_1200: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_220: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_476: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_750: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_ax: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_han: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_hel: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_ia: ["Subarctic forest hunter-gatherers"],
  subarctic_hunters_qin: ["Subarctic forest hunter-gatherers"],

  // ============================================
  // Gap-fill: historical European & African entities
  // ============================================

  // --- Hellenistic (-323) ---
  maya_preclassic_323: ["Maya chiefdoms and states"],
  meroe_323: ["Meroe", "Kush"],
  zapotec_323: ["Monte Albán", "Olmec", "Maya chiefdoms and states"],

  // --- Qin-Rome (-221) ---
  epirus_221: ["Epirus", "Greek city-states"],
  dacia_221: ["Dacia", "Getae"],
  illyria_221: ["Illyrians"],
  garamantes_221: ["Guanches"],
  cyrenaica_221: ["Ptolemaic Kingdom", "Cyraneica (UK Lybia)"],
  nasca_early_221: ["Nazca", "Paracas", "Andean hunter-gatherers"],
  teotihuacan_early_221: ["Teotihuacán", "Teotihuacàn"],

  // --- Han-Rome Peak (100) ---
  ireland_100: ["Celts", "Celtic kingdoms"],
  scotland_100: ["Picts", "Celts"],
  free_dacia_100: ["Dacia"],
  germanic_marcomanni_100: ["Celts", "Heruli"],
  berber_atlas_100: ["Berbers", "Mauri"],
  nok_successor_100: ["West African cereal farmers"],
  azania_100: ["Bantou", "Ethiopian highland farmers"],
  bantu_expansion_100: ["Bantou", "Bantu"],
  nasca_early_100: ["Nazca"],

  // --- Three Kingdoms (220) ---
  palmyra_220: ["Palmyra", "Roman Empire"],
  irish_kingdoms_220: ["Celtic kingdoms", "Celts"],
  picts_220: ["Picts", "Pictland", "Celtic kingdoms"],
  alamanni_220: ["Celts", "Heruli"],
  franks_220: ["Celts", "Heruli"],
  nok_220: ["West African cereal farmers"],
  berber_polities_220: ["Berbers", "Mauri"],
  azania_coast_220: ["Bantou", "Ethiopian highland farmers"],

  // --- Fall of Rome (476) ---
  lombards_476: ["Lombard principalities", "Lombards"],
  alamanni_476: ["Celts", "Heruli"],
  thuringians_476: ["Celts", "Heruli"],
  frisians_476: ["Frisians", "Franks"],
  irish_kingdoms_476: ["Celtic kingdoms", "Celts"],
  wales_476: ["Celtic kingdoms", "Celts"],
  garamantes_476: ["Guanches"],
  bantu_west_476: ["Bantou", "West African cereal farmers"],
  western_roman_476: ["Western Roman Empire", "Roman Empire"],
  slavic_tribes_476: ["Slavs", "Slavonic tribes", "Proto-Slavs"],
  alodia_476: ["Alwa", "Alodia", "Makkura"],
  bantu_east_476: ["Bantou", "Bantu"],

  // --- Tang Golden Age (750) ---
  norse_polities_750: ["Swedes", "Danes", "Swedes and Goths"],
  bantu_south_750: ["Bantou", "Bantu"],
  berber_kingdoms_750: ["Berber Tribes", "Mauri", "Berbers"],

  // --- Crusades (1200) ---
  latin_empire_1200: ["Latin Empire", "Byzantine Empire", "Eastern Roman Empire"],
  teutonic_order_1200: ["Teutonic Knights", "Poland"],
  ireland_1200: ["Celtic kingdoms", "Ireland"],
  wales_1200: ["Celtic kingdoms", "Celts"],

  // --- Iron Age (-800) ---
  nasca_paracas_early: ["Paracas", "Chavin", "Andean hunter-gatherers"],

  // --- Renaissance (1500) ---
  genoa_1500: ["Genoa", "Holy Roman Empire"],
  naples_1500: ["Naples", "Kingdom of Naples", "Kingdom of the Two Sicilies"],
  sicily_1500: ["Sicily"],
  ireland_1500: ["Celtic kingdoms", "Ireland"],
  wallachia_1500: ["Wallachia", "Romania"],
  moldavia_1500: ["Moldavia", "Moldova"],
  bohemia_1500: ["Holy Roman Empire", "Bohemia"],
  savoy_1500: ["Sardinia-Piedmont", "Savoy"],
  ragusa_1500: ["Ragusa", "Venice"],
  jolof_1500: ["West African cereal farmers"],
  ajuran_1500: ["Islamic city-states"],
  buganda_early_1500: ["Buganda", "Bantou"],
  luba_early_1500: ["Luba", "Bantou"],
  lunda_early_1500: ["Lunda", "Bantou"],

  // --- Early Modern (1648) ---
  brandenburg_prussia_1648: ["Brandenburg", "Prussia"],
  ireland_1648: ["England and Ireland", "Ireland"],
  scotland_1648: ["Scotland", "Scottland"],
  naples_1648: ["Naples", "Kingdom of the Two Sicilies"],
  sicily_1648: ["Sicily"],
  transylvania_1648: ["Transylvania", "Hungary"],
  wallachia_1648: ["Wallachia", "Romania"],
  moldavia_1648: ["Moldavia", "Moldova"],
  ragusa_1648: ["Ragusa", "Venice"],
  malta_1648: ["Malta", "Knights of Saint John"],
  algiers_regency_1648: ["Algiers"],
  tunis_regency_1648: ["Tunis"],
  tripoli_regency_1648: ["Tripolitania", "Libya"],
  ashanti_early_1648: ["West African cereal farmers", "Asante"],
  dahomey_early_1648: ["Dahomey", "West African cereal farmers"],
  bornu_1648: ["Bornu-Kanem"],
  buganda_early_1648: ["Buganda", "Bantou"],
  mutapa_1648: ["Mwenemutapa", "Great Zimbabwe"],
  zanzibar_1648: ["Zanzibar", "Islamic city-states"],

  // --- Crusades (1200) ---
  chimor_1200: ["Chimú Empire"],
  muisca_1200: ["Amazon hunter-gatherers"],

  // ============================================
  // Gap-fill: Americas, Oceania, Australia — batch 3
  // ============================================

  // --- Mongol Empire (1280) additional ---
  subarctic_hunters_1280: ["Subarctic forest hunter-gatherers"],
  na_pacific_foragers_1280: ["North American Pacifi foraging, hunting and fishing peoples"],
  plateau_fishers_1280: ["Plateau fichers and hunter gatherers"],
  manioc_farmers_1280: ["Manioc farmers"],
  plain_bison_1280: ["Plain bison hunters"],
  patagonian_hunters_1280: ["Patagonian shellfish and marine mammal hunters"],
  guarani_tupi_1280: ["Amazon hunter-gatherers"],
  muisca_1280: ["Amazon hunter-gatherers"],
  east_na_1280: ["Eastern North Amercian hunter-gatherers"],
  arctic_hunters_1280: ["Arctic marine mammal hunters"],

  // --- Renaissance (1500) additional ---
  subarctic_hunters_1500: ["Subarctic forest hunter-gatherers"],
  na_pacific_foragers_1500: ["North American Pacifi foraging, hunting and fishing peoples"],
  plateau_fishers_1500: ["Plateau fichers and hunter gatherers"],
  manioc_farmers_1500: ["Manioc farmers"],
  plain_bison_1500: ["Plain bison hunters"],
  patagonian_hunters_1500: ["Patagonian shellfish and marine mammal hunters"],
  guarani_tupi_1500: ["Amazon hunter-gatherers"],
  east_na_1500: ["Eastern North Amercian hunter-gatherers"],
  arctic_hunters_1500: ["Arctic marine mammal hunters"],
  mississippian_1500: ["Eastern North Amercian hunter-gatherers"],

  // --- Early Modern (1648) additional ---
  subarctic_hunters_1648: ["Subarctic forest hunter-gatherers"],
  na_pacific_foragers_1648: ["North American Pacifi foraging, hunting and fishing peoples"],
  plateau_fishers_1648: ["Plateau fichers and hunter gatherers"],
  manioc_farmers_1648: ["Manioc farmers"],
  plain_bison_1648: ["Plain bison hunters"],
  patagonian_hunters_1648: ["Patagonian shellfish and marine mammal hunters"],
  guarani_tupi_1648: ["Amazon hunter-gatherers"],
  east_na_1648: ["Eastern North Amercian hunter-gatherers"],
  arctic_hunters_1648: ["Arctic marine mammal hunters"],
  miskito_kingdom_1648: ["Belize"],

  // --- Enlightenment (1750) additional ---
  subarctic_hunters_1750: ["Subarctic forest hunter-gatherers"],
  na_pacific_foragers_1750: ["North American Pacifi foraging, hunting and fishing peoples"],
  plateau_fishers_1750: ["Plateau fichers and hunter gatherers"],
  manioc_farmers_1750: ["Manioc farmers"],
  plain_bison_1750: ["Plain bison hunters"],
  patagonian_hunters_1750: ["Patagonian shellfish and marine mammal hunters"],
  guarani_tupi_1750: ["Amazon hunter-gatherers"],
  east_na_1750: ["Eastern North Amercian hunter-gatherers"],
  arctic_hunters_1750: ["Arctic marine mammal hunters"],
  cherokee_1750: ["Cherokee", "Cherookee"],
  comanche_1750: ["Comanche"],
  creek_confederacy_1750: ["Creek", "Cherokee", "Eastern North Amercian hunter-gatherers"],

  // --- Industrial Revolution (1840) additional ---
  paraguay_1840: ["Paraguay"],
  venezuela_1840: ["Venezuela", "Vice-Royalty of New Granada"],
  dominican_republic_1840: ["Dominican Republic", "Haiti"],
  australia_colonies_1840: ["South Australia (UK)", "Western Australia (UK)", "Australia", "Australian aboriginal hunter-gatherers"],

  // --- World War Era (1939) additional ---
  mexico_1939: ["Mexico"],
  cuba_1939: ["Cuba"],
  bolivia_1939: ["Bolivia"],
  ecuador_1939: ["Ecuador"],
  paraguay_1939: ["Paraguay"],
  uruguay_1939: ["Uruguay"],

  // --- Cold War (1962) additional ---
  guatemala_1962: ["Guatemala"],
  honduras_1962: ["Honduras"],
  el_salvador_1962: ["El Salvador"],
  nicaragua_1962: ["Nicaragua"],
  costa_rica_1962: ["Costa Rica"],
  panama_1962: ["Panama"],
  haiti_1962: ["Haiti"],
  dominican_republic_1962: ["Dominican Republic"],
  jamaica_1962: ["Jamaica"],
  paraguay_1962: ["Paraguay"],
  uruguay_1962: ["Uruguay"],

  // --- Modern Era (2000) additional ---
  modern_peru: ["Peru"],
  modern_chile: ["Chile"],
  modern_venezuela: ["Venezuela"],
  modern_bolivia: ["Bolivia"],
  modern_ecuador: ["Ecuador"],
  modern_paraguay: ["Paraguay"],
  modern_uruguay: ["Uruguay"],
  modern_cuba: ["Cuba"],

  // --- AI Age (2023) additional ---
  ai_brazil: ["Brazil"],
  ai_mexico: ["Mexico"],
  ai_ecuador: ["Ecuador"],
  ai_bolivia: ["Bolivia"],
  ai_paraguay: ["Paraguay"],
  ai_uruguay: ["Uruguay"],
  ai_cuba: ["Cuba"],

  // ============================================
  // Gap-fill: Africa & Middle East — batch 4
  // ============================================

  // --- Modern Era (2000) Africa ---
  modern_niger: ["Niger"],
  modern_chad: ["Chad"],
  modern_burkina_faso: ["Burkina Faso"],
  modern_benin: ["Benin"],
  modern_togo: ["Togo"],
  modern_sierra_leone: ["Sierra Leone"],
  modern_liberia: ["Liberia"],
  modern_gambia: ["Gambia, The", "Gambia"],
  modern_guinea: ["Guinea"],
  modern_ivory_coast: ["Ivory Coast", "Côte d'Ivoire"],
  modern_gabon: ["Gabon"],
  modern_car: ["Central African Republic"],
  modern_djibouti: ["Djibouti"],
  modern_eritrea: ["Eritrea"],
  modern_madagascar: ["Madagascar"],
  modern_malawi: ["Malawi"],
  modern_zambia: ["Zambia"],
  modern_botswana: ["Botswana"],
  modern_namibia: ["Namibia"],
  modern_lesotho: ["Lesotho"],
  modern_eswatini: ["Swaziland", "Eswatini"],
  modern_rwanda: ["Rwanda"],
  modern_burundi: ["Burundi"],

  // --- Modern Era (2000) Middle East ---
  modern_afghanistan: ["Afghanistan"],
  modern_yemen: ["Yemen"],
  modern_jordan: ["Jordan"],
  modern_lebanon: ["Lebanon"],
  modern_syria: ["Syria"],
  modern_kuwait: ["Kuwait"],
  modern_qatar: ["Qatar"],
  modern_bahrain: ["Bahrain"],
  modern_oman: ["Oman"],
  modern_armenia: ["Armenia"],
  modern_azerbaijan: ["Azerbaijan"],
  modern_georgia: ["Georgia"],

  // --- AI Age (2023) Africa ---
  ai_niger: ["Niger"],
  ai_chad: ["Chad"],
  ai_burkina_faso: ["Burkina Faso"],
  ai_benin: ["Benin"],
  ai_togo: ["Togo"],
  ai_sierra_leone: ["Sierra Leone"],
  ai_liberia: ["Liberia"],
  ai_gambia: ["Gambia, The", "Gambia"],
  ai_guinea: ["Guinea"],
  ai_ivory_coast: ["Ivory Coast", "Côte d'Ivoire"],
  ai_gabon: ["Gabon"],
  ai_car: ["Central African Republic"],
  ai_djibouti: ["Djibouti"],
  ai_eritrea: ["Eritrea"],
  ai_malawi: ["Malawi"],
  ai_zambia: ["Zambia"],
  ai_botswana: ["Botswana"],
  ai_namibia: ["Namibia"],
  ai_lesotho: ["Lesotho"],
  ai_eswatini: ["Swaziland", "Eswatini"],
  ai_burundi: ["Burundi"],
  ai_south_sudan: ["South Sudan", "Sudan"],
  ai_angola: ["Angola"],
  ai_guinea_bissau: ["Guinea-Bissau"],
  ai_eq_guinea: ["Equatorial Guinea"],
  ai_mauritania: ["Mauritania"],
  ai_western_sahara: ["Western Sahara"],

  // --- AI Age (2023) Middle East ---
  ai_afghanistan: ["Afghanistan"],
  ai_yemen: ["Yemen"],
  ai_jordan: ["Jordan"],
  ai_lebanon: ["Lebanon"],
  ai_syria: ["Syria"],
  ai_kuwait: ["Kuwait"],
  ai_qatar: ["Qatar"],
  ai_bahrain: ["Bahrain"],
  ai_oman: ["Oman"],
  ai_armenia: ["Armenia"],
  ai_azerbaijan: ["Azerbaijan"],
  ai_georgia: ["Georgia"],
};

/**
 * Geometry clip rules: after matching, clip a region's geometry to a
 * bounding polygon for specific snapshot year ranges.
 *
 * Use case: the 200 CE basemap has a single "Han" entity, but we need
 * separate geometries for Cao Wei (north), Sun Wu (southeast), and
 * Shu Han (southwest) in the Three Kingdoms era.
 *
 * clipPolygon: array of [lon, lat] coordinates forming a clipping polygon.
 * The region's geometry will be intersected with this polygon.
 * yearMin/yearMax: snapshot year range to apply.
 */
export const GEOMETRY_CLIP_RULES: Record<
  string,
  { clipPolygon: number[][]; yearMin?: number; yearMax?: number }[]
> = {
  // Cao Wei: northern China — north of the Qinling-Huaihe line
  cao_wei_220: [
    {
      clipPolygon: [
        [90, 55], [130, 55], [130, 32.5],
        [121, 32], [117, 32], [114, 32.5], [111, 33],
        [108, 33.5], [105, 34], [103, 34], [100, 35.5],
        [90, 35.5], [90, 55],
      ],
      yearMin: -200,
      yearMax: 400,
    },
  ],
  // Sun Wu: southeast China — south of the Qinling-Huaihe line and east of ~107°E
  sun_wu_220: [
    {
      clipPolygon: [
        [107, 33.5], [108, 33.5], [111, 33], [114, 32.5],
        [117, 32], [121, 32], [130, 32.5],
        [130, 15], [107, 15], [107, 33.5],
      ],
      yearMin: -200,
      yearMax: 400,
    },
  ],
  // Shu Han: Sichuan basin + Yunnan/Guizhou — west of ~107°E, south of ~34°N
  shu_han_220: [
    {
      clipPolygon: [
        [90, 35.5], [100, 35.5], [103, 34], [105, 34],
        [107, 33.5], [107, 15], [90, 15], [90, 35.5],
      ],
      yearMin: -200,
      yearMax: 400,
    },
  ],

  // ==================== GREECE / OTTOMAN BORDER ====================
  // Kingdom of Greece (1832–1881): Peloponnese, central Greece, Cyclades
  // Northern border ~39°N (Arta-Volos line), before Thessaly was ceded in 1881
  greece_1840: [
    {
      clipPolygon: [
        [19, 39.2], [22.5, 39.2], [23.5, 39.5], [24.5, 39.2],
        [27, 39.2], [27, 34], [19, 34], [19, 39.2],
      ],
      yearMin: 1700,
      yearMax: 1880,
    },
  ],
  // Greece (post-1881): gained Thessaly, border moves north to ~40°N
  greece_1900: [
    {
      clipPolygon: [
        [19, 40.2], [22, 40.5], [24.5, 40.2], [26, 40.5],
        [27, 40.5], [27, 34], [19, 34], [19, 40.2],
      ],
      yearMin: 1880,
      yearMax: 1920,
    },
  ],
  // Albania (Ottoman vilayet until 1912): approximate territory
  albania_1900: [
    {
      clipPolygon: [
        [19, 42.5], [21.5, 42.5], [21.5, 39.5], [19, 39.5], [19, 42.5],
      ],
      yearMin: 1700,
      yearMax: 1920,
    },
  ],
  // Wallachia: southern Romania, between Carpathians and Danube
  wallachia_1750: [
    {
      clipPolygon: [
        [22.5, 45.5], [28, 45.5], [28, 43], [22.5, 43], [22.5, 45.5],
      ],
      yearMin: 1600,
      yearMax: 1880,
    },
  ],
  // Moldavia: eastern Romania / Moldova
  moldavia_1750: [
    {
      clipPolygon: [
        [26, 48.5], [30, 48.5], [30, 45], [26, 45], [26, 48.5],
      ],
      yearMin: 1600,
      yearMax: 1880,
    },
  ],

  // ==================== WEST AFRICA ====================
  // Sokoto Caliphate: northern Nigeria / southern Niger
  sokoto_1840: [
    {
      clipPolygon: [
        [3, 14], [15, 14], [15, 7], [8, 7],
        [3, 9], [3, 14],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Masina Empire (Diina): inner Niger delta, central Mali
  masina_1840: [
    {
      clipPolygon: [
        [-6, 16], [0, 16], [0, 12], [-6, 12], [-6, 16],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Futa Jallon: highlands of Guinea
  futa_jallon_1840: [
    {
      clipPolygon: [
        [-14, 12.5], [-10, 12.5], [-10, 9.5], [-14, 9.5], [-14, 12.5],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Futa Toro: Senegal River valley
  futa_toro_1840: [
    {
      clipPolygon: [
        [-17, 17], [-12, 17], [-12, 13.5], [-17, 13.5], [-17, 17],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Senegal (French): coastal Senegal
  senegal_1840: [
    {
      clipPolygon: [
        [-18, 16.5], [-15, 16.5], [-15, 12], [-18, 12], [-18, 16.5],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Segu Bambara: middle Niger around Ségou, Mali
  segu_bambara_1840: [
    {
      clipPolygon: [
        [-9, 15], [-4, 15], [-4, 11.5], [-9, 11.5], [-9, 15],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Kaarta: western Mali
  kaarta_1840: [
    {
      clipPolygon: [
        [-12, 16], [-8, 16], [-8, 12.5], [-12, 12.5], [-12, 16],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Kong Empire: northern Ivory Coast
  kong_empire_1840: [
    {
      clipPolygon: [
        [-8, 11.5], [-3, 11.5], [-3, 7.5], [-8, 7.5], [-8, 11.5],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Fante Confederacy: coastal Ghana
  fante_confederacy_1840: [
    {
      clipPolygon: [
        [-3, 7], [0.5, 7], [0.5, 4.5], [-3, 4.5], [-3, 7],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Songhai remnant (Dendi): along the Niger bend, Niger/Benin border
  songhai_remnant_1840: [
    {
      clipPolygon: [
        [0, 15], [4, 15], [4, 11], [0, 11], [0, 15],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Air Sultanate: Aïr Mountains, central Niger
  air_sultanate_1840: [
    {
      clipPolygon: [
        [5, 21], [11, 21], [11, 16], [5, 16], [5, 21],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Oyo Empire: southwestern Nigeria
  oyo_empire_1840: [
    {
      clipPolygon: [
        [1, 10], [5.5, 10], [5.5, 6], [1, 6], [1, 10],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== CENTRAL AFRICA ====================
  // Kongo Kingdom remnant: lower Congo River, northern Angola / Cabinda
  kongo_remnant_1840: [
    {
      clipPolygon: [
        [11, -2], [17, -2], [17, -8], [11, -8], [11, -2],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Teke Kingdom: Pool Malebo / middle Congo, Republic of Congo
  teke_kingdom_1840: [
    {
      clipPolygon: [
        [13, 1], [19, 1], [19, -5], [13, -5], [13, 1],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Kuba Kingdom: Kasai region, central DRC
  kuba_kingdom_1840: [
    {
      clipPolygon: [
        [19, -2], [25, -2], [25, -7], [19, -7], [19, -2],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Yaka Kingdom: Kwango River, western DRC / northern Angola
  yaka_kingdom_1840: [
    {
      clipPolygon: [
        [16, -4], [20, -4], [20, -9], [16, -9], [16, -4],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Imbangala: eastern Angola
  imbangala_1840: [
    {
      clipPolygon: [
        [15, -8], [21, -8], [21, -14], [15, -14], [15, -8],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== EAST AFRICA ====================
  // Egyptian Sudan: Nile Valley from Aswan south to ~10°N
  egyptian_sudan_1840: [
    {
      clipPolygon: [
        [24, 23], [37, 23], [37, 9], [30, 9],
        [24, 12], [24, 23],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Darfur Sultanate: western Sudan
  darfur_sultanate_1840: [
    {
      clipPolygon: [
        [22, 16], [28, 16], [28, 10], [22, 10], [22, 16],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Bagirmi: Chad basin, south of Lake Chad
  bagirmi_1840: [
    {
      clipPolygon: [
        [14, 14], [19, 14], [19, 9], [14, 9], [14, 14],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Nkore (Ankole): southwestern Uganda
  nkore_1840: [
    {
      clipPolygon: [
        [29, 0.5], [31, 0.5], [31, -1.5], [29, -1.5], [29, 0.5],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Awsa Sultanate: Afar lowlands, eastern Ethiopia / Djibouti
  awsa_sultanate_1840: [
    {
      clipPolygon: [
        [39, 13], [44, 13], [44, 9], [39, 9], [39, 13],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Oromo territories: central-southern Ethiopian highlands
  oromo_1840: [
    {
      clipPolygon: [
        [35, 10], [42, 10], [42, 4], [35, 4], [35, 10],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== SOUTHERN AFRICA ====================
  // Zulu Kingdom: coastal KwaZulu-Natal
  zulu_1840: [
    {
      clipPolygon: [
        [29, -27], [33, -27], [33, -31], [29, -31], [29, -27],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Ndebele (Matabele): northern portion of Zulu territory, migrating toward Zimbabwe
  ndebele_1840: [
    {
      clipPolygon: [
        [28, -26], [33, -26], [33, -29], [28, -29], [28, -26],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Swazi Kingdom: Eswatini area
  swazi_1840: [
    {
      clipPolygon: [
        [30.5, -25.5], [32.5, -25.5], [32.5, -27.5], [30.5, -27.5], [30.5, -25.5],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Basotho Kingdom: Lesotho highlands
  basotho_1840: [
    {
      clipPolygon: [
        [27, -28.5], [30, -28.5], [30, -31], [27, -31], [27, -28.5],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Transvaal Boer republics: interior highveld
  transvaal_boer_1840: [
    {
      clipPolygon: [
        [25, -22], [31, -22], [31, -27], [25, -27], [25, -22],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Natal / Boer Republic of Natalia: coastal KZN south of Tugela
  natal_boer_1840: [
    {
      clipPolygon: [
        [28, -28], [32, -28], [32, -31.5], [28, -31.5], [28, -28],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Delagoa Bay area: southern Mozambique coast
  delagoa_bay_1840: [
    {
      clipPolygon: [
        [31, -23], [36, -23], [36, -27], [31, -27], [31, -23],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Xhosa territories: Eastern Cape
  xhosa_1840: [
    {
      clipPolygon: [
        [25, -31], [29, -31], [29, -34], [25, -34], [25, -31],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Shona states: eastern Zimbabwe / Mashonaland
  shona_states_1840: [
    {
      clipPolygon: [
        [28, -15], [34, -15], [34, -22], [28, -22], [28, -15],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],
  // Ovimbundu kingdoms: central Angolan highlands
  ovimbundu_1840: [
    {
      clipPolygon: [
        [13, -10], [19, -10], [19, -15], [13, -15], [13, -10],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== MIDDLE EAST ====================
  // Saudi Second State (Emirate of Nejd): central Arabian Peninsula
  saudi_second_state_1840: [
    {
      clipPolygon: [
        [40, 28], [50, 28], [50, 20], [40, 20], [40, 28],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== NORTH AFRICA ====================
  // Kanem (Wadai Empire): eastern Chad
  kanem_1840: [
    {
      clipPolygon: [
        [18, 16], [24, 16], [24, 10], [18, 10], [18, 16],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== SOMALI SULTANATES ====================
  somali_sultanates_1840: [
    {
      clipPolygon: [
        [41, 12], [52, 12], [52, -1], [41, -1], [41, 12],
      ],
      yearMin: 1700,
      yearMax: 1900,
    },
  ],

  // ==================== FINLAND (Grand Duchy within Russia) ====================
  finland_1900: [
    {
      clipPolygon: [
        [20, 59.8], [26, 59.8], [30, 60.5], [32, 62],
        [32, 64], [30, 66], [29, 68], [28, 69.5], [25, 70.5],
        [20, 70.5], [20, 59.8],
      ],
      yearMin: 1800,
      yearMax: 1920,
    },
  ],

  // ==================== AFRICA: CLIP LARGE CATCHALL POLYGONS ====================

  // Kanem Empire: Lake Chad basin and surrounding Sahel
  kanem_750: [
    {
      clipPolygon: [
        [8, 18], [20, 18], [20, 8], [14, 8],
        [8, 10], [8, 18],
      ],
    },
  ],

  // Takrur: Senegal River / western Sahel
  takrur_750: [
    {
      clipPolygon: [
        [-17, 17], [-10, 17], [-10, 12], [-17, 12], [-17, 17],
      ],
    },
  ],

  // Igbo-Ukwu: southeastern Nigeria
  igbo_ukwu_750: [
    {
      clipPolygon: [
        [5, 9], [10, 9], [10, 4], [5, 4], [5, 9],
      ],
    },
  ],

  // Bantu Southern Expansion (750 CE): eastern/southern Africa
  // between ~8°S and ~20°S, coast to coast
  bantu_south_750: [
    {
      clipPolygon: [
        [5, -2], [44, -2], [44, -22],
        [30, -22], [15, -20], [5, -14], [5, -2],
      ],
    },
  ],

  // Bantu Early (500 BCE): Cameroon/Nigeria border region
  bantu_early_500bce: [
    {
      clipPolygon: [
        [5, 10], [15, 10], [15, 2], [5, 2], [5, 10],
      ],
    },
  ],

  // Bantu East African polities (various eras)
  bantu_east_african_polities: [
    {
      clipPolygon: [
        [25, 5], [42, 5], [42, -15], [25, -15], [25, 5],
      ],
    },
  ],
  bantu_east_africa_220: [
    {
      clipPolygon: [
        [25, 5], [42, 5], [42, -15], [25, -15], [25, 5],
      ],
    },
  ],
  bantu_west_476: [
    {
      clipPolygon: [
        [5, 8], [20, 8], [20, -10], [5, -10], [5, 8],
      ],
    },
  ],
  bantu_east_476: [
    {
      clipPolygon: [
        [25, 5], [42, 5], [42, -15], [25, -15], [25, 5],
      ],
    },
  ],
  bantu_expansion_100: [
    {
      clipPolygon: [
        [10, 8], [40, 8], [40, -15], [10, -15], [10, 8],
      ],
    },
  ],

  // Khoisan: southern tip of Africa, pushed below ~18°S
  khoisan_peoples: [
    {
      clipPolygon: [
        [10, -18], [40, -18], [40, -35], [10, -35], [10, -18],
      ],
    },
  ],
  khoisan_ia: [
    {
      clipPolygon: [
        [10, -15], [44, -15], [44, -35], [10, -35], [10, -15],
      ],
    },
  ],
  khoisan_axial: [
    {
      clipPolygon: [
        [10, -15], [44, -15], [44, -35], [10, -35], [10, -15],
      ],
    },
  ],
  khoisan_hellen: [
    {
      clipPolygon: [
        [10, -12], [44, -12], [44, -35], [10, -35], [10, -12],
      ],
    },
  ],
  khoisan_qin: [
    {
      clipPolygon: [
        [10, -12], [44, -12], [44, -35], [10, -35], [10, -12],
      ],
    },
  ],
  khoisan_han: [
    {
      clipPolygon: [
        [10, -12], [44, -12], [44, -35], [10, -35], [10, -12],
      ],
    },
  ],
  khoisan_220: [
    {
      clipPolygon: [
        [10, -12], [44, -12], [44, -35], [10, -35], [10, -12],
      ],
    },
  ],
  khoisan_476: [
    {
      clipPolygon: [
        [10, -15], [44, -15], [44, -35], [10, -35], [10, -15],
      ],
    },
  ],
  khoisan_750: [
    {
      clipPolygon: [
        [10, -22], [44, -22], [44, -35], [10, -35], [10, -22],
      ],
    },
  ],
  khoisan_1200: [
    {
      clipPolygon: [
        [15, -22], [40, -22], [40, -35], [15, -35], [15, -22],
      ],
    },
  ],
  khoisan_1280: [
    {
      clipPolygon: [
        [15, -22], [40, -22], [40, -35], [15, -35], [15, -22],
      ],
    },
  ],
  khoisan_1500: [
    {
      clipPolygon: [
        [15, -25], [35, -25], [35, -35], [15, -35], [15, -25],
      ],
    },
  ],
  khoisan_1648: [
    {
      clipPolygon: [
        [15, -27], [32, -27], [32, -35], [15, -35], [15, -27],
      ],
    },
  ],
  khoisan_1750: [
    {
      clipPolygon: [
        [15, -28], [30, -28], [30, -35], [15, -35], [15, -28],
      ],
    },
  ],

  // Berber Resistance Kingdoms (750): inland Maghreb / Atlas mountains (south of ~34°N)
  berber_kingdoms_750: [
    {
      clipPolygon: [
        [-7, 34], [0, 34], [0, 31], [-7, 31], [-7, 34],
      ],
    },
  ],

  // Maghreb Berber polities: northern coastal Maghreb (north of ~34°N)
  maghreb_berber_polities: [
    {
      clipPolygon: [
        [-7, 36], [0, 36], [0, 34], [-7, 34], [-7, 36],
      ],
    },
  ],

  // Nok successor / pre-state West African regions (various eras)
  nok_culture_west_africa: [
    {
      clipPolygon: [
        [-5, 12], [10, 12], [10, 5], [-5, 5], [-5, 12],
      ],
    },
  ],
  nok_west_africa_500bce: [
    {
      clipPolygon: [
        [5, 12], [12, 12], [12, 6], [5, 6], [5, 12],
      ],
    },
  ],
  west_africa_nok_prestate: [
    {
      clipPolygon: [
        [5, 12], [12, 12], [12, 6], [5, 6], [5, 12],
      ],
    },
  ],
  west_african_tribal_polities: [
    {
      clipPolygon: [
        [-17, 15], [15, 15], [15, 3], [-17, 3], [-17, 15],
      ],
    },
  ],
  west_african_tribes: [
    {
      clipPolygon: [
        [-17, 15], [15, 15], [15, 3], [-17, 3], [-17, 15],
      ],
    },
  ],
  west_african_chiefdoms_220: [
    {
      clipPolygon: [
        [-17, 15], [15, 15], [15, 3], [-17, 3], [-17, 15],
      ],
    },
  ],
  west_african_sahel_polities_476: [
    {
      clipPolygon: [
        [-17, 18], [15, 18], [15, 5], [-17, 5], [-17, 18],
      ],
    },
  ],
  nok_successor_100: [
    {
      clipPolygon: [
        [5, 12], [12, 12], [12, 6], [5, 6], [5, 12],
      ],
    },
  ],
  nok_220: [
    {
      clipPolygon: [
        [5, 12], [12, 12], [12, 6], [5, 6], [5, 12],
      ],
    },
  ],

  // Sahel polities (221 BCE)
  sahel_polities_221_bce: [
    {
      clipPolygon: [
        [-12, 18], [8, 18], [8, 10], [-12, 10], [-12, 18],
      ],
    },
  ],

  // Azania coast regions
  azania_100: [
    {
      clipPolygon: [
        [30, 0], [42, 0], [42, -12], [30, -12], [30, 0],
      ],
    },
  ],
  azania_coast_220: [
    {
      clipPolygon: [
        [30, 0], [42, 0], [42, -12], [30, -12], [30, 0],
      ],
    },
  ],

  // Oyo early (1200, 1280): southwestern Nigeria
  oyo_early_1200: [
    {
      clipPolygon: [
        [1, 10], [5, 10], [5, 6], [1, 6], [1, 10],
      ],
    },
  ],
  oyo_early_1280: [
    {
      clipPolygon: [
        [1, 10], [5, 10], [5, 6], [1, 6], [1, 10],
      ],
    },
  ],

  // Benin early (1200): Edo area
  benin_early_1200: [
    {
      clipPolygon: [
        [4, 9], [8, 9], [8, 5], [4, 5], [4, 9],
      ],
    },
  ],

  // Hausa States (1200, 1280): northern Nigeria / southern Niger
  hausa_states_1200: [
    {
      clipPolygon: [
        [3, 14], [12, 14], [12, 9], [3, 9], [3, 14],
      ],
    },
  ],
  hausa_states_1280: [
    {
      clipPolygon: [
        [3, 14], [12, 14], [12, 9], [3, 9], [3, 14],
      ],
    },
  ],

  // Luba early
  luba_early_1200: [
    {
      clipPolygon: [
        [23, -4], [31, -4], [31, -12], [23, -12], [23, -4],
      ],
    },
  ],
  luba_early_1500: [
    {
      clipPolygon: [
        [23, -4], [31, -4], [31, -12], [23, -12], [23, -4],
      ],
    },
  ],
  lunda_early_1500: [
    {
      clipPolygon: [
        [19, -6], [28, -6], [28, -14], [19, -14], [19, -6],
      ],
    },
  ],

  // Jolof (1500): Senegambia
  jolof_1500: [
    {
      clipPolygon: [
        [-17, 16], [-13, 16], [-13, 12], [-17, 12], [-17, 16],
      ],
    },
  ],

  // Dagbon (1500): northern Ghana
  dagbon_1500: [
    {
      clipPolygon: [
        [-3, 11], [1, 11], [1, 8], [-3, 8], [-3, 11],
      ],
    },
  ],

  // Ashanti early (1648)
  ashanti_early_1648: [
    {
      clipPolygon: [
        [-4, 8.5], [0, 8.5], [0, 5.5], [-4, 5.5], [-4, 8.5],
      ],
    },
  ],
  // Dahomey early (1648)
  dahomey_early_1648: [
    {
      clipPolygon: [
        [1, 8.5], [3, 8.5], [3, 6], [1, 6], [1, 8.5],
      ],
    },
  ],

  // Buganda / Great Lakes Bantou regions
  buganda_proto_750: [
    {
      clipPolygon: [
        [29, 2], [36, 2], [36, -4], [29, -4], [29, 2],
      ],
    },
  ],
  buganda_early_1500: [
    {
      clipPolygon: [
        [29, 2], [35, 2], [35, -3], [29, -3], [29, 2],
      ],
    },
  ],
  buganda_early_1648: [
    {
      clipPolygon: [
        [29, 2], [34, 2], [34, -2], [29, -2], [29, 2],
      ],
    },
  ],
  buganda_1750: [
    {
      clipPolygon: [
        [29, 2], [33, 2], [33, -1], [29, -1], [29, 2],
      ],
    },
  ],

  // Liberia (1840): coastal West Africa
  liberia_1840: [
    {
      clipPolygon: [
        [-12, 8.5], [-7.5, 8.5], [-7.5, 4], [-12, 4], [-12, 8.5],
      ],
    },
  ],

  // Nyamwezi (1840)
  nyamwezi_1840: [
    {
      clipPolygon: [
        [30, -2], [36, -2], [36, -8], [30, -8], [30, -2],
      ],
    },
  ],
};

/**
 * Geometry merge rules: after primary matching, merge additional basemap
 * entities into a region's geometry for specific snapshot year ranges.
 *
 * Use case: the aourednik basemaps show Tibet as a separate entity from
 * China in some snapshot years (e.g. 1914–1960), but historically Tibet
 * was part of the Qing Empire (from ~1720) and the PRC (from 1951).
 *
 * Structure: regionId -> array of { names, yearMin?, yearMax? }
 *   names:   basemap NAME strings to merge (tried in order, first hit used)
 *   yearMin: earliest snapshot year (inclusive) to apply this merge
 *   yearMax: latest snapshot year (inclusive) to apply this merge
 */
export const GEOMETRY_MERGE_RULES: Record<
  string,
  { names: string[]; yearMin?: number; yearMax?: number }[]
> = {
  china_republic_1939: [
    { names: ["Tibet", "Tibetan Empire"], yearMin: 1914, yearMax: 1945 },
  ],
  prc_1962: [
    { names: ["Tibet", "Tibetan Empire"], yearMin: 1945, yearMax: 1994 },
  ],
  east_asia_china_prc: [
    { names: ["Tibet", "Tibetan Empire"], yearMin: 1945, yearMax: 1994 },
  ],
  qing_empire_1900: [
    { names: ["Tibet", "Tibetan Empire"], yearMin: 1700, yearMax: 1914 },
  ],
  qing_empire_1840: [
    { names: ["Tibet", "Tibetan Empire"], yearMin: 1700, yearMax: 1880 },
  ],
  qing_dynasty: [
    { names: ["Tibet", "Tibetan Empire"], yearMin: 1700, yearMax: 1900 },
  ],
};

/**
 * Geometry subtract rules: after all regions are matched, clipped and
 * simplified, subtract a child region's actual geometry from a parent
 * region to avoid overlap (e.g. cut Finland out of the Russian Empire).
 *
 * Structure: regionId -> array of { childRegionId, yearMin?, yearMax? }
 *   childRegionId: the region whose geometry to subtract as a hole
 *   yearMin/yearMax: snapshot year range for this rule
 */
export const GEOMETRY_SUBTRACT_RULES: Record<
  string,
  { childRegionId: string; yearMin?: number; yearMax?: number }[]
> = {
  russian_empire_1900: [
    { childRegionId: "finland_1900", yearMin: 1800, yearMax: 1920 },
  ],

  kanem_750: [
    { childRegionId: "ghana_empire" },
  ],

  bantu_south_750: [
    { childRegionId: "khoisan_750" },
  ],

  malaya_1962: [
    { childRegionId: "singapore_1962", yearMin: 1960 },
  ],
  modern_malaysia: [
    { childRegionId: "modern_singapore" },
  ],
  ai_malaysia: [
    { childRegionId: "ai_singapore" },
  ],
};

/**
 * Custom geometries for regions too small to appear in the basemaps.
 * Used as a fallback when no basemap feature matches.
 */
export const CUSTOM_GEOMETRIES: Record<string, GeoJSON.Geometry> = {
  singapore_1962: {
    type: "Polygon",
    coordinates: [[
      [103.605, 1.265], [103.653, 1.222], [103.693, 1.215],
      [103.748, 1.230], [103.804, 1.240], [103.860, 1.248],
      [103.918, 1.263], [103.966, 1.278], [103.992, 1.310],
      [104.020, 1.340], [104.040, 1.365], [104.028, 1.392],
      [103.988, 1.416], [103.935, 1.430], [103.869, 1.438],
      [103.808, 1.440], [103.748, 1.432], [103.690, 1.415],
      [103.650, 1.393], [103.618, 1.360], [103.598, 1.325],
      [103.594, 1.295], [103.605, 1.265],
    ]],
  } as GeoJSON.Geometry,
  modern_singapore: {
    type: "Polygon",
    coordinates: [[
      [103.605, 1.265], [103.653, 1.222], [103.693, 1.215],
      [103.748, 1.230], [103.804, 1.240], [103.860, 1.248],
      [103.918, 1.263], [103.966, 1.278], [103.992, 1.310],
      [104.020, 1.340], [104.040, 1.365], [104.028, 1.392],
      [103.988, 1.416], [103.935, 1.430], [103.869, 1.438],
      [103.808, 1.440], [103.748, 1.432], [103.690, 1.415],
      [103.650, 1.393], [103.618, 1.360], [103.598, 1.325],
      [103.594, 1.295], [103.605, 1.265],
    ]],
  } as GeoJSON.Geometry,
  ai_singapore: {
    type: "Polygon",
    coordinates: [[
      [103.605, 1.265], [103.653, 1.222], [103.693, 1.215],
      [103.748, 1.230], [103.804, 1.240], [103.860, 1.248],
      [103.918, 1.263], [103.966, 1.278], [103.992, 1.310],
      [104.020, 1.340], [104.040, 1.365], [104.028, 1.392],
      [103.988, 1.416], [103.935, 1.430], [103.869, 1.438],
      [103.808, 1.440], [103.748, 1.432], [103.690, 1.415],
      [103.650, 1.393], [103.618, 1.360], [103.598, 1.325],
      [103.594, 1.295], [103.605, 1.265],
    ]],
  } as GeoJSON.Geometry,
};

/**
 * Snapshot years available from the basemaps repo.
 * We skip the deep prehistoric ones (bc123000, bc10000, bc8000, bc5000, bc4000, bc3000)
 * as they predate our earliest era (Bronze Age, -1600 BC).
 */
export const SNAPSHOT_YEARS = [
  -2000, -1500, -1000, -700, -500, -400, -323, -300, -200, -100, -1,
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279,
  1300, 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815,
  1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
];

/**
 * Convert a snapshot year to the filename used in the basemaps repo.
 */
export function snapshotYearToFilename(year: number): string {
  if (year < 0) return `world_bc${Math.abs(year)}.geojson`;
  return `world_${year}.geojson`;
}
