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

// Botga kelgan xabarlarni qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    let tasks = loadTasks();

    if (text.startsWith('/add ')) {
        const task = text.substring(5);
        if (!tasks[chatId]) tasks[chatId] = [];
        tasks[chatId].push(task);
        saveTasks(tasks);
        bot.sendMessage(chatId, `✅ Vazifa qo‘shildi: "${task}"`);

    } else if (text === '/list') {
        if (!tasks[chatId] || tasks[chatId].length === 0) {
            bot.sendMessage(chatId, "📌 Sizda hozircha vazifalar yo‘q.");
        } else {
            let reply = "📋 Sizning vazifalaringiz:\n";
            tasks[chatId].forEach((task, index) => {
                reply += `${index + 1}. ${task}\n`;
            });
            bot.sendMessage(chatId, reply);
        }

    } else if (text.startsWith('/delete ')) {
        const index = parseInt(text.split(' ')[1]) - 1;
        if (!isNaN(index) && tasks[chatId] && tasks[chatId][index]) {
            let removedTask = tasks[chatId].splice(index, 1);
            saveTasks(tasks);
            bot.sendMessage(chatId, `❌ O‘chirildi: "${removedTask}"`);
        } else {
            bot.sendMessage(chatId, "⚠️ Noto‘g‘ri indeks.");
        }

    } else {
        bot.sendMessage(chatId, "📝 Buyruqlar:\n" +
            "/add <matn> - Vazifa qo‘shish\n" +
            "/list - Vazifalarni ko‘rish\n" +
            "/delete <raqam> - Vazifani o‘chirish");
    }
});

console.log("✅ Bot ishlamoqda...");
