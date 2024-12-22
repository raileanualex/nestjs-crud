import { DataSource } from 'typeorm';
import { createDbConfig, DatabaseType } from './config';

export const type =
  (process.env.TYPEORM_CONNECTION as 'postgres' | 'mysql') ?? 'postgres';
export const isPg = type === 'postgres';

export default new DataSource(
  createDbConfig(isPg ? DatabaseType.POSTGRES : DatabaseType.MYSQL),
);
