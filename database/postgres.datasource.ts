import { DataSource } from 'typeorm';
import { createDbConfig, DatabaseType } from './config';

export const postgresConfig = createDbConfig(DatabaseType.POSTGRES);
export const postgresDataSource = new DataSource(postgresConfig);
