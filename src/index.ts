import TelegramBot from "node-telegram-bot-api";
import downloadImage from "./utils/downloadImage";
import performOCR from "./performOCR";
import parseReceipt from "./parseReceipt";
import sendToGoogleSheets from "./sendToGoogleSheets";
import getFromGoogleSheets from "./getFromGoogleSheets";
import dotenv from "dotenv"

dotenv.config();

const token: any = process.env.TELEGRAM_BOT_TOKEN;
const googleSheetsUrl : any = process.env.GOOGLE_SHEETS_URL;

// Create instance bot
const bot = new TelegramBot(token, { polling: true });

// Replace 'YOUR_VERCEL_DEPLOYED_URL' with the actual URL of your deployed Vercel app.
const webhookUrl = 'https://kosacita-bot-git-main-irham-ciptadis-projects.vercel.app';
bot.setWebHook(webhookUrl);

// Handler untuk command /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Send me an image of your receipt or use /list to see your purchases.');
});

// Handler untuk command /list
bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id?.toString(); // Get userId from user Telegram

  if (!userId) {
    bot.sendMessage(chatId, 'User ID not found.');
    return;
  }

  try {
    const response = await getFromGoogleSheets(userId, googleSheetsUrl);
    const data = response.data;

    if (!data || data.error || data.length === 0) {
      bot.sendMessage(chatId, 'No data found for your user ID.');
      return;
    }

    let message = 'Your shopping list:\n\n';
    data.forEach((item: any) => {
      message += `Name: ${item.name}\n`;
      message += `Qty: ${item.qty}\n`;
      message += `Price: ${item.price}\n`;
      message += `Vendor: ${item.vendor}\n\n`;
    });

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    bot.sendMessage(chatId, 'Error fetching data from Google Sheets.');
  }
});

// Handler untuk command /recent
bot.onText(/\/recent/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id?.toString(); // Get userId from user Telegram
	const limit = 5;

  if (!userId) {
    bot.sendMessage(chatId, 'User ID not found.');
    return;
  }

  try {
    const response = await getFromGoogleSheets(userId, googleSheetsUrl, limit);
    const data = response.data;

    if (!data || data.error || data.length === 0) {
      bot.sendMessage(chatId, 'No data found for your user ID.');
      return;
    }

    // Ambil 5 data row terbaru
    let message = '5 most recent purchases:\n\n';
    data.forEach((item: any) => {
      message += `Name: ${item.name}\n`;
      message += `Qty: ${item.qty}\n`;
      message += `Price: ${item.price}\n`;
      message += `Vendor: ${item.vendor}\n\n`;
    });

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    bot.sendMessage(chatId, 'Error fetching data from Google Sheets.');
  }
});

// Listen send image
bot.on("photo", async (msg: any) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const userId = msg.from.id;
  const processedAt = new Date().toISOString();

  try {
    bot.sendMessage(chatId, "Sedang memproses gambar...");

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
      total: parsedData.total
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
