import { Actions } from './action';

/**
 * Representa o Array que conterá os papeis, deve sempre ser seguido o seguinte formato.
 */
export interface Papeis {
   [index: string]: Papel;
}

export interface Papel {
   uid: string;
   icone: string;
   nome: string;
   descricao: string;
   /**
    * Tipo define a aplicação do papel
    *  - 0 para Voluntários e pessoas físicas,
    *  - 1 para PETs, 20 para pessoas juriticas,
    *  - 50 para sistemas de apoio, microserviços e embarcados
    */
   readonly tipo: number;
   /**
    * "Actions" representam as ações possiveis por este papel.
    * no módulo de GerencialGeral haverá uma tela contendo uma matriz,
    * onde cada coluna representa um Papel e cda linha uma ação, ao marcar
    * A interção entre colunas e linha atribui-se ao papel a autorização 
    * para que for investido deste papel poderá faze-lo
    * Nesta versão ou se pode ou não se pode fazer uma ação, 
    * qualquer papel que for autorizado a fazer esta ação tem preferencia 
    * aos demais.
    * 
    */
   actions?: Actions | string[] | any[];

}
