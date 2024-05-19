import TelegramBot from "node-telegram-bot-api";
import downloadImage from "./utils/downloadImage";
import performOCR from "./performOCR";
import parseReceipt from "./parseReceipt";
import sendToGoogleSheets from "./sendToGoogleSheets";
import getFromGoogleSheets from "./getFromGoogleSheets";
import deleteFromGoogleSheets from "./deleteFromGoogleSheets";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

const token: any = process.env.TELEGRAM_BOT_TOKEN;
const googleSheetsUrl: any = process.env.GOOGLE_SHEETS_URL;

app.get("/", (req, res) => res.send("Hello world!"));

// Create instance bot
const bot = new TelegramBot(token, { polling: true });

// Replace 'YOUR_VERCEL_DEPLOYED_URL' with the actual URL of your deployed Vercel app.
const webhookUrl =
  "https://kosacita-bot-git-main-irham-ciptadis-projects.vercel.app";
bot.setWebHook(webhookUrl);

// Handler untuk command /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Welcome! Send me an image of your receipt or use /list to see your purchases."
  );
});

// Handler untuk command /list
bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id?.toString(); // Ambil userId dari pengguna Telegram
	const action = 'list';

  if (!userId) {
    bot.sendMessage(chatId, 'User ID not found.');
    return;
  }

  try {
		bot.sendMessage(chatId, "Sedang memproses harap tunggu...");
		
    const response = await getFromGoogleSheets(userId, googleSheetsUrl, action);
    const data = response.data;

    if (!data || data.error || data.length === 0) {
      bot.sendMessage(chatId, 'No data found for your user ID.');
      return;
    }

		if (!Array.isArray(data)) {
			bot.sendMessage(chatId, "Your shopping list is empty.");
			return;
		}

    // let message = 'Your shopping list:\n\n';
    data.forEach((item: any) => {
      const message = `
        ID: ${item.id}
        Name: ${item.name}
        Qty: ${item.qty}
        Price: ${item.price}
        Vendor: ${item.vendor}
      `;

      bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Delete', callback_data: `delete_${item.id}` }]
          ]
        }
      });
    });
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    bot.sendMessage(chatId, 'Error fetching data from Google Sheets.');
  }
});

// Handler untuk menangani callback query
bot.on('callback_query', async (callbackQuery) => {
  const message:any = callbackQuery.message;
  const data:any = callbackQuery.data;

  if (data.startsWith('delete_')) {
    const itemId = data.split('_')[1];
    const userId = callbackQuery.from.id.toString();

    try {
			const response = await deleteFromGoogleSheets(userId, itemId, googleSheetsUrl);
      const deleteData = response.data;

      if (deleteData.error) {
        bot.sendMessage(message.chat.id, `Error: ${deleteData.error}`);
      } else {
        bot.sendMessage(message.chat.id, 'Item deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting item from Google Sheets:', error);
      bot.sendMessage(message.chat.id, 'Error deleting item from Google Sheets.');
    }
  }
});

// Handler untuk command /recent
bot.onText(/\/recent/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id?.toString(); // Get userId from user Telegram
	const action = 'list';
  const limit = 5;

  if (!userId) {
    bot.sendMessage(chatId, "User ID not found.");
    return;
  }

  try {
		bot.sendMessage(chatId, "Sedang memproses harap tunggu...");

    const response = await getFromGoogleSheets(userId, googleSheetsUrl, action, limit);
    const data = response.data;

    if (!data || data.error || data.length === 0) {
      bot.sendMessage(chatId, "No data found for your user ID.");
      return;
    }

		if (!Array.isArray(data)) {
			bot.sendMessage(chatId, "Your shopping list is empty.");
			return;
		}

    let message = "5 most recent purchases:\n\n";
    data.forEach((item: any) => {
      message += `ID: ${item.id}\n`;
      message += `Name: ${item.name}\n`;
      message += `Qty: ${item.qty}\n`;
      message += `Price: ${item.price}\n`;
      message += `Vendor: ${item.vendor}\n\n`;
    });

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    bot.sendMessage(chatId, "Error fetching data from Google Sheets.");
  }
});

// Handler untuk command /summary
bot.onText(/\/summary/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id?.toString(); // Ambil userId dari pengguna Telegram
	const action = 'summary';

  if (!userId) {
    bot.sendMessage(chatId, 'User ID not found.');
    return;
  }

  try {
    const response = await getFromGoogleSheets(userId, googleSheetsUrl, action);
    const summary = response.data;

    if (!summary || summary.error) {
      bot.sendMessage(chatId, 'Error fetching summary data.');
      return;
    }

    let message = `Total Expenses: ${summary.totalExpense.toFixed(2)}\n`;
    message += '\nTop Items:\n';
    summary.topItems.forEach((item: string, index: number) => {
      message += `${index + 1}. ${item}\n`;
    });

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching summary data:', error);
    bot.sendMessage(chatId, 'Error fetching summary data.');
  }
});

// Listen send image
bot.on("photo", async (msg: any) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const userId = msg.from.id;
  const processedAt = new Date().toISOString();

  try {
    bot.sendMessage(chatId, "Sedang memproses harap tunggu...");

    const imageBuffer = await downloadImage(fileId, token);
    const extractedText = await performOCR(imageBuffer);
    const parsedData = parseReceipt(extractedText);

    // bot.sendMessage(
    //   chatId,
    //   `Data yang diekstrak:\n${JSON.stringify(parsedData, null, 2)}`
    // );

    const receiptData = {
      userId: userId,
      processedAt: processedAt,
      items: parsedData.items,
      total: parsedData.total,
    };

    await sendToGoogleSheets(userId, processedAt, receiptData, googleSheetsUrl);

    // bot.sendMessage(chatId, `Data telah disimpan ke Google Sheets:\n${JSON.stringify(receiptData, null, 2)}`);
    bot.sendMessage(chatId, `Data berhasil disimpan!`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Terjadi kesalahan saat memproses gambar.");
  }
});

// Handler untuk pesan atau perintah yang tidak dikenali
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, 'Sorry, I don\'t understand that command. Please use /list or /recent.');
// });

console.log("Bot is running...");

module.exports = app;
