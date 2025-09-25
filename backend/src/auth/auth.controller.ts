import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        if (file.size > 5 * 1024 * 1024) {
          return cb(
            new BadRequestException('File size must be less than 5MB'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarPath = file ? `/uploads/avatars/${file.filename}` : undefined;
    return await this.authService.register(registerDto, avatarPath);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    return await this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        if (file.size > 5 * 1024 * 1024) {
          return cb(
            new BadRequestException('File size must be less than 5MB'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async updateProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateAuthDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarPath = file ? `/uploads/avatars/${file.filename}` : undefined;
    return await this.authService.updateProfile(
      req.user.id,
      updateProfileDto,
      avatarPath,
    );
  }
}
