import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { insertCompany } from '../factories/create-company-seed';

export default class CompanySeeder implements Seeder {
  public async run(dataSource: DataSource) {
    await Promise.all(
      Array.from({ length: 50 }).map(async () => insertCompany(dataSource)),
    );
  }
}
