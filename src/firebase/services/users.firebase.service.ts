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
   * 새로운 사용자를 생성합니다.
   */
  async createUser(user: User): Promise<User> {
    try {
      // Use the uid as the document ID
      await this.usersCollection.doc(user.uid).set({
        ...user,
        created_time: new Date(),
      });

      // Get the created document
      const userDoc = await this.usersCollection.doc(user.uid).get();

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
      // Check if user exists
      const userDoc = await this.usersCollection.doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      // Update the user
      await this.usersCollection.doc(uid).update({
        ...userData,
        // Don't allow updating the UID
        uid: undefined,
      });

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
