/**
 * 德语账单拆分助手 - 核心逻辑 (归属人版)
 * 支持 DeepSeek / OpenAI 等兼容接口
 */

// ==================== 数据词典 ====================

const CATEGORY_META = {
    meat:   { emoji: '🥩', name: '肉类',      defaultShared: true },
    veg:    { emoji: '🥬', name: '蔬果',      defaultShared: true },
    dairy:  { emoji: '🥛', name: '奶制品',    defaultShared: false },
    bread:  { emoji: '🍞', name: '面包',      defaultShared: false },
    drink:  { emoji: '🥤', name: '饮料',      defaultShared: false },
    snack:  { emoji: '🍪', name: '零食',      defaultShared: false },
    daily:  { emoji: '🧴', name: '日用品',    defaultShared: false },
    other:  { emoji: '📦', name: '其他',      defaultShared: false },
};

const AI_CAT_MAP = {
    '肉类': 'meat', '肉': 'meat', 'meat': 'meat',
    '蔬果': 'veg', '蔬菜': 'veg', '水果': 'veg', '果蔬': 'veg', 'veg': 'veg', 'vegetable': 'veg', 'fruit': 'veg',
    '奶制品': 'dairy', '奶': 'dairy', '乳制品': 'dairy', 'dairy': 'dairy',
    '面包': 'bread', '烘焙': 'bread', 'bread': 'bread',
    '饮料': 'drink', '饮品': 'drink', 'drink': 'drink', 'beverage': 'drink',
    '零食': 'snack', 'snack': 'snack',
    '日用品': 'daily', '日用': 'daily', '洗护': 'daily', 'daily': 'daily',
    '其他': 'other', '其它': 'other', 'other': 'other',
};

