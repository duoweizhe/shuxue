import { GoogleGenAI, Type } from "@google/genai";
import { WordProblem, Difficulty, UnitProblem, PatternProblem, AISettings, PatternLayout } from "../types";

// --- Helpers for Configuration ---

const getSettings = (): AISettings => {
  const stored = localStorage.getItem('math_explorer_settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.enableAI === undefined) parsed.enableAI = false;
    return parsed;
  }
  return { provider: 'gemini', enableAI: false };
};

// --- Random Context Generators ---

const SUBJECTS = [
  "小明", "小红", "小华", "乐乐", "天天", "李老师", "丁丁", "冬冬",
  "小熊猫", "小老虎", "大象", "小猴子", "长颈鹿", "小兔", "松鼠", "小猫", "小狗",
  "机器人", "外星朋友", "小仙女", "超级英雄"
];

const OBJECTS = [
  "苹果", "香蕉", "橘子", "草莓", "葡萄", "西瓜", "桃子", "蛋糕", "饼干", "糖果", "巧克力", "冰淇淋", "甜甜圈", "蘑菇", "宝石", "鸡蛋",
  "铅笔", "橡皮", "尺子", "笔记本", "蜡笔", "水彩笔", "剪刀", "贴纸", "邮票", "书本", "书包", "足球", "篮球", "羽毛球",
  "积木", "拼图", "气球", "风筝", "弹珠", "玩具车", "布娃娃", "飞盘", "陀螺", "玩偶", "乐高",
  "鲜花", "树叶", "贝壳", "石头", "星星", "松果", "勋章", "金币", "钥匙", "玻璃瓶", "蜡烛", "水晶", "种子"
];

const MEASURE_WORDS: Record<string, string> = {
  "苹果": "个", "香蕉": "根", "橘子": "个", "西瓜": "个", "蛋糕": "块", "饼干": "块", "糖果": "颗", "巧克力": "块", "蘑菇": "朵", "宝石": "颗", "鸡蛋": "个",
  "铅笔": "支", "橡皮": "块", "尺子": "把", "笔记本": "本", "贴纸": "张", "邮票": "枚", "书本": "本", "书包": "个", "足球": "个", "篮球": "个", "羽毛球": "个",
  "积木": "块", "拼图": "片", "气球": "个", "风筝": "只", "弹珠": "颗", "玩具车": "辆", "布娃娃": "个", "飞盘": "个", "陀螺": "个",
  "鲜花": "朵", "树叶": "片", "贝壳": "个", "石头": "块", "星星": "颗", "松果": "个", "勋章": "枚", "金币": "枚", "种子": "颗",
  "默认": "个"
};

const getMW = (obj: string) => MEASURE_WORDS[obj] || MEASURE_WORDS["默认"];

// --- Generic AI Caller ---

