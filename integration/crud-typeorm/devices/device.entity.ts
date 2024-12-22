import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@Entity('devices')
export class Device {
  @IsOptional({ always: true })
  @IsUUID('4', { always: true })
  @PrimaryGeneratedColumn('uuid')
  deviceKey: string;

  @IsOptional({ always: true })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  description?: string;
}
