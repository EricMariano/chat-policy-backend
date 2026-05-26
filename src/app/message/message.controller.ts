import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ServiceData } from '../types/general';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../user/user.enum';
import { Roles } from '../role';
import { User } from '../user';
import { type JwtPayload } from '../types/jwt';

@ApiTags('message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova mensagem' })
  @ApiBody({ type: CreateMessageDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiResponse({ status: 201, description: 'Mensagem criada com sucesso' })
  @ApiResponse({ status: 401, description: 'Sem permissão para enviar mensagens neste chat' })
  create(@User() user: JwtPayload, @Body() createMessageDto: CreateMessageDto) {
    const serviceData: ServiceData<CreateMessageDto> = {
      userId: user.userId,
      typeUserId: user.userTypeId,
      bodyData: createMessageDto
    };
    return this.messageService.createClient(serviceData);
  }
}
