import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard } from './auth.guard';
import { isPg, postgresConfig, mySqlConfig } from '../../database';
import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(isPg ? postgresConfig : mySqlConfig),
    CompaniesModule,
    ProjectsModule,
    UsersModule,
    DevicesModule,
    NotesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
