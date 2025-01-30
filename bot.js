require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');


const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let tasks = {};
let users = {};

const getMainMenu = () => ({
    reply_markup: {
        inline_keyboard: [
            [{ text: "➕ Vazifa qo'shish", callback_data: "add_task" }],
            [{ text: "📝 Vazifalar ro'yxati", callback_data: "list_tasks" }],
            [{ text: "🗑 Vazifa o'chirish", callback_data: "delete_task" }],
            [{ text: "📂 Vazifalar kategoriyasi", callback_data: "add_task_category" }],
            [{ text: "🔔 Eslatma qo'shish", callback_data: "add_reminder" }],
            [{ text: "📊 Statistika", callback_data: "view_statistics" }],
            [{ text: "📝 Profil sozlamalari", callback_data: "set_profile" }]
        ]
    }
});

bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;

    if (query.data === "add_task") {
        bot.sendMessage(chatId, "📌 Vazifani kiriting.");
        bot.once("message", (msg) => {
            let task = msg.text;
            if (!tasks[chatId]) tasks[chatId] = [];
            bot.sendMessage(chatId, "📂 Iltimos, vazifa uchun kategoriya tanlang:", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📚 O'qish", callback_data: "category_study" }],
                        [{ text: "💼 Ish", callback_data: "category_work" }],
                        [{ text: "🏠 Shaxsiy", callback_data: "category_personal" }]
                    ]
                }
            });

            bot.once("callback_query", (categoryQuery) => {
                let category = categoryQuery.data.replace("category_", "");
                tasks[chatId].push({ task, category });
                saveTasks(tasks);
                bot.sendMessage(chatId, `✅ Vazifa qo'shildi: "${task}" kategoriyasi: ${category}`, getMainMenu());
            });
        });
    }

    if (query.data === "list_tasks") {
        let userTasks = tasks[chatId] || [];
        if (userTasks.length === 0) {
            bot.sendMessage(chatId, "🚫 Hech qanday vazifa mavjud emas.", getMainMenu());
        } else {
            let taskList = userTasks.map((task, index) => `${index + 1}. ${task.task} (Kategoriya: ${task.category})`).join("\n");
            bot.sendMessage(chatId, `📝 Vazifalar:\n${taskList}`, getMainMenu());
        }
    }

    if (query.data === "delete_task") {
        let userTasks = tasks[chatId] || [];
        if (userTasks.length === 0) {
            bot.sendMessage(chatId, "🚫 Hech qanday vazifa o'chiriladigan yo'q.", getMainMenu());
        } else {
            let taskList = userTasks.map((task, index) => `${index + 1}. ${task.task}`).join("\n");
            bot.sendMessage(chatId, `📌 Qaysi vazifani o'chirmoqchisiz?\n${taskList}`, {
                reply_markup: {
                    force_reply: true
                }
            });
        }
    }

    if (query.data === "add_task_category") {
        bot.sendMessage(chatId, "📂 Iltimos, vazifa uchun kategoriya tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📚 O'qish", callback_data: "category_study" }],
                    [{ text: "💼 Ish", callback_data: "category_work" }],
                    [{ text: "🏠 Shaxsiy", callback_data: "category_personal" }]
                ]
            }
        });
    }

    if (query.data === "set_profile") {
        bot.sendMessage(chatId, "📜 Profil uchun ismingizni kiriting.");
        bot.once("message", (msg) => {
            users[chatId] = { name: msg.text };
            saveUsers(users);
            bot.sendMessage(chatId, `✅ Ismingiz saqlandi: ${msg.text}`);

            bot.sendMessage(chatId, "📜 Endi familiyangizni kiriting.");
            bot.once("message", (msg) => {
                users[chatId].surname = msg.text;
                saveUsers(users);
                bot.sendMessage(chatId, `✅ Familiyangiz saqlandi: ${msg.text}`);

                bot.sendMessage(chatId, "📜 Yoshingizni kiriting.");
                bot.once("message", (msg) => {
                    users[chatId].age = msg.text;
                    saveUsers(users);
                    bot.sendMessage(chatId, `✅ Yoshingiz saqlandi: ${msg.text}`, getMainMenu());
                });
            });
        });
    }

    if (query.data === "add_reminder") {
        bot.sendMessage(chatId, "🕐 Eslatma vaqti kiriting (masalan, 'Bugun 18:00').");
        bot.once("message", (msg) => {
            let reminderTime = msg.text;
            bot.sendMessage(chatId, `⏰ Eslatma qo'shildi: ${reminderTime}`);
        });
    }

    if (query.data === "view_statistics") {
        let userTasks = tasks[chatId] || [];
        let taskCount = userTasks.length;
        bot.sendMessage(chatId, `📊 Statistika:\nVazifalar soni: ${taskCount}`, getMainMenu());
    }
});

function saveTasks(tasks) {
    fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));
}

function saveUsers(users) {
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

function loadTasks() {
    if (fs.existsSync("tasks.json")) {
        return JSON.parse(fs.readFileSync("tasks.json"));
    }
    return {};
}

function loadUsers() {
    if (fs.existsSync("users.json")) {
        return JSON.parse(fs.readFileSync("users.json"));
    }
    return {};
}

tasks = loadTasks();
users = loadUsers();

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Salom! Men sizning To-Do List botingizman. Qo'shimcha vazifalar qo'shish uchun tugmalarga bosing.", getMainMenu());
});

console.log("✅ Dastur ishga tushdi...");