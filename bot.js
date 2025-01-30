require('dotenv').config();
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const DATA_FILE = 'tasks.json';

// JSON faylni o‘qish
function loadTasks() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE));
    }
    return {};
}

// JSON faylga yozish
function saveTasks(tasks) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// Boshlang‘ich menyu tugmalari
function getMainMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: "➕ Vazifa qo‘shish", callback_data: "add_task" }],
                [{ text: "📋 Vazifalarni ko‘rish", callback_data: "list_tasks" }],
                [{ text: "❌ Vazifani o‘chirish", callback_data: "delete_task" }]
            ]
        }
    };
}

// Start komandasi
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "📌 Assalomu alaykum! Men To-Do List botman. Quyidagi tugmalar orqali menga buyruq bering.", getMainMenu());
});

// Callback tugmalar
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    let tasks = loadTasks();

    if (query.data === "add_task") {
        bot.sendMessage(chatId, "✏️ Iltimos, yangi vazifani yozing.");
        bot.once("message", (msg) => {
            let text = msg.text;
            if (!tasks[chatId]) tasks[chatId] = [];
            tasks[chatId].push(text);
            saveTasks(tasks);
            bot.sendMessage(chatId, `✅ Vazifa qo‘shildi: "${text}"`, getMainMenu());
        });
    
    } else if (query.data === "list_tasks") {
        if (!tasks[chatId] || tasks[chatId].length === 0) {
            bot.sendMessage(chatId, "📌 Sizda hozircha vazifalar yo‘q.", getMainMenu());
        } else {
            let reply = "📋 Sizning vazifalaringiz:\n";
            tasks[chatId].forEach((task, index) => {
                reply += `${index + 1}. ${task}\n`;
            });
            bot.sendMessage(chatId, reply, getMainMenu());
        }

    } else if (query.data === "delete_task") {
        if (!tasks[chatId] || tasks[chatId].length === 0) {
            bot.sendMessage(chatId, "❌ O‘chirish uchun vazifalar yo‘q.", getMainMenu());
        } else {
            let buttons = tasks[chatId].map((task, index) => [{ text: `${index + 1}. ${task}`, callback_data: `del_${index}` }]);
            bot.sendMessage(chatId, "🗑 O‘chirmoqchi bo‘lgan vazifangizni tanlang:", {
                reply_markup: { inline_keyboard: buttons }
            });
        }
    } else if (query.data.startsWith("del_")) {
        let index = parseInt(query.data.split("_")[1]);
        if (tasks[chatId] && tasks[chatId][index]) {
            let removedTask = tasks[chatId].splice(index, 1);
            saveTasks(tasks);
            bot.sendMessage(chatId, `❌ O‘chirildi: "${removedTask}"`, getMainMenu());
        }
    }
});

console.log("✅ Bot ishlamoqda...");
