import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentChange, DocumentChangeAction } from '@angular/fire/firestore';
import { Papel } from './papeis/papel';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PapeisService {

  constructor(public db: AngularFirestore) { }

  getPapel(uid) {
    return this.getCollectionPapeis().doc<Papel>(uid).snapshotChanges();
  }

  updatePapel(uid: string, papel: Papel) {
    return this.getCollectionPapeis().doc<Papel>(uid).set(papel);
  }

  deletePapel(uid: string) {
    return this.getCollectionPapeis().doc<Papel>(uid).delete();
  }

  getPapeis(): Observable<DocumentChangeAction<Papel>[]> {
    return this.getCollectionPapeis().snapshotChanges();
  }

  private getCollectionPapeis(query = null): AngularFirestoreCollection<Papel> {
    if(query)
      return this.db.collection<Papel>('/papeis',query);
    else
      return this.db.collection<Papel>('/papeis');
  }

  searchPapel(nome: string) {
    return this.getCollectionPapeis(ref => ref.where('nome', '>=', nome)
      .where('nome', '<=', nome + '\uf8ff'))
      .snapshotChanges();
  }

  createPapel(papel: Papel) {
    return this.getCollectionPapeis()
      .add({
        nome: papel.nome,
        descricao: papel.descricao,
        icone: papel.icone,
        tipo: papel.tipo,
      });
  }
}
