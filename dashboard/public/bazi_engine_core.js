
// ===================================================================
//  BaZi Calculator - CTS-LHY13 八字規格庫 v1.7 Implementation
//  All data from 八字_規格庫_v1.7.json
// ===================================================================

// ── 天干地支 ──
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// ── 六十甲子 + 納音 ──
const SIXTY_JIAZI = [
  {gz:'甲子',nayin:'海中金'},{gz:'乙丑',nayin:'海中金'},{gz:'丙寅',nayin:'爐中火'},{gz:'丁卯',nayin:'爐中火'},
  {gz:'戊辰',nayin:'大林木'},{gz:'己巳',nayin:'大林木'},{gz:'庚午',nayin:'路傍土'},{gz:'辛未',nayin:'路傍土'},
  {gz:'壬申',nayin:'劍鋒金'},{gz:'癸酉',nayin:'劍鋒金'},{gz:'甲戌',nayin:'山頭火'},{gz:'乙亥',nayin:'山頭火'},
  {gz:'丙子',nayin:'澗下水'},{gz:'丁丑',nayin:'澗下水'},{gz:'戊寅',nayin:'城頭土'},{gz:'己卯',nayin:'城頭土'},
  {gz:'庚辰',nayin:'白蠟金'},{gz:'辛巳',nayin:'白蠟金'},{gz:'壬午',nayin:'楊柳木'},{gz:'癸未',nayin:'楊柳木'},
  {gz:'甲申',nayin:'泉中水'},{gz:'乙酉',nayin:'泉中水'},{gz:'丙戌',nayin:'屋上土'},{gz:'丁亥',nayin:'屋上土'},
  {gz:'戊子',nayin:'霹靂火'},{gz:'己丑',nayin:'霹靂火'},{gz:'庚寅',nayin:'松柏木'},{gz:'辛卯',nayin:'松柏木'},
  {gz:'壬辰',nayin:'長流水'},{gz:'癸巳',nayin:'長流水'},{gz:'甲午',nayin:'砂中金'},{gz:'乙未',nayin:'砂中金'},
  {gz:'丙申',nayin:'山下火'},{gz:'丁酉',nayin:'山下火'},{gz:'戊戌',nayin:'平地木'},{gz:'己亥',nayin:'平地木'},
  {gz:'庚子',nayin:'壁上土'},{gz:'辛丑',nayin:'壁上土'},{gz:'壬寅',nayin:'金箔金'},{gz:'癸卯',nayin:'金箔金'},
  {gz:'甲辰',nayin:'覆燈火'},{gz:'乙巳',nayin:'覆燈火'},{gz:'丙午',nayin:'天河水'},{gz:'丁未',nayin:'天河水'},
  {gz:'戊申',nayin:'大驛土'},{gz:'己酉',nayin:'大驛土'},{gz:'庚戌',nayin:'釵釧金'},{gz:'辛亥',nayin:'釵釧金'},
  {gz:'壬子',nayin:'桑柘木'},{gz:'癸丑',nayin:'桑柘木'},{gz:'甲寅',nayin:'大溪水'},{gz:'乙卯',nayin:'大溪水'},
  {gz:'丙辰',nayin:'沙中土'},{gz:'丁巳',nayin:'沙中土'},{gz:'戊午',nayin:'天上火'},{gz:'己未',nayin:'天上火'},
  {gz:'庚申',nayin:'石榴木'},{gz:'辛酉',nayin:'石榴木'},{gz:'壬戌',nayin:'大海水'},{gz:'癸亥',nayin:'大海水'}
];

// ── 藏干 ──
const HIDDEN_STEMS = {
  '子':['癸'],'丑':['己','辛','癸'],'寅':['甲','丙','戊'],'卯':['乙'],
  '辰':['戊','乙','癸'],'巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
  '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']
};

// ── 五行映射 ──
const STEM_ELEMENT = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
const BRANCH_ELEMENT = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
const STEM_YINYANG = {'甲':'陽','乙':'陰','丙':'陽','丁':'陰','戊':'陽','己':'陰','庚':'陽','辛':'陰','壬':'陽','癸':'陰'};

// ── 五行生剋 ──
const WUXING_SHENG = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
const WUXING_KE = {'木':'土','火':'金','土':'水','金':'木','水':'火'};

// ── 生肖 ──
const ZODIAC = {'子':'鼠','丑':'牛','寅':'虎','卯':'兔','辰':'龍','巳':'蛇','午':'馬','未':'羊','申':'猴','酉':'雞','戌':'狗','亥':'豬'};

