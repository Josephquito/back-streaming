import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Plataforma } from './plataforma.entity';
import { Negocio } from './negocio.entity';

@Entity('inventario_perfil')
export class InventarioPerfil {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plataforma, { eager: true })
  plataforma: Plataforma;

  @Column()
  plataformaId: number;

  @ManyToOne(() => Negocio, { eager: true })
  negocio: Negocio;

  @Column()
  negocioId: number;

  @Column('int', { default: 0 })
  stock_perfiles: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costo_promedio: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valor_total: number;
}
