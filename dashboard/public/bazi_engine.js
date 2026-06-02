
// ===================================================================
//  BaZi Calculator - CTS-LHY13 ?«å?è¦æ ¼åº?v1.7 Implementation
//  All data from ?«å?_è¦æ ¼åº«_v1.7.json
// ===================================================================

// ?€?€ å¤©å¹²?°æ”¯ ?€?€
const STEMS = ['??,'ä¹?,'ä¸?,'ä¸?,'??,'å·?,'åº?,'è¾?,'å£?,'??];
const BRANCHES = ['å­?,'ä¸?,'å¯?,'??,'è¾?,'å·?,'??,'??,'??,'??,'??,'äº?];

// ?€?€ ?­å??²å? + ç´éŸ³ ?€?€
const SIXTY_JIAZI = [
  {gz:'?²å?',nayin:'æµ·ä¸­??},{gz:'ä¹™ä?',nayin:'æµ·ä¸­??},{gz:'ä¸™å?',nayin:'?ä¸­??},{gz:'ä¸å¯',nayin:'?ä¸­??},
  {gz:'?Šè¾°',nayin:'å¤§æ???},{gz:'å·±å·³',nayin:'å¤§æ???},{gz:'åºšå?',nayin:'è·¯å???},{gz:'è¾›æœª',nayin:'è·¯å???},
  {gz:'å£¬ç”³',nayin:'?é???},{gz:'?¸é?',nayin:'?é???},{gz:'?²æ?',nayin:'å±±é ­??},{gz:'ä¹™äº¥',nayin:'å±±é ­??},
  {gz:'ä¸™å?',nayin:'æ¾—ä?æ°?},{gz:'ä¸ä?',nayin:'æ¾—ä?æ°?},{gz:'?Šå?',nayin:'?é ­??},{gz:'å·±å¯',nayin:'?é ­??},
  {gz:'åºšè¾°',nayin:'?½è???},{gz:'è¾›å·³',nayin:'?½è???},{gz:'å£¬å?',nayin:'æ¥ŠæŸ³??},{gz:'?¸æœª',nayin:'æ¥ŠæŸ³??},
  {gz:'?²ç”³',nayin:'æ³‰ä¸­æ°?},{gz:'ä¹™é?',nayin:'æ³‰ä¸­æ°?},{gz:'ä¸™æ?',nayin:'å±‹ä???},{gz:'ä¸äº¥',nayin:'å±‹ä???},
  {gz:'?Šå?',nayin:'?¹é???},{gz:'å·±ä?',nayin:'?¹é???},{gz:'åºšå?',nayin:'?¾æ???},{gz:'è¾›å¯',nayin:'?¾æ???},
  {gz:'å£¬è¾°',nayin:'?·æ?æ°?},{gz:'?¸å·³',nayin:'?·æ?æ°?},{gz:'?²å?',nayin:'?‚ä¸­??},{gz:'ä¹™æœª',nayin:'?‚ä¸­??},
  {gz:'ä¸™ç”³',nayin:'å±±ä???},{gz:'ä¸é?',nayin:'å±±ä???},{gz:'?Šæ?',nayin:'å¹³åœ°??},{gz:'å·±äº¥',nayin:'å¹³åœ°??},
  {gz:'åºšå?',nayin:'å£ä???},{gz:'è¾›ä?',nayin:'å£ä???},{gz:'å£¬å?',nayin:'?‘ç???},{gz:'?¸å¯',nayin:'?‘ç???},
  {gz:'?²è¾°',nayin:'è¦†ç???},{gz:'ä¹™å·³',nayin:'è¦†ç???},{gz:'ä¸™å?',nayin:'å¤©æ²³æ°?},{gz:'ä¸æœª',nayin:'å¤©æ²³æ°?},
  {gz:'?Šç”³',nayin:'å¤§é???},{gz:'å·±é?',nayin:'å¤§é???},{gz:'åºšæ?',nayin:'?µé‡§??},{gz:'è¾›äº¥',nayin:'?µé‡§??},
  {gz:'å£¬å?',nayin:'æ¡‘æ???},{gz:'?¸ä?',nayin:'æ¡‘æ???},{gz:'?²å?',nayin:'å¤§æºªæ°?},{gz:'ä¹™å¯',nayin:'å¤§æºªæ°?},
  {gz:'ä¸™è¾°',nayin:'æ²™ä¸­??},{gz:'ä¸å·³',nayin:'æ²™ä¸­??},{gz:'?Šå?',nayin:'å¤©ä???},{gz:'å·±æœª',nayin:'å¤©ä???},
  {gz:'åºšç”³',nayin:'?³æ¦´??},{gz:'è¾›é?',nayin:'?³æ¦´??},{gz:'å£¬æ?',nayin:'å¤§æµ·æ°?},{gz:'?¸äº¥',nayin:'å¤§æµ·æ°?}
];

// ?€?€ ?å¹² ?€?€
const HIDDEN_STEMS = {
  'å­?:['??],'ä¸?:['å·?,'è¾?,'??],'å¯?:['??,'ä¸?,'??],'??:['ä¹?],
  'è¾?:['??,'ä¹?,'??],'å·?:['ä¸?,'åº?,'??],'??:['ä¸?,'å·?],'??:['å·?,'ä¸?,'ä¹?],
  '??:['åº?,'å£?,'??],'??:['è¾?],'??:['??,'è¾?,'ä¸?],'äº?:['å£?,'??]
};

// ?€?€ äº”è?? å? ?€?€
const STEM_ELEMENT = {'??:'??,'ä¹?:'??,'ä¸?:'??,'ä¸?:'??,'??:'??,'å·?:'??,'åº?:'??,'è¾?:'??,'å£?:'æ°?,'??:'æ°?};
const BRANCH_ELEMENT = {'å­?:'æ°?,'ä¸?:'??,'å¯?:'??,'??:'??,'è¾?:'??,'å·?:'??,'??:'??,'??:'??,'??:'??,'??:'??,'??:'??,'äº?:'æ°?};
const STEM_YINYANG = {'??:'??,'ä¹?:'??,'ä¸?:'??,'ä¸?:'??,'??:'??,'å·?:'??,'åº?:'??,'è¾?:'??,'å£?:'??,'??:'??};

// ?€?€ äº”è??Ÿå? ?€?€
const WUXING_SHENG = {'??:'??,'??:'??,'??:'??,'??:'æ°?,'æ°?:'??};
const WUXING_KE = {'??:'??,'??:'??,'??:'æ°?,'??:'??,'æ°?:'??};

// ?€?€ ?Ÿè? ?€?€
const ZODIAC = {'å­?:'é¼?,'ä¸?:'??,'å¯?:'??,'??:'??,'è¾?:'é¾?,'å·?:'??,'??:'é¦?,'??:'ç¾?,'??:'??,'??:'??,'??:'??,'äº?:'è±?};

