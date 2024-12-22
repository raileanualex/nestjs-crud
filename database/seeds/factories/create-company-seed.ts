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

    return Promise.all(
      companyResult.identifiers.map(async (companyIdentifier) =>
        fns.map((fn) => fn(dataSource)(companyIdentifier.id)),
      ),
    );
  };

export const createInsertProject =
  (...fns: CreateFn[]) =>
  (dataSource: DataSource) =>
  async (companyId: number) => {
    const projectRepository = dataSource.getRepository(Project);
    const projectResult = await projectRepository.insert(createProject(companyId));

    return Promise.all(
      projectResult.identifiers.map(async (projectIdentifier) =>
        fns.map((fn) => fn(dataSource)(companyId, projectIdentifier.id)),
      ),
    );
  };

export const insertCompany = createInsertCompany(createInsertProject(insertUser));