const TRANSLATION_DICT = {
    'pf': 'Pfanner', 'pfanner': 'Pfanner',
    'kfree': '无乳糖', 'k-free': '无乳糖', 'laktosefrei': '无乳糖',
    'kpure': '纯', 'kpur': '纯', 'pur': '纯',
    'klc': '炸鸡风味', 'kentucky': '肯德基风味', 'kfc': 'KFC',
    'cremis': '奶油味', 'cremig': '奶油味',
    'ch': '鸡肉', 'h': '鸡', 'hähn': '鸡', 'hähnchen': '鸡',
    'st': '个', 'stück': '个', 'stk': '个',
    'eier': '鸡蛋', 'ei': '鸡蛋',
    'milch': '牛奶', 'h-milch': '常温奶', 'haltbar': '常温',
    'flügel': '鸡翅', 'wing': '鸡翅', 'wings': '鸡翅',
    'keks': '饼干', 'kekse': '饼干',
    'gesalzen': '盐味', 'gesalzene': '盐味',
    'melone': '甜瓜', 'melonen': '甜瓜',
    'mini': '迷你',
    'pak choi': '小白菜', 'pakchoi': '小白菜',
    'super': '超级',
    'hot': '辣',
    'galia': '加利亚',
    'nektarine': '油桃', 'nektarinen': '油桃',
    'rücken': '背肉',
    'wal': '核桃', 'walnuss': '核桃',
    'heid': '蓝莓', 'heidel': '蓝莓', 'heidelbeere': '蓝莓',
    'cremig': '奶油味',
    'lays': '乐事',
    'hot wings': '辣翅',
    'super-sandwich': '超级三明治',
    'schweinerücken': '猪背肉',
    'kfree.h-milch': '无乳糖常温奶', 'kfree h-milch': '无乳糖常温奶',
    'kpure.h.flügel': '纯鸡翅', 'kpure h flügel': '纯鸡翅',
    'kpur.h.flügel': '纯鸡翅', 'kpur h flügel': '纯鸡翅',
    'cremis.walheidkeks': '核桃蓝莓奶油饼干', 'cremis walheidkeks': '核桃蓝莓奶油饼干',
    'klc.ch.hot wings': '炸鸡辣翅',
    'melone galia': '加利亚甜瓜', 'melonen galia': '加利亚甜瓜',
    'mini-pak choi': '迷你小白菜',
    'hähnchenflügel': '鸡翅', 'h-flügel': '鸡翅',
    'rind': '牛肉', 'rindfleisch': '牛肉', 'schwein': '猪肉', 'schweinefleisch': '猪肉',
    'hähnchenbrust': '鸡胸肉', 'hähnchenkeule': '鸡腿',
    'huhn': '鸡', 'pute': '火鸡', 'putebrust': '火鸡胸肉',
    'ente': '鸭', 'lamm': '羊肉', 'kalb': '小牛肉', 'leber': '肝',
    'wurst': '香肠', 'bratwurst': '烤香肠', 'wiener': '维也纳香肠', 'salami': '萨拉米',
    'schinken': '火腿', 'speck': '培根', 'hackfleisch': '肉馅', 'frikadelle': '肉饼',
    'kotelett': '排骨', 'schnitzel': '炸肉排', 'gulasch': '炖牛肉', 'braten': '烤肉',
    'filet': '里脊', 'steak': '牛排',
    'minutensteak': '快煎牛排', 'sülze': '肉冻', 'blutwurst': '血肠', 'leberwurst': '猪肝肠',
    'fisch': '鱼', 'lachs': '三文鱼', 'thunfisch': '金枪鱼', 'garnelen': '虾',
    'fischstäbchen': '鱼条', 'hering': '鲱鱼', 'makrele': '鲭鱼', 'seehecht': '鳕鱼',
    'apfel': '苹果', 'banane': '香蕉', 'orange': '橙子', 'mandarine': '橘子',
    'traube': '葡萄', 'kirsche': '樱桃', 'erdbeere': '草莓', 'himbeere': '覆盆子',
    'blaubeere': '蓝莓', 'brombeere': '黑莓', 'pfirsich': '桃子', 'birne': '梨',
    'melone': '甜瓜', 'wassermelone': '西瓜', 'honigmelone': '哈密瓜', 'zitrone': '柠檬',
    'limette': '青柠', 'avocado': '牛油果', 'mango': '芒果', 'ananas': '菠萝',
    'tomate': '番茄', 'gurke': '黄瓜', 'kartoffel': '土豆', 'zwiebel': '洋葱',
    'knoblauch': '大蒜', 'möhre': '胡萝卜', 'karotte': '胡萝卜', 'salat': '生菜/沙拉',
    'eisberg': '球生菜', 'spinat': '菠菜', 'brokkoli': '西兰花', 'blumenkohl': '花菜',
    'paprika': '彩椒', 'aubergine': '茄子', 'zucchini': '西葫芦', 'kürbis': '南瓜',
    'radieschen': '萝卜', 'lauch': '大葱', 'sellerie': '芹菜', 'fenchel': '茴香',
    'kohl': '卷心菜', 'weißkohl': '白菜', 'rotkohl': '紫甘蓝', 'spitzkohl': '尖卷心菜',
    'pilz': '蘑菇', 'champignon': '口蘑', 'shiitake': '香菇', 'porree': '韭葱',
    'apfelsine': '橙子', 'pflaume': '李子', 'aprikose': '杏', 'feige': '无花果',
    'granatapfel': '石榴', 'kiwi': '猕猴桃', 'limone': '青柠', 'grapefruit': '柚子',
    'obst': '水果', 'gemüse': '蔬菜', 'gemischt': '混合',
    'vollmilch': '全脂牛奶', 'fettarme milch': '低脂牛奶',
    'käse': '奶酪', 'frischkäse': '奶油奶酪', 'mozzarella': '马苏里拉',
    'emmentaler': '埃曼塔尔奶酪', 'gouda': '高达奶酪', 'feta': '菲达奶酪',
    'butterkäse': '黄油奶酪', 'schnittkäse': '切片奶酪', 'streichkäse': '涂抹奶酪',
    'butter': '黄油', 'margarine': '人造黄油', 'sahne': '奶油', 'crème fraîche': '法式酸奶油',
    'joghurt': '酸奶', 'quark': '夸克奶酪', 'pudding': '布丁', 'kaka': '可可奶',
    'milchdrink': '奶饮', 'kefir': '开菲尔', 'buttermilch': '酪乳',
    'sahnequark': '奶油夸克', 'fruchtjoghurt': '果味酸奶', 'trinkjoghurt': '饮用酸奶',
    'schmand': '酸奶油',
    'brot': '面包', 'brötchen': '小面包', 'semmel': '小圆面包', 'baguette': '法棍',
    'croissant': '牛角包', 'toast': '吐司', 'toastbrot': '吐司面包', 'brotscheibe': '面包片',
    'vollkornbrot': '全麦面包', 'roggenbrot': '黑麦面包', 'brezel': '碱水结',
    'kuchen': '蛋糕', 'torte': '挞', 'gebäck': '糕点', 'stollen': '圣诞面包',
    'ciabatta': '夏巴塔', 'fladenbrot': '扁面包', 'pizzateig': '披萨面团',
    'sandwich': '三明治',
    'wasser': '水', 'mineralwasser': '矿泉水', 'stilles wasser': '纯净水',
    'sprudel': '苏打水', 'cola': '可乐', 'fanta': '芬达', 'sprite': '雪碧',
    'saft': '果汁', 'orangensaft': '橙汁', 'apfelsaft': '苹果汁', 'apfelschorle': '苹果气泡水',
    'traubensaft': '葡萄汁', 'ananasssaft': '菠萝汁', 'tomatensaft': '番茄汁',
    'bier': '啤酒', 'pils': '皮尔森啤酒', 'export': '出口啤酒', 'weizen': '小麦啤酒',
    'wein': '葡萄酒', 'rotwein': '红酒', 'weißwein': '白酒', 'sekt': '起泡酒',
    'kaffee': '咖啡', 'tee': '茶', 'kamillentee': '洋甘菊茶', 'pfefferminztee': '薄荷茶',
    'limonade': '柠檬水', 'eistee': '冰茶', 'energy': '能量饮料', 'red bull': '红牛',
    'alkohol': '酒精', 'schnaps': '烈酒', 'likör': '利口酒',
    'milchshake': '奶昔', 'smoothie': '果昔', 'kakao': '可可',
    'schokolade': '巧克力', 'tafel': '板', 'riegel': '棒', 'müsliriegel': '麦片棒',
    'chips': '薯片', 'nuss': '坚果', 'nüsse': '坚果', 'erdnuss': '花生',
    'mandel': '杏仁', 'walnuss': '核桃', 'haselnuss': '榛子', 'cashew': '腰果',
    'butterkeks': '黄油饼干', 'doppelkeks': '夹心饼干',
    'bonbon': '糖果', 'gummibär': '小熊软糖', 'lakritz': '甘草糖', 'schokoriegel': '巧克力棒',
    'eis': '冰淇淋', 'stieleis': '冰棍', 'eiscreme': '冰淇淋',
    'müsli': '麦片', 'cornflakes': '玉米片', 'knuspermüsli': '脆麦片',
    'praline': '夹心巧克力', 'nougat': '牛轧糖', 'karamell': '焦糖',
    'popcorn': '爆米花', 'salzstangen': '盐条饼干',
    'shampoo': '洗发水', 'duschgel': '沐浴露', 'seife': '肥皂', 'zahnpasta': '牙膏',
    'deodorant': '止汗剂', 'deo': '除臭剂', 'rasierer': '剃须刀', 'rasierschaum': '剃须泡沫',
    'taschentuch': '纸巾', 'taschentücher': '纸巾', 'küchenrolle': '厨房纸',
    'toilettenpapier': '卫生纸', 'klopapier': '卫生纸', 'watte': '化妆棉',
    'waschmittel': '洗衣液', 'weichspüler': '柔顺剂', 'spülmittel': '洗洁精',
    'creme': '面霜', 'lotion': '乳液', 'handcreme': '护手霜', 'sonnencreme': '防晒霜',
    'spülung': '护发素', 'zahnbürste': '牙刷', 'zahnseide': '牙线',
    'duschcreme': '沐浴乳', 'gesichtswasser': '爽肤水', 'make-up': '彩妆',
    'tampon': '卫生棉条', 'binde': '卫生巾', 'windel': '尿布',
    'feuchttuch': '湿巾', 'reinigungsmittel': '清洁剂',
    'geschirrspülmittel': '洗碗机清洁剂', 'badreiniger': '浴室清洁剂', 'fensterreiniger': '玻璃清洁剂',
    'nudel': '面条', 'nudeln': '面条', 'pasta': '意面',
    'reis': '米', 'mehl': '面粉', 'zucker': '糖', 'salz': '盐', 'pfeffer': '胡椒',
    'öl': '油', 'olivenöl': '橄榄油', 'essig': '醋', 'sauce': '酱', 'soße': '酱汁',
    'ketchup': '番茄酱', 'mayonnaise': '蛋黄酱', 'senf': '芥末', 'honig': '蜂蜜',
    'marmelade': '果酱', 'nutella': ' Nutella ', 'erdnußbutter': '花生酱',
    'gewürz': '调料', 'gewürze': '调料', 'kräuter': '香草',
    'tiefkühl': '冷冻', 'tiefkühlkost': '冷冻食品', 'fertiggericht': '即食餐',
    'pizza': '披萨', 'pommes': '薯条', 'croquette': '可乐饼',
    'dose': '罐头', 'dosentomate': '番茄罐头', 'dosenmais': '玉米罐头',
    'suppe': '汤', 'instant': '速食', 'brühe': '高汤',
    'konserven': '罐头食品', 'süßigkeit': '甜食', 'süßigkeiten': '糖果',
    'boden': '散养', 'bodenhaltung': '散养',
    'halal': '清真',
    'häagen': '哈根达斯', 'dazs': '达斯',
    'sprehe': 'Sprehe', 'chickenw': '鸡肉',
    'chinakohl': '大白菜', 'möhren': '胡萝卜', 'paprika': '彩椒',
    'heidelbeeren': '蓝莓', 'bananen': '香蕉', 'mandarinen': '橘子',
    'grün': '绿色',
};

