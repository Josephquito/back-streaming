// src/plataformas/plataformas.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PlataformasService } from './plataformas.service';
import { CreatePlataformaDto } from './dto/create-plataforma.dto';
import { UsuarioActual } from '../auth/decorator/usuario.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plataformas')
@UseGuards(JwtAuthGuard) // Aseguramos que solo usuarios autenticados puedan acceder
export class PlataformasController {
  constructor(private readonly plataformasService: PlataformasService) {}

  @Post()
  create(@Body() dto: CreatePlataformaDto, @UsuarioActual() user: JwtPayload) {
    return this.plataformasService.create(dto, user);
  }

  @Get()
  findAll(@UsuarioActual() user: JwtPayload) {
    return this.plataformasService.findAll(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UsuarioActual() user: JwtPayload) {
    return this.plataformasService.remove(+id, user);
  }
}
