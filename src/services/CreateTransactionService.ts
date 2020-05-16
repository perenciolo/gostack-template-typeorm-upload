import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const fixedValue = +(value * 100).toFixed() / 100;

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(transactionCategory);
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Transaction type must be either income or outcome');
    }

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && fixedValue > total) {
      throw new AppError(
        'Unable to process this transaction due insufficient funds',
      );
    }

    const transction = transactionRepository.create({
      title,
      type,
      value: fixedValue,
      category: transactionCategory,
    });
    await transactionRepository.save(transction);
    return transction;
  }
}

export default CreateTransactionService;
