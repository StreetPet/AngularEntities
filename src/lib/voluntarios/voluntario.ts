import { AvatarVoluntario } from '../avatar/avatar-voluntario';
import { Papel } from '../papeis';
import { Visitante } from '../visitantes';

/**
 * Voluntário é o contrato para transporte dos dados dos Voluntários
 *
 * Todo Voluntário ou pessoa física que atua no sistema tem seus dados
 * transportados e manipulados através de objetos que implementam esta
 * interface.
 *
 * Atenção authUser é o objeto obtido durante a autenticação com firebase,
 * porém é representado no sistema como sendo Visitantes, veja que o objeto
 * User do Firebase deve ser transportado para o objeto Visitante permitindo
 * assim sua manipulação no sistema de forma desacoplada. O Serviço
 * VoluntáriosService é responsável por fazer esta tradução.
 */
export interface Voluntario {

  /**
   *  Equivale ao objeto User que foi persistido no banco de dados do Firebase
   */
  authUser?: Visitante;
  email: string;
  idade: number;
  sobrenome: any;
  nameToSearch: string;
  /**
   * ID único gerado pelo firebase de forma a identificar esta estrutura 
   * de dados em todo o sistema.
   */
  uid: string;
  nome: string;
  /**
   * Avatar que representa o voluntário
   * Pode ser o objeto Avatar que representa um Avatar armazenado no sistema,
   * ou pode ser uma string com a URL, pode vir a ocorrer que a string seja uma
   * representação base64 da imagem, neste caso ela pode vir a ser convertida
   * no objeto AvatarUsuario
   */
  avatar: AvatarVoluntario | string;
  /**
   * Array de papeis ou dos IDs dos papeis.
   *
   * Any é usado para transição do DocumentRef quando em transito os dados
   * do firebase para uso local, quando será convertido para Papeis ou UID
   * do Papeis
   */
  papeis?: Papel[] | string[] | any[];
  /**
   * Papeis solicitados para este voluntário que ainda não fora aprovados.
   */
  papeisEmEspera?: Papel[] | string[] | any[];
}


