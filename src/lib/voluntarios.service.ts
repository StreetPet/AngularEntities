import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Voluntario, AvatarVoluntario } from './voluntarios';
import { Observable, Subscription } from 'rxjs';

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

  getVoluntario(uid) {
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).snapshotChanges();
  }

  updateVoluntario(uid: string, voluntario: Voluntario) {
    voluntario.nameToSearch = voluntario.nome.toLowerCase();
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).set(voluntario);
  }

  deleteVoluntario(uid: string) {
      const subscription:Subscription = this.getCollectionVoluntarios()
      .doc<Voluntario>(uid).valueChanges()
      .subscribe((voluntario: Voluntario) => {
        this.db.collection('/voluntarios_removidos').doc<Voluntario>(uid).set(voluntario);
        subscription.unsubscribe();
      });
      return this.getCollectionVoluntarios().doc<Voluntario>(uid).delete();
  }

  getVoluntarios(): Observable<any> {
    return this.getCollectionVoluntarios().snapshotChanges();
  }

  private getCollectionVoluntarios(query = null) {
    if (query)
      return this.db.collection<Voluntario>('/voluntarios', query);
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
        idade: voluntario.idade,
        avatar
      });
  }
}

