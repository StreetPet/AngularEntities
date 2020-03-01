import { Avatar } from './avatar';

export interface AvatarVoluntario extends Avatar{
  /**
   * Deve obrigatóriamente ser 1 para Voluntáiro
   */
  readonly type: number;
  
}