const CATEGORY_KEYWORDS = {
    meat: ['rind','schwein','hähnchen','huhn','pute','ente','lamm','kalb','leber','wurst','bratwurst','wiener','salami','schinken','speck','hack','frikadelle','kotelett','schnitzel','gulasch','braten','fisch','lachs','thunfisch','garnelen','fischstäbchen','hering','makrele','seehecht','filet','steak','minuten','sülze','blutwurst','leberwurst','flügel','wing','wings','hähnchenflügel','rücken','schweinerücken','kfc','chickenw'],
    veg:  ['apfel','banane','orange','mandarine','traube','kirsche','erdbeere','himbeere','blaubeere','brombeere','pfirsich','birne','melone','wassermelone','honigmelone','zitrone','limette','avocado','mango','ananas','tomate','gurke','kartoffel','zwiebel','knoblauch','möhre','karotte','salat','eisberg','spinat','brokkoli','blumenkohl','paprika','aubergine','zucchini','kürbis','radieschen','lauch','sellerie','fenchel','kohl','weißkohl','rotkohl','spitzkohl','pilz','champignon','shiitake','porree','apfelsine','pflaume','aprikose','feige','granatapfel','kiwi','limone','grapefruit','obst','gemüse','bananen','äpfel','tomaten','gurken','kartoffeln','zwiebeln','karotten','salatkopf','kräuter','basilikum','petersilie','dill','schnittlauch','thymian','rosmarin','nektarine','nektarinen','pak choi','pakchoi','choi','galia','melone galia','melonen galia','chinakohl','möhren','paprika','heidelbeeren','bananen','mandarinen'],
    dairy:['milch','vollmilch','fettarm','käse','frischkäse','mozzarella','emmentaler','gouda','feta','butterkäse','schnittkäse','streichkäse','butter','margarine','sahne','crème','joghurt','quark','pudding','kaka','milchdrink','kefir','buttermilch','sahnequark','fruchtjoghurt','trinkjoghurt','schmand','h-milch','häagen','dazs'],
    bread:['brot','brötchen','semmel','baguette','croissant','toast','toastbrot','brotscheibe','vollkornbrot','roggenbrot','brezel','kuchen','torte','gebäck','stollen','ciabatta','fladenbrot','pizzateig','sandwich','super-sandwich'],
    drink:['wasser','mineralwasser','stilles','sprudel','cola','fanta','sprite','saft','orangensaft','apfelsaft','apfelschorle','traubensaft','ananasssaft','tomatensaft','bier','pils','export','weizen','wein','rotwein','weißwein','sekt','kaffee','tee','kamillentee','pfefferminztee','limonade','eistee','energy','red bull','alkohol','schnaps','likör','milchshake','smoothie','kakao','pfirsich','eistee'],
    snack:['schokolade','tafel','riegel','müsliriegel','chips','nuss','nüsse','erdnuss','mandel','walnuss','haselnuss','cashew','keks','kekse','butterkeks','doppelkeks','bonbon','gummibär','lakritz','schokoriegel','eis','stieleis','eiscreme','müsli','cornflakes','knuspermüsli','praline','nougat','karamell','popcorn','salzstangen','lays','gesalzen','wal','heid','walnuss','heidelbeere','häagen','dazs'],
    daily:['shampoo','duschgel','seife','zahnpasta','deodorant','deo','rasierer','rasierschaum','taschentuch','taschentücher','küchenrolle','toilettenpapier','klopapier','watte','waschmittel','weichspüler','spülmittel','creme','lotion','handcreme','sonnencreme','spülung','zahnbürste','zahnseide','duschcreme','gesichtswasser','make-up','tampon','binde','windel','feuchttuch','reinigungsmittel','geschirrspülmittel','badreiniger','fensterreiniger'],
};

