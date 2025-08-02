// src/auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: number;
  id: number;
  rol: 'superadmin' | 'admin' | 'empleado';
  negocioId?: number | null;
  nombre: string;
}
