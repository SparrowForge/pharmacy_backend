import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, VerificationController],
  providers: [AuthService],
})
export class AuthModule {}