const SKIP_PATTERNS = [
    /\b(REWE|ALDI|LIDL|EDEKA|PENNY|NETTO|KAUFLAND|DM|ROSSMANN|MÜLLER|BIO|MARKT)\b/i,
    /\b(SUMME|TOTAL|GESAMT|ZWISCHENSUMME|SUBTOTAL)\b/i,
    /\b(MWST|UST|STEUER|VAT|ST\.|STEUER %)\b/i,
    /\b(BAR|EC-CASH|KREDITKARTE|KARTE|GUTSCHEIN|PAYBACK|COUPON|KARTENZAHLUNG)\b/i,
    /\b(RÜCKGELD|WECHSELGELD|GEBEN|BEKOMMEN)\b/i,
    /\b(BON|BON-NR|BELEG|KASSENBON|RECHNUNG|QUITTUNG|KUNDENBELEG)\b/i,
    /\b(USt-Id|ST-NR|STEUERNUMMER|HANDELSREGISTER|TERMINAL|TA-NR|BNR)\b/i,
    /\b(BEDIENT|VERKÄUFER|KASSE|SCHALTER|FILIALE)\b/i,
    /\b(DANKE|VIELEN DANK|AUF WIEDERSEHEN|TSCHÜSS)\b/i,
    /\b(BRUTTO|NETTO|STEUER)\b/i,
    /\b(SPAREN|RABATT|ANGEBOT|AKTION|PROZENT|COUPON|GUTSCHEIN)\b/i, // 促销信息
    /\b(SIE SPAREN|STRECKEN|DISCOUNT|%)\b/i,
    /\b(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})\b/,
    /\b(\d{1,2}:\d{2})\b/,
    /\b(EUR|€)\b.*\b(SUMME|GESAMT)\b/i,
    /\b(xxxx\d+)\b/i,
    /\b(DE\s*\d+)\b/i,
    /^\s*[AB]\s+\d+[,.]\d+%/,
    /^\s*\d+\s*$/,
    /^\s*$/,
];

// ==================== 状态 ====================

let items = []; // { id, original, translated, category, price, owner }
let nextId = 1;

// ==================== DOM 引用 ====================

const els = {
    uploadBox:      document.getElementById('uploadBox'),
    fileInput:      document.getElementById('fileInput'),
    progressSection:document.getElementById('progressSection'),
    progressFill:   document.getElementById('progressFill'),
    progressText:   document.getElementById('progressText'),
    resultSection:  document.getElementById('resultSection'),
    previewImg:     document.getElementById('previewImg'),
    splitCount:     document.getElementById('splitCount'),
    defaultSplitTags:document.getElementById('defaultSplitTags'),
    itemsBody:      document.getElementById('itemsBody'),
    totalAmount:    document.getElementById('totalAmount'),
    sharedAmount:   document.getElementById('sharedAmount'),
    personAAmount:  document.getElementById('personAAmount'),
    personBAmount:  document.getElementById('personBAmount'),
    addRowBtn:      document.getElementById('addRowBtn'),
    copyBtn:        document.getElementById('copyBtn'),
    exportCsvBtn:   document.getElementById('exportCsvBtn'),
    resetBtn:       document.getElementById('resetBtn'),
    copyBuffer:     document.getElementById('copyBuffer'),
    // AI
    aiSettings:     document.getElementById('aiSettings'),
    aiHeader:       document.getElementById('aiHeader'),
    aiBody:         document.getElementById('aiBody'),
    aiToggleIcon:   document.getElementById('aiToggleIcon'),
    apiKey:         document.getElementById('apiKey'),
    apiBase:        document.getElementById('apiBase'),
    apiBaseCustom:  document.getElementById('apiBaseCustom'),
    apiModel:       document.getElementById('apiModel'),
    autoAiTranslate:document.getElementById('autoAiTranslate'),
    aiTranslateBtn: document.getElementById('aiTranslateBtn'),
    aiStatus:       document.getElementById('aiStatus'),
    // Debug
    debugHeader:    document.getElementById('debugHeader'),
    debugBody:      document.getElementById('debugBody'),
    debugToggleIcon:document.getElementById('debugToggleIcon'),
    debugText:      document.getElementById('debugText'),
};

