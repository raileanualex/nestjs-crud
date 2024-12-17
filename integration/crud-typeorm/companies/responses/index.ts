import { SerializeOptions } from '@n4it/crud';
import { GetCompanyResponseDto } from './get-company-response.dto';

export const serialize: SerializeOptions = {
  get: GetCompanyResponseDto,
};
