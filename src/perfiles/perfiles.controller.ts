// src/perfiles/perfiles.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Perfil } from 'src/entities/perfil.entity';

@UseGuards(JwtAuthGuard)
@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Post()
  create(@Body() dto: CreatePerfilDto, @UsuarioActual() usuario: JwtPayload) {
    return this.perfilesService.create(dto, usuario);
  }

  @Get('cuenta/:cuentaId')
  getPerfilesPorCuenta(
    @Param('cuentaId', ParseIntPipe) cuentaId: number,
  ): Promise<Perfil[]> {
    return this.perfilesService.findByCuentaId(cuentaId);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePerfilDto) {
    return this.perfilesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.perfilesService.remove(id);
  }
}
