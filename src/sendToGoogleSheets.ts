import axios from 'axios';

interface Item {
  name: string;
  quantity: number;
  price: number;
  vendor: string;
}

interface ReceiptData {
  userId: number;
  processedAt: string;
  items: Item[];
  total: number;
}

const sendToGoogleSheets = async (userId: number, processedAt: string, data: ReceiptData, url: string): Promise<any> => {
  const response = await axios.post(url, {
		action: 'save',
		userId: userId,
		processedAt: processedAt,
		items: data.items,
		total: data.total
	});
	return response;
};

export default sendToGoogleSheets;