// ── 節氣表 2023-2028 ──
const JIEQI_TABLE = {
  '小寒':{'2023':'1/5','2024':'1/6','2025':'1/5','2026':'1/5','2027':'1/6','2028':'1/6'},
  '大寒':{'2023':'1/20','2024':'1/20','2025':'1/20','2026':'1/20','2027':'1/20','2028':'1/20'},
  '立春':{'2023':'2/4','2024':'2/4','2025':'2/3','2026':'2/3','2027':'2/3','2028':'2/4'},
  '雨水':{'2023':'2/19','2024':'2/19','2025':'2/18','2026':'2/18','2027':'2/18','2028':'2/19'},
  '驚蟄':{'2023':'3/6','2024':'3/5','2025':'3/5','2026':'3/5','2027':'3/6','2028':'3/5'},
  '春分':{'2023':'3/21','2024':'3/20','2025':'3/20','2026':'3/20','2027':'3/20','2028':'3/20'},
  '清明':{'2023':'4/5','2024':'4/4','2025':'4/4','2026':'4/4','2027':'4/5','2028':'4/4'},
  '穀雨':{'2023':'4/20','2024':'4/19','2025':'4/20','2026':'4/20','2027':'4/20','2028':'4/19'},
  '立夏':{'2023':'5/6','2024':'5/5','2025':'5/5','2026':'5/5','2027':'5/6','2028':'5/5'},
  '小滿':{'2023':'5/21','2024':'5/20','2025':'5/21','2026':'5/21','2027':'5/21','2028':'5/20'},
  '芒種':{'2023':'6/6','2024':'6/5','2025':'6/5','2026':'6/5','2027':'6/6','2028':'6/5'},
  '夏至':{'2023':'6/21','2024':'6/21','2025':'6/21','2026':'6/21','2027':'6/21','2028':'6/21'},
  '小暑':{'2023':'7/7','2024':'7/6','2025':'7/7','2026':'7/7','2027':'7/7','2028':'7/6'},
  '大暑':{'2023':'7/23','2024':'7/22','2025':'7/22','2026':'7/22','2027':'7/23','2028':'7/22'},
  '立秋':{'2023':'8/8','2024':'8/7','2025':'8/7','2026':'8/7','2027':'8/8','2028':'8/7'},
  '處暑':{'2023':'8/23','2024':'8/22','2025':'8/23','2026':'8/23','2027':'8/23','2028':'8/22'},
  '白露':{'2023':'9/8','2024':'9/7','2025':'9/7','2026':'9/7','2027':'9/8','2028':'9/7'},
  '秋分':{'2023':'9/23','2024':'9/22','2025':'9/23','2026':'9/23','2027':'9/23','2028':'9/22'},
  '寒露':{'2023':'10/8','2024':'10/8','2025':'10/8','2026':'10/8','2027':'10/8','2028':'10/8'},
  '霜降':{'2023':'10/24','2024':'10/23','2025':'10/23','2026':'10/23','2027':'10/23','2028':'10/22'},
  '立冬':{'2023':'11/8','2024':'11/7','2025':'11/7','2026':'11/7','2027':'11/7','2028':'11/7'},
  '小雪':{'2023':'11/22','2024':'11/22','2025':'11/22','2026':'11/22','2027':'11/22','2028':'11/22'},
  '大雪':{'2023':'12/7','2024':'12/7','2025':'12/7','2026':'12/7','2027':'12/7','2028':'12/7'},
  '冬至':{'2023':'12/22','2024':'12/21','2025':'12/22','2026':'12/21','2027':'12/22','2028':'12/21'}
};

// 12節（月柱切割線）- 按月序
const MONTH_JIE = ['立春','驚蟄','清明','立夏','芒種','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
const MONTH_BRANCHES = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];

// ── 任紅岩年數法 (規格庫 2010-2030) ──
const YEAR_NUMBERS = {
  2010:8,2011:13,2012:18,2013:24,2014:29,2015:34,2016:39,2017:45,2018:50,2019:55,
  2020:0,2021:9,2022:14,2023:19,2024:24,2025:30,2026:35,2027:40,2028:45,2029:51,2030:56
};
const MONTH_NUMBERS = {1:6,2:37,3:0,4:31,5:1,6:32,7:2,8:33,9:4,10:34,11:5,12:35};

function isLeapYear(y){return (y%4===0&&y%100!==0)||(y%400===0)}

// ── JDN (Julian Day Number) 計算 ──
function gregorianToJDN(y,m,d){
  const a = Math.floor((14-m)/12);
  const yy = y+4800-a;
  const mm = m+12*a-3;
  return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
}

// 日柱校準基準：2026-01-01 = 乙酉日 (六十甲子 idx=22)
const CALIBRATION_JDN = gregorianToJDN(2026,1,1); // 2461042
const CALIBRATION_IDX = 22; // 乙酉

// ── 五虎遁月 ──
function getMonthStemStart(yearStemIdx){
  const map = [2,4,6,8,0,2,4,6,8,0];
  return map[yearStemIdx];
}

// ── 五鼠遁時 ──
function getHourStemStart(dayStemIdx){
  const map = [0,2,4,6,8,0,2,4,6,8];
  return map[dayStemIdx];
}

// ── 時辰地支 ──
function getHourBranch(hour){
  if(hour>=23||hour<1) return 0;
  return Math.floor((hour+1)/2);
}

// ── 十神計算 ──
function getShiShen(dayStem,targetStem){
  const dayEl = STEM_ELEMENT[dayStem];
  const dayYY = STEM_YINYANG[dayStem];
  const tarEl = STEM_ELEMENT[targetStem];
  const tarYY = STEM_YINYANG[targetStem];
  const same = dayYY === tarYY;
  
  if(dayEl===tarEl) return same?'比肩':'劫財';
  if(WUXING_SHENG[dayEl]===tarEl) return same?'食神':'傷官';
  if(WUXING_KE[dayEl]===tarEl) return same?'偏財':'正財';
  if(WUXING_KE[tarEl]===dayEl) return same?'七殺':'正官';
  if(WUXING_SHENG[tarEl]===dayEl) return same?'偏印':'正印';
  return '';
}

// ── 沖合刑害 ──
const LIU_CHONG = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥','午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'};
const LIU_HE = [['子','丑'],['寅','亥'],['卯','戌'],['辰','酉'],['巳','申'],['午','未']];
const SAN_HE = [['申','子','辰','水局'],['亥','卯','未','木局'],['寅','午','戌','火局'],['巳','酉','丑','金局']];
const SAN_XING = {
  '持勢之刑':[['寅','巳'],['巳','申'],['申','寅']],
  '無恩之刑':[['丑','戌'],['戌','未'],['未','丑']],
  '無禮之刑':[['子','卯'],['卯','子']],
  '自刑':['辰','午','酉','亥']
};
const LIU_HAI = [['子','未'],['丑','午'],['寅','巳'],['卯','辰'],['申','亥'],['酉','戌']];

