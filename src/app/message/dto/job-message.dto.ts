import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

export class JobMessageDto extends PartialType(CreateMessageDto) {}
