import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Delete,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Req() req?,
  ) {
    const userId = req?.user?.id;
    return this.searchService.search(query, userId, limit);
  }

  @Get('suggestions')
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 5,
  ) {
    return this.searchService.getSuggestions(query, limit);
  }

  @Get('hashtag/:name')
  async searchHashtag(
    @Query('name') hashtagName: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.searchService.searchHashtag(hashtagName, page, limit);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getSearchHistory(
    @Req() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.searchService.getSearchHistory(req.user.id, limit);
  }

  @Delete('history')
  @UseGuards(JwtAuthGuard)
  async deleteSearchHistory(@Req() req) {
    return this.searchService.deleteSearchHistory(req.user.id);
  }
}
