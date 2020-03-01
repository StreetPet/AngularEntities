import { Papeis } from './papel';

export interface Actions {
   [index: string]: Action;
}

export interface Action {
   uid: string;
   name: string;
   description: string;
   /**
    * "level" define o nível de prioridade da ação, tanto na ordem de execução
    * como também nível de autoridade no sistema, os nívies são grupos de
    * milhares por tanto administradores estão na milhar inicial de 000 até 999,
    * todas as ações administrativas devem estar neste nível, os demais níveis
    * são ações gerais do sistema.
    * 
    * Veja o arquivo:
    *       Actions.json para detalhes das ações já identificadas no sistema
    */
   level: number;

   /**
    * id que identifica o nível superior ao qual este é subordinado.
    * 
    * Por exemplo havendo um nível 400 -> "Atribuir voluntário a ponto de apoio"
    * A ação 600 -> "Remover voluntário de ponto de apoio" pode ser definida
    * como inferior ou subordinada a ação 400, assim somente se a ação 400 
    * for dada ao papel este poderá também receber a ação.
    * 
    * Voce pode criar uma ação que não faz nada, para agrupar outras ações.
    * Assim para libera-las vc precisa atribuir a ação pai primeiro.
    */
   parent: number;

   /**
    * Lista os papeis que estão utilizando esta ação.
    * 
    * Haverá uma função responsável por manter esta proriedade.
    */
   papeis?: Papeis | string[] | any[];
}