// ── 旺相休囚死 ──
const WANGXIANG = {
  '春':{'木':'旺','火':'相','水':'休','金':'囚','土':'死'},
  '夏':{'火':'旺','土':'相','木':'休','水':'囚','金':'死'},
  '秋':{'金':'旺','水':'相','土':'休','火':'囚','木':'死'},
  '冬':{'水':'旺','木':'相','金':'休','土':'囚','火':'死'}
};

// ── 調候用神 ──
const TIAOHUO = {
  '甲':{'春':'木旺，需庚金砍伐成材；次用丙火暖局','夏':'火炎，急需癸水滋潤；忌過多戊土','秋':'金令，庚金剋木，需丁火鍛煉或壬水洩金','冬':'水旺，先用庚金截流，再用丁火解凍'},
  '乙':{'春':'木旺，需癸水滋潤；忌過多甲木競爭','夏':'火炎，急需癸水解渴；需己土培根','秋':'金令，乙木纖弱，需癸水或丙火護身','冬':'水冷，需丙火解凍暖身；忌多壬水'},
  '丙':{'春':'木旺生火，需壬水制衡；次需戊土吸熱','夏':'火炎，必須壬水降溫；忌見戊己燥土','秋':'金令，丙火失令，需甲木引火；壬水輔助','冬':'水旺，急需甲木引火；需壬水配合'},
  '丁':{'春':'木旺，以甲木為引火之媒；需庚金控甲','夏':'火炎，需壬水調節；甲木為引','秋':'金令，需甲木燃料；庚金為伴','冬':'水冷，急需甲木引燃；甲庚兩透最貴'},
  '戊':{'春':'木旺，甲木過旺則崩山，需庚金斬木保土','夏':'火炎土燥，急需壬水灌溉；甲木疏土','秋':'金令，金多土虛，需丙火暖身；甲木疏土','冬':'水旺，甲木疏土最急；丙火解凍次之'},
  '己':{'春':'木旺剋土，需丙火暖局；庚金疏木護土','夏':'火炎土燥，急需癸水滋潤；丙火次要','秋':'金令，土生金洩氣，需丙火補氣暖身','冬':'水冷，急需丙火解凍暖土；甲木疏導'},
  '庚':{'春':'木旺，金氣虛弱，需戊己土生扶；丁火鍛煉','夏':'火炎，鎔金危機，必須壬水降溫；戊土化殺生金','秋':'金旺，需丁火鍛煉+甲木燃料；次用壬水洗淘','冬':'金寒，必先丙火解凍；再丁火鍛煉；戊土攔水'},
  '辛':{'春':'金弱，需己土養護；壬水洗滌','夏':'烈火焚玉危機，必須壬癸水急救；己土濕土護身','秋':'金旺璀璨，最需壬水洗滌（金白水清）','冬':'金寒水冷，必先丙火暖水；壬水照耀'},
  '壬':{'春':'木旺洩水，需庚金生水；戊土築堤','夏':'火炎水沸，需庚金生水補源；戊土攔截','秋':'金旺生水強健，需戊土攔截；甲木疏導','冬':'水旺氾濫，必須戊土築堤；甲木疏導'},
  '癸':{'春':'木旺洩水，需庚辛金生水；丙火暖局','夏':'水弱火炎，庚辛金生水最急；壬水助力','秋':'金旺生水，需丙火溫暖；戊土攔截過旺','冬':'水冷，必先丙火解凍暖局；辛金生水輔助'}
};

// ── 天干體性 ──
const STEM_ALIAS = {'甲':'大樹','乙':'花草','丙':'太陽','丁':'燈火','戊':'高山','己':'田園','庚':'頑鐵','辛':'珠寶','壬':'江河','癸':'雨露'};

// ── 節氣日期解析 ──
function parseJieqiDate(str, year){
  const parts = str.split('/');
  return new Date(year, parseInt(parts[0])-1, parseInt(parts[1]));
}

function getLichunDate(year){
  const y = String(year);
  if(JIEQI_TABLE['立春'][y]) return parseJieqiDate(JIEQI_TABLE['立春'][y], year);
  return new Date(year, 1, 4); // 範圍外近似
}

function isBeforeLichun(year, month, day){
  const lc = getLichunDate(year);
  const bd = new Date(year, month-1, day);
  return bd < lc;
}

function getMonthByJieqi(year, month, day){
  const jieNames = ['小寒','立春','驚蟄','清明','立夏','芒種','小暑','立秋','白露','寒露','立冬','大雪'];
  const jieBranches = ['丑','寅','卯','辰','巳','午','未','申','酉','戌','亥','子'];
  const jieMonthNums = [12,1,2,3,4,5,6,7,8,9,10,11];
  
  const bd = new Date(year, month-1, day);
  let dates = [];
  
  // 前一年大雪
  const ys = String(year-1);
  if(JIEQI_TABLE['大雪'][ys]){
    dates.push({name:'大雪',date:parseJieqiDate(JIEQI_TABLE['大雪'][ys],year-1),branch:'子',monthNum:11});
  }
  
  const yStr = String(year);
  for(let i=0;i<jieNames.length;i++){
    const jie = jieNames[i];
    if(JIEQI_TABLE[jie] && JIEQI_TABLE[jie][yStr]){
      dates.push({name:jie, date:parseJieqiDate(JIEQI_TABLE[jie][yStr],year), branch:jieBranches[i], monthNum:jieMonthNums[i]});
    }
  }
  
  let result = {branch:'丑', monthNum:12, name:'小寒'};
  for(let i=dates.length-1;i>=0;i--){
    if(bd >= dates[i].date){ result = dates[i]; break; }
  }
  
  if(dates.length===0) return getMonthByApprox(month, day);
  return result;
}

