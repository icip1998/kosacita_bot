import Tesseract from 'tesseract.js';

const performOCR = async (imageBuffer: Buffer): Promise<string> => {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    return text;
  } catch (error) {
    console.error('Error performing OCR:', error);
    throw new Error('Failed to perform OCR');
  }
};

export default performOCR;