import { Injectable } from '@nestjs/common';
import { db } from './firebase.config';
import { User } from '../users/entities/user.entity';
import { Place, GeoPoint } from '../places/entities/place.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  // User collection
  private readonly usersCollection = db.collection('users');
  // Places collection
  private readonly placesCollection = db.collection('places');

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

  // ======= PLACES METHODS =======

  // Create a place document in Firestore
  async createPlace(place: Partial<Place>): Promise<Place> {
    try {
      // Generate a new ID if not provided
      const placeId = place.id || db.collection('places').doc().id;

      // Prepare tags_str if tags are provided but tags_str is not
      if (place.tags && !place.tags_str) {
        place.tags_str = place.tags.join(' ');
      }

      // 좌표 변환 (직렬화)
      let coordForFirestore: number[] | null = null;
      if (place.coord) {
        if (
          typeof place.coord === 'object' &&
          'latitude' in place.coord &&
          'longitude' in place.coord
        ) {
          coordForFirestore = [place.coord.latitude, place.coord.longitude];
        }
      }

      // Prepare data for Firestore (without the coord field)
      const { coord, ...placeWithoutCoord } = place;

      const placeData = {
        ...placeWithoutCoord,
        id: placeId,
        create_date: new Date(),
        in_main_page: place.in_main_page || false,
        is_confirm: place.is_confirm || false,
      };

      // Save to Firestore
      await this.placesCollection.doc(placeId).set({
        ...placeData,
        coord: coordForFirestore,
      });

      // Get the created document
      const placeDoc = await this.placesCollection.doc(placeId).get();

      if (!placeDoc.exists) {
        throw new Error('Failed to create place');
      }

      // Return the created place
      return this.convertFirestoreDocToPlace(placeDoc);
    } catch (error) {
      console.error('Error creating place:', error);
      throw error;
    }
  }

  // Find all places
  async findAllPlaces(options?: {
    type?: string;
    limit?: number;
  }): Promise<Place[]> {
    try {
      let query: FirebaseFirestore.Query = this.placesCollection;

      // Add type filter if provided
      if (options?.type) {
        query = query.where('type', '==', options.type);
      }

      // Add limit if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => this.convertFirestoreDocToPlace(doc));
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  // Find place by ID
  async findPlaceById(id: string): Promise<Place | null> {
    try {
      const placeDoc = await this.placesCollection.doc(id).get();

      if (!placeDoc.exists) {
        return null;
      }

      return this.convertFirestoreDocToPlace(placeDoc);
    } catch (error) {
      console.error(`Error fetching place with ID ${id}:`, error);
      throw error;
    }
  }

  // Update a place
  async updatePlace(
    id: string,
    placeData: Partial<Place>,
  ): Promise<Place | null> {
    try {
      // Check if place exists
      const placeDoc = await this.placesCollection.doc(id).get();

      if (!placeDoc.exists) {
        return null;
      }

      // Update tags_str if tags are updated
      if (placeData.tags && !placeData.tags_str) {
        placeData.tags_str = placeData.tags.join(' ');
      }

      // 좌표 변환 (직렬화)
      let coordForFirestore: number[] | undefined = undefined;
      if (
        placeData.coord &&
        typeof placeData.coord === 'object' &&
        'latitude' in placeData.coord
      ) {
        coordForFirestore = [
          placeData.coord.latitude,
          placeData.coord.longitude,
        ];
      }

      // Prepare update data without the coord field
      const { coord, ...updateDataWithoutCoord } = placeData;

      const updateData = {
        ...updateDataWithoutCoord,
        id: undefined, // Don't allow updating the ID
      };

      // Update in Firestore
      await this.placesCollection.doc(id).update({
        ...updateData,
        ...(coordForFirestore ? { coord: coordForFirestore } : {}),
      });

      // Get updated document
      const updatedDoc = await this.placesCollection.doc(id).get();
      return this.convertFirestoreDocToPlace(updatedDoc);
    } catch (error) {
      console.error(`Error updating place with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete a place
  async deletePlace(id: string): Promise<boolean> {
    try {
      // Check if place exists
      const placeDoc = await this.placesCollection.doc(id).get();

      if (!placeDoc.exists) {
        return false;
      }

      // Delete the place
      await this.placesCollection.doc(id).delete();

      return true;
    } catch (error) {
      console.error(`Error deleting place with ID ${id}:`, error);
      throw error;
    }
  }

  // Find places by tags
  async findPlacesByTags(tags: string[]): Promise<Place[]> {
    try {
      // For tag search, we'll search places that contain ANY of the provided tags
      // Firestore doesn't directly support array contains any with multiple values
      // so we'll do this client-side

      const snapshot = await this.placesCollection.get();

      const places = snapshot.docs
        .map((doc) => this.convertFirestoreDocToPlace(doc))
        .filter((place) => {
          if (!place.tags) return false;
          // Check if any of the search tags are in this place's tags
          return tags.some((tag) => place.tags.includes(tag));
        });

      return places;
    } catch (error) {
      console.error('Error searching places by tags:', error);
      throw error;
    }
  }

  // Search places by text (name or description)
  async searchPlaces(searchText: string): Promise<Place[]> {
    try {
      // Firestore doesn't have built-in text search, so we're implementing a simple client-side search
      const snapshot = await this.placesCollection.get();

      const lowerSearchText = searchText.toLowerCase();

      const places = snapshot.docs
        .map((doc) => this.convertFirestoreDocToPlace(doc))
        .filter((place) => {
          const nameMatch = place.name?.toLowerCase().includes(lowerSearchText);
          const nameCorMatch = place.name_cor
            ?.toLowerCase()
            .includes(lowerSearchText);
          const descMatch = place.description
            ?.toLowerCase()
            .includes(lowerSearchText);
          return nameMatch || nameCorMatch || descMatch;
        });

      return places;
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  // Helper method to convert Firestore document to Place
  private convertFirestoreDocToPlace(
    doc: FirebaseFirestore.DocumentSnapshot,
  ): Place {
    const data = doc.data() || {};

    // Convert Firestore Timestamp to Date
    const createDate = data.create_date?.toDate
      ? data.create_date.toDate()
      : data.create_date
        ? new Date(data.create_date)
        : new Date();

    // 좌표 변환 (역직렬화)
    let coordinates: GeoPoint | undefined = undefined;
    if (data.coord) {
      if (Array.isArray(data.coord) && data.coord.length === 2) {
        coordinates = {
          latitude: data.coord[0],
          longitude: data.coord[1],
        };
      } else if (data.coord instanceof admin.firestore.GeoPoint) {
        coordinates = {
          latitude: data.coord.latitude,
          longitude: data.coord.longitude,
        };
      }
    }

    return new Place({
      ...data,
      id: doc.id,
      create_date: createDate,
      coord: coordinates,
    });
  }
}
