import { Injectable, CollectionChangeRecord } from '@angular/core';
import { DocumentSnapshot, Action, QueryFn, DocumentChange, CollectionReference } from '@angular/fire/firestore';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { DocumentChangeAction, DocumentReference } from '@angular/fire/firestore';
import { Papel } from './papeis/papel';
import { Observable, Subscription } from 'rxjs';

export type PapeisObserverFunction = (p: Papel[]) => void;
export type PapelObserverFunction = (p: Papel) => void;

@Injectable({
  providedIn: 'root'
})
export class PapeisService {

  constructor(public db: AngularFirestore) { }

  getPapel(uid): Observable<Action<DocumentSnapshot<Papel>>> {
    return this.getCollectionPapeis().doc<Papel>(uid).snapshotChanges();
  }

  async updatePapel(uid: string, papel: Papel): Promise<void> {
    return this.getCollectionPapeis().doc<Papel>(uid).set(papel);
  }

  async deletePapel(uid: string): Promise<void> {
    return this.getCollectionPapeis().doc<Papel>(uid).delete();
  }

  /**
   * Observa se existe e se foi adicionado novos papeis que são 
   * obrigatórios para todo voluntário. 
   * 
   * @param observerFn
   */
  observeInitialRoles(observerFn: PapeisObserverFunction): Subscription {
    return this.getCollectionPapeis((ref: CollectionReference) => {
      return ref.where('initial', '==', true);
    }).snapshotChanges(['added'])
      .subscribe((docAction: DocumentChangeAction<Papel>[]) => {
        const papeis: Papel[] = [];
        docAction.forEach((action: DocumentChangeAction<Papel>) => {
          papeis.push(action.payload.doc.data());
        });
        observerFn(papeis);
      });
  }

  private getCollectionPapeis(query?: QueryFn): AngularFirestoreCollection<Papel> {
    if (query) {
      return this.db.collection<Papel>('/papeis', query);
    } else {
      return this.db.collection<Papel>('/papeis');
    }
  }

  searchPapel(nome: string): Observable<DocumentChangeAction<Papel>[]> {
    return this.getCollectionPapeis(ref => ref.where('nome', '>=', nome)
      .where('nome', '<=', nome + '\uf8ff'))
      .snapshotChanges();
  }

  createPapel(papel: Papel): Promise<DocumentReference> {
    return this.getCollectionPapeis()
      .add(papel);
  }

  /**
   * Adiciona uma função que observa mudanças e novos papeis no banco de dados
   *
   * @param observerFn
   */
  observePapeis(observerFn: PapeisObserverFunction): Subscription {
    return this.getCollectionPapeis().snapshotChanges(['added', 'modified'])
      .subscribe((docsAction: DocumentChangeAction<Papel>[]) => {
        const papeis: Papel[] = [];
        docsAction.forEach(((docAction: DocumentChangeAction<Papel>) => {
          const papel: Papel = docAction.payload.doc.data();
          console.log(papel);
          if (papel.uid === undefined) {
            this.correctPapelUid(docAction.payload);
            return;
          }
          papeis.push(papel);
        }));
        observerFn(papeis);
      });
  }
  correctPapelUid(payload: DocumentChange<Papel>) {
    if (payload.doc.exists) {
      const uid: string = payload.doc.id;
      const papel: Papel = payload.doc.data();
      papel.uid = uid;
      this.updatePapel(uid, papel);
    }
  }

  /**
   * 
   * @param observerFn
   */
  observeRemovedPapeis(observerFn: PapeisObserverFunction): Subscription {
    return this.getCollectionPapeis().snapshotChanges(['removed'])
      .subscribe((dosAction: DocumentChangeAction<Papel>[]) => {
        observerFn(dosAction.map<Papel>(((v: DocumentChangeAction<Papel>) => {
          return v.payload.doc.data();
        })));
      });
  }
}
