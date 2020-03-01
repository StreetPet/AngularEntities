import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentSnapshot, Action, QueryFn, DocumentChange } from '@angular/fire/firestore';
import { DocumentChangeAction, DocumentReference } from '@angular/fire/firestore';
import { Papel, Papeis } from './papeis/papel';
import { Observable, Subscription } from 'rxjs';
import { Voluntario } from './voluntarios';

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

  async createPapel(papel: Papel): Promise<DocumentReference> {
    return this.getCollectionPapeis()
      .add(papel);
  }

  /**
   * Adiciona uma função que observa mudanças e novos papeis no banco de dados
   * 
   * @param observerFn
   */
  observePapeis(observerFn: (p: Papeis) => void): Subscription {
    return this.getCollectionPapeis().snapshotChanges(['added', 'modified'])
      .subscribe((docsAction: DocumentChangeAction<Papel>[]) => {
        const papeis: Papeis = {};
        docsAction.forEach(((docAction: DocumentChangeAction<Papel>) => {
          const papel: Papel = docAction.payload.doc.data();
          console.log(papel);
          if (papel.uid === undefined) {
            this.correctPapelUid(docAction.payload);
            return;
          }
          papeis[papel.uid] = papel;
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
  observeRemovedPapeis(observerFn: (p: Papel[]) => void): Subscription {
    return this.getCollectionPapeis().snapshotChanges(['removed'])
      .subscribe((dosAction: DocumentChangeAction<Papel>[]) => {
        observerFn(dosAction.map<Papel>(((v: DocumentChangeAction<Papel>) => {
          return v.payload.doc.data();
        })));
      });
  }
}
