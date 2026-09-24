import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback smart plan generator if API key is missing or call fails
function generateFallbackPlan(goalText: string, category?: string) {
  const isThai = /[\u0E00-\u0E7F]/.test(goalText);
  let sessions = [
    {
      order: 1,
      name: isThai ? 'ช่วงที่ 1: ตั้งสมาธิและปูพื้นฐาน' : 'Session 1: Foundations',
      focusMinutes: 25,
      breakMinutes: 5,
      topic: isThai ? 'อ่านภาพรวมและสารบัญ' : 'Overview & Core Concepts',
      tips: isThai ? 'ปิดการแจ้งเตือน ไฮไลต์ประเด็นสำคัญ' : 'Silence notifications, note key ideas',
    },
    {
      order: 2,
      name: isThai ? 'ช่วงที่ 2: เจาะลึกเนื้อหายาก' : 'Session 2: Deep Dive',
      focusMinutes: 30,
      breakMinutes: 5,
      topic: isThai ? 'ทำความเข้าใจจุดสำคัญและตัวอย่าง' : 'In-depth review & examples',
      tips: isThai ? 'จดสรุปเป็นภาษาของตัวเองสั้น ๆ' : 'Summarize in your own words',
    },
    {
      order: 3,
      name: isThai ? 'ช่วงที่ 3: ทบทวนและทดสอบ' : 'Session 3: Practice & Review',
      focusMinutes: 25,
      breakMinutes: 10,
      topic: isThai ? 'ทดสอบความเข้าใจและทบทวน' : 'Active recall & self-test',
      tips: isThai ? 'ลองอธิบายสิ่งสำคัญโดยไม่เปิดดูเฉลย' : 'Test yourself without notes',
    },
  ];

  if (goalText.includes('1 ชั่วโมง') || goalText.includes('60 นาที') || goalText.includes('1 hr') || goalText.includes('1 hour')) {
    sessions = [
      {
        order: 1,
        name: isThai ? 'ช่วงที่ 1: เนื้อหาหลัก' : 'Session 1: Core Material',
        focusMinutes: 25,
        breakMinutes: 5,
        topic: isThai ? 'เรียนรู้และสรุปหัวใจสำคัญ' : 'Core learning',
        tips: isThai ? 'โฟกัส 1 เรื่องให้เสร็จ' : 'Single-task with full focus',
      },
      {
        order: 2,
        name: isThai ? 'ช่วงที่ 2: ทบทวนปิดท้าย' : 'Session 2: Review & Wrap-up',
        focusMinutes: 25,
        breakMinutes: 5,
        topic: isThai ? 'ทบทวนและตรวจสอบความเข้าใจ' : 'Summary & retention',
        tips: isThai ? 'ทำแบบฝึกหัดสั้น ๆ' : 'Quick practice questions',
      },
    ];
  } else if (goalText.includes('3 ชั่วโมง') || goalText.includes('3 hr') || goalText.includes('3 hour')) {
    sessions.push({
      order: 4,
      name: isThai ? 'ช่วงที่ 4: สรุปภาพรวมและเก็งข้อสอบ' : 'Session 4: Final Synthesis',
      focusMinutes: 25,
      breakMinutes: 15,
      topic: isThai ? 'สรุปประเด็นหลักและจุดที่มักผิด' : 'Final recap & common pitfalls',
      tips: isThai ? 'พักผ่อนสมอง ดื่มน้ำให้เพียงพอ' : 'Rest your mind, stay hydrated',
    });
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + s.focusMinutes + s.breakMinutes, 0);

  return {
    planTitle: isThai ? `แผนโฟกัส: ${goalText.slice(0, 35)}` : `Focus Plan: ${goalText.slice(0, 35)}`,
    reasoning: isThai
      ? 'จัดโครงสร้างแบบ Pomodoro ที่ปรับสมดุลตามเวลา ให้สมองมีช่วงรับข้อมูล พักย่อย และดึงความจำมาทดสอบเพื่อความจำระยะยาวที่ดีที่สุด'
      : 'Structured using balanced intervals to maintain high cognitive retention without mental fatigue.',
    totalEstimatedMinutes: totalMinutes,
    sessions,
  };
}

