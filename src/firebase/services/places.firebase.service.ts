import { Injectable } from '@nestjs/common';
import { db } from '../firebase.config';
import { Place } from '../../places/entities/place.entity';
import {
  convertFirestoreDocToPlace,
  convertGeoPointToArray,
} from '../utils/firestore-converter';
import * as firestore from 'firebase-admin/firestore';

@Injectable()
export class PlacesFirebaseService {
  private readonly placesCollection = db.collection('places');

  /**
   * 새로운 장소를 생성합니다.
   */
  async createPlace(place: Partial<Place>): Promise<Place> {
    try {
      // Generate a new ID if not provided
      const placeId = place.id || db.collection('places').doc().id;

      // Prepare tags_str if tags are provided but tags_str is not
      if (place.tags && !place.tags_str) {
        place.tags_str = place.tags.join(' ');
      }

      // 좌표 변환 (직렬화)
      const coordForFirestore = convertGeoPointToArray(place.coord);

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
      return convertFirestoreDocToPlace(placeDoc);
    } catch (error) {
      console.error('Error creating place:', error);
      throw error;
    }
  }

  /**
   * 모든 장소를 조회합니다.
   */
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

      return snapshot.docs.map((doc) => convertFirestoreDocToPlace(doc));
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  /**
   * 특정 ID의 장소를 조회합니다.
   */
  async findPlaceById(id: string): Promise<Place | null> {
    try {
      const placeDoc = await this.placesCollection.doc(id).get();

      if (!placeDoc.exists) {
        return null;
      }

      return convertFirestoreDocToPlace(placeDoc);
    } catch (error) {
      console.error(`Error fetching place with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 장소 정보를 업데이트합니다.
   */
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
      const coordForFirestore = convertGeoPointToArray(placeData.coord);

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
      return convertFirestoreDocToPlace(updatedDoc);
    } catch (error) {
      console.error(`Error updating place with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 장소를 삭제합니다.
   */
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

  /**
   * 태그로 장소를 검색합니다.
   */
  async findPlacesByTags(tags: string[]): Promise<Place[]> {
    try {
      // For tag search, we'll search places that contain ANY of the provided tags
      // Firestore doesn't directly support array contains any with multiple values
      // so we'll do this client-side

      const snapshot = await this.placesCollection.get();

      const places = snapshot.docs
        .map((doc) => convertFirestoreDocToPlace(doc))
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

  /**
   * 키워드로 장소를 검색합니다.
   */
  async searchPlaces(searchText: string): Promise<Place[]> {
    try {
      // Firestore doesn't have built-in text search, so we're implementing a simple client-side search
      const snapshot = await this.placesCollection.get();

      const lowerSearchText = searchText.toLowerCase();

      const places = snapshot.docs
        .map((doc) => convertFirestoreDocToPlace(doc))
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

  /**
   * 여러 ID의 장소를 조회합니다.
   */
  async findPlacesByIds(ids: string[]): Promise<Place[]> {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      // Firestore는 in 쿼리에 최대 10개의 값만 허용하므로 청크로 나눠 처리
      const chunkSize = 10;
      const places: Place[] = [];

      // ID 배열을 청크로 나누어 처리
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);

        // 청크 크기가 1이면 단일 문서 조회
        if (chunk.length === 1) {
          const doc = await this.placesCollection.doc(chunk[0]).get();
          if (doc.exists) {
            places.push(convertFirestoreDocToPlace(doc));
          }
        } else {
          // 여러 문서를 in 쿼리로 조회
          const snapshot = await this.placesCollection
            .where(firestore.FieldPath.documentId(), 'in', chunk)
            .get();

          snapshot.docs.forEach((doc) => {
            places.push(convertFirestoreDocToPlace(doc));
          });
        }
      }

      return places;
    } catch (error) {
      console.error('Error fetching places by IDs:', error);
      throw error;
    }
  }
}
