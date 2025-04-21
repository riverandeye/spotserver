import { Injectable } from '@nestjs/common';
import { db } from './firebase.config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FirebaseService {
  // User collection
  private readonly usersCollection = db.collection('users');

  // Create a user document in Firestore
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

      // Return the created user with the Firestore data
      const userData = userDoc.data() || {};
      return new User({
        ...userData,
        created_time: userData.created_time?.toDate() || new Date(),
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find all users
  async findAllUsers(): Promise<User[]> {
    try {
      const snapshot = await this.usersCollection.get();

      return snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return new User({
          ...data,
          created_time: data.created_time?.toDate() || new Date(),
        });
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Find a user by uid
  async findUserById(uid: string): Promise<User | null> {
    try {
      const userDoc = await this.usersCollection.doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data() || {};
      return new User({
        ...userData,
        created_time: userData.created_time?.toDate() || new Date(),
      });
    } catch (error) {
      console.error(`Error fetching user with ID ${uid}:`, error);
      throw error;
    }
  }

  // Update a user
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
      const updatedData = updatedUserDoc.data() || {};

      return new User({
        ...updatedData,
        created_time: updatedData.created_time?.toDate() || new Date(),
      });
    } catch (error) {
      console.error(`Error updating user with ID ${uid}:`, error);
      throw error;
    }
  }

  // Delete a user
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