// ==================== 本地存储 ====================

function loadSettings() {
    els.apiKey.value = localStorage.getItem('grocery_api_key') || '';
    const savedBase = localStorage.getItem('grocery_api_base') || 'https://api.deepseek.com';
    const opt = Array.from(els.apiBase.options).find(o => o.value === savedBase);
    if (opt) els.apiBase.value = savedBase;
    else { els.apiBase.value = 'custom'; els.apiBaseCustom.value = savedBase; els.apiBaseCustom.classList.remove('hidden'); }
    els.apiModel.value = localStorage.getItem('grocery_api_model') || 'deepseek-chat';
    els.autoAiTranslate.checked = localStorage.getItem('grocery_auto_ai') !== 'false';
}

function saveSettings() {
    localStorage.setItem('grocery_api_key', els.apiKey.value);
    const base = els.apiBase.value === 'custom' ? els.apiBaseCustom.value.trim() : els.apiBase.value;
    localStorage.setItem('grocery_api_base', base);
    localStorage.setItem('grocery_api_model', els.apiModel.value.trim());
    localStorage.setItem('grocery_auto_ai', els.autoAiTranslate.checked);
}

// ==================== 事件绑定 ====================

els.uploadBox.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
els.uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); els.uploadBox.classList.add('dragover'); });
els.uploadBox.addEventListener('dragleave', () => els.uploadBox.classList.remove('dragover'));
els.uploadBox.addEventListener('drop', (e) => { e.preventDefault(); els.uploadBox.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
els.splitCount.addEventListener('input', () => { recalcAll(); render(); });
els.defaultSplitTags.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        e.target.classList.toggle('active');
        updateDefaultOwners();
        recalcAll();
        render();
    }
});
els.addRowBtn.addEventListener('click', () => { addItem({ original: '', translated: '', category: 'other', price: 0, owner: '' }); render(); });
els.copyBtn.addEventListener('click', copySummary);
els.exportCsvBtn.addEventListener('click', exportCsv);
els.resetBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有数据吗？')) {
        items = []; nextId = 1;
        els.resultSection.classList.add('hidden');
        els.progressSection.classList.add('hidden');
        els.fileInput.value = '';
    }
});

// AI 面板
els.aiHeader.addEventListener('click', () => {
    els.aiBody.classList.toggle('hidden');
    els.aiSettings?.classList.toggle('expanded');
    const icon = els.aiToggleIcon;
    icon.textContent = icon.textContent === '▶' ? '▼' : '▶';
});
els.apiBase.addEventListener('change', () => {
    if (els.apiBase.value === 'custom') els.apiBaseCustom.classList.remove('hidden');
    else els.apiBaseCustom.classList.add('hidden');
});
[els.apiKey, els.apiBase, els.apiBaseCustom, els.apiModel, els.autoAiTranslate].forEach(el => el.addEventListener('change', saveSettings));
els.aiTranslateBtn.addEventListener('click', () => { if (items.length === 0) { alert('请先上传账单'); return; } runAiTranslate(items); });

// 调试区
els.debugHeader.addEventListener('click', () => {
    els.debugBody.classList.toggle('hidden');
    const icon = els.debugToggleIcon;
    icon.textContent = icon.textContent === '▶' ? '▼' : '▶';
});

// ==================== 核心逻辑 ====================

function handleFiles(files) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) { alert('请上传图片文件'); return; }
    const url = URL.createObjectURL(file);
    els.previewImg.src = url;
    els.resultSection.classList.add('hidden');
    els.progressSection.classList.remove('hidden');
    els.progressFill.style.width = '0%';
    els.progressText.textContent = '正在初始化 OCR 引擎...';
    runOCR(url);
}

async function runOCR(imageUrl) {
    try {
        const result = await Tesseract.recognize(imageUrl, 'deu', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const pct = Math.round(m.progress * 100);
                    els.progressFill.style.width = pct + '%';
                    els.progressText.textContent = `正在识别文字... ${pct}%`;
                }
            }
        });

        els.progressText.textContent = '正在解析账单...';
        els.debugText.value = result.data.text;
        const lines = result.data.text.split('\n');
        const parsed = parseReceipt(lines);

        items = parsed.map(p => ({
            id: nextId++,
            original: p.original,
            translated: translate(p.original),
            category: classify(p.original),
            price: p.price,
            owner: ''
        }));

        updateDefaultOwners();
        recalcAll();

        els.progressSection.classList.add('hidden');
        els.resultSection.classList.remove('hidden');
        render();

        if (els.autoAiTranslate.checked && els.apiKey.value.trim()) {
            await runAiTranslate(items);
        }
    } catch (err) {
        console.error(err);
        els.progressText.textContent = '识别失败：' + err.message;
        els.progressFill.style.width = '100%';
        els.progressFill.style.background = 'var(--danger)';
    }
}

