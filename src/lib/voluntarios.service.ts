import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction, DocumentSnapshot, Action } from '@angular/fire/firestore';
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

  getVoluntario(uid: string): Observable<Action<DocumentSnapshot<Voluntario>>> {
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).snapshotChanges();
  }

  updateVoluntario(uid: string, voluntario: Voluntario): Promise<void> {
    voluntario.nameToSearch = voluntario.nome.toLowerCase();
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).set(voluntario);
  }

  deleteVoluntario(uid: string): Promise<void>{
    const subscription: Subscription = this.getCollectionVoluntarios()
      .doc<Voluntario>(uid).valueChanges()
      .subscribe((voluntario: Voluntario) => {
        this.db.collection('/voluntarios_removidos').doc<Voluntario>(uid).set(voluntario);
        subscription.unsubscribe();
      });
    return this.getCollectionVoluntarios().doc<Voluntario>(uid).delete();
  }

  getVoluntarios(): Observable<DocumentChangeAction<Voluntario>[]> {
    return this.getCollectionVoluntarios().snapshotChanges();
  }

  private getCollectionVoluntarios(query = null): AngularFirestoreCollection<Voluntario> {
    if (query)
      return this.db.collection<Voluntario>('/voluntarios', query);
    else
      return this.db.collection<Voluntario>('/voluntarios');
  }

  searchVoluntario(searchValue: string):Observable<DocumentChangeAction<Voluntario>[]> {
    return this.getCollectionVoluntarios(ref => ref.where('nameToSearch', '>=', searchValue)
      .where('nameToSearch', '<=', searchValue + '\uf8ff'))
      .snapshotChanges();
  }

  searchVoluntarioPelaIdade(idade: number):Observable<DocumentChangeAction<Voluntario>[]> {
    const collection = this.getCollectionVoluntarios(ref => ref.orderBy('idade').startAt(idade));
    return collection.snapshotChanges();
  }

  createVoluntario(voluntario: Voluntario, avatar: AvatarVoluntario) {
    return this.getCollectionVoluntarios()
      .add(<Voluntario><unknown>{
        nome: voluntario.nome,
        nameToSearch: voluntario.nome.toLowerCase(),
        sobrenome: voluntario.sobrenome,
        idade: voluntario.idade,
        avatar: avatar.link
      });
  }
}

