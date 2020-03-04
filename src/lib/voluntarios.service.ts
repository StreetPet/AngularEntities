import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, CollectionReference } from '@angular/fire/firestore';
import { QueryFn, DocumentData, DocumentChange } from '@angular/fire/firestore';
import { DocumentChangeAction, DocumentSnapshot, Action } from '@angular/fire/firestore';
import { DocumentReference } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { Voluntario, AvatarVoluntario } from './voluntarios';
import { Papel } from './papeis';
import { PapeisService, PapeisObserverFunction } from './papeis.service';
import { Visitante } from 'entities/lib/visitantes/visitante';

export interface SubscriptionArray {
  [index: string]: Subscription;
}

/**
 * Função que observa mudanças nos Voluntarios
 */
export type ObserveVoluntariosFunction = (voluntarios: Voluntario[]) => void;
/**
 * Função que observa mudanças em apenas um Voluntario
 */
export type ObserveVoluntarioFunction = (voluntario: Voluntario) => void;

/**
 * Resultados possíveis quando se solicita que aguarde um papel;
 */
export type ResultWaitPapel = 'aguardando' | 'autorizado' | 'negado' | 'cancelado';

@Injectable({
  providedIn: 'root'
})
export class VoluntariosService {

  constructor(private db: AngularFirestore, private papeisSrv: PapeisService) { }

  getAvatars(): Observable<AvatarVoluntario[]> {
    return this.getCollectionAvatars().valueChanges();
  }

  private getCollectionAvatars(): AngularFirestoreCollection<AvatarVoluntario> {
    return this.db.collection<AvatarVoluntario>('/avatars');
  }