function parseReceipt(lines) {
    const products = [];
    let current = null;
    let pendingName = null;

    function flushCurrent() {
        if (current && current.price != null && current.price > 0) {
            products.push({ original: current.original.trim(), price: current.price });
        }
        current = null;
    }

    function isQuantityLine(text) {
        return /^\d+\s*[\*xX]?\s*\d+[,.]\d{2}\s*$/i.test(text) || /^\d+\s+\d+[,.]\d{2}\s*$/i.test(text);
    }
    function looksLikeQuantity(name) {
        const t = name.trim();
        return /^\d+\s+\d+[,.]\d{2}$/.test(t) || /^\d+\s*[\*xX]\s*\d+[,.]\d{2}$/.test(t);
    }

    for (let rawLine of lines) {
        let line = rawLine.trim();
        if (!line || line.length < 2) continue;
        if (SKIP_PATTERNS.some(p => p.test(line))) { flushCurrent(); pendingName = null; continue; }

        const cleanedLine = line.replace(/\s+[AB]\s*$/i, '').trim();

        if (isQuantityLine(cleanedLine)) {
            if (current && current.price != null) flushCurrent();
            if (current) current.original += ' (' + line + ')';
            else if (pendingName) { current = { original: pendingName + ' (' + line + ')', price: null }; pendingName = null; }
            continue;
        }
        if (/^\d+[,.]\d+\s*kg\s*$/i.test(cleanedLine)) {
            if (current && current.price != null) flushCurrent();
            if (current) current.original += ' (' + line + ')';
            else if (pendingName) { current = { original: pendingName + ' (' + line + ')', price: null }; pendingName = null; }
            continue;
        }

        const priceMatches = [...cleanedLine.matchAll(/(\d+[,.]\d{2})/g)];
        if (priceMatches.length > 0) {
            const lastMatch = priceMatches[priceMatches.length - 1];
            const price = parseFloat(lastMatch[0].replace(',', '.'));
            if (!isNaN(price) && price > 0) {
                let namePart = cleanedLine.substring(0, lastMatch.index).trim();
                namePart = namePart.replace(/\b\d+[,.]?\d*\s*(x|stk|st|kg|g|ml|l)\b/gi, '').trim();
                namePart = namePart.replace(/\s+\d+\s+\d+[,.]\d{2}$/g, '').trim();
                namePart = namePart.replace(/\s+\d+\s*[\*xX]\s*\d+[,.]\d{2}$/g, '').trim();
                namePart = namePart.replace(/[*\-=]/g, ' ').trim();
                namePart = namePart.replace(/\s+/g, ' ');

                if (looksLikeQuantity(namePart)) {
                    const target = current || (pendingName ? { original: pendingName, price: null } : null);
                    if (target) {
                        target.original += ' (' + namePart + ')';
                        target.price = price;
                        current = target;
                        pendingName = null;
                        continue;
                    }
                }

                if (!namePart || namePart.length < 2 || /^\d+$/.test(namePart)) {
                    if (current && current.price == null && current.original) namePart = current.original;
                    else if (pendingName) { namePart = pendingName; pendingName = null; }
                }
                if (namePart && namePart.length >= 2 && !/^\d+$/.test(namePart)) {
                    flushCurrent();
                    current = { original: namePart, price: price };
                }
            }
        } else {
            if (current && current.price != null) flushCurrent();
            if (current) current.original += ' ' + line;
            else pendingName = pendingName ? pendingName + ' ' + line : line;
        }
    }
    flushCurrent();
    if (products.length === 0) alert('未能自动识别出商品，请尝试截图更清晰或手动添加。');
    return products;
}

function similarity(a, b) {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1.0;
    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= longer.length; j++) {
            if (i === 0) costs[j] = j;
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (shorter[i - 1] !== longer[j - 1]) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[longer.length] = lastValue;
    }
    return (longer.length - costs[longer.length]) / longer.length;
}

function translate(german) {
    const lower = german.toLowerCase().trim();
    if (TRANSLATION_DICT[lower]) return TRANSLATION_DICT[lower];
    let processed = lower.replace(/\bh[.\-]milch\b/g, 'h-milch').replace(/\bh[.\-]flügel\b/g, 'hähnchenflügel').replace(/\bch[.\-]hot\b/g, 'chicken-hot');
    if (TRANSLATION_DICT[processed]) return TRANSLATION_DICT[processed];
    const tokens = processed.split(/[^a-zA-ZäöüßÄÖÜ0-9]+/).filter(t => t.length > 0);
    const results = [];
    let i = 0;
    while (i < tokens.length) {
        let found = false;
        for (let len = Math.min(3, tokens.length - i); len >= 1; len--) {
            const p1 = tokens.slice(i, i + len).join(' ');
            const p2 = tokens.slice(i, i + len).join('-');
            const p3 = tokens.slice(i, i + len).join('.');
            if (TRANSLATION_DICT[p1]) { results.push(TRANSLATION_DICT[p1]); i += len; found = true; break; }
            if (TRANSLATION_DICT[p2]) { results.push(TRANSLATION_DICT[p2]); i += len; found = true; break; }
            if (TRANSLATION_DICT[p3]) { results.push(TRANSLATION_DICT[p3]); i += len; found = true; break; }
        }
        if (!found) {
            const t = tokens[i];
            if (TRANSLATION_DICT[t]) results.push(TRANSLATION_DICT[t]);
            i++;
        }
    }
    if (results.length > 0) return [...new Set(results)].join('');
    for (const [de, zh] of Object.entries(TRANSLATION_DICT)) { if (lower.includes(de)) return zh; }
    return '';
}

