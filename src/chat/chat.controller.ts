import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { RecommendRequestDto } from './dto/recommend-request.dto';
import { RecommendResponseDto } from './dto/recommend-response.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('recommend')
  @ApiOperation({
    summary: '음식 및 맛집 추천 요청',
    description: '사용자 질문을 분석하여 관련 맛집을 추천합니다',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 추천 정보를 생성한 경우',
    type: RecommendResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '음식/맛집과 관련없는 질문이거나 요청 형식이 잘못된 경우',
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류',
  })
  async recommend(
    @Body() body: RecommendRequestDto,
  ): Promise<RecommendResponseDto> {
    try {
      if (!body.query) {
        throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
      }
      const maxResults = body.max_results ?? 5;
      return await this.chatService.processRecommendation(
        body.query,
        maxResults,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error processing recommendation',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
