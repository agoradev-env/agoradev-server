import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import {
  SignupDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SocialAuthDto,
} from './dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  private get jwt() {
    return this.jwtService;
  }

  private get supabase() {
    return this.databaseService.getClient();
  }

  /**
   * Sign up a new user
   */
  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, password, fullName } = signupDto;

    // Sign up with Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data.user) {
      throw new UnauthorizedException('Failed to create user');
    }

    // Create user profile in custom table
    await this.databaseService.insert('profiles', {
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      created_at: new Date().toISOString(),
    });

    // Generate JWT tokens
    const tokens = this.generateTokens(data.user.id, data.user.email);

    return {
      ...tokens,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName,
        createdAt: data.user.created_at,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Login with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!data.user) {
      throw new UnauthorizedException('Login failed');
    }

    // Get user profile
    const profile = await this.getUserProfile(data.user.id);

    // Generate JWT tokens
    const tokens = this.generateTokens(data.user.id, data.user.email);

    return {
      ...tokens,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name,
        createdAt: data.user.created_at,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Verify email with OTP/code
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ success: boolean }> {
    const { email, code } = verifyEmailDto;

    const { error } = await this.supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    return { success: true };
  }

  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ success: boolean }> {
    const { email } = forgotPasswordDto;

    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw new UnauthorizedException('Failed to send reset email');
    }

    return { success: true };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean }> {
    const { token, newPassword } = resetPasswordDto;

    // First verify the token by getting the user
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Update the password
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new UnauthorizedException('Failed to update password');
    }

    return { success: true };
  }

  /**
   * Social authentication (Google/Apple)
   */
  async socialAuth(socialAuthDto: SocialAuthDto): Promise<AuthResponseDto> {
    const { provider, accessToken } = socialAuthDto;

    let authResult;

    if (provider === 'google') {
      authResult = await this.supabase.auth.signInWithIdToken({
        provider: 'google',
        token: accessToken,
      });
    } else if (provider === 'apple') {
      authResult = await this.supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: accessToken,
      });
    } else {
      throw new UnauthorizedException('Unsupported provider');
    }

    if (authResult.error) {
      throw new UnauthorizedException(authResult.error.message);
    }

    if (!authResult.data.user) {
      throw new UnauthorizedException('Social auth failed');
    }

    const user = authResult.data.user;

    // Check if profile exists, create if not
    const profile = await this.getUserProfile(user.id);
    if (!profile) {
      await this.databaseService.insert('profiles', {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        created_at: new Date().toISOString(),
      });
    }

    // Generate JWT tokens
    const tokens = this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || profile?.full_name,
        createdAt: user.created_at,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwt.verify(refreshToken);
      const { sub: userId, email } = payload;

      // Generate new access token
      const accessToken = this.jwt.sign({ sub: userId, email });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean }> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new UnauthorizedException('Logout failed');
    }

    return { success: true };
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken };
  }

  /**
   * Get user profile from database
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      return await this.databaseService.selectById('profiles', userId);
    } catch (error) {
      return null;
    }
  }
}