function classify(german) {
    const lower = german.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) if (lower.includes(kw)) return cat;
    }
    return 'other';
}

function updateDefaultOwners() {
    const sharedCats = new Set();
    els.defaultSplitTags.querySelectorAll('.tag.active').forEach(t => sharedCats.add(t.dataset.cat));
    items.forEach(item => {
        if (sharedCats.has(item.category)) item.owner = '';
        else item.owner = '';
    });
}

function recalcAll() {
    const count = parseInt(els.splitCount.value) || 2;
    items.forEach(item => {
        item.splitPrice = item.owner === '' ? item.price / count : 0;
        item.exclusivePrice = item.owner !== '' ? item.price : 0;
    });
    updateSummary();
}

function updateSummary() {
    const count = parseInt(els.splitCount.value) || 2;
    const total = items.reduce((s, i) => s + i.price, 0);
    const sharedTotal = items.filter(i => i.owner === '').reduce((s, i) => s + i.price, 0);
    const aTotal = items.filter(i => i.owner === 'A').reduce((s, i) => s + i.price, 0);
    const bTotal = items.filter(i => i.owner === 'B').reduce((s, i) => s + i.price, 0);
    const sharedPerPerson = count > 0 ? sharedTotal / count : 0;
    const aPays = sharedPerPerson + aTotal;
    const bPays = sharedPerPerson + bTotal;
    els.totalAmount.textContent = fmt(total);
    els.sharedAmount.textContent = fmt(sharedTotal);
    els.personAAmount.textContent = fmt(aPays);
    els.personBAmount.textContent = fmt(bPays);
}

function fmt(n) { return '€' + (typeof n === 'number' ? n.toFixed(2) : '0.00'); }

// ==================== AI 翻译 ====================

function buildAiPrompt(products) {
    const list = products.map((p, i) => `${i + 1}. ${p.original}`).join('\n');
    return `你是一位精通德语超市商品的助手。请对以下账单商品进行翻译和分类。\n\n规则：\n1. 翻译为简洁的中文日常说法\n2. 类别必须是以下之一：肉类、蔬果、奶制品、面包、饮料、零食、日用品、其他\n3. 返回严格的 JSON 数组，不要有任何额外文字或 markdown 代码块标记\n\n商品列表：\n${list}\n\n返回格式：\n[\n  {"original": "...", "translated": "...", "category": "..."},\n  ...\n]`;
}

async function runAiTranslate(currentItems) {
    const apiKey = els.apiKey.value.trim();
    if (!apiKey) { setAiStatus('请先填写 API Key', 'error'); return; }
    let baseUrl = els.apiBase.value === 'custom' ? els.apiBaseCustom.value.trim() : els.apiBase.value;
    if (!baseUrl) baseUrl = 'https://api.deepseek.com';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const model = els.apiModel.value.trim() || 'deepseek-chat';
    setAiStatus('AI 翻译中...', 'loading');
    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: buildAiPrompt(currentItems) }], temperature: 0.3 })
        });
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errText || response.statusText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('AI 返回内容为空');
        let parsed;
        try {
            parsed = JSON.parse(content.replace(/```json\s*|\s*```/g, '').trim());
        } catch (e) { throw new Error('AI 返回的 JSON 格式不正确'); }
        if (!Array.isArray(parsed)) throw new Error('AI 返回的不是数组');
        let updatedCount = 0;
        parsed.forEach(entry => {
            if (!entry.original) return;
            const item = currentItems.find(it => it.original.toLowerCase() === entry.original.toLowerCase() || similarity(it.original.toLowerCase(), entry.original.toLowerCase()) > 0.8);
            if (item) {
                if (entry.translated) { item.translated = entry.translated; updatedCount++; }
                if (entry.category) {
                    const catKey = AI_CAT_MAP[entry.category] || AI_CAT_MAP[entry.category.toLowerCase()];
                    if (catKey) item.category = catKey;
                }
            }
        });
        updateDefaultOwners();
        recalcAll();
        render();
        setAiStatus(`AI 翻译完成，更新了 ${updatedCount} 个商品`, 'success');
    } catch (err) {
        console.error('AI 翻译失败:', err);
        let msg = err.message;
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) msg = '网络错误或 CORS 限制，请检查 API 地址是否正确，或尝试安装 CORS 插件';
        else if (msg.includes('401')) msg = 'API Key 无效（401），请检查 Key 是否正确';
        else if (msg.includes('429')) msg = '请求过于频繁（429），请稍后再试';
        setAiStatus('AI 翻译失败: ' + msg, 'error');
    }
}

function setAiStatus(text, type) {
    els.aiStatus.textContent = text;
    els.aiStatus.className = 'ai-status ' + (type || '');
}

// ==================== 渲染 ====================

