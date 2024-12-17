export class TestSerializeModel {
  declare id: number;
  declare name: string;
  declare email: string;
  declare isActive: boolean;

  constructor(partial: Partial<TestSerializeModel>) {
    Object.assign(this, partial);
  }
}
