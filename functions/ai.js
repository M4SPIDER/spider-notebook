/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (UPDATED)
 * SDXL + KV + STREAMING + SAFE OUTPUT + FULL DICTIONARY
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.2.1"; // Version bump for Massive Dictionary

const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1500;

//////////////////////////////
// STATIC DICTIONARY (PERMANENT KNOWLEDGE)
// Acts as "Model Training" - Never deleted by user commands
//////////////////////////////
const TRANSLATION_DICT = {
  // --- Greetings (1-26) ---
  "hello": "హలో (Halo) 🕸️",
  "hi": "హాయ్ (Hay) 🔥",
  "thank you": "ధన్యవాదాలు (Dhan'yavadalu) 🙏",
  "thank you very much": "చాలా ధన్యవాదాలు (Cala dhan'yavadalu)",
  "you are welcome": "మీకు స్వాగతం (Miku svagatam)",
  "yes": "అవును (Avunu)",
  "no": "లేదు (Ledu)", 
  "please": "దయచేసి (Dayacesi)",
  "excuse me": "క్షమించండి (Ksamin̄candi)",
  "sorry": "క్షమించండి (Ksamin̄candi)",
  "don't worry": "చింతించకండి (Cintincakandi) 👍",
  "good morning": "శుభోదయం (Subhodayam) ☀️",
  "good afternoon": "శుభ మద్యాహ్నం (Subha madyahnam)",
  "good evening": "శుభ సాయంత్రం (Subha sayantram)",
  "good night": "శుభ రాత్రి (Subha ratri) 🌙",
  "see you later": "తర్వాత కలుద్దాం (Tarvata kaluddam)",
  "goodbye": "వీడ్కోలు (Vidkolu)",
  "bye": "బై (Bai) 👋",
  "how are you": "మీరు ఎలా ఉన్నారు? (Miru ela unnaru?)",
  "how are you?": "మీరు ఎలా ఉన్నారు? (Miru ela unnaru?)",
  "i am fine": "నేను బాగానే ఉన్నాను (Nenu bagane unnanu)",
  "i am fine. and you?": "నేను బాగానే ఉన్నాను. మరియు మీరు? (Nenu bagane unnanu. Mariyu miru?)",
  "what is your name": "నీ పేరు ఏమిటి? (Ni peru emiti?)",
  "what is your name?": "నీ పేరు ఏమిటి? (Ni peru emiti?)",
  "my name is": "నా పేరు... (Na peru...)",
  "nice to meet you": "మిమ్మల్ని కలవడం సంతోషం (Mim'malni kalavadam santosam)",
  "i am pleased to meet you": "మిమ్మల్ని కలవడం నాకు సంతోషంగా ఉంది (Mim'malni kalavadam naku santosanga undi)",
  "bless you": "నిన్ను ఆశీర్వదించుగాక (Ninnu asirvadincugaka)",
  "cheers": "చీర్స్ (Cirs!) 🥂",
  "good luck": "అదృష్టం (Adrstam!)",
  "happy birthday": "పుట్టినరోజు శుభాకాంక్షలు (Puttinaroju subhakanksalu) 🎂",
  "congratulations": "అభినందనలు (Abhinandanalu) 🎉",

  // --- Conversation (27-48) ---
  "do you live here": "మీరు ఇక్కడ ఉంటున్నారా? (Miru ikkada untunnara?)",
  "do you live here?": "మీరు ఇక్కడ ఉంటున్నారా? (Miru ikkada untunnara?)",
  "where are you going": "మీరు ఎక్కడికి వెళుతున్నారు? (Miru ekkadiki velutunnaru?)",
  "where are you going?": "మీరు ఎక్కడికి వెళుతున్నారు? (Miru ekkadiki velutunnaru?)",
  "what are you doing": "నువ్వేమి చేస్తున్నావు? (Nuvvemi cestunnavu?)",
  "what are you doing?": "నువ్వేమి చేస్తున్నావు? (Nuvvemi cestunnavu?)",
  "today is a nice day, isn't it?": "ఈ రోజు మంచి రోజు, కాదా? (I roju man̄ci roju, kada?)",
  "where are you from": "నువ్వు ఎక్కడ నుంచి వచ్చావు? (Nuvvu ekkada nun̄ci vaccavu?)",
  "where are you from?": "నువ్వు ఎక్కడ నుంచి వచ్చావు? (Nuvvu ekkada nun̄ci vaccavu?)",
  "i am from": "నేను నుండి… (Nenu nundi…)",
  "do you like it here?": "మీకు ఇక్కడ నచ్చిందా? (Miku ikkada naccinda?)",
  "yes, i like it here": "అవును, నాకు ఇక్కడ నచ్చింది (Avunu, naku ikkada naccindi)",
  "how long are you here for?": "మీరు ఎంతకాలం ఇక్కడ ఉన్నారు? (Miru entakalam ikkada unnaru?)",
  "i am here for three days": "నేను మూడు రోజులు ఇక్కడ ఉన్నాను (Nenu mudu rojulu ikkada unnanu)",
  "i am here for three weeks": "నేను మూడు వారాలు ఇక్కడ ఉన్నాను (Nenu mudu varalu ikkada unnanu)",
  "how old are you": "మీ వయస్సు ఎంత? (Mi vayas'su enta?)",
  "how old are you?": "మీ వయస్సు ఎంత? (Mi vayas'su enta?)",
  "what is your occupation?": "మీ వృత్తి ఏమిటి? (Mi vr̥tti emiti?)",
  "i am a": "నేను ఒక… (Nenu oka…)",
  "i work in": "నేను పని చేస్తున్నాను… (Nenu pani cestunnanu…)",
  "i am a student": "నేనొక విద్యార్థిని (Nenoka vidyarthini)",
  "i am studying": "నేను చదువుకుంటున్నాను… (Nenu caduvukuntunnanu…)",
  "i am retired": "నేను రిటైర్ అయ్యాను (Nenu ritair ayyanu)",
  "what is your email?": "మీ ఇమెయిల్ ఏమిటి? (Mi imeyil emiti?)",
  "what is your phone number?": "మీ ఫోన్ నంబర్ ఏమిటి? (Mi phon nambar emiti?)",
  "here is my email": "ఇదిగో నా ఇమెయిల్ (Idigo na imeyil)",
  "here is my phone number": "ఇదిగో నా ఫోన్ నంబర్ (Idigo na phon nambar)",
  "are you on facebook or twitter?": "మీరు Facebook లేదా Twitterలో ఉన్నారా? (Miru Facebook leda Twitterlo unnara?)",
  "keep in touch": "సన్నిహితంగా ఉండండి (Sannihitanga undandi)",
  "it has been great meeting you": "మిమ్మల్ని కలవడం చాలా బాగుంది (Mim'malni kalavadam cala bagundi)",

  // --- Pronouns (50-69) ---
  "i": "నేను (Nenu)",
  "me": "నేను (Nenu)",
  "you": "నువ్వు (Nuvvu)", 
  "you (formal/plural)": "మీరు (Meeru)",
  "he": "అతను (Atanu)", 
  "she": "ఆమె (Aame)",
  "it": "అది (Adi)",
  "we": "మేము (Memu)",
  "they": "వారు (Vaaru)",
  "my": "నా (Naa)",
  "your": "నీ (Nee)",
  "your (formal)": "మీ (Mee)",
  "our": "మా (Maa)",
  "that": "ఆ (Aa)",
  "this": "ఈ (Ee)",

  // --- Transportation (70-109) ---
  "how do i get to the zoo?": "నేను జూకి ఎలా వెళ్ళగలను? (Nenu juki ela vellagalanu?)",
  "can we get there by public transport?": "ప్రజా రవాణా ద్వారా మనం అక్కడికి చేరుకోగలమా? (Praja ravana dvara manam akkadiki cerukogalama?)",
  "what time does the bus leave?": "బస్సు ఏ సమయానికి బయలుదేరుతుంది? (Bas'su e samayaniki bayaluderutundi?)",
  "what time does it arrive?": "ఎంత సమయానికి వస్తుంది? (Enta samayaniki vastundi?)",
  "how long will it be delayed?": "ఎంతకాలం ఆలస్యం అవుతుంది? (Entakalam alasyam avutundi?)",
  "is this seat free?": "ఈ సీటు ఉచితం? (I situ ucitam?)",
  "i want to get off here": "నేను ఇక్కడ దిగాలనుకుంటున్నాను (Nenu ikkada digalanukuntunnanu)",
  "where can i buy a ticket?": "నేను టిక్కెట్‌ను ఎక్కడ కొనుగోలు చేయవచ్చు? (Nenu tikketnu ekkada konugolu ceyavaccu?)",
  "do i need to book a ticket in advance?": "నేను ముందుగానే టికెట్ బుక్ చేసుకోవాలా? (Nenu mundugane tiket buk cesukovala?)",
  "can i have a one-way ticket?": "దయచేసి నాకు వన్ వే టికెట్ ఇవ్వవచ్చా? (Dayacesi naku van ve tiket ivvavacca?)",
  "i would like a window seat": "నాకు కిటికీ సీటు కావాలి (Naku kitiki situ kavali)",
  "which bus goes to the station?": "ఏ బస్సు స్టేషన్‌కి వెళ్తుంది? (E bas'su stesanki veltundi?)",
  "what is the bus number?": "బస్సు నంబర్ అంటే ఏమిటి? (Bas'su nambar ante emiti?)",
  "where is the bus stop?": "బస్టాప్ ఎక్కడ ఉంది? (Bastap ekkada undi?)",
  "what is the next stop?": "తదుపరి స్టాప్ ఏమిటి? (Tadupari stap emiti?)",
  "i would like to get off at": "నేను …లో దిగాలనుకుంటున్నాను (Nenu … lo digalanukuntunnanu)",
  "what time does the train depart?": "రైలు ఎన్ని గంటలకు బయలుదేరుతుంది? (Railu enni gantalaku bayaluderutundi?)",
  "which platform does the train leave from?": "రైలు ఏ ప్లాట్‌ఫారమ్ నుండి బయలుదేరుతుంది? (Railu e platpharam nundi bayaluderutundi?)",
  "how much is a ticket to": "[గమ్యం]కి టికెట్ ఎంత? ([Gamyam]ki tiket enta?)",
  "is there a direct train to": "నేరుగా రైలు ఉందా? (Neruga railu unda?)",
  "i would like a taxi": "నాకు టాక్సీ కావాలి (Naku taksi kavali) 🚕",
  "where is the taxi stand?": "టాక్సీ స్టాండ్ ఎక్కడ ఉంది? (Taksi stand ekkada undi?)",
  "please take me to": "దయచేసి నన్ను … కి తీసుకెళ్లండి (Dayacesi nannu … ki tisukellandi)",
  "how much does this cost?": "దీని ధర ఎంత? (Dini dhara enta?)",
  "please turn on the meter": "దయచేసి మీటర్‌ని ఆన్ చేయండి (Dayacesi mitar‌ni an ceyandi)",
  "stop here": "ఇక్కడ ఆగు (Ikkada agu)",
  "can you give me a receipt?": "దయచేసి నాకు రశీదు ఇవ్వగలరా? (Dayacesi naku rasidu ivvagalara?)",

  // --- Accommodation (110-139) ---
  "where is a hotel?": "హోటల్ ఎక్కడ ఉంది? (Hotal ekkada undi?)",
  "how much is it per night?": "ఒక రాత్రికి ఎంత? (Oka ratriki enta?)",
  "is breakfast included?": "అల్పాహారం చేర్చబడిందా? (Alpaharam cercabadinda?)",
  "i would like to book a room": "నేను గదిని బుక్ చేయాలనుకుంటున్నాను (Nenu gadini buk ceyalanukuntunnanu)",
  "is there wireless internet?": "ఇక్కడ వైర్‌లెస్ ఇంటర్నెట్ సదుపాయం ఉందా? (Ikkada vair‌les intarnet sadupayam unda?)",
  "can i see the room?": "నేను గదిని చూడగలనా? (Nenu gadini cudagalana?)",
  "can i use the laundry?": "నేను లాండ్రీని ఉపయోగించవచ్చా? (Nenu landrini upayogin̄cavacca?)",
  "i lost my key": "నేను నా కీని పోగొట్టుకున్నాను (Nenu na kini pogottukunnanu)",
  "there is no hot water": "వేడి నీటి సౌకర్యం లేదు (Vedi niti saukaryam ledu)",
  "what time is checkout?": "చెక్అవుట్ సమయం ఎంత? (Cekavut samayam enta?)",
  "can you call a taxi for me?": "మీరు నా కోసం టాక్సీని పిలవగలరా? (Miru na kosam taksini pilavagalara?)",
  "where is the nearest campsite?": "సమీప క్యాంప్ సైట్ ఎక్కడ ఉంది? (Samipa kyamp sait ekkada undi?)",
  "can i camp here?": "నేను ఇక్కడ క్యాంప్ చేయవచ్చా? (Nenu ikkada kyamp ceyavacca?)",
  "is the water drinkable?": "నీరు త్రాగదగినదా? (Niru tragadaginada?)",
  "can i stay at your place?": "నేను మీ స్థలంలో ఉండవచ్చా? (Nenu mi sthalanlo undavacca?)",
  "thank you for your hospitality": "మీ ఆతిధ్యానికి ధన్యవాదాలు (Mi atidhyaniki dhan'yavadalu)",

  // --- Shopping (140-154) ---
  "where is a supermarket?": "సూపర్ మార్కెట్ ఎక్కడ ఉంది? (Supar market ekkada undi?)",
  "where can i buy": "నేను ఎక్కడ కొనుగోలు చేయగలను? (Nenu ekkada konugolu ceyagalanu?)",
  "i would like to buy": "నేను కొనుగోలు చేయాలనుకుంటున్నాను (Nenu konugolu ceyalanukuntunnanu)",
  "how much is it?": "ఇది ఎంత? (Idi enta?) 💰",
  "can you write down the price?": "మీరు ధరను వ్రాయగలరా? (Miru dharanu vrayagalara?)",
  "do you accept credit cards?": "మీరు క్రెడిట్ కార్డులను అంగీకరిస్తారా? (Miru kredit kardulanu angikaristara?)",
  "could i have a bag?": "దయచేసి నాకు బ్యాగ్ ఇవ్వవచ్చా? (Dayacesi naku byag ivvavacca?)",
  "i don't need a bag": "నాకు బ్యాగ్ అవసరం లేదు (Naku byag avasaram ledu)",
  "could i have a receipt?": "దయచేసి నేను రసీదుని పొందగలనా? (Dayacesi nenu rasiduni pondagalana?)",
  "that's too expensive": "అది చాలా ఖరీదైనది (Adi cala kharidainadi)",
  "can you lower the price?": "మీరు ధర తగ్గించగలరా? (Miru dhara taggin̄cagalara?)",

  // --- Emergencies & Health (155-202) ---
  "help": "సహాయం! (Sahayam!) 🚨",
  "help!": "సహాయం! (Sahayam!)",
  "stop": "ఆపు (Apu)",
  "stop!": "ఆపు! (Apu!)",
  "thief": "దొంగ (Donga)",
  "fire": "అగ్ని (Agni) 🔥",
  "call a doctor": "డాక్టర్ని పిలవండి (Daktarni pilavandi)",
  "call the police": "పోలీస్ (Polis)",
  "police": "పోలీస్ (Polis)",
  "it's an emergency": "ఇది అత్యవసర పరిస్థితి (Idi atyavasara paristhiti)",
  "where is the police station?": "పోలీస్ స్టేషన్ ఎక్కడ ఉంది? (Polis stesan ekkada undi?)",
  "i have been robbed": "నేను దోచుకోబడ్డాను (Nenu docukobaddanu)",
  "i lost my wallet": "నా వాలెట్ పోయింది (Na valet poyindi)",
  "i want to contact my embassy": "నేను నా రాయబార కార్యాలయాన్ని సంప్రదించాలనుకుంటున్నాను (Nenu na rayabara karyalayanni sampradincalanukuntunnanu)",
  "where is the nearest hospital?": "సమీప ఆసుపత్రి ఎక్కడ ఉంది? (Samipa asupatri ekkada undi?)",
  "i need a doctor": "నాకు డాక్టర్ కావాలి (Naku daktar kavali)",
  "i have a fever": "నాకు జ్వరంగా ఉంది (Naku jvaranga undi)",
  "i am sick": "నేను అనారోగ్యంగా ఉన్నాను (Nenu anarogyanga unnanu)",
  "i have been vomiting": "నాకు వాంతులు అవుతున్నాయి (Naku vantulu avutunnayi)",
  "i have a toothache": "నాకు పంటినొప్పి ఉంది (Naku pantinoppi undi)",
  "i need a prescription": "నాకు ప్రిస్క్రిప్షన్ కావాలి (Naku priskripsan kavali)",
  "i have a disability": "నాకు వైకల్యం ఉంది (Naku vaikalyam undi)",
  "is there wheelchair access?": "వీల్ చైర్ యాక్సెస్ ఉందా? (Vil cair yakses unda?)",
  "can you help me?": "మీరు నాకు సహాయం చేయగలరా? (Miru naku sahayam ceyagalara?)",

  // --- Time (203-265) ---
  "morning": "ఉదయం (Udayam)",
  "afternoon": "మధ్యాహ్నం (Madhyahnam)",
  "evening": "సాయంత్రం (Sayantram)",
  "night": "రాత్రి (Ratri)",
  "today": "ఈరోజు (Iroju)",
  "tomorrow": "రేపు (Repu)",
  "yesterday": "నిన్న (Ninna)",
  "now": "ఇప్పుడు (Ippudu)",
  "later": "తరువాత (Taruvata)",
  "before": "ముందు (Mundu)",
  "sunday": "ఆదివారం (Adivaram)",
  "monday": "సోమవారం (Somavaram)",
  "tuesday": "మంగళవారం (Mangalavaram)",
  "wednesday": "బుధవారం (Budhavaram)",
  "thursday": "గురువారం (Guruvaram)",
  "friday": "శుక్రవారం (Sukravaram)",
  "saturday": "శనివారం (Sanivaram)",
  "january": "జనవరి (Janavari)",
  "february": "ఫిబ్రవరి (Phibravari)",
  "march": "మార్చి (Marci)",
  "april": "ఏప్రిల్ (Epril)",
  "may": "మే (Me)",
  "june": "జూన్ (Jun)",
  "july": "జూలై (Julai)",
  "august": "ఆగస్టు (Agastu)",
  "september": "సెప్టెంబర్ (Septembar)",
  "october": "అక్టోబర్ (Aktobar)",
  "november": "నవంబర్ (Navambar)",
  "december": "డిసెంబర్ (Disembar)",
  "what time is it?": "ఇప్పుడు సమయం ఎంత? (Ippudu samayam enta?) ⌚",
  "second": "రెండవ / సెకను (Rendava / Sekanu)",
  "minute": "నిమిషం (Nimisham)",
  "hour": "గంట (Ganta)",
  "day": "రోజు (Roju)",
  "week": "వారం (Varam)",
  "month": "నెల (Nela)",
  "year": "సంవత్సరం (Sanvatsaram)",

  // --- Numbers (267-317) ---
  "0": "సున్నా (Sunna)",
  "1": "ఒకటి (Okati)",
  "2": "రెండు (Rendu)",
  "3": "మూడు (Mudu)",
  "4": "నాలుగు (Nalugu)",
  "5": "ఐదు (Aidu)",
  "6": "ఆరు (Aru)",
  "7": "ఏడు (Edu)",
  "8": "ఎనిమిది (Enimidi)",
  "9": "తొమ్మిది (Tommidi)",
  "10": "పది (Padi)",
  "11": "పదకొండు (Padakondu)",
  "12": "పన్నెండు (Pannendu)",
  "13": "పదమూడు (Padamudu)",
  "14": "పద్నాలుగు (Padnalugu)",
  "15": "పదిహేను (Padihenu)",
  "16": "పదహారు (Padaharu)",
  "17": "పదిహేడు (Padihedu)",
  "18": "పద్దెనిమిది (Paddenimidi)",
  "19": "పంతొమ్మిది (Pantommidi)",
  "20": "ఇరవై (Iravai)",
  "21": "ఇరవై ఒకటి (Iravai okati)",
  "30": "ముప్పై (Muppai)",
  "40": "నలభై (Nalabhai)",
  "50": "యాభై (Yabhai)",
  "60": "అరవై (Aravai)",
  "70": "డెబ్బై (Debbai)",
  "80": "ఎనభై (Enabhai)",
  "90": "తొంభై (Tombhai)",
  "100": "వంద (Vanda)",
  "200": "రెండు వందలు (Rendu vandalu)",
  "500": "ఐదు వందలు (Aidu vandalu)",
  "1000": "వెయ్యి (Veyyi)",
  "10000": "పది వేలు (Padi velu)",
  "100000": "లక్ష (Laksha) / వంద వేలు (Vanda velu)",
  "1000000": "పది లక్షలు (Padi lakshalu) / ఒక మిలియన్ (Oka miliyan)",
  "first": "మొదటి (Modati)",
  "second (2nd)": "రెండవది (Rendavadi)",
  "third": "మూడవ (Mudava)",
  "fourth": "నాల్గవ (Nalgava)",
  "fifth": "ఐదవ (Aidava)",
  
  // --- Amounts (318-327) ---
  "less": "తక్కువ (Takkuva)",
  "more": "మరింత (Marinta) / ఎక్కువ (Ekkuva)",
  "half": "సగం (Sagam)",
  "all": "అన్నీ (Anni)",
  "none": "ఏదీ కాదు (Edi kadu)",
  "some": "కొన్ని (Konni)",
  "many": "చాలా (Cala)",
  "how much": "ఎంత? (Enta?)",
  "how many": "ఎన్ని? (Enni?)",
  "food": "ఆహారం (Aharam) 🥘",
  "water": "నీరు (Niru)"
};