function render() {
    const tbody = els.itemsBody;
    tbody.innerHTML = '';
    if (items.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="9">暂无商品，请上传账单或手动添加</td></tr>';
        updateSummary();
        return;
    }
    items.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const ownerClass = item.owner === 'A' ? 'owner-a' : item.owner === 'B' ? 'owner-b' : 'owner-shared';
        const ownerLabel = item.owner === 'A' ? 'A独占' : item.owner === 'B' ? 'B独占' : '公摊';
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><input type="text" value="${esc(item.original)}" data-id="${item.id}" data-field="original"></td>
            <td><input type="text" value="${esc(item.translated)}" data-id="${item.id}" data-field="translated" placeholder="点击翻译..."></td>
            <td>
                <select data-id="${item.id}" data-field="category">
                    ${Object.entries(CATEGORY_META).map(([key, meta]) => `<option value="${key}" ${item.category === key ? 'selected' : ''}>${meta.emoji} ${meta.name}</option>`).join('')}
                </select>
            </td>
            <td><input type="number" step="0.01" value="${item.price.toFixed(2)}" data-id="${item.id}" data-field="price"></td>
            <td>
                <select class="owner-select ${ownerClass}" data-id="${item.id}" data-field="owner">
                    <option value="" ${item.owner === '' ? 'selected' : ''}>公摊</option>
                    <option value="A" ${item.owner === 'A' ? 'selected' : ''}>A独占</option>
                    <option value="B" ${item.owner === 'B' ? 'selected' : ''}>B独占</option>
                </select>
            </td>
            <td>${item.owner === '' ? fmt(item.splitPrice) : '-'}</td>
            <td>${item.owner !== '' ? fmt(item.exclusivePrice) : '-'}</td>
            <td><button class="delete-btn" data-id="${item.id}">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', onItemChange);
        if (el.type === 'text' || el.type === 'number') el.addEventListener('input', onItemChange);
    });
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', onDelete));
    updateSummary();
}

function onItemChange(e) {
    const el = e.target;
    const id = parseInt(el.dataset.id);
    const field = el.dataset.field;
    const item = items.find(i => i.id === id);
    if (!item) return;
    let value = el.value;
    if (field === 'price') value = parseFloat(value) || 0;
    item[field] = value;
    if (field === 'original' && !item.translated) {
        item.translated = translate(value);
        item.category = classify(value);
    }
    recalcAll();
    render();
}

function onDelete(e) {
    const id = parseInt(e.target.dataset.id);
    items = items.filter(i => i.id !== id);
    recalcAll();
    render();
}

function addItem(data) {
    items.push({
        id: nextId++,
        original: data.original || '',
        translated: data.translated || translate(data.original || ''),
        category: data.category || classify(data.original || ''),
        price: data.price || 0,
        owner: data.owner ?? ''
    });
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ==================== 导出 ====================

function copySummary() {
    const count = parseInt(els.splitCount.value) || 2;
    const total = items.reduce((s, i) => s + i.price, 0);
    const sharedTotal = items.filter(i => i.owner === '').reduce((s, i) => s + i.price, 0);
    const aTotal = items.filter(i => i.owner === 'A').reduce((s, i) => s + i.price, 0);
    const bTotal = items.filter(i => i.owner === 'B').reduce((s, i) => s + i.price, 0);
    const sharedPerPerson = count > 0 ? sharedTotal / count : 0;
    const aPays = sharedPerPerson + aTotal;
    const bPays = sharedPerPerson + bTotal;
    const lines = [
        '🛒 德语超市账单拆分结果',
        '════════════════════════════',
        '',
        ...items.map((it, i) => {
            const owner = it.owner === 'A' ? '【A独占】' : it.owner === 'B' ? '【B独占】' : '【公摊】';
            return `${i+1}. ${it.original} → ${it.translated || '(未翻译)'} | ${CATEGORY_META[it.category].name} | €${it.price.toFixed(2)} ${owner}`;
        }),
        '',
        '════════════════════════════',
        `账单总额：€${total.toFixed(2)}`,
        `公摊总额：€${sharedTotal.toFixed(2)}（${count}人分，每人 €${sharedPerPerson.toFixed(2)}）`,
        '',
        `🅰️ A 应付 = €${sharedPerPerson.toFixed(2)}(公摊) + €${aTotal.toFixed(2)}(独占) = €${aPays.toFixed(2)}`,
        `🅱️ B 应付 = €${sharedPerPerson.toFixed(2)}(公摊) + €${bTotal.toFixed(2)}(独占) = €${bPays.toFixed(2)}`,
    ];
    els.copyBuffer.value = lines.join('\n');
    els.copyBuffer.select();
    document.execCommand('copy');
    alert('分账文本已复制到剪贴板！');
}

function exportCsv() {
    const headers = ['序号', '德语原文', '中文翻译', '类别', '原价(€)', '归属', '公摊价(€)', '独占价(€)'];
    const rows = items.map((it, i) => [
        i + 1, it.original, it.translated, CATEGORY_META[it.category].name, it.price.toFixed(2),
        it.owner === 'A' ? 'A独占' : it.owner === 'B' ? 'B独占' : '公摊',
        it.owner === '' ? it.splitPrice.toFixed(2) : '',
        it.owner !== '' ? it.exclusivePrice.toFixed(2) : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `账单拆分_${new Date().toLocaleDateString('zh-CN')}.csv`;
    link.click();
}

// ==================== 初始化 ====================

loadSettings();
updateSummary();
