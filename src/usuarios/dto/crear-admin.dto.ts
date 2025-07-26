export class CrearAdminDto {
  nombre: string;
  apellido: string;
  correo: string;
  clave: string;
  telefono?: string;
  rol: string; // Se convierte en enum dentro del servicio
  negocio?: {
    nombre: string;
    correo_contacto: string;
    telefono: string;
  };
}