// Endpoint: AI Focus Planner
app.post('/api/ai-plan', async (req, res) => {
  try {
    const { goal, category } = req.body;
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Goal prompt is required' });
    }

    if (!ai) {
      // Return generated smart plan if API key is not yet configured
      return res.json(generateFallbackPlan(goal, category));
    }

    const systemInstruction = `คุณคือ AI Focus Planner ของแอปพลิเคชัน Focus City
มีหน้าที่ช่วยผู้ใช้วางแผนการอ่านหนังสือ การเรียน การทำงาน หรือการทำโปรเจกต์
โดยรับเป้าหมายหรือเวลา เช่น "พรุ่งนี้สอบ มีเวลาอ่าน 2 ชั่วโมง" หรือ "เหลือเวลา 5 วัน ต้องอ่านหนังสือ 6 บท"
ให้:
1. แบ่งงานออกเป็นส่วนย่อยที่ทำได้จริง (Sub-tasks / Sessions)
2. แนะนำระยะเวลา Focus แต่ละรอบ (ปกติ 20-50 นาทีต่อรอบ ตามความเหมาะสม)
3. แนะนำเวลาพักสั้น (Break) 5-10 นาที
4. กำหนดจำนวน Session และแบ่งเนื้อหาในแต่ละ Session
5. ให้เหตุผลสั้น ๆ สุภาพ อบอุ่น ชัดเจนว่าทำไมจึงแนะนำโครงสร้างนี้
ผู้ใช้ต้องสามารถปรับแต่งได้ ตอบเป็นภาษาไทย`;

    const prompt = `เป้าหมายของผู้ใช้: "${goal}"
หมวดหมู่กิจกรรม: ${category || 'ทั่วไป'}

กรุณาสร้างแผนการโฟกัสพร้อมแบ่ง session อย่างเหมาะสม`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: {
              type: Type.STRING,
              description: 'ชื่อแผนที่กระชับและดึงดูด',
            },
            reasoning: {
              type: Type.STRING,
              description: 'เหตุผลสั้น ๆ ว่าทำไมจึงแนะนำแผนและจังหวะเวลานี้',
            },
            totalEstimatedMinutes: {
              type: Type.NUMBER,
              description: 'เวลารวมทั้งหมดโดยประมาณ (นาที) ทั้งช่วงโฟกัสและพัก',
            },
            sessions: {
              type: Type.ARRAY,
              description: 'รายการ session แต่ละช่วง',
              items: {
                type: Type.OBJECT,
                properties: {
                  order: { type: Type.INTEGER },
                  name: { type: Type.STRING, description: 'ชื่อช่วง เช่น ช่วงที่ 1: บทที่ 1-2' },
                  focusMinutes: { type: Type.INTEGER, description: 'เวลาโฟกัส (นาที)' },
                  breakMinutes: { type: Type.INTEGER, description: 'เวลาพัก (นาที)' },
                  topic: { type: Type.STRING, description: 'เนื้อหาหรือเป้าหมายย่อยในรอบนี้' },
                  tips: { type: Type.STRING, description: 'คำแนะนำเทคนิคสมาธิในรอบนี้สั้น ๆ' },
                },
                required: ['order', 'name', 'focusMinutes', 'breakMinutes', 'topic'],
              },
            },
          },
          required: ['planTitle', 'reasoning', 'totalEstimatedMinutes', 'sessions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error('Gemini AI Plan error:', error);
    // Graceful fallback to avoid breaking UX
    const fallback = generateFallbackPlan(req.body?.goal || 'การอ่านหนังสือ', req.body?.category);
    return res.json(fallback);
  }
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Focus City server running on port ${PORT}`);
  });
}

startServer();
