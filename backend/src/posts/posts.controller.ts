import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/posts',
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
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (file) createPostDto.image = `/uploads/posts/${file.filename}`;
    return await this.postsService.create(createPostDto, req.user.id);
  }

  @Get('/')
  async findAll(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const cursorNum = cursor ? parseInt(cursor) : undefined;
    const limitNum = limit ? parseInt(limit) : 10;
    const userId = req.user?.id;
    return await this.postsService.findAll(cursorNum, limitNum, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-posts')
  async findMyPosts(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return await this.postsService.findMyPosts(req.user.id, pageNum, limitNum);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user?.id;
    return await this.postsService.findOne(+id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/posts',
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
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (file) updatePostDto.image = `/uploads/posts/${file.filename}`;
    return await this.postsService.update(+id, updatePostDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async remove(@Param('id') id: string, @Req() req) {
    return await this.postsService.remove(+id, req.user.id);
  }
}