// ?€?€ ç¯€æ°?¡¨ 2023-2028 ?€?€
const JIEQI_TABLE = {
  'å°å?':{'2023':'1/5','2024':'1/6','2025':'1/5','2026':'1/5','2027':'1/6','2028':'1/6'},
  'å¤§å?':{'2023':'1/20','2024':'1/20','2025':'1/20','2026':'1/20','2027':'1/20','2028':'1/20'},
  'ç«‹æ˜¥':{'2023':'2/4','2024':'2/4','2025':'2/3','2026':'2/3','2027':'2/3','2028':'2/4'},
  '?¨æ°´':{'2023':'2/19','2024':'2/19','2025':'2/18','2026':'2/18','2027':'2/18','2028':'2/19'},
  'é©šè?':{'2023':'3/6','2024':'3/5','2025':'3/5','2026':'3/5','2027':'3/6','2028':'3/5'},
  '?¥å?':{'2023':'3/21','2024':'3/20','2025':'3/20','2026':'3/20','2027':'3/20','2028':'3/20'},
  'æ¸…æ?':{'2023':'4/5','2024':'4/4','2025':'4/4','2026':'4/4','2027':'4/5','2028':'4/4'},
  'ç©€??:{'2023':'4/20','2024':'4/19','2025':'4/20','2026':'4/20','2027':'4/20','2028':'4/19'},
  'ç«‹å?':{'2023':'5/6','2024':'5/5','2025':'5/5','2026':'5/5','2027':'5/6','2028':'5/5'},
  'å°æ»¿':{'2023':'5/21','2024':'5/20','2025':'5/21','2026':'5/21','2027':'5/21','2028':'5/20'},
  '?’ç¨®':{'2023':'6/6','2024':'6/5','2025':'6/5','2026':'6/5','2027':'6/6','2028':'6/5'},
  'å¤è‡³':{'2023':'6/21','2024':'6/21','2025':'6/21','2026':'6/21','2027':'6/21','2028':'6/21'},
  'å°æ?':{'2023':'7/7','2024':'7/6','2025':'7/7','2026':'7/7','2027':'7/7','2028':'7/6'},
  'å¤§æ?':{'2023':'7/23','2024':'7/22','2025':'7/22','2026':'7/22','2027':'7/23','2028':'7/22'},
  'ç«‹ç?':{'2023':'8/8','2024':'8/7','2025':'8/7','2026':'8/7','2027':'8/8','2028':'8/7'},
  '?•æ?':{'2023':'8/23','2024':'8/22','2025':'8/23','2026':'8/23','2027':'8/23','2028':'8/22'},
  '?½éœ²':{'2023':'9/8','2024':'9/7','2025':'9/7','2026':'9/7','2027':'9/8','2028':'9/7'},
  'ç§‹å?':{'2023':'9/23','2024':'9/22','2025':'9/23','2026':'9/23','2027':'9/23','2028':'9/22'},
  'å¯’éœ²':{'2023':'10/8','2024':'10/8','2025':'10/8','2026':'10/8','2027':'10/8','2028':'10/8'},
  '?œé?':{'2023':'10/24','2024':'10/23','2025':'10/23','2026':'10/23','2027':'10/23','2028':'10/22'},
  'ç«‹å†¬':{'2023':'11/8','2024':'11/7','2025':'11/7','2026':'11/7','2027':'11/7','2028':'11/7'},
  'å°é›ª':{'2023':'11/22','2024':'11/22','2025':'11/22','2026':'11/22','2027':'11/22','2028':'11/22'},
  'å¤§é›ª':{'2023':'12/7','2024':'12/7','2025':'12/7','2026':'12/7','2027':'12/7','2028':'12/7'},
  '?¬è‡³':{'2023':'12/22','2024':'12/21','2025':'12/22','2026':'12/21','2027':'12/22','2028':'12/21'}
};

// 12ç¯€ï¼ˆæ??±å??²ç?ï¼? ?‰æ?åº?const MONTH_JIE = ['ç«‹æ˜¥','é©šè?','æ¸…æ?','ç«‹å?','?’ç¨®','å°æ?','ç«‹ç?','?½éœ²','å¯’éœ²','ç«‹å†¬','å¤§é›ª','å°å?'];
const MONTH_BRANCHES = ['å¯?,'??,'è¾?,'å·?,'??,'??,'??,'??,'??,'äº?,'å­?,'ä¸?];

// ?€?€ ä»»ç?å²©å¹´?¸æ? (è¦æ ¼åº?2010-2030) ?€?€
const YEAR_NUMBERS = {
  2010:8,2011:13,2012:18,2013:24,2014:29,2015:34,2016:39,2017:45,2018:50,2019:55,
  2020:0,2021:9,2022:14,2023:19,2024:24,2025:30,2026:35,2027:40,2028:45,2029:51,2030:56
};
const MONTH_NUMBERS = {1:6,2:37,3:0,4:31,5:1,6:32,7:2,8:33,9:4,10:34,11:5,12:35};

function isLeapYear(y){return (y%4===0&&y%100!==0)||(y%400===0)}

// ?€?€ JDN (Julian Day Number) è¨ˆç? ?€?€
function gregorianToJDN(y,m,d){
  const a = Math.floor((14-m)/12);
  const yy = y+4800-a;
  const mm = m+12*a-3;
  return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
}

// ?¥æŸ±?¡æ??ºæ?ï¼?026-01-01 = ä¹™é???(?­å??²å? idx=22)
const CALIBRATION_JDN = gregorianToJDN(2026,1,1); // 2461042
const CALIBRATION_IDX = 22; // ä¹™é?

// ?€?€ äº”è??æ? ?€?€
function getMonthStemStart(yearStemIdx){
  const map = [2,4,6,8,0,2,4,6,8,0];
  return map[yearStemIdx];
}

// ?€?€ äº”é??æ? ?€?€
function getHourStemStart(dayStemIdx){
  const map = [0,2,4,6,8,0,2,4,6,8];
  return map[dayStemIdx];
}

// ?€?€ ?‚è¾°?°æ”¯ ?€?€
function getHourBranch(hour){
  if(hour>=23||hour<1) return 0;
  return Math.floor((hour+1)/2);
}

// ?€?€ ?ç?è¨ˆç? ?€?€
function getShiShen(dayStem,targetStem){
  const dayEl = STEM_ELEMENT[dayStem];
  const dayYY = STEM_YINYANG[dayStem];
  const tarEl = STEM_ELEMENT[targetStem];
  const tarYY = STEM_YINYANG[targetStem];
  const same = dayYY === tarYY;
  
  if(dayEl===tarEl) return same?'æ¯”è‚©':'?«è²¡';
  if(WUXING_SHENG[dayEl]===tarEl) return same?'é£Ÿç?':'?·å?';
  if(WUXING_KE[dayEl]===tarEl) return same?'?è²¡':'æ­?²¡';
  if(WUXING_KE[tarEl]===dayEl) return same?'ä¸ƒæ®º':'æ­??';
  if(WUXING_SHENG[tarEl]===dayEl) return same?'?å°':'æ­?°';
  return '';
}

// ?€?€ æ²–å??‘å®³ ?€?€
const LIU_CHONG = {'å­?:'??,'ä¸?:'??,'å¯?:'??,'??:'??,'è¾?:'??,'å·?:'äº?,'??:'å­?,'??:'ä¸?,'??:'å¯?,'??:'??,'??:'è¾?,'äº?:'å·?};
const LIU_HE = [['å­?,'ä¸?],['å¯?,'äº?],['??,'??],['è¾?,'??],['å·?,'??],['??,'??]];
const SAN_HE = [['??,'å­?,'è¾?,'æ°´å?'],['äº?,'??,'??,'?¨å?'],['å¯?,'??,'??,'?«å?'],['å·?,'??,'ä¸?,'?‘å?']];
const SAN_XING = {
  '?å‹¢ä¹‹å?':[['å¯?,'å·?],['å·?,'??],['??,'å¯?]],
  '?¡æ©ä¹‹å?':[['ä¸?,'??],['??,'??],['??,'ä¸?]],
  '?¡ç¦®ä¹‹å?':[['å­?,'??],['??,'å­?]],
  '?ªå?':['è¾?,'??,'??,'äº?]
};
const LIU_HAI = [['å­?,'??],['ä¸?,'??],['å¯?,'å·?],['??,'è¾?],['??,'äº?],['??,'??]];

// ?€?€ ?ºç›¸ä¼‘å?æ­??€?€
const WANGXIANG = {
  '??:{'??:'??,'??:'??,'æ°?:'ä¼?,'??:'??,'??:'æ­?},
  'å¤?:{'??:'??,'??:'??,'??:'ä¼?,'æ°?:'??,'??:'æ­?},
  'ç§?:{'??:'??,'æ°?:'??,'??:'ä¼?,'??:'??,'??:'æ­?},
  '??:{'æ°?:'??,'??:'??,'??:'ä¼?,'??:'??,'??:'æ­?}
};

