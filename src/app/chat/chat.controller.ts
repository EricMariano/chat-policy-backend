import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageService } from '../message/message.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../user/user.enum';
import { Roles } from '../role';
import { User } from '../user';
import { type JwtPayload } from '../types/jwt';
import { ServiceData } from '../types/general';
import { ShareChatDto } from './dto/share-chat.dto';
import { UpdateSharedChatDto } from './dto/update-shared-chat.dto';
import { RemoveSharedChatDto } from './dto/remove-shared-chat.dto';
import { FindChatByIdDto } from './dto/find-chat-by-id.dto';
import { FindPermissionsDto } from './dto/find-permissions.dto';
import { CreateChatDto } from './dto/create-chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Listar mensagens do chat com paginação' })
  @ApiParam({ name: 'chatId', description: 'ID do chat (UUID)' })
  @ApiQuery({
    name: 'lastMessageId',
    required: false,
    description: 'ID da última mensagem para cursor-based pagination',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Mensagens listadas com sucesso' })
  @ApiResponse({
    status: 401,
    description: 'Sem permissão para acessar este chat',
  })
  @ApiResponse({ status: 404, description: 'Chat não encontrado' })
  async findMessages(
    @User() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Query('lastMessageId') lastMessageId?: string,
  ) {
    const serviceData: ServiceData<{ chatId: string; lastMessageId?: string }> =
      {
        userId: user.userId,
        typeUserId: user.userTypeId,
        bodyData: {
          chatId,
          lastMessageId,
        },
      };
    return this.messageService.findMessagesWithPagination(serviceData);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo chat' })
  @ApiBody({ type: CreateChatDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 201, description: 'Chat criado com sucesso' })
  async createChat(@User() user: JwtPayload, @Body() body: CreateChatDto) {
    const serviceData: ServiceData<CreateChatDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return await this.chatService.create(serviceData);
  }

  @Get('scrolling')
  @ApiOperation({ summary: 'Buscar chats por ID com paginação' })
  @ApiQuery({
    name: 'lastChatId',
    required: false,
    description: 'ID do último chat para cursor-based pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (1-100, padrão: 10)',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Chats listados com sucesso' })
  async findChatById(
    @User() user: JwtPayload,
    @Query() query: FindChatByIdDto,
  ) {
    const serviceData: ServiceData<FindChatByIdDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: query,
    };

    return await this.chatService.findChatById(serviceData);
  }

  @Get('shared-scrolling')
  @ApiOperation({ summary: 'Buscar chats compartilhados com paginação' })
  @ApiQuery({
    name: 'lastChatId',
    required: false,
    description: 'ID do último chat para cursor-based pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (1-100, padrão: 10)',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({
    status: 200,
    description: 'Chats compartilhados listados com sucesso',
  })
  async findSharedChatScrolling(
    @User() user: JwtPayload,
    @Query() query: FindChatByIdDto,
  ) {
    const serviceData: ServiceData<FindChatByIdDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: query,
    };
    return await this.chatService.findSharedChatScrolling(serviceData);
  }

  @Post('share')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Compartilhar chat com outro usuário' })
  @ApiBody({ type: ShareChatDto })
  @ApiResponse({ status: 201, description: 'Chat compartilhado com sucesso' })
  @ApiResponse({
    status: 404,
    description: 'Chat, usuário ou role não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Chat já compartilhado com este usuário',
  })
  async shareChat(@User() user: JwtPayload, @Body() body: ShareChatDto) {
    const serviceData: ServiceData<ShareChatDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return await this.chatService.shareChat(serviceData);
  }

  @Patch('share')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Editar role de um compartilhamento de chat' })
  @ApiBody({ type: UpdateSharedChatDto })
  @ApiResponse({
    status: 200,
    description: 'Compartilhamento atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Chat ou compartilhamento não encontrado',
  })
  async updateSharedChat(
    @User() user: JwtPayload,
    @Body() body: UpdateSharedChatDto,
  ) {
    const serviceData: ServiceData<UpdateSharedChatDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return await this.chatService.updateSharedChat(serviceData);
  }

  @Delete('share')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Remover compartilhamento de chat' })
  @ApiQuery({ type: RemoveSharedChatDto })
  @ApiResponse({
    status: 200,
    description: 'Compartilhamento removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Chat ou compartilhamento não encontrado',
  })
  async removeSharedChat(
    @User() user: JwtPayload,
    @Query() body: RemoveSharedChatDto,
  ) {
    const serviceData: ServiceData<RemoveSharedChatDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: body,
    };
    return await this.chatService.removeSharedChat(serviceData);
  }

  @Get('users/shared')
  @ApiOperation({ summary: 'Buscar pessoas com permissão no chat' })
  @ApiQuery({ name: 'chatId', description: 'ID do chat (UUID)' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 200, description: 'Permissões listadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Chat não encontrado' })
  async findPersonHavePermissionChat(
    @User() user: JwtPayload,
    @Query() query: FindPermissionsDto,
  ) {
    const serviceData: ServiceData<FindPermissionsDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: query,
    };
    return await this.chatService.findPersonHavePermissionChat(serviceData);
  }
}