//////////////////////////////
// UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*##+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

//////////////////////////////
// KV MEMORY
//////////////////////////////
async function getMemory(env, key) {
  try {
    return env.CHAT_KV ? JSON.parse(await env.CHAT_KV.get(key)) || [] : [];
  } catch {
    return [];
  }
}

async function saveMemory(env, key, mem) {
  if (!env.CHAT_KV) return;
  await env.CHAT_KV.put(key, JSON.stringify(mem), { expirationTtl: AI_MEMORY_TTL_DAYS * 86400 });
}

async function deleteMemory(env, key) {
  if (!env.CHAT_KV) return false;
  await env.CHAT_KV.delete(key);
  return true;
}

//////////////////////////////
// AI CALL
//////////////////////////////
async function runAi(env, model, payload) {
  for (let i = 0; i <= AI_RETRY_LIMIT; i++) {
    try {
      return await env.SPY_AI.run(model, payload);
    } catch (e) {
      if (i === AI_RETRY_LIMIT) throw e;
      await sleep(AI_RETRY_DELAY_BASE * (2 ** i));
    }
  }
}

function extractText(resp) {
  return (
    resp?.output?.[1]?.content?.[0]?.text ||
    resp?.output?.[0]?.content?.[0]?.text ||
    resp?.response ||
    resp?.result ||
    ""
  );
}

