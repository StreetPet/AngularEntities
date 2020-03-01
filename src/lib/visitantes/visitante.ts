import { User } from 'firebase';

/**
 * Visitante é a definição dos dados para transporte de User do Firebase
 * 
 * Tais dados são os mesmos usados pelo Objeto User do Firebase, 
 * porém de forma a desacoplar do firebase tais informações.
 */
export interface Visitante{
   uid: string;
   email: string;
   displayName: string;
   photoURL: string;
   emailVerified: boolean;
}
