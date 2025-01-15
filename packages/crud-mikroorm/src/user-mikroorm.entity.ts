import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  nameFirst!: string;

  @Property()
  nameLast!: string;

  @Property()
  companyId!: number;

  @Property()
  email!: string;
}
