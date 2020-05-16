import csvParse from 'csv-parse';
import fs from 'fs';

export default async function loadCSV(filePath: string): Promise<Array<any>> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);
  const lines: Array<any> = [];

  parseCSV.on('data', line => {
    lines.push(line);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return Promise.resolve(lines);
}
