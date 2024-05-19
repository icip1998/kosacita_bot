import axios from 'axios';

const getFromGoogleSheets = async (userId: any, url: string, action: string = 'list', limit: number = 10): Promise<any> => {
  const response = await axios.get(`${url}?userId=${userId}&action=${action}&limit=${limit}`);
	return response;
};

export default getFromGoogleSheets;