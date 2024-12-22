import { faker } from '@faker-js/faker';

export const createCompany = () => ({
  name: faker.company.name(),
  domain: faker.internet.url(),
  description: faker.lorem.sentence(),
});

export const createProject = (companyId: number) => ({
  name: faker.company.name(),
  companyId,
  description: faker.lorem.sentence(),
  isActive: faker.datatype.boolean(),
});

export const createUserProfile = () => ({
  name: faker.person.firstName(),
});

export const createUser = (companyId: number, projectId: number, profileId: number) => ({
  email: faker.internet.email(),
  isActive: faker.datatype.boolean(),
  name: {
    first: faker.person.firstName(),
    last: faker.person.lastName(),
  },
  projectId,
  companyId,
  profileId,
});

export const createLicence = () => ({
  name: faker.company.name(),
});

export const createUserLicence = (userId: number, licenceId: number) => ({
  userId,
  licenceId,
  yearsActive: faker.number.int(),
});

export const createUserProject = (projectId: number, userId: number) => ({
  projectId,
  userId,
  review: faker.lorem.sentence(),
});

export const createNotes = () => ({
  revisionId: faker.number.int(),
});