const callAI = async (
  systemPrompt: string,
  userPrompt: string,
  schemaType: 'WORD' | 'UNIT' | 'PATTERN',
  temperature: number = 0.8
): Promise<any | null> => {
  const settings = getSettings();
  if (!settings.enableAI) return null;

  if (settings.provider === 'gemini') {
    try {
      // Create a new GoogleGenAI instance right before making the call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use gemini-3-pro-preview for complex reasoning tasks like math problems
      const modelId = "gemini-3-pro-preview";
      
      let schema: any;
      if (schemaType === 'WORD') {
        schema = {
          type: Type.OBJECT,
          properties: {
            story: { type: Type.STRING },
            question: { type: Type.STRING },
            answer: { type: Type.INTEGER },
            options: { type: Type.ARRAY, items: { type: Type.INTEGER } }
          },
          required: ["story", "question", "answer", "options"]
        };
      } else if (schemaType === 'UNIT') {
        schema = {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            question: { type: Type.STRING },
            answer: { type: Type.NUMBER },
            options: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            unit: { type: Type.STRING }
          },
          required: ["scenario", "question", "answer", "options", "unit"]
        };
      } else {
        schema = {
          type: Type.OBJECT,
          properties: {
            layout: { type: Type.STRING, enum: ['LINEAR', 'GRID', 'CIRCLE'] },
            sequence: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.INTEGER },
            options: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            explanation: { type: Type.STRING }
          },
          required: ["layout", "sequence", "answer", "options", "explanation"]
        };
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: temperature,
          // Add thinking budget to allow for detailed reasoning in complex math generation
          thinkingConfig: { thinkingBudget: 4096 }
        }
      });

      // Directly access .text property from response object as per guidelines
      if (response.text) {
        return JSON.parse(response.text.trim());
      }
      return null;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return null;
    }
  } else {
    try {
      const baseUrl = settings.baseUrl?.replace(/\/$/, '') || 'http://localhost:11434/v1';
      const apiKey = settings.apiKey || 'sk-placeholder';
      const model = settings.model || 'gpt-3.5-turbo';

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          temperature: temperature,
          response_format: { type: "json_object" } 
        })
      });

      if (!res.ok) throw new Error(`API Status: ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content.trim());
      }
      return null;
    } catch (error: any) {
      console.error("OpenAI/Custom API Error:", error);
      return null;
    }
  }
};

// --- Local Fallback Generators ---

const getRandomTemplate = (templates: any[], ...args: any[]) => {
    const t = templates[Math.floor(Math.random() * templates.length)];
    return t(...args);
};

const generateLocalWordProblemFallback = (
  difficulty: Difficulty, 
  subject: string, 
  object: string, 
  nums: number[], 
  ans: number, 
  opType: string
): WordProblem => {
  let story = "";
  let question = "";
  
  const n1 = nums[0];
  const n2 = nums[1];
  const mw = getMW(object);

  if (opType.includes("Addition")) {
    const templates = [
        (s: string, o: string, v1: number, v2: number, m: string) => ({s: `${s}收集了 ${v1} ${m}${o}，后来又拿到了 ${v2} ${m}。`, q: `现在${s}一共有多少${m}${o}？`}),
        (s: string, o: string, v1: number, v2: number, m: string) => ({s: `${s}正在整理物品，数出了 ${v1} ${m}${o}，旁边还有 ${v2} ${m}。`, q: `一共有多少${m}${o}？`}),
    ];
    const t = getRandomTemplate(templates, subject, object, n1, n2, mw);
    story = t.s; question = t.q;
  } else {
    const templates = [
        (s: string, o: string, v1: number, v2: number, m: string) => ({s: `${s}原本有 ${v1} ${m}${o}，分给了好朋友 ${v2} ${m}。`, q: `现在${s}还剩多少${m}${o}？`}),
    ];
    const t = getRandomTemplate(templates, subject, object, n1, n2, mw);
    story = t.s; question = t.q;
  }

  const options = Array.from(new Set([ans, ans + 2, Math.abs(ans - 3), ans + 5])).sort(() => Math.random() - 0.5);
  return { story, question, answer: ans, options };
};

// --- Pattern Logic Logic ---

const generateLocalPatternProblem = (difficulty: Difficulty): PatternProblem => {
    let layout: PatternLayout = 'LINEAR';
    let sequence: (number | string)[] = [];
    let answer = 0;
    let explanation = "";

    // 基础模式扩展至 20+ 种规律
    const modes = [
        "ADD_1", "ADD_2", "ADD_3", "ADD_4", "ADD_5", "ADD_10", 
        "SUB_1", "SUB_2", "SUB_3", "SUB_5", "SUB_10",
        "REPEAT_AB", "REPEAT_AAB", "REPEAT_ABB", "REPEAT_ABC", "REPEAT_AABB",
        "PAIRS", "MIRROR", "TENS_JUMP", "FIVES_JUMP", "DOUBLE", "ODD", "EVEN"
    ];
    const mode = modes[Math.floor(Math.random() * modes.length)];

    // 根据难度设置参数
    let length = difficulty === Difficulty.EASY ? 5 : 7;
    if (difficulty !== Difficulty.EASY) {
        const layouts: PatternLayout[] = ['LINEAR', 'GRID', 'CIRCLE'];
        layout = layouts[Math.floor(Math.random() * layouts.length)];
        length = layout === 'GRID' ? 9 : 6;
    }

    let start = 1;
    let step = 1;

    switch (mode) {
        case "ADD_1": case "ADD_2": case "ADD_3": case "ADD_4": case "ADD_5": case "ADD_10":
            step = parseInt(mode.split('_')[1]);
            start = Math.floor(Math.random() * 20) + 1;
            for (let i = 0; i < length; i++) sequence.push(start + i * step);
            explanation = `等差规律：每个数都比前一个大 ${step}。`;
            break;
        case "SUB_1": case "SUB_2": case "SUB_3": case "SUB_5": case "SUB_10":
            step = parseInt(mode.split('_')[1]);
            start = 50 + Math.floor(Math.random() * 20);
            for (let i = 0; i < length; i++) sequence.push(start - i * step);
            explanation = `递减规律：每个数都比前一个小 ${step}。`;
            break;
        case "REPEAT_AB":
            const a = Math.floor(Math.random() * 9) + 1, b = Math.floor(Math.random() * 9) + 10;
            for (let i = 0; i < length; i++) sequence.push(i % 2 === 0 ? a : b);
            explanation = `循环规律：按照 ${a} 和 ${b} 交替出现。`;
            break;
        case "REPEAT_AAB":
            const a1 = Math.floor(Math.random() * 9) + 1, b1 = a1 + 5;
            for (let i = 0; i < length; i++) sequence.push(i % 3 === 2 ? b1 : a1);
            explanation = `循环规律：按照 A-A-B 的顺序排列。`;
            break;
        case "REPEAT_ABB":
            const a2 = Math.floor(Math.random() * 9) + 1, b2 = a2 + 2;
            for (let i = 0; i < length; i++) sequence.push(i % 3 === 0 ? a2 : b2);
            explanation = `循环规律：按照 A-B-B 的顺序排列。`;
            break;
        case "REPEAT_ABC":
            const v1=1, v2=2, v3=3;
            for (let i = 0; i < length; i++) sequence.push([v1,v2,v3][i % 3]);
            explanation = `循环规律：按照三个数一组循环排列。`;
            break;
        case "REPEAT_AABB":
            const vA = Math.floor(Math.random()*5)+1, vB = vA+10;
            for (let i = 0; i < length; i++) sequence.push(i % 4 < 2 ? vA : vB);
            explanation = `循环规律：按照两个 A 和两个 B 循环排列。`;
            break;
        case "PAIRS":
            start = Math.floor(Math.random() * 10) + 1;
            for (let i = 0; i < length; i++) sequence.push(start + Math.floor(i / 2));
            explanation = `成对规律：每两个数是一样的，然后增加 1。`;
            break;
        case "MIRROR":
            const mid = Math.floor(length / 2);
            for (let i = 0; i < length; i++) sequence.push(i <= mid ? i + 1 : length - i);
            explanation = `镜像规律：左右对称排列。`;
            break;
        case "TENS_JUMP":
            start = 10;
            for (let i = 0; i < length; i++) sequence.push(start * (i + 1));
            explanation = `整十数规律：每次增加 10。`;
            break;
        case "FIVES_JUMP":
            start = 5;
            for (let i = 0; i < length; i++) sequence.push(start * (i + 1));
            explanation = `逢五规律：每次增加 5。`;
            break;
        case "DOUBLE":
            start = Math.floor(Math.random() * 3) + 1;
            let current = start;
            for (let i = 0; i < length; i++) {
                sequence.push(current);
                current *= 2;
            }
            explanation = `倍数规律：后面的数是前面的 2 倍。`;
            break;
        case "ODD":
            for (let i = 0; i < length; i++) sequence.push(1 + i * 2);
            explanation = `奇数规律：连续的单数排列。`;
            break;
        case "EVEN":
            for (let i = 0; i < length; i++) sequence.push(2 + i * 2);
            explanation = `偶数规律：连续的双数排列。`;
            break;
        default:
            for (let i = 0; i < length; i++) sequence.push(i + 1);
            explanation = `简单规律：每次增加 1。`;
    }

    // 随机挖去一个位置
    const gapIndex = difficulty === Difficulty.EASY ? sequence.length - 1 : Math.floor(Math.random() * (sequence.length - 2)) + 1;
    answer = sequence[gapIndex] as number;
    sequence[gapIndex] = "?";

    // 生成干扰选项
    const options = new Set<number>([answer]);
    while (options.size < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const val = answer + offset;
        if (val >= 0 && val !== answer) options.add(val);
        else options.add(answer + options.size + 2);
    }

    return {
        layout,
        sequence,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        explanation
    };
};

// --- Public Exported Functions ---

export const generateWordProblem = async (difficulty: Difficulty): Promise<WordProblem> => {
    const settings = getSettings();
    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const object = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    
    let opType = "Simple Addition";
    let n1 = 10, n2 = 5;
    if (difficulty === Difficulty.HARD) {
        n1 = Math.floor(Math.random() * 50) + 20;
        n2 = Math.floor(Math.random() * 20) + 10;
        opType = "Addition (Within 100)";
    } else {
        n1 = Math.floor(Math.random() * 10) + 5;
        n2 = Math.floor(Math.random() * 5) + 1;
    }
    const ans = n1 + n2;

    if (settings.enableAI) {
        const result = await callAI(
            "你是一个亲切的小学数学老师。请为一个小学二年级学生生成一个有趣的数学应用题。",
            `生成一个${difficulty}难度的关于${object}的加法或减法应用题。`,
            'WORD'
        );
        if (result) return result;
    }
    
    return generateLocalWordProblemFallback(difficulty, subject, object, [n1, n2], ans, opType);
};

export const getEncouragement = async (isCorrect: boolean): Promise<string> => {
    const correctMsgs = ["太棒了！🎉", "真聪明！🌟", "你真是一个数学小天才！🚀", "回答完全正确！👏"];
    const wrongMsgs = ["没关系，再仔细想一想哦。💪", "加油，你离成功只差一点点！✨", "再数一数，相信你能做对！👀", "不要灰心，下一次一定会成功！🌈"];
    const msgs = isCorrect ? correctMsgs : wrongMsgs;
    return msgs[Math.floor(Math.random() * msgs.length)];
};

export const generateUnitProblem = async (): Promise<UnitProblem> => {
    const settings = getSettings();
    if (settings.enableAI) {
        const result = await callAI(
            "生成关于长度（米、厘米）、重量（克、千克）或时间（小时、分、秒）单位换算的应用题。",
            "生成一个单位换算挑战题。",
            'UNIT'
        );
        if (result) return result;
    }

    const types = ['length', 'weight', 'time'];
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === 'length') {
        return {
            scenario: "大象伯伯的身高是 3 米。",
            question: "3 米等于多少厘米？",
            answer: 300,
            options: [30, 300, 3, 3000].sort(() => Math.random() - 0.5),
            unit: "厘米"
        };
    } else if (type === 'weight') {
        return {
            scenario: "小兔子采了一个大蘑菇，重 2 千克。",
            question: "2 千克等于多少克？",
            answer: 2000,
            options: [200, 20, 2000, 20000].sort(() => Math.random() - 0.5),
            unit: "克"
        };
    } else {
        return {
            scenario: "动画片已经播出了 2 分钟。",
            question: "2 分钟等于多少秒？",
            answer: 120,
            options: [60, 100, 120, 200].sort(() => Math.random() - 0.5),
            unit: "秒"
        };
    }
};

export const generatePatternProblem = async (difficulty: Difficulty): Promise<PatternProblem> => {
    const settings = getSettings();
    if (settings.enableAI) {
        const result = await callAI(
            "生成一个有趣的数学找规律题目。可以是数字序列、矩阵或环形排列。",
            `生成一个${difficulty}难度的找规律题目。`,
            'PATTERN'
        );
        if (result) return result;
    }
    
    // 如果没有 AI，执行动态离线逻辑（已扩充至 20+ 种规律）
    return generateLocalPatternProblem(difficulty);
};

export const testOpenAIConnection = async (settings: AISettings): Promise<{success: boolean, message?: string}> => {
    try {
        const baseUrl = settings.baseUrl?.replace(/\/$/, '') || 'http://localhost:11434/v1';
        const apiKey = settings.apiKey || 'sk-placeholder';
        const model = settings.model || 'gpt-3.5-turbo';

        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 5
            })
        });

        if (res.ok) return { success: true };
        return { success: false, message: `Status: ${res.status}` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};