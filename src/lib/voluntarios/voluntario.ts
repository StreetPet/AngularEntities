import { AvatarVoluntario } from './avatar-voluntario';
import { Papel } from '../papeis/papel';
import { User } from 'firebase';

export interface Voluntario {
  authUser?: User;
  email: string;
  idade: number;
  sobrenome: any;
  nameToSearch: string;
  uid: string;
  nome: string;
  avatar: AvatarVoluntario;
  papel?: Papel;
}
