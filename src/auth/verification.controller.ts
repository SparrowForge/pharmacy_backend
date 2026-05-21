import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller()
export class VerificationController {
  constructor(private readonly authService: AuthService) {}

  @Get('verify')
  @ApiOperation({ summary: 'Verify email with verify button link token' })
  @ApiQuery({ name: 'verify_token', required: true, type: String })
  verifyByLink(@Query('verify_token') verifyToken: string) {
    const token = verifyToken?.trim();
    if (!token) {
      throw new BadRequestException('verify_token query parameter is required');
    }

    return this.authService.verifyEmail({ token });
  }
}
