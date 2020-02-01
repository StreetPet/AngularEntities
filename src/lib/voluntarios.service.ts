import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Voluntario, AvatarVoluntario } from './voluntarios';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoluntariosService {

  constructor(public db: AngularFirestore) { }

  getAvatars() {
    return this.getCollectionAvatars().valueChanges();
  }

  private getCollectionAvatars() {
    return this.db.collection<AvatarVoluntario>('/avatars');
  }

  getVoluntario(uuid) {
    return this.getCollectionVoluntarios().doc<Voluntario>(uuid).snapshotChanges();
  }

  updateVoluntario(uuid: string, voluntario: Voluntario) {
    voluntario.nameToSearch = voluntario.nome.toLowerCase();
    return this.getCollectionVoluntarios().doc<Voluntario>(uuid).set(voluntario);
  }

  deleteVoluntario(uuid: string) {
    return this.getCollectionVoluntarios().doc<Voluntario>(uuid).delete();
  }

  getVoluntarios(): Observable<any> {
    return this.getCollectionVoluntarios().snapshotChanges();
  }

  private getCollectionVoluntarios(query = null) {
    if(query)
      return this.db.collection<Voluntario>('/voluntarios',query);
    else
      return this.db.collection<Voluntario>('/voluntarios');
  }

  searchVoluntario(searchValue: string) {
    return this.getCollectionVoluntarios(ref => ref.where('nameToSearch', '>=', searchValue)
      .where('nameToSearch', '<=', searchValue + '\uf8ff'))
      .snapshotChanges();
  }

  searchVoluntarioPelaIdade(idade: number) {
    const collection = this.db
      .collection('voluntarios', ref => ref.orderBy('idade').startAt(idade));
    return collection.snapshotChanges();
  }

  createVoluntario(voluntario: Voluntario, avatar: AvatarVoluntario) {
    return this.db.collection('voluntarios')
      .add({
        nome: voluntario.nome,
        nameToSearch: voluntario.nome.toLowerCase(),
        sobrenome: voluntario.sobrenome,
        idade: parseInt(voluntario.idade, 10),
        avatar
      });
  }
}

