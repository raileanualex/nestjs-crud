import { DataSource } from 'typeorm';
import { createDbConfig, DatabaseType } from './config';

export const mySqlConfig = createDbConfig(DatabaseType.MYSQL);
export const mysqlDataSource = new DataSource(mySqlConfig);
