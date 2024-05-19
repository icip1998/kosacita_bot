import axios from 'axios';
import fs from 'fs';

// Handle for download image from Telegram
const downloadImage = async (fileId: string, token: string): Promise<Buffer> => {
  const url = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
  const response = await axios.get(url);
  const filePath = response.data.result.file_path;
  const imageUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  
  // Save image to folder 'uploads'
  const fileName = `${fileId}.jpg`; // File Name disesuaikan dengan fileId untuk menghindari duplikat
  const filePathToSave = `uploads/${fileName}`;
  fs.writeFileSync(filePathToSave, imageResponse.data);

  return Buffer.from(imageResponse.data, 'binary');
};


export default downloadImage;