function getMonthByApprox(month, day){
  const approx = [
    {m:1,d:5,branch:'丑',monthNum:12,name:'小寒'},
    {m:2,d:4,branch:'寅',monthNum:1,name:'立春'},
    {m:3,d:6,branch:'卯',monthNum:2,name:'驚蟄'},
    {m:4,d:5,branch:'辰',monthNum:3,name:'清明'},
    {m:5,d:6,branch:'巳',monthNum:4,name:'立夏'},
    {m:6,d:6,branch:'午',monthNum:5,name:'芒種'},
    {m:7,d:7,branch:'未',monthNum:6,name:'小暑'},
    {m:8,d:7,branch:'申',monthNum:7,name:'立秋'},
    {m:9,d:8,branch:'酉',monthNum:8,name:'白露'},
    {m:10,d:8,branch:'戌',monthNum:9,name:'寒露'},
    {m:11,d:7,branch:'亥',monthNum:10,name:'立冬'},
    {m:12,d:7,branch:'子',monthNum:11,name:'大雪'}
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
  if('寅卯辰'.includes(monthBranch)) return '春';
  if('巳午未'.includes(monthBranch)) return '夏';
  if('申酉戌'.includes(monthBranch)) return '秋';
  return '冬';
}

function getElementColor(element){
  return {'木':'var(--wood)','火':'var(--fire)','土':'var(--earth)','金':'var(--metal)','水':'var(--water)'}[element]||'var(--text)';
}

function getNayinElement(nayin){
  if(nayin.includes('金')) return '金';
  if(nayin.includes('木')) return '木';
  if(nayin.includes('水')) return '水';
  if(nayin.includes('火')) return '火';
  if(nayin.includes('土')) return '土';
  return '';
}

// ── 計算日柱 ──
function getDayPillarIndex(year, month, day){
  // 優先使用任紅岩年數法 (規格庫提供 2010-2030)
  let yearNum;
  if(month <= 2){
    yearNum = YEAR_NUMBERS[year-1]; // 1月2月使用上一年年數
  } else {
    yearNum = YEAR_NUMBERS[year];
  }
  
  if(yearNum !== undefined){
    const monthNum = MONTH_NUMBERS[month];
    let idx = yearNum + monthNum + day;
    while(idx > 60) idx -= 60;
    if(idx <= 0) idx += 60;
    return idx;
  }
  
  // 範圍外使用 JDN 日柱推算法（已校準）
  return getDayPillarByJDN(year, month, day);
}

function getDayPillarByJDN(y,m,d){
  const jdn = gregorianToJDN(y,m,d);
  // 使用校準基準: 2026-01-01 = 乙酉 idx=22
  let idx = ((jdn - CALIBRATION_JDN + CALIBRATION_IDX - 1) % 60) + 1;
  if(idx <= 0) idx += 60;
  return idx;
}

// ══════════════════════════════════════
//  MAIN CALCULATION
// ══════════════════════════════════════
function calculateBaziEngine(inputYear, inputMonth, inputDay, inputHour, inputGender){
  const year = parseInt(inputYear);
  const month = parseInt(inputMonth);
  const day = parseInt(inputDay);
  let hour = parseInt(inputHour);
  const minute = parseInt(document.getElementById('birthMinute').value);
  const gender = inputGender;
  
  if(isNaN(year)||isNaN(month)||isNaN(day)||isNaN(hour)){alert('請填入完整出生資料');return}
  
  // === 子時規則：23:00-00:59歸屬明日 ===
  let calcYear = year, calcMonth = month, calcDay = day;
  if(hour >= 23){
    // 歸屬明日
    const nextDay = new Date(year, month-1, day+1);
    calcYear = nextDay.getFullYear();
    calcMonth = nextDay.getMonth()+1;
    calcDay = nextDay.getDate();
  }
  
  // ═══ 年柱 ═══
  // 立春前屬上一年
  let yearForPillar = calcYear;
  if(isBeforeLichun(calcYear, calcMonth, calcDay)){
    yearForPillar = calcYear - 1;
  }
  const yearStemIdx = (yearForPillar - 4) % 10;
  const yearBranchIdx = (yearForPillar - 4) % 12;
  const yearStem = STEMS[yearStemIdx >= 0 ? yearStemIdx : yearStemIdx+10];
  const yearBranch = BRANCHES[yearBranchIdx >= 0 ? yearBranchIdx : yearBranchIdx+12];
  
  // ═══ 月柱 ═══
  const monthInfo = getMonthByJieqi(calcYear, calcMonth, calcDay);
  const monthBranch = monthInfo.branch;
  const monthBranchIdx = BRANCHES.indexOf(monthBranch);
  // 五虎遁月: 年干→月干起點
  const monthStemStart = getMonthStemStart(STEMS.indexOf(yearStem));
  // 月干 = 起始天干 + (月支索引 - 寅支索引) 
  const yinIdx = 2; // 寅 index in BRANCHES
  const monthOffset = (monthBranchIdx - yinIdx + 12) % 12;
  const monthStemIdx = (monthStemStart + monthOffset) % 10;
  const monthStem = STEMS[monthStemIdx];
  
  // ═══ 日柱 ═══
  let dayIdx = getDayPillarIndex(calcYear, calcMonth, calcDay);
  const dayStem = STEMS[(dayIdx-1)%10];
  const dayBranch = BRANCHES[(dayIdx-1)%12];
  
  // ═══ 時柱 ═══
  const hourBranchIdx = getHourBranch(hour);
  const hourBranch = BRANCHES[hourBranchIdx];
  const hourStemStart = getHourStemStart(STEMS.indexOf(dayStem));
  const hourStemIdx = (hourStemStart + hourBranchIdx) % 10;
  const hourStem = STEMS[hourStemIdx];
  
  // ═══ 納音 ═══
  // getJiaziIdx() 已在全域定義
  const yearNayin = SIXTY_JIAZI[getJiaziIdx(yearStem,yearBranch)].nayin;
  const monthNayin = SIXTY_JIAZI[getJiaziIdx(monthStem,monthBranch)].nayin;
  const dayNayin = SIXTY_JIAZI[getJiaziIdx(dayStem,dayBranch)].nayin;
  const hourNayin = SIXTY_JIAZI[getJiaziIdx(hourStem,hourBranch)].nayin;
  
  // ═══ 日主 ═══
  const dayMaster = dayStem;
  const dayMasterElement = STEM_ELEMENT[dayMaster];
  const season = getSeason(monthBranch);
  
  // ═══ 五行統計 ═══
  let wuxingCount = {'木':0,'火':0,'土':0,'金':0,'水':0};
  // 天干五行
  [yearStem,monthStem,dayStem,hourStem].forEach(s=>{wuxingCount[STEM_ELEMENT[s]]++});
  // 地支五行
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{wuxingCount[BRANCH_ELEMENT[b]]++});
  // 藏干五行
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{
    HIDDEN_STEMS[b].forEach(s=>{wuxingCount[STEM_ELEMENT[s]]+=0.5});
  });
  
  // ═══ 旺衰 ═══
  const wangxiang = WANGXIANG[season];
  const dayMasterState = wangxiang ? wangxiang[dayMasterElement] : '休';
  
  // 日主力量分析
  let dayMasterStrength = 0;
  const stateScore = {'旺':100,'相':75,'休':50,'囚':25,'死':10};
  dayMasterStrength = stateScore[dayMasterState] || 50;
  // 計算比劫和印星數量
  let helpCount = 0, drainCount = 0;
  [yearStem,monthStem,hourStem].forEach(s=>{
    const ss = getShiShen(dayMaster, s);
    if(['比肩','劫財','正印','偏印'].includes(ss)) helpCount++;
    else drainCount++;
  });
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{
    const bEl = BRANCH_ELEMENT[b];
    if(bEl===dayMasterElement || WUXING_SHENG[bEl]===dayMasterElement) helpCount++;
    else drainCount++;
  });
  
  let strengthLabel, strengthDesc;
  if(dayMasterStrength >= 75 && helpCount >= drainCount){
    strengthLabel = '日主偏強';
    strengthDesc = '日主得令且助力多，宜用財官食傷洩耗';
  } else if(dayMasterStrength >= 75){
    strengthLabel = '日主中強';
    strengthDesc = '日主得令但洩耗亦多，格局趨於平衡';
  } else if(dayMasterStrength <= 25 && helpCount < drainCount){
    strengthLabel = '日主偏弱';
    strengthDesc = '日主失令且無助，宜用印比生扶';
  } else if(dayMasterStrength <= 25){
    strengthLabel = '日主弱';
    strengthDesc = '日主失令，需印星生扶或比劫助力';
  } else {
    strengthLabel = '日主中和';
    strengthDesc = '日主不強不弱，取用神需細看格局';
  }
  
  // ═══ 十神 ═══
  const yearShiShen = getShiShen(dayMaster, yearStem);
  const monthShiShen = getShiShen(dayMaster, monthStem);
  const dayShiShen = '日主';
  const hourShiShen = getShiShen(dayMaster, hourStem);
  
  // ═══ 調候 ═══
  const tiaohouAdvice = TIAOHUO[dayMaster] ? TIAOHUO[dayMaster][season] : '無資料';
  
  // ═══ 沖合刑害 ═══
  const allBranches = [
    {name:'年支',branch:yearBranch},
    {name:'月支',branch:monthBranch},
    {name:'日支',branch:dayBranch},
    {name:'時支',branch:hourBranch}
  ];
  let relationships = [];
  
  // 六沖
  for(let i=0;i<allBranches.length;i++){
    for(let j=i+1;j<allBranches.length;j++){
      if(LIU_CHONG[allBranches[i].branch]===allBranches[j].branch){
        relationships.push({type:'chong',label:`${allBranches[i].name}${allBranches[i].branch} 沖 ${allBranches[j].name}${allBranches[j].branch}`});
      }
    }
  }
  // 六合
  for(const [a,b] of LIU_HE){
    for(let i=0;i<allBranches.length;i++){
      for(let j=i+1;j<allBranches.length;j++){
        if((allBranches[i].branch===a && allBranches[j].branch===b)||(allBranches[i].branch===b && allBranches[j].branch===a)){
          relationships.push({type:'he',label:`${allBranches[i].name}${allBranches[i].branch} 合 ${allBranches[j].name}${allBranches[j].branch}`});
        }
      }
    }
  }
  // 三合
  for(const triple of SAN_HE){
    const bs = allBranches.map(x=>x.branch);
    const count = [triple[0],triple[1],triple[2]].filter(t=>bs.includes(t)).length;
    if(count>=3) relationships.push({type:'he',label:`三合${triple[3]}：${triple[0]}${triple[1]}${triple[2]}`});
    else if(count===2){
      const found = [triple[0],triple[1],triple[2]].filter(t=>bs.includes(t));
      relationships.push({type:'he',label:`半合：${found.join('')}（趨${triple[3]}）`});
    }
  }
  // 三刑
  for(const [xingType, pairs] of Object.entries(SAN_XING)){
    if(xingType==='自刑'){
      const bs = allBranches.map(x=>x.branch);
      pairs.forEach(p=>{
        const cnt = bs.filter(b=>b===p).length;
        if(cnt>=2) relationships.push({type:'xing',label:`自刑：${p}見${p}`});
      });
    } else {
      for(const [a,b] of pairs){
        for(let i=0;i<allBranches.length;i++){
          for(let j=i+1;j<allBranches.length;j++){
            if((allBranches[i].branch===a&&allBranches[j].branch===b)||(allBranches[i].branch===b&&allBranches[j].branch===a)){
              relationships.push({type:'xing',label:`${xingType}：${allBranches[i].branch}刑${allBranches[j].branch}`});
            }
          }
        }
      }
    }
  }
  // 六害
  for(const [a,b] of LIU_HAI){
    for(let i=0;i<allBranches.length;i++){
      for(let j=i+1;j<allBranches.length;j++){
        if((allBranches[i].branch===a&&allBranches[j].branch===b)||(allBranches[i].branch===b&&allBranches[j].branch===a)){
          relationships.push({type:'hai',label:`${allBranches[i].name}${allBranches[i].branch} 害 ${allBranches[j].name}${allBranches[j].branch}`});
        }
      }
    }
  }
  
  // ═══ 空亡 ═══
  const xunKong = getXunKong(dayIdx);
  
  // ═══ 渲染 ═══
  document.getElementById('result').style.display='block';
  
  // Basic Info
  const zodiac = ZODIAC[yearBranch]||'';
  const zodiacEmoji = {'鼠':'🐭','牛':'🐂','虎':'🐯','兔':'🐰','龍':'🐲','蛇':'🐍','馬':'🐴','羊':'🐑','猴':'🐵','雞':'🐔','狗':'🐶','豬':'🐷'}[zodiac]||'';
  
  document.getElementById('basicInfo').innerHTML = `
    <div class="sh">
      <h3>${gender==='male'?'乾造（男命）':'坤造（女命）'} · ${year}年${month}月${day}日 ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}</h3>
      <span class="badge">${zodiacEmoji} ${zodiac}年</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--dim)">
      <span>日主：<strong style="color:${getElementColor(dayMasterElement)};font-size:16px">${dayMaster}</strong>（${STEM_ALIAS[dayMaster]}·${dayMasterElement}）</span>
      <span>月令：${monthBranch}月（${monthInfo.name}後）</span>
      <span>季節：${season}</span>
      <span>日主狀態：<strong style="color:${dayMasterState==='旺'||dayMasterState==='相'?'var(--green)':'var(--red)'}">${dayMasterState}</strong></span>
      <span>生肖：${zodiacEmoji} ${zodiac}（以立春為界）</span>
      <span>空亡：${xunKong.join('、')}</span>
    </div>`;
  
  // Four Pillars
  const pillars = [
    {label:'年柱',stem:yearStem,branch:yearBranch,nayin:yearNayin,shishen:yearShiShen},
    {label:'月柱',stem:monthStem,branch:monthBranch,nayin:monthNayin,shishen:monthShiShen},
    {label:'日柱',stem:dayStem,branch:dayBranch,nayin:dayNayin,shishen:dayShiShen},
    {label:'時柱',stem:hourStem,branch:hourBranch,nayin:hourNayin,shishen:hourShiShen}
  ];
  
  document.getElementById('pillarsGrid').innerHTML = pillars.map(p=>{
    const stemEl = STEM_ELEMENT[p.stem];
    const branchEl = BRANCH_ELEMENT[p.branch];
    const hidden = HIDDEN_STEMS[p.branch];
    const hiddenShiShen = hidden.map(h=>{
      const ss = p.label==='日柱' && h===dayStem ? '日主' : getShiShen(dayMaster, h);
      return `<span class="pillar-shishen" style="border-color:${getElementColor(STEM_ELEMENT[h])}40;color:${getElementColor(STEM_ELEMENT[h])};font-size:9px">${h}${ss?'·'+ss:''}</span>`;
    }).join('');
    
    const shishenColor = {'比肩':'var(--accent)','劫財':'var(--accent)','食神':'var(--wood)','傷官':'var(--wood)',
      '偏財':'var(--earth)','正財':'var(--earth)','七殺':'var(--fire)','正官':'var(--fire)',
      '偏印':'var(--water)','正印':'var(--water)','日主':'var(--gold)'}[p.shishen]||'var(--text)';
    
    return `<div class="pillar-card">
      <div class="pillar-label">${p.label}</div>
      <div class="pillar-shishen" style="border-color:${shishenColor}40;color:${shishenColor};margin-bottom:8px">${p.shishen}</div>
      <div class="pillar-stem element-${stemEl}" style="color:${getElementColor(stemEl)}">${p.stem}</div>
      <div class="pillar-branch element-${branchEl}" style="color:${getElementColor(branchEl)}">${p.branch}</div>
      <div class="pillar-nayin">${p.nayin}</div>
      <div style="font-family:var(--mono);font-size:9px;color:var(--dim);margin-bottom:4px">藏干</div>
      <div>${hiddenShiShen}</div>
    </div>`;
  }).join('');
  
  // 五行統計
  const maxWx = Math.max(...Object.values(wuxingCount), 1);
  const wxEmoji = {'木':'🌿','火':'🔥','土':'⛰️','金':'⚔️','水':'💧'};
  document.getElementById('wuxingGrid').innerHTML = ['木','火','土','金','水'].map(el=>{
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
      <h4>☯ 日主強弱分析</h4>
      <div class="analysis-item ${dayMasterStrength>=50?'good':'warn'}">
        <strong>${strengthLabel}</strong><br>
        <span style="color:var(--dim)">${strengthDesc}</span>
      </div>
      <div class="analysis-item">
        日主 ${dayMaster}（${STEM_ALIAS[dayMaster]}）在${season}季${monthBranch}月為「<strong style="color:${dayMasterState==='旺'||dayMasterState==='相'?'var(--green)':'var(--red)'}">${dayMasterState}</strong>」
      </div>
      <div class="analysis-item">
        助身力量：${helpCount} · 耗洩力量：${drainCount}
      </div>
    </div>
    
    <div class="analysis-card">
      <h4>🌡️ 調候用神</h4>
      <div class="analysis-item gold">
        <strong>${dayMaster}日主 · ${season}季調候</strong><br>
        <span style="color:var(--dim)">${tiaohouAdvice}</span>
      </div>
    </div>
    
    <div class="analysis-card">
      <h4>🎵 納音五行</h4>
      <div class="analysis-item">
        年柱：<strong style="color:${getElementColor(getNayinElement(yearNayin))}">${yearNayin}</strong>（${getNayinElement(yearNayin)}）
      </div>
      <div class="analysis-item">
        月柱：<strong style="color:${getElementColor(getNayinElement(monthNayin))}">${monthNayin}</strong>（${getNayinElement(monthNayin)}）
      </div>
      <div class="analysis-item">
        日柱：<strong style="color:${getElementColor(getNayinElement(dayNayin))}">${dayNayin}</strong>（${getNayinElement(dayNayin)}）· 日主本命納音
      </div>
      <div class="analysis-item">
        時柱：<strong style="color:${getElementColor(getNayinElement(hourNayin))}">${hourNayin}</strong>（${getNayinElement(hourNayin)}）
      </div>
    </div>
    
    <div class="analysis-card">
      <h4>🔄 旺相休囚死</h4>
      ${wangxiang ? Object.entries(wangxiang).map(([el,state])=>{
        const stateColors = {'旺':'var(--green)','相':'var(--accent)','休':'var(--dim)','囚':'var(--orange)','死':'var(--red)'};
        const isDay = el===dayMasterElement;
        return `<div class="analysis-item ${isDay?'good':''}">
          <span style="color:${getElementColor(el)}">${el}</span>：
          <strong style="color:${stateColors[state]}">${state}</strong>
          ${isDay?'← 日主':''}
        </div>`;
      }).join('') : '<div class="analysis-item">無資料</div>'}
    </div>`;
  
  // 沖合刑害
  if(relationships.length > 0){
    document.getElementById('chongHePanel').innerHTML = `
      <div class="sh">
        <h3>沖合刑害關係</h3>
        <span class="badge">地支互動</span>
      </div>
      <div class="chong-tags">
        ${relationships.map(r=>`<span class="chong-tag ${r.type}">${r.label}</span>`).join('')}
      </div>`;
    document.getElementById('chongHePanel').style.display='block';
  } else {
    document.getElementById('chongHePanel').innerHTML = `
      <div class="sh">
        <h3>沖合刑害關係</h3>
        <span class="badge">地支互動</span>
      </div>
      <div style="font-size:12px;color:var(--dim)">四柱地支間無明顯沖合刑害關係</div>`;
    document.getElementById('chongHePanel').style.display='block';
  }
  
  // Animate
  gsap.from('#result', {opacity:0, y:30, duration:0.8, ease:'power3.out'});
  gsap.from('.pillar-card', {opacity:0, y:40, stagger:0.15, duration:0.7, ease:'back.out(1.7)', delay:0.2});
  gsap.from('.wx-item', {opacity:0, scale:0.8, stagger:0.1, duration:0.5, ease:'power2.out', delay:0.6});
  gsap.from('.analysis-card', {opacity:0, y:20, stagger:0.1, duration:0.5, ease:'power2.out', delay:0.9});
  
  // ═══ 五行缺失/過旺提示 ═══
  const alertEl = document.getElementById('wuxingAlert');
  let alertsHtml = '';
  const missing = ['木','火','土','金','水'].filter(e=>wuxingCount[e]===0);
  const excess = ['木','火','土','金','水'].filter(e=>wuxingCount[e]>=6);
  if(missing.length>0){
    alertsHtml += `<div class="wx-alert danger">
      <span class="wx-alert-icon">⚠️</span>
      <div>命局<strong>缺${missing.join('、')}</strong>！五行不全，${missing.map(e=>{
        const tips={'木':'宜取木名、居東方、穿青綠色','火':'宜取火名、居南方、穿紅色','土':'宜居中央、穿黃棕色','金':'宜取金名、居西方、穿白色','水':'宜取水名、居北方、穿黑藍色'};
        return tips[e];
      }).join('；')}</div>
    </div>`;
  }
  if(excess.length>0){
    alertsHtml += `<div class="wx-alert">
      <span class="wx-alert-icon">💡</span>
      <div>${excess.map(e=>`<strong style="color:${getElementColor(e)}">${e}</strong>行過旺（${wuxingCount[e]}）`).join('，')}，宜洩不宜剋</div>
    </div>`;
  }
  alertEl.innerHTML = alertsHtml;
  
  // ═══ 十神總覽 ═══
  const ssAll = {};
  const ssNames = ['比肩','劫財','食神','傷官','偏財','正財','七殺','正官','偏印','正印'];
  ssNames.forEach(n=>ssAll[n]=0);
  // 天干十神
  [yearStem,monthStem,hourStem].forEach(s=>{
    const ss = getShiShen(dayMaster,s);
    if(ss && ssAll[ss]!==undefined) ssAll[ss]++;
  });
  // 藏干十神
  [yearBranch,monthBranch,dayBranch,hourBranch].forEach(b=>{
    HIDDEN_STEMS[b].forEach(h=>{
      const ss = getShiShen(dayMaster,h);
      if(ss && ssAll[ss]!==undefined) ssAll[ss]+=0.5;
    });
  });
  const ssCatColor = {'比肩':'var(--accent)','劫財':'var(--accent)','食神':'var(--wood)','傷官':'var(--wood)',
    '偏財':'var(--earth)','正財':'var(--earth)','七殺':'var(--fire)','正官':'var(--fire)',
    '偏印':'var(--water)','正印':'var(--water)'};
  const ssCatName = {'比肩':'比劫','劫財':'比劫','食神':'食傷','傷官':'食傷',
    '偏財':'財星','正財':'財星','七殺':'官殺','正官':'官殺','偏印':'印星','正印':'印星'};
  document.getElementById('ssGrid').innerHTML = ssNames.map(n=>{
    const c = ssAll[n];
    return `<div class="ss-cell">
      <div class="ss-name" style="color:${ssCatColor[n]}">${n}</div>
      <div class="ss-count" style="color:${c>0?ssCatColor[n]:'var(--dim)'}">${c}</div>
      <div class="ss-cat">${ssCatName[n]}</div>
    </div>`;
  }).join('');
  
  // ═══ 大運排盤 ═══
  const dayunPanel = document.getElementById('dayunPanel');
  const dayunTrack = document.getElementById('dayunTrack');
  // 大運起運：男命陽年順排、女命陽年逆排；男命陰年逆排、女命陰年順排
  const yearStemYY = STEM_YINYANG[yearStem];
  const isYangYear = yearStemYY === '陽';
  const isMale = gender === 'male';
  const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);
  
  // 起運歲數（簡化：約3歲一步近似）
  // 精確計算需要出生日到下一個節/上一個節的天數÷3，這裡用節氣近似
  let startAge = 3; // 簡化近似
  const monthJieDate = getMonthByJieqi(calcYear, calcMonth, calcDay);
  // 近似：距離下一節或上一節天數÷3
  const bdDate = new Date(year, month-1, day);
  let daysToJie = 0;
  const yStr2 = String(calcYear);
  const jieOrder2 = ['小寒','立春','驚蟄','清明','立夏','芒種','小暑','立秋','白露','寒露','立冬','大雪'];
  if(isForward){
    // 順行：找下一個節
    for(const jn of jieOrder2){
      if(JIEQI_TABLE[jn] && JIEQI_TABLE[jn][yStr2]){
        const jd = parseJieqiDate(JIEQI_TABLE[jn][yStr2], calcYear);
        if(jd > bdDate){ daysToJie = Math.ceil((jd-bdDate)/(86400000)); break; }
      }
    }
  } else {
    // 逆行：找上一個節
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
  
  // 排10步大運
  let dayunSteps = [];
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
      <div class="dy-age">${d.ageStart}-${d.ageEnd}歲</div>
      <div class="dy-gz"><span style="color:${getElementColor(stemEl)}">${d.stem}</span><span style="color:${getElementColor(branchEl)}">${d.branch}</span></div>
      <div class="dy-nayin">${d.nayin}</div>
      <div class="dy-el" style="color:var(--dim)">${d.dyYearStart}-${d.dyYearEnd}</div>
      <div class="dy-ss" style="border-color:${ssCol}40;color:${ssCol}">${d.ss}</div>
      ${i<9?'<div class="dayun-connector"></div>':''}
    </div>`;
  }).join('');
  dayunPanel.style.display = 'block';
  document.getElementById('dayunBadge').textContent = `${isForward?'順行':'逆行'} · 起運${startAge}歲`;
  
  gsap.from('.dayun-step', {opacity:0, y:15, stagger:0.08, duration:0.4, ease:'power2.out', delay:0.7});
  gsap.from('.ss-cell', {opacity:0, scale:0.9, stagger:0.05, duration:0.3, ease:'power2.out', delay:0.8});
  
  // Scroll to result
  setTimeout(()=>{
    document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
  }, 200);
}

