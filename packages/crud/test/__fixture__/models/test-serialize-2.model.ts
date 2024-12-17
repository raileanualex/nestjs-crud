import { Exclude } from 'class-transformer';

import { TestSerializeModel } from './test-serialize.model';

export class TestSerialize2Model extends TestSerializeModel {
  declare id: number;
  declare name: string;
  declare email: string;

  @Exclude()
  declare isActive: boolean;

  constructor(partial: Partial<TestSerialize2Model>) {
    super(partial);
    Object.assign(this, partial);
  }
}