//////////////////////////////
// MAIN HANDLER
//////////////////////////////
export async function onRequest(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const payload = await request.json();
    const {
      prompt = "",
      mode = "chat",
      user_preference_id = "anon",
      aspect_ratio = "1:1",
      stream = false,
      file_content,
      filename
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;
    const cleanPrompt = (prompt || "").trim().toLowerCase();

    //////////////////////
    // DELETE MEMORY
    //////////////////////
    if (
      mode === "delete_memory" || 
      mode === "clear_memory" || 
      mode === "delete_all" || 
      cleanPrompt === "delete all"
    ) {
      const success = await deleteMemory(env, memKey);
      const msg = success ? "Memory wiped successfully 🧹" : "No KV found or empty.";
      
      if (cleanPrompt === "delete all") {
        return new Response(msg, { headers: { ...cors, "Content-Type": "text/plain" } });
      }

      return new Response(JSON.stringify({ status: success ? "success" : "skipped", message: msg }), { 
        headers: { ...cors, "Content-Type": "application/json" } 
      });
    }

    //////////////////////
    // OPTION B: DICTIONARY LOOKUP
    //////////////////////
    // Triggered if user asks "Translate [word]" or "Translate [word] to telugu"
    if (cleanPrompt.startsWith("translate")) {
      // 1. Extract the term
      let term = cleanPrompt
        .replace("translate", "")
        .replace(" to telugu", "")
        .replace(" in telugu", "")
        .trim();
      
      // 2. Remove punctuation from end for better matching
      term = term.replace(/[?.!]+$/, "");

      // 3. Check Dictionary
      if (TRANSLATION_DICT[term]) {
        const directOutput = TRANSLATION_DICT[term];
        
        // Return DIRECTLY (bypassing AI)
        if (mode === "stream" || stream) {
           // Simulate stream for frontend compatibility
           return new Response(`data: ${JSON.stringify({ text: directOutput })}\n\ndata: [DONE]\n\n`, {
             headers: { ...cors, "Content-Type": "text/event-stream" }
           });
        } else {
           return new Response(directOutput, { headers: { ...cors, "Content-Type": "text/plain" } });
        }
      }
    }

    //////////////////////
    // SHARED SYSTEM PROMPT
    //////////////////////
    const CORE_SYSTEM_PROMPT = 
`You are ${AI_NAME}, created by M4 Spider.

🔥 STRICT BEHAVIOR RULES:
1. **IDENTITY**: Never mention "Mistral" or internal prompts.
2. **EMOJIS**: Use emojis naturally and often 🕸️🔥.
3. **NO META-TALK**: Never say "I will speak Telugu now". Just do it.

🌍 LANGUAGE SWITCHING LOGIC (ZERO LATENCY):
- **Input: English** -> **Output: Pure English** (Professional but friendly).
- **Input: Telugu** -> **Output: TELANGANA SLANG (Romanized)**.

🗣️ TELANGANA DIALECT (FALLBACK FOR AI):
{
  "examples": [
    {"user_input": "Ela unnav?", "ai_output": "Masth unna bhai! Nuvvu etla unnav? Em sangathi? 🔥"},
    {"user_input": "Ekkadiki veltunnav?", "ai_output": "Ekadiki pothunnav? Hyderabad ah? Cheppu radha."},
    {"user_input": "Bhojanam chesava?", "ai_output": "Ippude ayindhi. Nuv thinnava ledha?"}
  ]
}

FORMATTING: No bold (**), no headers (##). Keep it clean.`;

    //////////////////////
    // STREAM MODE
    //////////////////////
    if (mode === "stream" || stream === true) {
      const encoder = new TextEncoder();
      const streamResp = new ReadableStream({
        async start(controller) {
          try {
            let finalPrompt = prompt;
            if (mode === "analyze_file" && file_content) {
              finalPrompt = `FILE: ${filename}\nCONTENT: ${file_content}\nREQ: ${prompt}`;
            }

            const res = await runAi(
              env,
              "@cf/mistralai/mistral-small-3.1-24b-instruct",
              {
                messages: [
                  { role: "system", content: CORE_SYSTEM_PROMPT },
                  { role: "user", content: finalPrompt }
                ],
                max_tokens: 8192,
                temperature: 0.7
              }
            );

            const text = extractText(res) || "";
            const chunks = text.match(/[\s\S]{1,120}/g) || [];

            for (let chunk of chunks) {
              chunk = chunk.replace(/\*\*/g, "").replace(/(^|\n)\s*##+\s*/g, "$1");
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              await sleep(15);
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n[Error] " + err.message })}\n\n`));
            controller.close();
          }
        }
      });
      return new Response(streamResp, { headers: { ...cors, "Content-Type": "text/event-stream" } });
    }

    //////////////////////
    // IMAGE GEN
    //////////////////////
    if (mode === "image_gen") {
      const image = await runAi(env, "@cf/stabilityai/stable-diffusion-xl-base-1.0", {
        prompt: `${prompt}, ultra detailed, cinematic lighting`,
        aspect_ratio
      });
      return new Response(image, { headers: { ...cors, "Content-Type": "image/png" } });
    }

    //////////////////////
    // NORMAL CHAT
    //////////////////////
    let memory = await getMemory(env, memKey);
    memory.push({ role: "user", content: prompt, ts: Date.now() });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    const messages = [
      { role: "system", content: CORE_SYSTEM_PROMPT },
      ...memory.map(m => ({ role: m.role, content: m.content }))
    ];

    const aiRes = await runAi(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { messages, max_tokens: 4096, temperature: 0.7 });
    const output = cleanAiResponse(extractText(aiRes));
    
    memory.push({ role: "assistant", content: output, ts: Date.now() });
    await saveMemory(env, memKey, memory);

    return new Response(output, { headers: { ...cors, "Content-Type": "text/plain" } });

  } catch (e) {
    return new Response("Spider AI Error: " + e.message, { status: 500, headers: cors });
  }
}