// ── 納音查找輔助（用於大運） ──
function getJiaziIdx(stem, branch){
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  for(let i=0;i<60;i++){
    if(i%10===si && i%12===bi) return i;
  }
  return 0;
}

// ── 空亡計算 ──
function getXunKong(dayIdx){
  // dayIdx is 1-60 (六十甲子)
  const idx = dayIdx - 1; // 0-based
  const xunStart = idx - (idx % 10); // 該旬起始
  // 旬空 = 10天干配完後剩下的2個地支
  const startBranch = xunStart % 12;
  const kong1 = (startBranch + 10) % 12;
  const kong2 = (startBranch + 11) % 12;
  return [BRANCHES[kong1], BRANCHES[kong2]];
}

// ── 當前節氣顯示 ──
function showCurrentJieqi(){
  const now = new Date();
  const y = now.getFullYear();
  const yStr = String(y);
  const jieqiOrder = ['小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種','夏至','小暑','大暑','立秋','處暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
  
  let currentJieqi = '';
  let nextJieqi = '';
  let nextDate = '';
  
  if(JIEQI_TABLE['小寒'][yStr]){
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
    currentJieqi = lastJieqi || '冬至';
  }
  
  const el = document.getElementById('jieqiNow');
  if(el && currentJieqi){
    el.textContent = `當前節氣：${currentJieqi}${nextJieqi?` → ${nextJieqi}（${nextDate}）`:''}`;
  }
}

// ══════════════════════════════════════
//  BOOT ANIMATION
// ══════════════════════════════════════
(function(){
  const steps = [
    '載入干支推算系統 ────── ','載入六十甲子納音 ────── ','載入節氣查表引擎 ────── ',
    '載入五行旺衰矩陣 ────── ','載入十神關係矩陣 ────── ','載入調候用神矩陣 ────── ',
    '載入沖合刑害模組 ────── ','初始化靜觀命理引擎 ──── '
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

// ── 頁面載入後自動排範例盤 ──
setTimeout(()=>{
  if(document.getElementById('result').style.display!=='block'){
    calculate();
  }
}, 3200);
