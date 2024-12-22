import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Type } from 'class-transformer';
import { License } from './license.entity';

@Entity('user_licenses')
export class UserLicense {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  licenseId: number;

  @ManyToOne(() => User)
  @Type(() => User)
  user: User;

  @ManyToOne(() => License)
  @Type(() => License)
  license: License;

  @Column()
  yearsActive: number;
}
