import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { QueryFn, DocumentData, DocumentChange } from '@angular/fire/firestore';
import { DocumentChangeAction, DocumentSnapshot, Action } from '@angular/fire/firestore';
import { DocumentReference } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { Voluntario, AvatarVoluntario } from './voluntarios';
import { Papel, Papeis } from './papeis';
import { PapeisService } from './papeis.service';

export interface SubscriptionArray {
  [index: string]: Subscription;
}

/**
 * Função que observa mudanças no permitindo tratar os Voluntarios retornados
 */
export type ObserveVoluntariosFunction = (voluntarios: Voluntario[]) => void;
/**
 * 
 */
export type ObservePapeisFunction = (voluntarios: Papeis | Papel[]) => void;

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

  getVoluntario(uid: string): Observable<Action<DocumentSnapshot<Voluntario>>> {
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).snapshotChanges();
  }

  async updateVoluntario(uid: string, voluntario: Voluntario) {
    voluntario.nameToSearch = voluntario.nome.toLowerCase();
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).set(voluntario);
  }

  async deleteVoluntario(uid: string): Promise<void> {
    const subscription: Subscription = this.getCollectionVoluntarios()
      .doc<Voluntario>(uid).valueChanges()
      .subscribe((voluntario: Voluntario) => {
        this.db.collection('/voluntarios_removidos').doc<Voluntario>(uid).set(voluntario);
        subscription.unsubscribe();
      });
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).delete();
  }

  getVoluntarios(): Observable<DocumentChangeAction<Voluntario>[]> {
    return this.getCollectionVoluntarios().snapshotChanges(['added', 'modified']);
  }

  private getCollectionVoluntarios(query?: QueryFn): AngularFirestoreCollection<Voluntario> {
    if (query) {
      return this.db.collection<Voluntario>('/voluntarios', query);
    } else {
      return this.db.collection<Voluntario>('/voluntarios');
    }
  }

  /**
   * 
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

  correctVoluntarioUid(payload: DocumentChange<Voluntario>) {
    if (payload.doc.exists) {
      const uid: string = payload.doc.id;
      const voluntario: Voluntario = payload.doc.data();
      voluntario.uid = uid;
      this.updateVoluntario(uid, voluntario);
    }
  }

  searchVoluntario(searchValue: string, observeFn: ObserveVoluntariosFunction): Subscription {
    return this.getCollectionVoluntarios(ref => ref.where('nameToSearch', '>=', searchValue)
      .where('nameToSearch', '<=', searchValue + '\uf8ff'))
      .snapshotChanges().subscribe((ref: DocumentChangeAction<Voluntario>[]) => {
        observeFn(ref
          .map<Voluntario>((v: DocumentChangeAction<Voluntario>) => {
            const voluntario: Voluntario = v.payload.doc.data();
            voluntario.uid = v.payload.doc.id;
            return voluntario;
          }));
      });
  }

  searchVoluntarioPelaIdade(
    idade: number,
    observeFn: (voluntarios: Voluntario[]) => void): Subscription {

    const collection = this.getCollectionVoluntarios(ref => ref.orderBy('idade')
      .startAt(idade));
    return collection.snapshotChanges().subscribe((ref: DocumentChangeAction<Voluntario>[]) => {
      observeFn(ref.map<Voluntario>((v: DocumentChangeAction<Voluntario>) => {
        const voluntario: Voluntario = v.payload.doc.data();
        voluntario.uid = v.payload.doc.id;
        return voluntario;
      }));
    });
  }

  async createVoluntario(
    voluntario: Voluntario,
    avatar: AvatarVoluntario): Promise<DocumentReference> {

    return this.getCollectionVoluntarios()
      .add({
        nome: voluntario.nome,
        nameToSearch: voluntario.nome.toLowerCase(),
        sobrenome: voluntario.sobrenome,
        idade: voluntario.idade,
        avatar: avatar.link
      } as unknown as Voluntario);
  }

  observePapeis(
    uid: Voluntario | string,
    observeFn: (papeis: Papeis) => void): Subscription {

    if (typeof uid !== 'string') {
      uid = uid.uid;
    }

    return this.getVoluntario(uid)
      .subscribe((value: Action<DocumentSnapshot<Voluntario>>) => {
        const voluntario = value.payload.data();
        const papeisRef = (voluntario.papeis as any as DocumentReference[]) || [];

        const papeis: Papeis = {};
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
    observeFn: ObservePapeisFunction): Subscription {
    if (typeof uid !== 'string')
      uid = uid.uid;

    return this.getVoluntario(uid)
      .subscribe((value: Action<DocumentSnapshot<Voluntario>>) => {
        const voluntario: Voluntario = value.payload.data();
        let papeisRef = (voluntario.papeisEmEspera as any as DocumentReference[]);

        if (papeisRef === undefined) papeisRef = []

        const papeis: Papeis = {};
        const promisesRef: Promise<void>[] = [];

        papeisRef.forEach((docRef: DocumentReference) => {
          console.log(docRef);
          promisesRef.push(docRef.get()
            .then((doc: DocumentSnapshot<DocumentData>) => {
              const papel: Papel = doc.data() as Papel;
              if (papel) {
                papel.uid = doc.id;
                papeis[doc.id] = papel;
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

    const subscriptionVoluntario = this.getVoluntario(uid).subscribe((voluntarioADS: Action<DocumentSnapshot<Voluntario>>) => {

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