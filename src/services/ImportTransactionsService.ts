import path from 'path';
import fs from 'fs';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import loadCSV from '../utils/loadCSV';
import Category from '../models/Category';

interface Request {
  csvTransactionsFilename: string;
}

interface CreateTransactionRequest {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute({ csvTransactionsFilename }: Request): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);
    const csvPath = path.join(uploadConfig.directory, csvTransactionsFilename);
    const csvTransactionsFileExists = await fs.promises.stat(csvPath);

    if (!csvTransactionsFileExists) {
      throw new AppError('File not found', 404);
    }

    try {
      const csvData = await loadCSV(csvPath);
      const categories = csvData
        .map(item => item.slice(-1)[0])
        .filter((value, index, self) => self.indexOf(value) === index);
      const existentCategories = await categoriesRepository.find({
        where: {
          title: In(categories),
        },
      });
      const existentCategoriesTitles = existentCategories.map(
        (category: Category) => category.title,
      );
      const categoriesToAdd = categories.filter(
        (category: string) => !existentCategoriesTitles.includes(category),
      );
      const newCategories = categoriesRepository.create(
        categoriesToAdd.map((title: string) => ({
          title,
        })),
      );
      await categoriesRepository.save(newCategories);
      const allCategories = [...existentCategories, ...newCategories];
      const transactions = transactionsRepository.create(
        csvData.map(transaction => ({
          title: transaction[0],
          type: transaction[1],
          value: transaction[2],
          category: allCategories.find(
            (category: Category) => category.title === transaction[3],
          ),
        })),
      );
      await transactionsRepository.save(transactions);
      await fs.promises.unlink(csvPath);
      return transactions;
    } catch (error) {
      throw new AppError(error.message);
    }
  }
}

export default ImportTransactionsService;
