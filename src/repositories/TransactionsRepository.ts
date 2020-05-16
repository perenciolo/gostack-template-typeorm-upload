import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const findTransactions = await this.find();

    const transactions = findTransactions.reduce(
      (sum: { [key: string]: number }, transaction: Transaction) => {
        const value = sum;
        const key = transaction.type;
        if (!value[key]) {
          value[key] = 0;
        }
        value[key] += +transaction.value;
        return value;
      },
      {},
    );

    const { income = 0, outcome = 0 } = transactions;
    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;
