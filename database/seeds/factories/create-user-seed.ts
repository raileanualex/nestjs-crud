import { DataSource } from 'typeorm';
import {
  createUserProfile,
  createUser,
  createUserLicence,
  createUserProject,
  createLicence,
  createNotes,
} from './factory';
import { UserProfile } from '../../../integration/crud-typeorm/users-profiles';
import { User } from '../../../integration/crud-typeorm/users';
import { License, UserLicense } from '../../../integration/crud-typeorm/users-licenses';
import { UserProject } from '../../../integration/crud-typeorm/projects';
import { Note } from '../../../integration/crud-typeorm/notes';

export type CreateFn<T = unknown> = (
  dataSource: DataSource,
) => (projectId: number, userId: number) => Promise<T>;

export const createInsertUser =
  (...fns: CreateFn[]) =>
  (dataSource: DataSource) =>
  async (companyId: number, projectId: number) => {
    const userRepository = dataSource.getRepository(User);
    const userProfileRepository = dataSource.getRepository(UserProfile);

    const userProfileResponse = await userProfileRepository.insert(createUserProfile());
    const userResponse = await userRepository.insert(
      createUser(companyId, projectId, userProfileResponse.identifiers[0].id),
    );

    await Promise.all(
      userResponse.identifiers.map(async (user) =>
        fns.map((fn) => fn(dataSource)(projectId, user.id)),
      ),
    );
  };

export const createInsertUserProject = (dataSource: DataSource) => {
  const userProjectRepository = dataSource.getRepository(UserProject);

  return async (projectId: number, userId: number) => {
    return userProjectRepository.insert(createUserProject(projectId, userId));
  };
};

export const createInsertNotes = (dataSource: DataSource) => async () => {
  const notesRepository = dataSource.getRepository(Note);
  return notesRepository.insert(createNotes());
};

export const createInsertUserLicence = (dataSource: DataSource) => {
  const licenceRepository = dataSource.getRepository(License);
  const userLicenceRepository = dataSource.getRepository(UserLicense);

  return async (_: number, userId: number) => {
    const licenceResponse = await licenceRepository.insert(createLicence());

    return userLicenceRepository.insert(
      createUserLicence(userId, licenceResponse.identifiers[0].id),
    );
  };
};

export const insertUser = createInsertUser(
  createInsertUserLicence,
  createInsertUserProject,
  createInsertNotes,
);
