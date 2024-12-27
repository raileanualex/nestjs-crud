import { CrudRoutesFactory } from '../crud';
import { CrudOptions } from '../interfaces';

export const Crud = (options: CrudOptions) => (target: Object) => {
  const factoryMethod = options.routesFactory || CrudRoutesFactory;
  new factoryMethod(target, options);
};
