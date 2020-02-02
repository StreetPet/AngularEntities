import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PapeisService {

import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Papel } from './papeis';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoluntariosService {

  constructor(public db: AngularFirestore) { }

  getPapel(uid) {
    return this.getCollectionPapeis().doc<Papel>(uid).snapshotChanges();
  }

  updatePapel(uid: string, papel: Papel) {
    return this.getCollectionVoluntarios().doc<Papel>(uid).set(papel);
  }

  deletePapel(uid: string) {
    return this.getCollectionVoluntarios().doc<Papel>(uuid).delete();
  }

  getPapeis(): Observable<any> {
    return this.getCollectionPapeis().snapshotChanges();
  }

  private getCollectionPapeis(query = null) {
    if(query)
      return this.db.collection<Papel>('/papeis',query);
    else
      return this.db.collection<Voluntario>('/papeis');
  }

  searchPapel(nome: string) {
    return this.getCollectionVoluntarios(ref => ref.where('nome', '>=', searchValue)
      .where('nome', '<=', searchValue + '\uf8ff'))
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
