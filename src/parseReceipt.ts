interface Item {
  name: string;
  quantity: number;
  price: number;
  vendor: string;
}

interface ParsedData {
  items: Item[];
  total: number;
}

const parseReceipt = (extractedText: string): ParsedData => {
  const lines = extractedText.split('\n');
  const items: Item[] = [];
  let total = 0;

  lines.forEach((line) => {
    const match = line.match(/^(.+?)\s+(\d+)\s+(\d+,\d+)/);
    if (match) {
      const name = match[1].trim();
      const quantity = parseInt(match[2].trim());
      const price = parseFloat(match[3].replace(',', '.').trim());
      items.push({ name, quantity, price, vendor: 'Indomaret' });
    }

    const totalMatch = line.match(/^HARGA JUAL\s+(\d+,\d+)/);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(',', '.').trim());
    }
  });

  return { items, total };
};

export default parseReceipt;
