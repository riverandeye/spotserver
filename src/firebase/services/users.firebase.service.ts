import { Injectable } from '@nestjs/common';
import { db } from '../firebase.config';
import { User } from '../../users/entities/user.entity';
import {
  convertFirestoreDocToUser,
  convertTimestampToDate,
} from '../utils/firestore-converter';

@Injectable()
export class UsersFirebaseService {
  private readonly usersCollection = db.collection('users');

  /**
   * undefined 값을 필터링하고 null로 대체합니다.
   */
  private removeUndefinedValues(data: any): any {
    const result = {};

    for (const key in data) {
      if (data[key] !== undefined) {
        result[key] = data[key];
      } else {
        result[key] = null; // undefined를 null로 대체
      }
    }

    return result;
  }

  /**
   * 새로운 사용자를 생성합니다.
   */
  async createUser(user: User): Promise<User> {
    try {
      // uid가 없거나 빈 문자열인 경우 자동 생성
      const userId = user.uid?.trim()
        ? user.uid
        : this.usersCollection.doc().id;

      // undefined 값을 필터링
      const userData = this.removeUndefinedValues({
        ...user,
        uid: userId, // 자동 생성된 uid 사용
        created_time: new Date(),
      });

      // Use the uid as the document ID
      await this.usersCollection.doc(userId).set(userData);

      // Get the created document
      const userDoc = await this.usersCollection.doc(userId).get();

      if (!userDoc.exists) {
        throw new Error('Failed to create user');
      }

      // Return the created user
      return convertFirestoreDocToUser(userDoc);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * 모든 사용자를 조회합니다.
   */
  async findAllUsers(): Promise<User[]> {
    try {
      const snapshot = await this.usersCollection.get();
      return snapshot.docs.map((doc) => convertFirestoreDocToUser(doc));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * 특정 ID의 사용자를 조회합니다.
   */
  async findUserById(uid: string): Promise<User | null> {
    try {
      if (!uid?.trim()) {
        return null; // uid가 없거나 빈 문자열이면 null 반환
      }

      const userDoc = await this.usersCollection.doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      return convertFirestoreDocToUser(userDoc);
    } catch (error) {
      console.error(`Error fetching user with ID ${uid}:`, error);
      throw error;
    }
  }

  /**
   * 사용자 정보를 업데이트합니다.
   */
  async updateUser(uid: string, userData: Partial<User>): Promise<User | null> {
    try {
      // uid가 없거나 빈 문자열이면 업데이트 불가
      if (!uid?.trim()) {
        return null;
      }

      // Check if user exists
      const userDoc = await this.usersCollection.doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      // undefined 값을 제거하고 uid는 업데이트 데이터에서 제외
      const updateData = this.removeUndefinedValues({
        ...userData,
      });

      // uid는 명시적으로 제거
      delete updateData.uid;

      // Update the user
      await this.usersCollection.doc(uid).update(updateData);

      // Get the updated document
      const updatedUserDoc = await this.usersCollection.doc(uid).get();
      return convertFirestoreDocToUser(updatedUserDoc);
    } catch (error) {
      console.error(`Error updating user with ID ${uid}:`, error);
      throw error;
    }
  }

  /**
   * 사용자를 삭제합니다.
   */
  async deleteUser(uid: string): Promise<boolean> {
    try {
      // uid가 없거나 빈 문자열이면 삭제 불가
      if (!uid?.trim()) {
        return false;
      }

      // Check if user exists
      const userDoc = await this.usersCollection.doc(uid).get();

      if (!userDoc.exists) {
        return false;
      }

      // Delete the user
      await this.usersCollection.doc(uid).delete();

      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${uid}:`, error);
      throw error;
    }
  }
}
