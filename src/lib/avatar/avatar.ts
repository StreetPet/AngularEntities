export interface Avatar{
   /**
    * Quando Avatar é criado deve ser definido o tipo,
    * que é diretamente ligado a quem usa o avatar,
    * sendo:
    *  - 0 para Voluntários e pessoas físicas,
    *  - 1 para PETs, 20 para pessoas juriticas,
    *  - 50 para sistemas de apoio, microserviços e embarcados
    */
   readonly type: number;
   id?: string;
   link: string;
}