  /**
   * Metodo interno para obtenção do documento referente ao voluntário conforme o id informado.
   * 
   * @param uid 
   * 
   */
  private getVoluntarioDoc(uid: string | Voluntario): Observable<Action<DocumentSnapshot<Voluntario>>> {
    if (typeof uid !== 'string')
      uid = uid.uid;
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).snapshotChanges();
  }

  public observeVoluntario(
    uid: string | Voluntario,
    observerFn: ObserveVoluntarioFunction): Subscription {

    return this.getVoluntarioDoc(uid).subscribe(
      (data: Action<DocumentSnapshot<Voluntario>>) => {
        const voluntario: Voluntario = data.payload.data();
        observerFn(voluntario);
      });
  }

  /**
   * 
   * @param voluntario 
   * @param uid 
   */
  updateVoluntario(voluntario: Voluntario, uid?: string): Promise<void> {
    if (uid) {
      voluntario = { ...voluntario } as Voluntario;
      voluntario.uid = uid;
    }
    return this.getCollectionVoluntarios().doc<Voluntario>(voluntario.uid)
      .set(voluntario);
  }

  /**
   * 
   * @param uid 
   * 
   */
  deleteVoluntario(uid: string): Promise<void> {
    //TODO: rever este algortimo de deleção como um todo
    const subscription: Subscription = this.getCollectionVoluntarios()
      .doc<Voluntario>(uid).valueChanges()
      .subscribe((voluntario: Voluntario) => {
        subscription.unsubscribe();
        // TODO: ACREDITO QUE MOVER ESTE CÓDIGO PARA FIREBASE_FUNCTION SEJA MAIS ADEQUADO
        return this.db.collection('/voluntarios_removidos')
          .doc<Voluntario>(uid).set(voluntario);
      });
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).delete();
  }

  /**
   * Obtem voluntários, adicionados e alterados
   */
  getVoluntarios(): Observable<DocumentChangeAction<Voluntario>[]> {
    return this.getCollectionVoluntarios()
      .snapshotChanges(['added', 'modified']);
  }

  private getCollectionVoluntarios(query?: QueryFn): AngularFirestoreCollection<Voluntario> {
    if (query) {
      return this.db.collection<Voluntario>('/voluntarios', query);
    } else {
      return this.db.collection<Voluntario>('/voluntarios');
    }
  }

  /**
   * Mantem o observer informado sobre atualizações nos Voluntários
   * 
   * @param recursive @todo quando implementado deve popular toda a arore de dados do objeto Voluntário.
   */
  observeVoluntarios(observeFn: ObserveVoluntariosFunction, recursive: boolean = true): Subscription {
    return this.getVoluntarios()
      .subscribe((voluntariosRef: DocumentChangeAction<Voluntario>[]) => {

        const voluntarios: Voluntario[] = voluntariosRef
          .map<Voluntario>(((v: DocumentChangeAction<Voluntario>) => {
            const voluntario: Voluntario = v.payload.doc.data();

            if (voluntario.uid === undefined) {
              this.correctVoluntarioUid(v.payload);
              return;
            }
            return voluntario;
          }));

        observeFn(voluntarios);
      });
  }

  /**
   * 
   * @param payload 
   */
  private correctVoluntarioUid(payload: DocumentChange<Voluntario>): Promise<void> {
    if (payload.doc.exists) {
      const uid: string = payload.doc.id;
      const voluntario: Voluntario = payload.doc.data();
      voluntario.uid = uid;
      return this.updateVoluntario(voluntario);
    }
    return Promise.reject();
  }

  /**
   * 
   * @param searchValue 
   * @param observeFn 
   */
  searchVoluntario(searchValue: string, observeFn: ObserveVoluntariosFunction): Subscription {
    return this.getCollectionVoluntarios((ref: CollectionReference) => {
      return ref.where('nameToSearch', '>=', searchValue)
        .where('nameToSearch', '<=', searchValue + '\uf8ff');
    }).snapshotChanges()
      .subscribe((ref: DocumentChangeAction<Voluntario>[]) => {
        observeFn(ref
          .map<Voluntario>((v: DocumentChangeAction<Voluntario>) => {
            const voluntario: Voluntario = v.payload.doc.data();
            voluntario.uid = v.payload.doc.id;
            return voluntario;
          }));
      });
  }

  /**
   * 
   * @param idade 
   * @param observeFn 
   */
  searchVoluntarioPelaIdade(
    idade: number,
    observeFn: (voluntarios: Voluntario[]) => void): Subscription {

    const collection = this.getCollectionVoluntarios((ref: CollectionReference) => {
      return ref.orderBy('idade').startAt(idade);
    });

    return collection.snapshotChanges()
      .subscribe((ref: DocumentChangeAction<Voluntario>[]) => {
        observeFn(ref.map<Voluntario>((v: DocumentChangeAction<Voluntario>) => {
          const voluntario: Voluntario = v.payload.doc.data();
          voluntario.uid = v.payload.doc.id;
          return voluntario;
        }));
      });
  }

  /**
   * Cria um registro na coleção de documentos relativos a voluntários.
   * 
   * Associa o documento criado com mesmo ID ao do Usuário visitante. 
   * Aloca papeis iniciais, conforme parametros indicativos na coleção 
   * de papeis.
   * 
   * Chamar este metódo com um visitante que já seja voluntário retorna
   * o resgiso já existente.
   * 
   * @param visitante 
   */
  alocaComoVoluntario(visitante: Visitante): Promise<Voluntario> {
    // popular Voluntário com dados do usuário logado
    const novoVoluntario: Voluntario = {
      uid: visitante.uid,
      nome: visitante.displayName,
      email: visitante.email,
      avatar: visitante.photoURL
    } as Voluntario;

    return this.createVoluntario(novoVoluntario)
      .then((voluntario: Voluntario) => {
        return new Promise((resolve, reject) => {
          this.papeisSrv.observeInitialRoles((papeis: Papel[]) => {
            papeis.forEach((papel: Papel) => {

              this.solicitaPapel(
                voluntario,
                papel,
                (resultado: ResultWaitPapel) => {
                  resolve(voluntario);
                });
            })
          });
        });
      });
  }

  /**
   * Cria um novo registor para voluntário.
   * 
   * Se informado o Avatar substitui o informado no objeto.
   * 
   * @param voluntario 
   * @param avatar 
   */
  createVoluntario(
    voluntario: Voluntario,
    avatar?: AvatarVoluntario): Promise<Voluntario> {

    let nameToSearch = voluntario.nome ? `${voluntario.nome} ` : ' ';
    nameToSearch += `${voluntario.sobrenome ? voluntario.sobrenome : ''}`;
    nameToSearch = nameToSearch.trim().toLocaleLowerCase();

    voluntario.nameToSearch = nameToSearch;
    voluntario.avatar = avatar ? avatar.link : voluntario.avatar;

    if (voluntario.uid) {
      return new Promise<Voluntario>((resolve, reject) => {
        const subscription = this.getVoluntarioDoc(voluntario.uid)
          .subscribe((action: Action<DocumentSnapshot<Voluntario>>) => {

            subscription.unsubscribe();

            if (action.payload.exists)
              reject('Já Existe um voluntário com este UID');
            else {
              this.updateVoluntario(voluntario)
                .then(() => {
                  resolve(voluntario);
                });
            }
          });
      });
    } else {
      return new Promise<Voluntario>((resolve, reject) => {
        this.getCollectionVoluntarios()
          .add(voluntario)
          .then((docRef: DocumentReference) => {
            voluntario.uid = docRef.id;
            this.updateVoluntario(voluntario).then(() => {
              resolve(voluntario);
            }).catch((err: any) => {
              reject(err);
            });
          });
      });
    }
  }

  /**
   * 
   * @param uid 
   * @param observeFn 
   */
  observePapeis(
    uid: Voluntario | string,
    observeFn: PapeisObserverFunction): Subscription {

    if (typeof uid !== 'string') {
      uid = uid.uid;
    }

    return this.getVoluntarioDoc(uid)
      .subscribe((value: Action<DocumentSnapshot<Voluntario>>) => {
        const voluntario = value.payload.data();
        const papeisRef = (voluntario.papeis as any as DocumentReference[]) || [];

        const papeis: Papel[] = [];
        const promisesRef: Promise<void>[] = [];

        papeisRef.forEach((docRef: DocumentReference) => {
          console.log(docRef);
          promisesRef.push(docRef.get()
            .then((doc: DocumentSnapshot<DocumentData>) => {
              const papel: Papel = doc.data() as Papel;
              if (papel) {
                papel.uid = doc.id;
                papeis[doc.id] = papel;
              }
            }));
        });
        Promise.all(promisesRef)
          .then(() => observeFn(papeis))
          .catch((err) => {
            console.log(err);
            observeFn(null);
          });
      });
  }

  /**
   * Observa se houve papeis alterados no sistema pra o voluntario informado
   * 
   * Algum evento no sistema pode ter solicitado a analise de adição 
   * de um papel ao voluntário, quando isso ocorre esta função alerta 
   * aos interessados tal situação.
   * @param uid 
   * @param observeFn 
   */
  observePapeisEmEspera(
    uid: Voluntario | string,
    observeFn: PapeisObserverFunction): Subscription {
    if (typeof uid !== 'string')
      uid = uid.uid;

    return this.getVoluntarioDoc(uid)
      .subscribe((value: Action<DocumentSnapshot<Voluntario>>) => {
        const voluntario: Voluntario = value.payload.data();
        let papeisRef = (voluntario.papeisEmEspera as any as DocumentReference[]);

        if (papeisRef === undefined) papeisRef = []

        const papeis: Papel[] = [];
        const promisesRef: Promise<void>[] = [];

        papeisRef.forEach((docRef: DocumentReference) => {
          console.log(docRef);
          promisesRef.push(docRef.get()
            .then((doc: DocumentSnapshot<DocumentData>) => {
              const papel: Papel = doc.data() as Papel;
              if (papel) {
                papel.uid = doc.id;
                papeis.push(papel);
              };
            }));
        });
        Promise.all(promisesRef)
          .then(() => observeFn(papeis))
          .catch((err) => {
            console.log(err);
            observeFn(null);
          });
      });
  }

  /**
   * 
   * @TODO estou achando muito verboso, muita volta para apenas adicionar um item a um array no documento do firebase, busco uma forma mais eficiente e que mantenha toda a aplicação informada da alteração de forma automática. Lembrando que os serviços são fachadas para o Firebase, ocultando toda sua complexidade do resto da aplicação, portanto não se deve transferir objetos especificos do firebase para camadas acima.
   * @param uid voluntário a ser consutlado
   * @param p apel a ser observado
   * @param observador função observadora que irá proceder conforme resultado da solicitação
   */
  public solicitaPapel(
    uid: Voluntario | string,
    p: Papel,
    observador: (resultado: ResultWaitPapel) => void) {
    if (typeof uid !== 'string')
      uid = uid.uid;

    const subscriptionVoluntario = this.getVoluntarioDoc(uid)
      .subscribe((voluntarioADS: Action<DocumentSnapshot<Voluntario>>) => {

        console.log('Solicita papel type de snapshot');
        console.log(voluntarioADS.type);

        if (voluntarioADS.type === 'value') {
          console.log('processa value');
          subscriptionVoluntario.unsubscribe();
          const voluntario: Voluntario = voluntarioADS.payload.data();
          console.log(voluntario);
          let papeisRef = (voluntario.papeisEmEspera as any as DocumentReference[]);
          if (papeisRef === undefined) papeisRef = [];

          const wait: boolean = (!papeisRef.find((docRef: DocumentReference) => {
            return docRef.id === p.uid;
          }));

          const subscriptionPapel = this.papeisSrv.getPapel(p.uid)
            .subscribe((papelADS: Action<DocumentSnapshot<Papel>>) => {
              if (papelADS.type === 'value') {
                subscriptionPapel.unsubscribe();
                if (wait) papeisRef.push(papelADS.payload.ref);
                else papeisRef = papeisRef.filter((docRef: DocumentReference) => {
                  return docRef.id !== p.uid;
                });
                console.log('Adicionando Papel Ref para Papeis Ref');
                this.getCollectionVoluntarios()
                  .doc<Voluntario>(voluntario.uid)
                  .update({ papeisEmEspera: papeisRef }).then((value) => {
                    console.log('Papeis atualizado!');
                    if (wait) observador('aguardando');
                    else observador('cancelado');
                  });
              }
            });
        }
      });
  }
}