// ?€?€ èª¿å€™ç”¨ç¥??€?€
const TIAOHUO = {
  '??:{'??:'?¨æ—ºï¼Œé?åºšé??ä??æ?ï¼›æ¬¡?¨ä??«æ?å±€','å¤?:'?«ç?ï¼Œæ€¥é??¸æ°´æ»‹æ½¤ï¼›å??å??Šå?','ç§?:'?‘ä»¤ï¼Œå??‘å??¨ï??€ä¸ç«?›ç??–å£¬æ°´æ´©??,'??:'æ°´æ—ºï¼Œå??¨å??‘æˆªæµï??ç”¨ä¸ç«è§??'},
  'ä¹?:{'??:'?¨æ—ºï¼Œé??¸æ°´æ»‹æ½¤ï¼›å??å??²æœ¨ç«¶çˆ­','å¤?:'?«ç?ï¼Œæ€¥é??¸æ°´è§?¸´ï¼›é?å·±å??¹æ ¹','ç§?:'?‘ä»¤ï¼Œä??¨ç?å¼±ï??€?¸æ°´?–ä??«è­·èº?,'??:'æ°´å†·ï¼Œé?ä¸™ç«è§???–èº«ï¼›å?å¤šå£¬æ°?},
  'ä¸?:{'??:'?¨æ—º?Ÿç«ï¼Œé?å£¬æ°´?¶è¡¡ï¼›æ¬¡?€?Šå??¸ç†±','å¤?:'?«ç?ï¼Œå??ˆå£¬æ°´é?æº«ï?å¿Œè??Šå·±?¥å?','ç§?:'?‘ä»¤ï¼Œä??«å¤±ä»¤ï??€?²æœ¨å¼•ç«ï¼›å£¬æ°´è???,'??:'æ°´æ—ºï¼Œæ€¥é??²æœ¨å¼•ç«ï¼›é?å£¬æ°´?å?'},
  'ä¸?:{'??:'?¨æ—ºï¼Œä»¥?²æœ¨?ºå??«ä?åª’ï??€åºšé??§ç”²','å¤?:'?«ç?ï¼Œé?å£¬æ°´èª¿ç?ï¼›ç”²?¨ç‚ºå¼?,'ç§?:'?‘ä»¤ï¼Œé??²æœ¨?ƒæ?ï¼›å??‘ç‚ºä¼?,'??:'æ°´å†·ï¼Œæ€¥é??²æœ¨å¼•ç?ï¼›ç”²åºšå…©?æ?è²?},
  '??:{'??:'?¨æ—ºï¼Œç”²?¨é??ºå?å´©å±±ï¼Œé?åºšé??¬æœ¨ä¿å?','å¤?:'?«ç??Ÿç‡¥ï¼Œæ€¥é?å£¬æ°´?Œæ?ï¼›ç”²?¨ç???,'ç§?:'?‘ä»¤ï¼Œé?å¤šå??›ï??€ä¸™ç«?–èº«ï¼›ç”²?¨ç???,'??:'æ°´æ—ºï¼Œç”²?¨ç??Ÿæ??¥ï?ä¸™ç«è§??æ¬¡ä?'},
  'å·?:{'??:'?¨æ—º?‹å?ï¼Œé?ä¸™ç«?–å?ï¼›å??‘ç??¨è­·??,'å¤?:'?«ç??Ÿç‡¥ï¼Œæ€¥é??¸æ°´æ»‹æ½¤ï¼›ä??«æ¬¡è¦?,'ç§?:'?‘ä»¤ï¼Œå??Ÿé?æ´©æ°£ï¼Œé?ä¸™ç«è£œæ°£?–èº«','??:'æ°´å†·ï¼Œæ€¥é?ä¸™ç«è§???–å?ï¼›ç”²?¨ç?å°?},
  'åº?:{'??:'?¨æ—ºï¼Œé?æ°??å¼±ï??€?Šå·±?Ÿç??¶ï?ä¸ç«?›ç?','å¤?:'?«ç?ï¼Œé??‘å±æ©Ÿï?å¿…é?å£¬æ°´?æº«ï¼›æ??Ÿå?æ®ºç???,'ç§?:'?‘æ—ºï¼Œé?ä¸ç«?›ç?+?²æœ¨?ƒæ?ï¼›æ¬¡?¨å£¬æ°´æ?æ·?,'??:'?‘å?ï¼Œå??ˆä??«è§£?ï??ä??«é??‰ï??Šå??”æ°´'},
  'è¾?:{'??:'?‘å¼±ï¼Œé?å·±å?é¤Šè­·ï¼›å£¬æ°´æ?æ»?,'å¤?:'?ˆç«?šç??±æ?ï¼Œå??ˆå£¬?¸æ°´?¥æ?ï¼›å·±?Ÿæ??Ÿè­·èº?,'ç§?:'?‘æ—º?€?¨ï??€?€å£¬æ°´æ´—æ?ï¼ˆé??½æ°´æ¸…ï?','??:'?‘å?æ°´å†·ï¼Œå??ˆä??«æ?æ°´ï?å£¬æ°´?§è€€'},
  'å£?:{'??:'?¨æ—ºæ´©æ°´ï¼Œé?åºšé??Ÿæ°´ï¼›æ??Ÿç???,'å¤?:'?«ç?æ°´æ²¸ï¼Œé?åºšé??Ÿæ°´è£œæ?ï¼›æ??Ÿæ???,'ç§?:'?‘æ—º?Ÿæ°´å¼·å¥ï¼Œé??Šå??”æˆªï¼›ç”²?¨ç?å°?,'??:'æ°´æ—ºæ°¾æ¿«ï¼Œå??ˆæ??Ÿç??¤ï??²æœ¨?å?'},
  '??:{'??:'?¨æ—ºæ´©æ°´ï¼Œé?åºšè??‘ç?æ°´ï?ä¸™ç«?–å?','å¤?:'æ°´å¼±?«ç?ï¼Œå?è¾›é??Ÿæ°´?€?¥ï?å£¬æ°´?©å?','ç§?:'?‘æ—º?Ÿæ°´ï¼Œé?ä¸™ç«æº«æ?ï¼›æ??Ÿæ??ªé???,'??:'æ°´å†·ï¼Œå??ˆä??«è§£?æ?å±€ï¼›è??‘ç?æ°´è???}
};

// ?€?€ å¤©å¹²é«”æ€??€?€
const STEM_ALIAS = {'??:'å¤§æ¨¹','ä¹?:'?±è?','ä¸?:'å¤ªé™½','ä¸?:'?ˆç«','??:'é«˜å±±','å·?:'?°å?','åº?:'?‘éµ','è¾?:'? å¯¶','å£?:'æ±Ÿæ²³','??:'?¨éœ²'};

// ?€?€ ç¯€æ°?—¥?Ÿè§£???€?€
function parseJieqiDate(str, year){
  const parts = str.split('/');
  return new Date(year, parseInt(parts[0])-1, parseInt(parts[1]));
}

