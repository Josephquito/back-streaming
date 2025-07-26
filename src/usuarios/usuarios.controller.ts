import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CrearAdminDto } from './dto/crear-admin.dto';
import { ActualizarAdminDto } from './dto/actualizar-admin.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() body: CrearAdminDto, @Request() req: { user: JwtPayload }) {
    return this.usuariosService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req: { user: JwtPayload }) {
    const { rol, negocioId } = req.user;

    if (rol === 'superadmin') {
      return this.usuariosService.findAll(); // Ver todos
    }

    // Admin: solo ver usuarios de su negocio
    if (negocioId == null) {
      throw new ForbiddenException('No tiene un negocio asignado');
    }
    return this.usuariosService.findAllByNegocio(negocioId);
  }

  @Get('admins')
  findAdmins(@Request() req: { user: JwtPayload }) {
    const user = req.user;

    if (user.rol !== 'superadmin') {
      throw new ForbiddenException('Solo el superadmin puede ver los admins');
    }

    return this.usuariosService.findAdmins(); // 👈 tu método personalizado
  }
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('ID inválido');
    }
    return this.usuariosService.findOneConRestriccion(idNum, req.user);
  }

  @Patch(':id')
  actualizarAdmin(
    @Param('id') id: string,
    @Body() body: ActualizarAdminDto,
    @Request() req: { user: JwtPayload },
  ) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('ID inválido');
    }

    if (req.user.rol !== 'superadmin') {
      throw new ForbiddenException(
        'Solo el superadmin puede editar administradores y sus negocios',
      );
    }

    return this.usuariosService.actualizarAdminConNegocio(idNum, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    return this.usuariosService.removeConRestriccion(+id, req.user);
  }
}
