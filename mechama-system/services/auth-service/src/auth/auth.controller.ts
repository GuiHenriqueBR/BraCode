import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiResponse } from '@mechama/types';
import { logger } from '@mechama/shared';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    try {
      const result = await this.authService.register(registerDto);
      
      logger.info('User registered successfully', { email: registerDto.email });
      
      return {
        success: true,
        message: 'Usuário registrado com sucesso. Verifique seu email.',
        data: result,
      };
    } catch (error) {
      logger.error('Registration failed', error as Error, { email: registerDto.email });
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const result = await this.authService.login(loginDto);
      
      logger.info('User logged in successfully', { email: loginDto.email });
      
      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      };
    } catch (error) {
      logger.error('Login failed', error as Error, { email: loginDto.email });
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<ApiResponse> {
    try {
      const result = await this.authService.refreshToken(refreshToken);
      
      return {
        success: true,
        message: 'Token renovado com sucesso',
        data: result,
      };
    } catch (error) {
      logger.error('Token refresh failed', error as Error);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string): Promise<ApiResponse> {
    try {
      await this.authService.logout(refreshToken);
      
      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    } catch (error) {
      logger.error('Logout failed', error as Error);
      throw error;
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string): Promise<ApiResponse> {
    try {
      await this.authService.verifyEmail(token);
      
      return {
        success: true,
        message: 'Email verificado com sucesso',
      };
    } catch (error) {
      logger.error('Email verification failed', error as Error, { token });
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string): Promise<ApiResponse> {
    try {
      await this.authService.forgotPassword(email);
      
      return {
        success: true,
        message: 'Email de recuperação enviado',
      };
    } catch (error) {
      logger.error('Forgot password failed', error as Error, { email });
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponse> {
    try {
      await this.authService.resetPassword(resetPasswordDto);
      
      return {
        success: true,
        message: 'Senha redefinida com sucesso',
      };
    } catch (error) {
      logger.error('Password reset failed', error as Error);
      throw error;
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<ApiResponse> {
    try {
      await this.authService.changePassword(req.user.id, changePasswordDto);
      
      return {
        success: true,
        message: 'Senha alterada com sucesso',
      };
    } catch (error) {
      logger.error('Password change failed', error as Error, { userId: req.user?.id });
      throw error;
    }
  }

  // 2FA endpoints
  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  async setup2FA(@Req() req: Request): Promise<ApiResponse> {
    try {
      const result = await this.authService.setup2FA(req.user.id);
      
      return {
        success: true,
        message: '2FA configurado',
        data: result,
      };
    } catch (error) {
      logger.error('2FA setup failed', error as Error, { userId: req.user?.id });
      throw error;
    }
  }

  @Post('2fa/verify')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Req() req: Request,
    @Body('token') token: string
  ): Promise<ApiResponse> {
    try {
      await this.authService.verify2FA(req.user.id, token);
      
      return {
        success: true,
        message: '2FA ativado com sucesso',
      };
    } catch (error) {
      logger.error('2FA verification failed', error as Error, { userId: req.user?.id });
      throw error;
    }
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async disable2FA(
    @Req() req: Request,
    @Body('token') token: string
  ): Promise<ApiResponse> {
    try {
      await this.authService.disable2FA(req.user.id, token);
      
      return {
        success: true,
        message: '2FA desativado com sucesso',
      };
    } catch (error) {
      logger.error('2FA disable failed', error as Error, { userId: req.user?.id });
      throw error;
    }
  }

  // OAuth endpoints
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const result = await this.authService.oauthCallback(req.user);
      
      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}&refresh=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback failed', error as Error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(): Promise<void> {
    // Initiates Facebook OAuth flow
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const result = await this.authService.oauthCallback(req.user);
      
      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}&refresh=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Facebook OAuth callback failed', error as Error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }
}