function getLichunDate(year){
  const y = String(year);
  if(JIEQI_TABLE['ç«‹æ˜¥'][y]) return parseJieqiDate(JIEQI_TABLE['ç«‹æ˜¥'][y], year);
  return new Date(year, 1, 4); // ç¯„å?å¤–è?ä¼?}

function isBeforeLichun(year, month, day){
  const lc = getLichunDate(year);
  const bd = new Date(year, month-1, day);
  return bd < lc;
}

function getMonthByJieqi(year, month, day){
  const jieNames = ['å°å?','ç«‹æ˜¥','é©šè?','æ¸…æ?','ç«‹å?','?’ç¨®','å°æ?','ç«‹ç?','?½éœ²','å¯’éœ²','ç«‹å†¬','å¤§é›ª'];
  const jieBranches = ['ä¸?,'å¯?,'??,'è¾?,'å·?,'??,'??,'??,'??,'??,'äº?,'å­?];
  const jieMonthNums = [12,1,2,3,4,5,6,7,8,9,10,11];
  
  const bd = new Date(year, month-1, day);
  let dates = [];
  
  // ?ä?å¹´å¤§??  const ys = String(year-1);
  if(JIEQI_TABLE['å¤§é›ª'][ys]){
    dates.push({name:'å¤§é›ª',date:parseJieqiDate(JIEQI_TABLE['å¤§é›ª'][ys],year-1),branch:'å­?,monthNum:11});
  }
  
  const yStr = String(year);
  for(let i=0;i<jieNames.length;i++){
    const jie = jieNames[i];
    if(JIEQI_TABLE[jie] && JIEQI_TABLE[jie][yStr]){
      dates.push({name:jie, date:parseJieqiDate(JIEQI_TABLE[jie][yStr],year), branch:jieBranches[i], monthNum:jieMonthNums[i]});
    }
  }
  
  let result = {branch:'ä¸?, monthNum:12, name:'å°å?'};
  for(let i=dates.length-1;i>=0;i--){
    if(bd >= dates[i].date){ result = dates[i]; break; }
  }
  
  if(dates.length===0) return getMonthByApprox(month, day);
  return result;
}

function getMonthByApprox(month, day){
  const approx = [
    {m:1,d:5,branch:'ä¸?,monthNum:12,name:'å°å?'},
    {m:2,d:4,branch:'å¯?,monthNum:1,name:'ç«‹æ˜¥'},
    {m:3,d:6,branch:'??,monthNum:2,name:'é©šè?'},
    {m:4,d:5,branch:'è¾?,monthNum:3,name:'æ¸…æ?'},
    {m:5,d:6,branch:'å·?,monthNum:4,name:'ç«‹å?'},
    {m:6,d:6,branch:'??,monthNum:5,name:'?’ç¨®'},
    {m:7,d:7,branch:'??,monthNum:6,name:'å°æ?'},
    {m:8,d:7,branch:'??,monthNum:7,name:'ç«‹ç?'},
    {m:9,d:8,branch:'??,monthNum:8,name:'?½éœ²'},
    {m:10,d:8,branch:'??,monthNum:9,name:'å¯’éœ²'},
    {m:11,d:7,branch:'äº?,monthNum:10,name:'ç«‹å†¬'},
    {m:12,d:7,branch:'å­?,monthNum:11,name:'å¤§é›ª'}
  ];
  let result = approx[0];
  for(let i=approx.length-1;i>=0;i--){
    if(month>approx[i].m || (month===approx[i].m && day>=approx[i].d)){
      result = approx[i]; break;
    }
  }
  return result;
}

function getSeason(monthBranch){
  if('å¯…å¯è¾?.includes(monthBranch)) return '??;
  if('å·³å???.includes(monthBranch)) return 'å¤?;
  if('?³é???.includes(monthBranch)) return 'ç§?;
  return '??;
}

function getElementColor(element){
  return {'??:'var(--wood)','??:'var(--fire)','??:'var(--earth)','??:'var(--metal)','æ°?:'var(--water)'}[element]||'var(--text)';
}

function getNayinElement(nayin){
  if(nayin.includes('??)) return '??;
  if(nayin.includes('??)) return '??;
  if(nayin.includes('æ°?)) return 'æ°?;
  if(nayin.includes('??)) return '??;
  if(nayin.includes('??)) return '??;
  return '';
}

// ?€?€ è¨ˆç??¥æŸ± ?€?€
function getDayPillarIndex(year, month, day){
  // ?ªå?ä½¿ç”¨ä»»ç?å²©å¹´?¸æ? (è¦æ ¼åº«æ?ä¾?2010-2030)
  let yearNum;
  if(month <= 2){
    yearNum = YEAR_NUMBERS[year-1]; // 1???ˆä½¿?¨ä?ä¸€å¹´å¹´??  } else {
    yearNum = YEAR_NUMBERS[year];
  }
  
  if(yearNum !== undefined){
    const monthNum = MONTH_NUMBERS[month];
    let idx = yearNum + monthNum + day;
    while(idx > 60) idx -= 60;
    if(idx <= 0) idx += 60;
    return idx;
  }
  
  // ç¯„å?å¤–ä½¿??JDN ?¥æŸ±?¨ç?æ³•ï?å·²æ ¡æº–ï?
  return getDayPillarByJDN(year, month, day);
}

function getDayPillarByJDN(y,m,d){
  const jdn = gregorianToJDN(y,m,d);
  // ä½¿ç”¨?¡æ??ºæ?: 2026-01-01 = ä¹™é? idx=22
  let idx = ((jdn - CALIBRATION_JDN + CALIBRATION_IDX - 1) % 60) + 1;
  if(idx <= 0) idx += 60;
  return idx;
}

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â?
//  MAIN CALCULATION
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â?
function calculate(){
  const year = parseInt(document.getElementById('birthYear').value);
  const month = parseInt(document.getElementById('birthMonth').value);
  const day = parseInt(document.getElementById('birthDay').value);
  let hour = parseInt(document.getElementById('birthHour').value);
  const minute = parseInt(document.getElementById('birthMinute').value);
  const gender = document.getElementById('gender').value;
  
  if(isNaN(year)||isNaN(month)||isNaN(day)||isNaN(hour)){alert('è«‹å¡«?¥å??´å‡º?Ÿè???);return}
  
  // === å­æ?è¦å?ï¼?3:00-00:59æ­¸å±¬?æ—¥ ===
  let calcYear = year, calcMonth = month, calcDay = day;
  if(hour >= 23){
    // æ­¸å±¬?æ—¥
    const nextDay = new Date(year, month-1, day+1);
    calcYear = nextDay.getFullYear();
    calcMonth = nextDay.getMonth()+1;
    calcDay = nextDay.getDate();
  }
  
  // ?â???å¹´æŸ± ?â???  // ç«‹æ˜¥?å±¬ä¸Šä?å¹?  let yearForPillar = calcYear;
  if(isBeforeLichun(calcYear, calcMonth, calcDay)){
    yearForPillar = calcYear - 1;
  }
  const yearStemIdx = (yearForPillar - 4) % 10;
  const yearBranchIdx = (yearForPillar - 4) % 12;
  const yearStem = STEMS[yearStemIdx >= 0 ? yearStemIdx : yearStemIdx+10];
  const yearBranch = BRANCHES[yearBranchIdx >= 0 ? yearBranchIdx : yearBranchIdx+12];
  
  // ?â????ˆæŸ± ?â???  const monthInfo = getMonthByJieqi(calcYear, calcMonth, calcDay);
  const monthBranch = monthInfo.branch;
  const monthBranchIdx = BRANCHES.indexOf(monthBranch);
  // äº”è??æ?: å¹´å¹²?’æ?å¹²èµ·é»?  const monthStemStart = getMonthStemStart(STEMS.indexOf(yearStem));
  // ?ˆå¹² = èµ·å?å¤©å¹² + (?ˆæ”¯ç´¢å? - å¯…æ”¯ç´¢å?) 
  const yinIdx = 2; // å¯?index in BRANCHES
  const monthOffset = (monthBranchIdx - yinIdx + 12) % 12;
  const monthStemIdx = (monthStemStart + monthOffset) % 10;
  const monthStem = STEMS[monthStemIdx];
  
  // ?â????¥æŸ± ?â???  let dayIdx = getDayPillarIndex(calcYear, calcMonth, calcDay);
  const dayStem = STEMS[(dayIdx-1)%10];
  const dayBranch = BRANCHES[(dayIdx-1)%12];
  
  // ?â????‚æŸ± ?â???  const hourBranchIdx = getHourBranch(hour);
  const hourBranch = BRANCHES[hourBranchIdx];
  const hourStemStart = getHourStemStart(STEMS.indexOf(dayStem));
  const hourStemIdx = (hourStemStart + hourBranchIdx) % 10;
  const hourStem = STEMS[hourStemIdx];
  
  // ?â???ç´éŸ³ ?â???  // getJiaziIdx() å·²åœ¨?¨å?å®šç¾©
  const yearNayin = SIXTY_JIAZI[getJiaziIdx(yearStem,yearBranch)].nayin;
  const monthNayin = SIXTY_JIAZI[getJiaziIdx(monthStem,monthBranch)].nayin;
  const dayNayin = SIXTY_JIAZI[getJiaziIdx(dayStem,dayBranch)].nayin;
  const hourNayin = SIXTY_JIAZI[getJiaziIdx(hourStem,hourBranch)].nayin;
  
  // ?â????¥ä¸» ?â???  const dayMaster = dayStem;
  const dayMasterElement = STEM_ELEMENT[dayMaster];
  const season = getSeason(monthBranch);
  
  // ?â???äº”è?çµ±è? ?â???  let wuxingCount = {'??:0,'??:0,'??:0,'??:0,'æ°?:0};
  // å¤©å¹²äº”è?
  [yearStem,monthStem,dayStem,hourStem].forEach(s=>{wuxingCount[STEM_ELEMENT[s]]++});
  // ?°æ”¯äº”è?
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{wuxingCount[BRANCH_ELEMENT[b]]++});
  // ?å¹²äº”è?
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{
    HIDDEN_STEMS[b].forEach(s=>{wuxingCount[STEM_ELEMENT[s]]+=0.5});
  });
  
  // ?â????ºè¡° ?â???  const wangxiang = WANGXIANG[season];
  const dayMasterState = wangxiang ? wangxiang[dayMasterElement] : 'ä¼?;
  
  // ?¥ä¸»?›é??†æ?
  let dayMasterStrength = 0;
  const stateScore = {'??:100,'??:75,'ä¼?:50,'??:25,'æ­?:10};
  dayMasterStrength = stateScore[dayMasterState] || 50;
  // è¨ˆç?æ¯”åŠ«?Œå°?Ÿæ•¸??  let helpCount = 0, drainCount = 0;
  [yearStem,monthStem,hourStem].forEach(s=>{
    const ss = getShiShen(dayMaster, s);
    if(['æ¯”è‚©','?«è²¡','æ­?°','?å°'].includes(ss)) helpCount++;
    else drainCount++;
  });
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{
    const bEl = BRANCH_ELEMENT[b];
    if(bEl===dayMasterElement || WUXING_SHENG[bEl]===dayMasterElement) helpCount++;
    else drainCount++;
  });
  
  let strengthLabel, strengthDesc;
  if(dayMasterStrength >= 75 && helpCount >= drainCount){
    strengthLabel = '?¥ä¸»?å¼·';
    strengthDesc = '?¥ä¸»å¾—ä»¤ä¸”åŠ©?›å?ï¼Œå??¨è²¡å®˜é??·æ´©??;
  } else if(dayMasterStrength >= 75){
    strengthLabel = '?¥ä¸»ä¸­å¼·';
    strengthDesc = '?¥ä¸»å¾—ä»¤ä½†æ´©?—äº¦å¤šï??¼å?è¶¨æ–¼å¹³è¡¡';
  } else if(dayMasterStrength <= 25 && helpCount < drainCount){
    strengthLabel = '?¥ä¸»?å¼±';
    strengthDesc = '?¥ä¸»å¤±ä»¤ä¸”ç„¡?©ï?å®œç”¨?°æ??Ÿæ‰¶';
  } else if(dayMasterStrength <= 25){
    strengthLabel = '?¥ä¸»å¼?;
    strengthDesc = '?¥ä¸»å¤±ä»¤ï¼Œé??°æ??Ÿæ‰¶?–æ??«åŠ©??;
  } else {
    strengthLabel = '?¥ä¸»ä¸­å?';
    strengthDesc = '?¥ä¸»ä¸å¼·ä¸å¼±ï¼Œå??¨ç??€ç´°ç??¼å?';
  }
  
  // ?â????ç? ?â???  const yearShiShen = getShiShen(dayMaster, yearStem);
  const monthShiShen = getShiShen(dayMaster, monthStem);
  const dayShiShen = '?¥ä¸»';
  const hourShiShen = getShiShen(dayMaster, hourStem);
  
  // ?â???èª¿å€??â???  const tiaohouAdvice = TIAOHUO[dayMaster] ? TIAOHUO[dayMaster][season] : '?¡è???;
  
  // ?â???æ²–å??‘å®³ ?â???  const allBranches = [
    {name:'å¹´æ”¯',branch:yearBranch},
    {name:'?ˆæ”¯',branch:monthBranch},
    {name:'?¥æ”¯',branch:dayBranch},
    {name:'?‚æ”¯',branch:hourBranch}
  ];
  let relationships = [];
  
  // ?­æ?
  for(let i=0;i<allBranches.length;i++){
    for(let j=i+1;j<allBranches.length;j++){
      if(LIU_CHONG[allBranches[i].branch]===allBranches[j].branch){
        relationships.push({type:'chong',label:`${allBranches[i].name}${allBranches[i].branch} æ²?${allBranches[j].name}${allBranches[j].branch}`});
      }
    }
  }
  // ?­å?
  for(const [a,b] of LIU_HE){
    for(let i=0;i<allBranches.length;i++){
      for(let j=i+1;j<allBranches.length;j++){
        if((allBranches[i].branch===a && allBranches[j].branch===b)||(allBranches[i].branch===b && allBranches[j].branch===a)){
          relationships.push({type:'he',label:`${allBranches[i].name}${allBranches[i].branch} ??${allBranches[j].name}${allBranches[j].branch}`});
        }
      }
    }
  }
  // ä¸‰å?
  for(const triple of SAN_HE){
    const bs = allBranches.map(x=>x.branch);
    const count = [triple[0],triple[1],triple[2]].filter(t=>bs.includes(t)).length;
    if(count>=3) relationships.push({type:'he',label:`ä¸‰å?${triple[3]}ï¼?{triple[0]}${triple[1]}${triple[2]}`});
    else if(count===2){
      const found = [triple[0],triple[1],triple[2]].filter(t=>bs.includes(t));
      relationships.push({type:'he',label:`?Šå?ï¼?{found.join('')}ï¼ˆè¶¨${triple[3]}ï¼‰`});
    }
  }
  // ä¸‰å?
  for(const [xingType, pairs] of Object.entries(SAN_XING)){
    if(xingType==='?ªå?'){
      const bs = allBranches.map(x=>x.branch);
      pairs.forEach(p=>{
        const cnt = bs.filter(b=>b===p).length;
        if(cnt>=2) relationships.push({type:'xing',label:`?ªå?ï¼?{p}è¦?{p}`});
      });
    } else {
      for(const [a,b] of pairs){
        for(let i=0;i<allBranches.length;i++){
          for(let j=i+1;j<allBranches.length;j++){
            if((allBranches[i].branch===a&&allBranches[j].branch===b)||(allBranches[i].branch===b&&allBranches[j].branch===a)){
              relationships.push({type:'xing',label:`${xingType}ï¼?{allBranches[i].branch}??{allBranches[j].branch}`});
            }
          }
        }
      }
    }
  }
  // ?­å®³
  for(const [a,b] of LIU_HAI){
    for(let i=0;i<allBranches.length;i++){
      for(let j=i+1;j<allBranches.length;j++){
        if((allBranches[i].branch===a&&allBranches[j].branch===b)||(allBranches[i].branch===b&&allBranches[j].branch===a)){
          relationships.push({type:'hai',label:`${allBranches[i].name}${allBranches[i].branch} å®?${allBranches[j].name}${allBranches[j].branch}`});
        }
      }
    }
  }
  
  // ?â???ç©ºäº¡ ?â???  const xunKong = getXunKong(dayIdx);
  
  // ?â???æ¸²æ? ?â???  document.getElementById('result').style.display='block';
  
  // Basic Info
  const zodiac = ZODIAC[yearBranch]||'';
  const zodiacEmoji = {'é¼?:'?­','??:'??','??:'?¯','??:'?°','é¾?:'?²','??:'??','é¦?:'?´','ç¾?:'??','??:'?µ','??:'??','??:'?¶','è±?:'?·'}[zodiac]||'';
  
  document.getElementById('basicInfo').innerHTML = `
    <div class="sh">
      <h3>${gender==='male'?'ä¹¾é€ ï??·å‘½ï¼?:'?¤é€ ï?å¥³å‘½ï¼?} Â· ${year}å¹?{month}??{day}??${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}</h3>
      <span class="badge">${zodiacEmoji} ${zodiac}å¹?/span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--dim)">
      <span>?¥ä¸»ï¼?strong style="color:${getElementColor(dayMasterElement)};font-size:16px">${dayMaster}</strong>ï¼?{STEM_ALIAS[dayMaster]}Â·${dayMasterElement}ï¼?/span>
      <span>?ˆä»¤ï¼?{monthBranch}?ˆï?${monthInfo.name}å¾Œï?</span>
      <span>å­??ï¼?{season}</span>
      <span>?¥ä¸»?€?‹ï?<strong style="color:${dayMasterState==='??||dayMasterState==='???'var(--green)':'var(--red)'}">${dayMasterState}</strong></span>
      <span>?Ÿè?ï¼?{zodiacEmoji} ${zodiac}ï¼ˆä»¥ç«‹æ˜¥?ºç?ï¼?/span>
      <span>ç©ºäº¡ï¼?{xunKong.join('??)}</span>
    </div>`;
  
  // Four Pillars
  const pillars = [
    {label:'å¹´æŸ±',stem:yearStem,branch:yearBranch,nayin:yearNayin,shishen:yearShiShen},
    {label:'?ˆæŸ±',stem:monthStem,branch:monthBranch,nayin:monthNayin,shishen:monthShiShen},
    {label:'?¥æŸ±',stem:dayStem,branch:dayBranch,nayin:dayNayin,shishen:dayShiShen},
    {label:'?‚æŸ±',stem:hourStem,branch:hourBranch,nayin:hourNayin,shishen:hourShiShen}
  ];
  
  document.getElementById('pillarsGrid').innerHTML = pillars.map(p=>{
    const stemEl = STEM_ELEMENT[p.stem];
    const branchEl = BRANCH_ELEMENT[p.branch];
    const hidden = HIDDEN_STEMS[p.branch];
    const hiddenShiShen = hidden.map(h=>{
      const ss = p.label==='?¥æŸ±' && h===dayStem ? '?¥ä¸»' : getShiShen(dayMaster, h);
      return `<span class="pillar-shishen" style="border-color:${getElementColor(STEM_ELEMENT[h])}40;color:${getElementColor(STEM_ELEMENT[h])};font-size:9px">${h}${ss?'Â·'+ss:''}</span>`;
    }).join('');
    
    const shishenColor = {'æ¯”è‚©':'var(--accent)','?«è²¡':'var(--accent)','é£Ÿç?':'var(--wood)','?·å?':'var(--wood)',
      '?è²¡':'var(--earth)','æ­?²¡':'var(--earth)','ä¸ƒæ®º':'var(--fire)','æ­??':'var(--fire)',
      '?å°':'var(--water)','æ­?°':'var(--water)','?¥ä¸»':'var(--gold)'}[p.shishen]||'var(--text)';
    
    return `<div class="pillar-card">
      <div class="pillar-label">${p.label}</div>
      <div class="pillar-shishen" style="border-color:${shishenColor}40;color:${shishenColor};margin-bottom:8px">${p.shishen}</div>
      <div class="pillar-stem element-${stemEl}" style="color:${getElementColor(stemEl)}">${p.stem}</div>
      <div class="pillar-branch element-${branchEl}" style="color:${getElementColor(branchEl)}">${p.branch}</div>
      <div class="pillar-nayin">${p.nayin}</div>
      <div style="font-family:var(--mono);font-size:9px;color:var(--dim);margin-bottom:4px">?å¹²</div>
      <div>${hiddenShiShen}</div>
    </div>`;
  }).join('');
  
  // äº”è?çµ±è?
  const maxWx = Math.max(...Object.values(wuxingCount), 1);
  const wxEmoji = {'??:'?Œ¿','??:'?”¥','??:'?°ï?','??:'?”ï?','æ°?:'?’§'};
  document.getElementById('wuxingGrid').innerHTML = ['??,'??,'??,'??,'æ°?].map(el=>{
    const count = wuxingCount[el];
    const pct = Math.round(count/maxWx*100);
    return `<div class="wx-item">
      <div class="wx-label" style="color:${getElementColor(el)}">${wxEmoji[el]}</div>
      <div class="wx-name">${el}</div>
      <div class="wx-bar"><div class="wx-bar-fill" style="width:${pct}%;background:${getElementColor(el)}"></div></div>
      <div class="wx-count" style="color:${getElementColor(el)}">${count}</div>
    </div>`;
  }).join('');
  
  // Analysis Cards
  document.getElementById('analysisGrid').innerHTML = `
    <div class="analysis-card">
      <h4>???¥ä¸»å¼·å¼±?†æ?</h4>
      <div class="analysis-item ${dayMasterStrength>=50?'good':'warn'}">
        <strong>${strengthLabel}</strong><br>
        <span style="color:var(--dim)">${strengthDesc}</span>
      </div>
      <div class="analysis-item">
        ?¥ä¸» ${dayMaster}ï¼?{STEM_ALIAS[dayMaster]}ï¼‰åœ¨${season}å­?{monthBranch}?ˆç‚º??strong style="color:${dayMasterState==='??||dayMasterState==='???'var(--green)':'var(--red)'}">${dayMasterState}</strong>??      </div>
      <div class="analysis-item">
        ?©èº«?›é?ï¼?{helpCount} Â· ?—æ´©?›é?ï¼?{drainCount}
      </div>
    </div>
    
    <div class="analysis-card">
      <h4>?Œ¡ï¸?èª¿å€™ç”¨ç¥?/h4>
      <div class="analysis-item gold">
        <strong>${dayMaster}?¥ä¸» Â· ${season}å­?ª¿??/strong><br>
        <span style="color:var(--dim)">${tiaohouAdvice}</span>
      </div>
    </div>
    
    <div class="analysis-card">
      <h4>?µ ç´éŸ³äº”è?</h4>
      <div class="analysis-item">
        å¹´æŸ±ï¼?strong style="color:${getElementColor(getNayinElement(yearNayin))}">${yearNayin}</strong>ï¼?{getNayinElement(yearNayin)}ï¼?      </div>
      <div class="analysis-item">
        ?ˆæŸ±ï¼?strong style="color:${getElementColor(getNayinElement(monthNayin))}">${monthNayin}</strong>ï¼?{getNayinElement(monthNayin)}ï¼?      </div>
      <div class="analysis-item">
        ?¥æŸ±ï¼?strong style="color:${getElementColor(getNayinElement(dayNayin))}">${dayNayin}</strong>ï¼?{getNayinElement(dayNayin)}ï¼‰Â??¥ä¸»?¬å‘½ç´éŸ³
      </div>
      <div class="analysis-item">
        ?‚æŸ±ï¼?strong style="color:${getElementColor(getNayinElement(hourNayin))}">${hourNayin}</strong>ï¼?{getNayinElement(hourNayin)}ï¼?      </div>
    </div>
    
    <div class="analysis-card">
      <h4>?? ?ºç›¸ä¼‘å?æ­?/h4>
      ${wangxiang ? Object.entries(wangxiang).map(([el,state])=>{
        const stateColors = {'??:'var(--green)','??:'var(--accent)','ä¼?:'var(--dim)','??:'var(--orange)','æ­?:'var(--red)'};
        const isDay = el===dayMasterElement;
        return `<div class="analysis-item ${isDay?'good':''}">
          <span style="color:${getElementColor(el)}">${el}</span>ï¼?          <strong style="color:${stateColors[state]}">${state}</strong>
          ${isDay?'???¥ä¸»':''}
        </div>`;
      }).join('') : '<div class="analysis-item">?¡è???/div>'}
    </div>`;
  
  // æ²–å??‘å®³
  if(relationships.length > 0){
    document.getElementById('chongHePanel').innerHTML = `
      <div class="sh">
        <h3>æ²–å??‘å®³?œä?</h3>
        <span class="badge">?°æ”¯äº’å?</span>
      </div>
      <div class="chong-tags">
        ${relationships.map(r=>`<span class="chong-tag ${r.type}">${r.label}</span>`).join('')}
      </div>`;
    document.getElementById('chongHePanel').style.display='block';
  } else {
    document.getElementById('chongHePanel').innerHTML = `
      <div class="sh">
        <h3>æ²–å??‘å®³?œä?</h3>
        <span class="badge">?°æ”¯äº’å?</span>
      </div>
      <div style="font-size:12px;color:var(--dim)">?›æŸ±?°æ”¯?“ç„¡?é¡¯æ²–å??‘å®³?œä?</div>`;
    document.getElementById('chongHePanel').style.display='block';
  }
  
  // Animate
  gsap.from('#result', {opacity:0, y:30, duration:0.8, ease:'power3.out'});
  gsap.from('.pillar-card', {opacity:0, y:40, stagger:0.15, duration:0.7, ease:'back.out(1.7)', delay:0.2});
  gsap.from('.wx-item', {opacity:0, scale:0.8, stagger:0.1, duration:0.5, ease:'power2.out', delay:0.6});
  gsap.from('.analysis-card', {opacity:0, y:20, stagger:0.1, duration:0.5, ease:'power2.out', delay:0.9});
  
  // ?â???äº”è?ç¼ºå¤±/?æ—º?ç¤º ?â???  const alertEl = document.getElementById('wuxingAlert');
  let alertsHtml = '';
  const missing = ['??,'??,'??,'??,'æ°?].filter(e=>wuxingCount[e]===0);
  const excess = ['??,'??,'??,'??,'æ°?].filter(e=>wuxingCount[e]>=6);
  if(missing.length>0){
    alertsHtml += `<div class="wx-alert danger">
      <span class="wx-alert-icon">? ï?</span>
      <div>?½å?<strong>ç¼?{missing.join('??)}</strong>ï¼ä?è¡Œä??¨ï?${missing.map(e=>{
        const tips={'??:'å®œå??¨å??å??±æ–¹?ç©¿?’ç???,'??:'å®œå??«å??å??—æ–¹?ç©¿ç´…è‰²','??:'å®œå?ä¸­å¤®?ç©¿é»ƒæ???,'??:'å®œå??‘å??å?è¥¿æ–¹?ç©¿?½è‰²','æ°?:'å®œå?æ°´å??å??—æ–¹?ç©¿é»‘è???};
        return tips[e];
      }).join('ï¼?)}</div>
    </div>`;
  }
  if(excess.length>0){
    alertsHtml += `<div class="wx-alert">
      <span class="wx-alert-icon">?’¡</span>
      <div>${excess.map(e=>`<strong style="color:${getElementColor(e)}">${e}</strong>è¡Œé??ºï?${wuxingCount[e]}ï¼‰`).join('ï¼?)}ï¼Œå?æ´©ä?å®œå?</div>
    </div>`;
  }
  alertEl.innerHTML = alertsHtml;
  
  // ?â????ç?ç¸½è¦½ ?â???  const ssAll = {};
  const ssNames = ['æ¯”è‚©','?«è²¡','é£Ÿç?','?·å?','?è²¡','æ­?²¡','ä¸ƒæ®º','æ­??','?å°','æ­?°'];
  ssNames.forEach(n=>ssAll[n]=0);
  // å¤©å¹²?ç?
  [yearStem,monthStem,hourStem].forEach(s=>{
    const ss = getShiShen(dayMaster,s);
    if(ss && ssAll[ss]!==undefined) ssAll[ss]++;
  });
  // ?å¹²?ç?
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{
    HIDDEN_STEMS[b].forEach(h=>{
      const ss = getShiShen(dayMaster,h);
      if(ss && ssAll[ss]!==undefined) ssAll[ss]+=0.5;
    });
  });
  const ssCatColor = {'æ¯”è‚©':'var(--accent)','?«è²¡':'var(--accent)','é£Ÿç?':'var(--wood)','?·å?':'var(--wood)',
    '?è²¡':'var(--earth)','æ­?²¡':'var(--earth)','ä¸ƒæ®º':'var(--fire)','æ­??':'var(--fire)',
    '?å°':'var(--water)','æ­?°':'var(--water)'};
  const ssCatName = {'æ¯”è‚©':'æ¯”åŠ«','?«è²¡':'æ¯”åŠ«','é£Ÿç?':'é£Ÿå‚·','?·å?':'é£Ÿå‚·',
    '?è²¡':'è²¡æ?','æ­?²¡':'è²¡æ?','ä¸ƒæ®º':'å®˜æ®º','æ­??':'å®˜æ®º','?å°':'?°æ?','æ­?°':'?°æ?'};
  document.getElementById('ssGrid').innerHTML = ssNames.map(n=>{
    const c = ssAll[n];
    return `<div class="ss-cell">
      <div class="ss-name" style="color:${ssCatColor[n]}">${n}</div>
      <div class="ss-count" style="color:${c>0?ssCatColor[n]:'var(--dim)'}">${c}</div>
      <div class="ss-cat">${ssCatName[n]}</div>
    </div>`;
  }).join('');
  
  // ?â???å¤§é??’ç›¤ ?â???  const dayunPanel = document.getElementById('dayunPanel');
  const dayunTrack = document.getElementById('dayunTrack');
  // å¤§é?èµ·é?ï¼šç”·?½é™½å¹´é??’ã€å¥³?½é™½å¹´é€†æ?ï¼›ç”·?½é™°å¹´é€†æ??å¥³?½é™°å¹´é???  const yearStemYY = STEM_YINYANG[yearStem];
  const isYangYear = yearStemYY === '??;
  const isMale = gender === 'male';
  const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);
  
  // èµ·é?æ­²æ•¸ï¼ˆç°¡?–ï?ç´?æ­²ä?æ­¥è?ä¼¼ï?
  // ç²¾ç¢ºè¨ˆç??€è¦å‡º?Ÿæ—¥?°ä?ä¸€?‹ç?/ä¸Šä??‹ç??„å¤©?¸Ã?ï¼Œé€™è£¡?¨ç?æ°??ä¼?  let startAge = 3; // ç°¡å?è¿‘ä¼¼
  const monthJieDate = getMonthByJieqi(calcYear, calcMonth, calcDay);
  // è¿‘ä¼¼ï¼šè??¢ä?ä¸€ç¯€?–ä?ä¸€ç¯€å¤©æ•¸Ã·3
  const bdDate = new Date(year, month-1, day);
  let daysToJie = 0;
  const yStr2 = String(calcYear);
  const jieOrder2 = ['å°å?','ç«‹æ˜¥','é©šè?','æ¸…æ?','ç«‹å?','?’ç¨®','å°æ?','ç«‹ç?','?½éœ²','å¯’éœ²','ç«‹å†¬','å¤§é›ª'];
  if(isForward){
    // ?†è?ï¼šæ‰¾ä¸‹ä??‹ç?
    for(const jn of jieOrder2){
      if(JIEQI_TABLE[jn] && JIEQI_TABLE[jn][yStr2]){
        const jd = parseJieqiDate(JIEQI_TABLE[jn][yStr2], calcYear);
        if(jd > bdDate){ daysToJie = Math.ceil((jd-bdDate)/(86400000)); break; }
      }
    }
  } else {
    // ?†è?ï¼šæ‰¾ä¸Šä??‹ç?
    for(let k=jieOrder2.length-1;k>=0;k--){
      const jn = jieOrder2[k];
      if(JIEQI_TABLE[jn] && JIEQI_TABLE[jn][yStr2]){
        const jd = parseJieqiDate(JIEQI_TABLE[jn][yStr2], calcYear);
        if(jd <= bdDate){ daysToJie = Math.ceil((bdDate-jd)/(86400000)); break; }
      }
    }
  }
  startAge = Math.max(1, Math.round(daysToJie / 3));
  if(startAge > 10) startAge = startAge % 10 || 3;
  
  // ??0æ­¥å¤§??  let dayunSteps = [];
  const monthJiaziIdx = getJiaziIdx(monthStem, monthBranch);
  const currentAge = new Date().getFullYear() - year;
  
  for(let step=1; step<=10; step++){
    let offset = isForward ? step : -step;
    let idx = ((monthJiaziIdx + offset) % 60 + 60) % 60;
    const gz = SIXTY_JIAZI[idx];
    const ageStart = startAge + (step-1)*10;
    const ageEnd = ageStart + 9;
    const dyYearStart = year + ageStart;
    const dyYearEnd = year + ageEnd;
    const dyStem = gz.gz[0];
    const dyBranch = gz.gz[1];
    const dySS = getShiShen(dayMaster, dyStem);
    const isActive = currentAge >= ageStart && currentAge <= ageEnd;
    dayunSteps.push({gz:gz.gz, nayin:gz.nayin, stem:dyStem, branch:dyBranch, ss:dySS,
      ageStart, ageEnd, dyYearStart, dyYearEnd, isActive});
  }
  
  dayunTrack.innerHTML = dayunSteps.map((d,i)=>{
    const stemEl = STEM_ELEMENT[d.stem];
    const branchEl = BRANCH_ELEMENT[d.branch];
    const ssCol = ssCatColor[d.ss] || 'var(--dim)';
    return `<div class="dayun-step ${d.isActive?'active':''}">
      <div class="dy-age">${d.ageStart}-${d.ageEnd}æ­?/div>
      <div class="dy-gz"><span style="color:${getElementColor(stemEl)}">${d.stem}</span><span style="color:${getElementColor(branchEl)}">${d.branch}</span></div>
      <div class="dy-nayin">${d.nayin}</div>
      <div class="dy-el" style="color:var(--dim)">${d.dyYearStart}-${d.dyYearEnd}</div>
      <div class="dy-ss" style="border-color:${ssCol}40;color:${ssCol}">${d.ss}</div>
      ${i<9?'<div class="dayun-connector"></div>':''}
    </div>`;
  }).join('');
  dayunPanel.style.display = 'block';
  document.getElementById('dayunBadge').textContent = `${isForward?'?†è?':'?†è?'} Â· èµ·é?${startAge}æ­²`;
  
  gsap.from('.dayun-step', {opacity:0, y:15, stagger:0.08, duration:0.4, ease:'power2.out', delay:0.7});
  gsap.from('.ss-cell', {opacity:0, scale:0.9, stagger:0.05, duration:0.3, ease:'power2.out', delay:0.8});
  
  // Scroll to result
  setTimeout(()=>{
    document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
  }, 200);
}

// ?€?€ ç´éŸ³?¥æ‰¾è¼”åŠ©ï¼ˆç”¨?¼å¤§?‹ï? ?€?€
function getJiaziIdx(stem, branch){
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  for(let i=0;i<60;i++){
    if(i%10===si && i%12===bi) return i;
  }
  return 0;
}

// ?€?€ ç©ºäº¡è¨ˆç? ?€?€
function getXunKong(dayIdx){
  // dayIdx is 1-60 (?­å??²å?)
  const idx = dayIdx - 1; // 0-based
  const xunStart = idx - (idx % 10); // è©²æ—¬èµ·å?
  // ?¬ç©º = 10å¤©å¹²?å?å¾Œå‰©ä¸‹ç?2?‹åœ°??  const startBranch = xunStart % 12;
  const kong1 = (startBranch + 10) % 12;
  const kong2 = (startBranch + 11) % 12;
  return [BRANCHES[kong1], BRANCHES[kong2]];
}

// ?€?€ ?¶å?ç¯€æ°?¡¯ç¤??€?€
function showCurrentJieqi(){
  const now = new Date();
  const y = now.getFullYear();
  const yStr = String(y);
  const jieqiOrder = ['å°å?','å¤§å?','ç«‹æ˜¥','?¨æ°´','é©šè?','?¥å?','æ¸…æ?','ç©€??,'ç«‹å?','å°æ»¿','?’ç¨®','å¤è‡³','å°æ?','å¤§æ?','ç«‹ç?','?•æ?','?½éœ²','ç§‹å?','å¯’éœ²','?œé?','ç«‹å†¬','å°é›ª','å¤§é›ª','?¬è‡³'];
  
  let currentJieqi = '';
  let nextJieqi = '';
  let nextDate = '';
  
  if(JIEQI_TABLE['å°å?'][yStr]){
    let lastJieqi = '';
    for(const jq of jieqiOrder){
      if(JIEQI_TABLE[jq][yStr]){
        const d = parseJieqiDate(JIEQI_TABLE[jq][yStr], y);
        if(now >= d){
          lastJieqi = jq;
        } else {
          if(!nextJieqi){ nextJieqi = jq; nextDate = JIEQI_TABLE[jq][yStr]; }
        }
      }
    }
    currentJieqi = lastJieqi || '?¬è‡³';
  }
  
  const el = document.getElementById('jieqiNow');
  if(el && currentJieqi){
    el.textContent = `?¶å?ç¯€æ°??${currentJieqi}${nextJieqi?` ??${nextJieqi}ï¼?{nextDate}ï¼‰`:''}`;
  }
}

// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â?
//  BOOT ANIMATION
// ?â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â??â?
(function(){
  const steps = [
    'è¼‰å…¥å¹²æ”¯?¨ç?ç³»çµ± ?€?€?€?€?€?€ ','è¼‰å…¥?­å??²å?ç´éŸ³ ?€?€?€?€?€?€ ','è¼‰å…¥ç¯€æ°?Ÿ¥è¡¨å????€?€?€?€?€?€ ',
    'è¼‰å…¥äº”è??ºè¡°?©é™£ ?€?€?€?€?€?€ ','è¼‰å…¥?ç??œä??©é™£ ?€?€?€?€?€?€ ','è¼‰å…¥èª¿å€™ç”¨ç¥çŸ©???€?€?€?€?€?€ ',
    'è¼‰å…¥æ²–å??‘å®³æ¨¡ç? ?€?€?€?€?€?€ ','?å??–é?è§€?½ç?å¼•æ? ?€?€?€?€ '
  ];
  const bm = document.getElementById('bm');
  let i = 0;
  function next(){
    if(i < steps.length){
      const line = document.createElement('div');
      line.innerHTML = steps[i] + '<span class="ok">OK</span>';
      bm.appendChild(line);
      i++;
      setTimeout(next, 180 + Math.random()*120);
    } else {
      gsap.to('#bf', {opacity:1, duration:0.5, delay:0.3});
      gsap.to('#boot', {opacity:0, duration:0.6, delay:1.2, onComplete:()=>{
        document.getElementById('boot').style.display='none';
        gsap.to('#main', {opacity:1, duration:0.8});
        showCurrentJieqi();
      }});
    }
  }
  setTimeout(next, 400);
})();

// ?€?€ ?é¢è¼‰å…¥å¾Œè‡ª?•æ?ç¯„ä????€?€
setTimeout(()=>{
  if(document.getElementById('result').style.display!=='block'){
    calculate();
  }
}, 3200);

