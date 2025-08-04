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
import { ActualizarEmpleadoDto } from './dto/actualizar-empleado.dto';

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
      return this.usuariosService.findTodos(); // Ver todos
    }

    // Admin: solo ver usuarios de su negocio
    if (negocioId == null) {
      throw new ForbiddenException('No tiene un negocio asignado');
    }
    return this.usuariosService.findAllByNegocio(negocioId);
  }

  @Get('todos')
  findTodos(@Request() req: { user: JwtPayload }) {
    const { rol, negocioId } = req.user;

    if (rol === 'superadmin') {
      return this.usuariosService.findTodos();
    }

    if (!negocioId) {
      throw new ForbiddenException('No tiene un negocio asignado');
    }

    return this.usuariosService.findTodosPorNegocio(negocioId);
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
  actualizarUsuario(
    @Param('id') id: string,
    @Body() body: ActualizarAdminDto | ActualizarEmpleadoDto,
    @Request() req: { user: JwtPayload },
  ) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('ID inválido');
    }

    if (req.user.rol === 'superadmin') {
      const dto: ActualizarAdminDto = body;
      return this.usuariosService.actualizarAdminConNegocio(idNum, dto);
    }

    const dto: ActualizarEmpleadoDto = body;
    return this.usuariosService.updateConRestriccion(idNum, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: JwtPayload }) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      throw new BadRequestException('ID inválido');
    }

    const { rol } = req.user;

    if (rol === 'superadmin') {
      return this.usuariosService.removeConRestriccion(idNum, req.user);
    }

    // Si es admin o empleado, solo puede hacer eliminación lógica de su negocio
    return this.usuariosService.updateConRestriccion(
      idNum,
      { activo: false },
      req.user,
    );
  }
}
