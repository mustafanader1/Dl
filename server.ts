import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEBTS_FILE = path.join(DATA_DIR, "debts.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Helper function to read debts
function readDebts() {
  try {
    if (fs.existsSync(DEBTS_FILE)) {
      const data = fs.readFileSync(DEBTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading debts file, initializing with empty array:", error);
  }
  return [];
}

// Helper function to write debts
function writeDebts(debts: any[]) {
  try {
    fs.writeFileSync(DEBTS_FILE, JSON.stringify(debts, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing debts file:", error);
  }
}

// Helper function to read settings
function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading settings file, initializing with defaults:", error);
  }
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    enabled: false,
  };
}

// Helper function to write settings
function writeSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing settings file:", error);
  }
}

// API: Get all debts
app.get("/api/debts", (req, res) => {
  const debts = readDebts();
  res.json(debts);
});

// API: Create new debt
app.post("/api/debts", (req, res) => {
  const debts = readDebts();
  const newDebt = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
    history: [],
    ...req.body,
  };
  debts.push(newDebt);
  writeDebts(debts);
  res.status(201).json(newDebt);
});

// API: Update debt
app.put("/api/debts/:id", (req, res) => {
  const debts = readDebts();
  const index = debts.findIndex((d: any) => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Debt not found" });
  }

  debts[index] = {
    ...debts[index],
    ...req.body,
  };
  writeDebts(debts);
  res.json(debts[index]);
});

// API: Delete debt
app.delete("/api/debts/:id", (req, res) => {
  const debts = readDebts();
  const filtered = debts.filter((d: any) => d.id !== req.params.id);
  writeDebts(filtered);
  res.json({ success: true });
});

// API: Get settings
app.get("/api/settings", (req, res) => {
  const settings = readSettings();
  res.json(settings);
});

// API: Save settings
app.post("/api/settings", (req, res) => {
  writeSettings(req.body);
  res.json({ success: true, settings: req.body });
});

// API: Send Telegram notification
app.post("/api/telegram/send", async (req, res) => {
  const { debtId, message: customMessage } = req.body;
  const debts = readDebts();
  const debt = debts.find((d: any) => d.id === debtId);
  const settings = readSettings();

  if (!settings.botToken || !settings.chatId) {
    return res.status(400).json({ error: "إعدادات البوت غير مكتملة. الرجاء إدخال توكن البوت ومعرّف الدردشة في صفحة الإعدادات." });
  }

  let text = customMessage;

  if (!text && debt) {
    const priorityLabel = 
      debt.priority === "high" ? "🔴 عالية جداً" : 
      debt.priority === "medium" ? "🟡 متوسطة" : "🟢 منخفضة";
    
    const remaining = debt.amount - debt.paidAmount;
    const formattedDueDate = new Date(debt.dueDate).toLocaleDateString("ar-EG", {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    text = `🔔 *تذكير دفع مستحق* 🔔\n\n` +
           `👤 *المدين:* ${debt.debtorName}\n` +
           `💰 *المبلغ الإجمالي:* ${debt.amount.toLocaleString()} ${debt.currency}\n` +
           `✅ *المدفوع حتى الآن:* ${debt.paidAmount.toLocaleString()} ${debt.currency}\n` +
           `💵 *المتبقي المستحق:* ${remaining.toLocaleString()} ${debt.currency}\n` +
           `📅 *تاريخ الاستحقاق:* ${formattedDueDate}\n` +
           `⚠️ *الأولوية:* ${priorityLabel}\n` +
           (debt.telegramUsername ? `📱 *تليجرام:* @${debt.telegramUsername.replace("@", "")}\n` : "") +
           (debt.phone ? `📞 *الهاتف:* \`${debt.phone}\`\n` : "") +
           (debt.description ? `📝 *ملاحظات:* ${debt.description}\n` : "") +
           `\n⏳ يرجى سداد المبلغ المتبقي في أقرب وقت ممكن. شكراً لكم!`;
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: text,
        parse_mode: "Markdown"
      })
    });

    const result = await response.json();
    if (result.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.description || "فشل إرسال الرسالة عبر التليجرام." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "حدث خطأ أثناء الاتصال بخوادم تليجرام." });
  }
});

// API: Test Telegram settings
app.post("/api/telegram/test", async (req, res) => {
  const { botToken, chatId } = req.body;

  if (!botToken || !chatId) {
    return res.status(400).json({ error: "الرجاء توفير توكن البوت ومعرّف الدردشة لإجراء الفحص." });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "⚡ *فحص الاتصال بنظام تذكير الديون والالتزامات* ⚡\n\nتم الاتصال بنجاح! بوت الإشعارات يعمل الآن وجاهز لإرسال تذكيرات الديون.",
        parse_mode: "Markdown"
      })
    });

    const result = await response.json();
    if (result.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.description || "فشل الفحص. يرجى التحقق من صحة التوكن ومعرف الدردشة." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "فشل الاتصال بخوادم تليجرام." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
