import { DataSource } from 'typeorm';
import { createCompany, createProject } from './factory';
import { Company } from '../../../integration/crud-typeorm/companies';
import { Project } from '../../../integration/crud-typeorm/projects';
import { insertUser } from './create-user-seed';

export type CreateFn<T = unknown> = (
  dataSource: DataSource,
) => (companyId: number, projectId?: number) => Promise<T>;

export const createInsertCompany =
  (...fns: CreateFn[]) =>
  async (dataSource: DataSource) => {
    const companyRepository = dataSource.getRepository(Company);
    const companyResult = await companyRepository.insert(createCompany());

    await Promise.all(fns.map((fn) => fn(dataSource)(companyResult.identifiers[0].id)));
  };

export const createInsertProject =
  (...fns: CreateFn[]) =>
  (dataSource: DataSource) =>
  async (companyId: number) => {
    const projectRepository = dataSource.getRepository(Project);
    const projectResult = await projectRepository.insert(createProject(companyId));

    await Promise.all(
      fns.map((fn) => fn(dataSource)(companyId, projectResult.identifiers[0].id)),
    );
  };

export const insertCompany = createInsertCompany(createInsertProject(insertUser));
