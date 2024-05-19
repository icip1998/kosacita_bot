import axios from 'axios';

const getFromGoogleSheets = async (userId: any, url: string, limit: number = 10): Promise<any> => {
  const response = await axios.get(`${url}?userId=${userId}&limit=${limit}`);
	return response;
};

export default getFromGoogleSheets;