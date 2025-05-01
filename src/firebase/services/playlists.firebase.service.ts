import { Injectable } from '@nestjs/common';
import { db } from '../firebase.config';
import { Playlist } from '../../playlists/entities/playlist.entity';
import { convertTimestampToDate } from '../utils/firestore-converter';
import * as firestore from 'firebase-admin/firestore';

@Injectable()
export class PlaylistsFirebaseService {
  private readonly playlistsCollection = db.collection('playlists');

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
   * 새로운 플레이리스트를 생성합니다.
   */
  async createPlaylist(playlist: Partial<Playlist>): Promise<Playlist> {
    try {
      // 플레이리스트 소유자(owner)가 필수인지 확인
      if (!playlist.owner) {
        throw new Error('Playlist owner is required');
      }

      // Generate a new ID if not provided
      const playlistId = playlist.id || db.collection('playlists').doc().id;

      // Prepare data for Firestore and remove undefined values
      const playlistData = this.removeUndefinedValues({
        ...playlist,
        id: playlistId,
        created_at: new Date(),
        updated_at: new Date(),
        is_visible: playlist.is_visible ?? false,
        type: playlist.type || 'user',
        places: playlist.places || [],
        thumbnails: playlist.thumbnails || [],
      });

      // Save to Firestore
      await this.playlistsCollection.doc(playlistId).set(playlistData);

      // Get the created document
      const playlistDoc = await this.playlistsCollection.doc(playlistId).get();

      if (!playlistDoc.exists) {
        throw new Error('Failed to create playlist');
      }

      // Return the created playlist
      return this.convertFirestoreDocToPlaylist(playlistDoc);
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  /**
   * 모든 플레이리스트를 조회합니다.
   */
  async findAllPlaylists(options?: {
    type?: string;
    owner?: string;
    limit?: number;
  }): Promise<Playlist[]> {
    try {
      let query: FirebaseFirestore.Query = this.playlistsCollection;

      // Add type filter if provided
      if (options?.type) {
        query = query.where('type', '==', options.type);
      }

      // Add owner filter if provided
      if (options?.owner) {
        query = query.where('owner', '==', options.owner);
      }

      // Add limit if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) =>
        this.convertFirestoreDocToPlaylist(doc),
      );
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }
  }

  /**
   * 특정 ID의 플레이리스트를 조회합니다.
   */
  async findPlaylistById(id: string): Promise<Playlist | null> {
    try {
      const playlistDoc = await this.playlistsCollection.doc(id).get();

      if (!playlistDoc.exists) {
        return null;
      }

      return this.convertFirestoreDocToPlaylist(playlistDoc);
    } catch (error) {
      console.error(`Error fetching playlist with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 특정 사용자의 플레이리스트를 검색합니다.
   */
  async findPlaylistsByUser(userId: string): Promise<Playlist[]> {
    try {
      const snapshot = await this.playlistsCollection
        .where('owner', '==', userId)
        .get();

      return snapshot.docs.map((doc) =>
        this.convertFirestoreDocToPlaylist(doc),
      );
    } catch (error) {
      console.error(`Error finding playlists for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 플레이리스트 정보를 업데이트합니다.
   */
  async updatePlaylist(
    id: string,
    playlistData: Partial<Playlist>,
  ): Promise<Playlist | null> {
    try {
      // Check if playlist exists
      const playlistDoc = await this.playlistsCollection.doc(id).get();

      if (!playlistDoc.exists) {
        return null;
      }

      // Prepare update data
      const updateData = this.removeUndefinedValues({
        ...playlistData,
        updated_at: new Date(), // Update the timestamp
      });

      // id는 명시적으로 삭제
      delete updateData.id;

      // Update in Firestore
      await this.playlistsCollection.doc(id).update(updateData);

      // Get updated document
      const updatedDoc = await this.playlistsCollection.doc(id).get();
      return this.convertFirestoreDocToPlaylist(updatedDoc);
    } catch (error) {
      console.error(`Error updating playlist with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 플레이리스트를 삭제합니다.
   */
  async deletePlaylist(id: string): Promise<boolean> {
    try {
      // Check if playlist exists
      const playlistDoc = await this.playlistsCollection.doc(id).get();

      if (!playlistDoc.exists) {
        return false;
      }

      // Delete the playlist
      await this.playlistsCollection.doc(id).delete();

      return true;
    } catch (error) {
      console.error(`Error deleting playlist with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 장소를 플레이리스트에 추가합니다.
   */
  async addPlaceToPlaylist(
    playlistId: string,
    placeId: string,
    thumbnailUrl?: string,
  ): Promise<Playlist | null> {
    try {
      const playlistDoc = await this.playlistsCollection.doc(playlistId).get();

      if (!playlistDoc.exists) {
        return null;
      }

      const playlist = this.convertFirestoreDocToPlaylist(playlistDoc);

      // Check if the place is already in the playlist
      if (playlist.places && playlist.places.includes(placeId)) {
        return playlist; // Place already exists, return current playlist
      }

      // Add the place to the playlist
      const places = playlist.places
        ? [...playlist.places, placeId]
        : [placeId];

      // 업데이트할 데이터 준비
      const updateData: any = {
        places,
        updated_at: new Date(),
      };

      // 썸네일 URL이 제공된 경우 썸네일 배열 업데이트
      if (thumbnailUrl) {
        const newThumbnail = {
          url: thumbnailUrl,
          place_id: placeId,
        };
        const thumbnails = playlist.thumbnails || [];

        // 최대 5개의 썸네일만 유지하기 위해 필요한 경우 가장 오래된 항목 제거
        if (thumbnails.length >= 5) {
          thumbnails.shift(); // 첫 번째 항목 제거
        }

        // 썸네일 객체를 일반 객체로 변환
        const serializedThumbnails = thumbnails.map((thumb) => ({
          url: thumb.url,
          place_id: thumb.place_id,
        }));

        updateData.thumbnails = [...serializedThumbnails, newThumbnail];
      }

      // Update the playlist
      await this.playlistsCollection.doc(playlistId).update(updateData);

      // Get updated document
      const updatedDoc = await this.playlistsCollection.doc(playlistId).get();
      return this.convertFirestoreDocToPlaylist(updatedDoc);
    } catch (error) {
      console.error(
        `Error adding place ${placeId} to playlist ${playlistId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * 장소를 플레이리스트에서 제거합니다.
   */
  async removePlaceFromPlaylist(
    playlistId: string,
    placeId: string,
  ): Promise<Playlist | null> {
    try {
      const playlistDoc = await this.playlistsCollection.doc(playlistId).get();

      if (!playlistDoc.exists) {
        return null;
      }

      const playlist = this.convertFirestoreDocToPlaylist(playlistDoc);

      // Check if the place is in the playlist
      if (!playlist.places || !playlist.places.includes(placeId)) {
        return playlist; // Place doesn't exist, return current playlist
      }

      // Remove the place from the playlist
      const places = playlist.places.filter((id) => id !== placeId);

      // 업데이트할 데이터 준비
      const updateData: any = {
        places,
        updated_at: new Date(),
      };

      // 해당 장소에 관련된 썸네일 제거
      if (playlist.thumbnails && playlist.thumbnails.length > 0) {
        const thumbnails = playlist.thumbnails.filter(
          (thumbnail) => thumbnail.place_id !== placeId,
        );
        updateData.thumbnails = thumbnails;
      }

      // Update the playlist
      await this.playlistsCollection.doc(playlistId).update(updateData);

      // Get the updated playlist
      const updatedDoc = await this.playlistsCollection.doc(playlistId).get();
      return this.convertFirestoreDocToPlaylist(updatedDoc);
    } catch (error) {
      console.error(
        `Error removing place ${placeId} from playlist ${playlistId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Firestore 문서를 Playlist 객체로 변환합니다.
   */
  private convertFirestoreDocToPlaylist(
    doc: FirebaseFirestore.DocumentSnapshot,
  ): Playlist {
    const data = doc.data() || {};

    // Firestore 참조 객체를 문자열로 변환
    let owner = data.owner;
    if (owner && typeof owner === 'object' && owner._path) {
      owner = owner._path.segments[1]; // 'users/{userId}'에서 userId 추출
    }

    let places = data.places || [];
    if (Array.isArray(places)) {
      places = places.map((place) => {
        if (place && typeof place === 'object' && place._path) {
          return place._path.segments[1]; // 'places/{placeId}'에서 placeId 추출
        }
        return place;
      });
    }

    // thumbnails 필드 처리
    const thumbnails = Array.isArray(data.thumbnails) ? data.thumbnails : [];

    return new Playlist({
      ...data,
      id: doc.id,
      owner: owner,
      places: places,
      thumbnails: thumbnails,
      created_at: convertTimestampToDate(data.created_at),
      updated_at: convertTimestampToDate(data.updated_at),
    });
  }

  /**
   * 여러 ID의 플레이리스트를 조회합니다.
   */
  async findPlaylistsByIds(ids: string[]): Promise<Playlist[]> {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      // Firestore는 in 쿼리에 최대 10개의 값만 허용하므로 청크로 나눠 처리
      const chunkSize = 10;
      const playlists: Playlist[] = [];

      // ID 배열을 청크로 나누어 처리
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);

        // 청크 크기가 1이면 단일 문서 조회
        if (chunk.length === 1) {
          const doc = await this.playlistsCollection.doc(chunk[0]).get();
          if (doc.exists) {
            playlists.push(this.convertFirestoreDocToPlaylist(doc));
          }
        } else {
          // 여러 문서를 in 쿼리로 조회
          const snapshot = await this.playlistsCollection
            .where(firestore.FieldPath.documentId(), 'in', chunk)
            .get();

          snapshot.docs.forEach((doc) => {
            playlists.push(this.convertFirestoreDocToPlaylist(doc));
          });
        }
      }

      return playlists;
    } catch (error) {
      console.error('Error fetching playlists by IDs:', error);
      throw error;
    }
  }
}
