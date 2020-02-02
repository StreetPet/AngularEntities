import { AvatarVoluntario } from './avatar-voluntario';
import { Papel } from '../papeis/papel';

export interface Voluntario {
  email: string;
  idade: number;
  sobrenome: any;
  nameToSearch: string;
  uid: string;
  nome: string;
  avatar: AvatarVoluntario;
  papel?: Papel;
}
