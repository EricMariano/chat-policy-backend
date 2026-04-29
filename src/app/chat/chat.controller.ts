import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageService } from '../message/message.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../user/user.enum';
import { Roles } from '../role';
import { User } from '../user';
import { type JwtPayload } from '../types/jwt';
import { ServiceData } from '../types/general';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  

  // @Post()
  // @ApiBody({ type: ChatRequestDto })
  // @ApiOkResponse({ type: ChatResponseDto })
  // async chat(@Body() body?: ChatRequestDto): Promise<ChatResponseDto> {
  //   const question = body?.question;
  //   if (!question || typeof question !== 'string' || !question.trim()) {
  //     throw new BadRequestException(
  //       'question is required and must be non-empty',
  //     );
  //   }
  //   return this.chatService.ask(question.trim());
  // }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Listar mensagens do chat com paginação' })
  @ApiParam({ name: 'chatId', description: 'ID do chat (UUID)' })
  @ApiQuery({ name: 'lastMessageId', required: false, description: 'ID da última mensagem para cursor-based pagination' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Mensagens listadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Sem permissão para acessar este chat' })
  @ApiResponse({ status: 404, description: 'Chat não encontrado' })
  async findMessages(
    @User() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Query('lastMessageId') lastMessageId?: string,
  ) {
    const serviceData: ServiceData<{ chatId: string; lastMessageId?: string }> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: {
        chatId,
        lastMessageId,
      },
    };
    return this.messageService.findMessagesWithPagination(serviceData);
  }
}
