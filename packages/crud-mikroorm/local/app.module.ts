import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UsersService } from './users.service';
import { EntityCaseNamingStrategy, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { UsersController } from './user.controller';
import { Users } from './user-mikroorm.entity';

@Module({
  imports: [
    MikroOrmModule.forRoot({
        entities: [Users], // Your entity
        dbName: 'nestjsx_crud', // Replace with your local database name
        user: 'root', // Replace with your PostgreSQL username
        password: 'root', // Replace with your PostgreSQL password
        port: 5432, // Default PostgreSQL port
        host: 'localhost', // Assuming your database is local
        debug: true, // Optional: Enable SQL query logging
        driver: PostgreSqlDriver,
        namingStrategy: EntityCaseNamingStrategy,
        allowGlobalContext: true
    }),
    MikroOrmModule.forFeature([Users]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class AppModule {}
