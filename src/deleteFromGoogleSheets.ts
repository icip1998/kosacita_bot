import axios from 'axios';

const deleteFromGoogleSheets = async (userId: string, itemId: string, url: string): Promise<any> => {
  const response = await axios.post(url, {
		action: 'delete',
		userId: userId,
		itemId: itemId,
	});
	return response;
};

export default deleteFromGoogleSheets;