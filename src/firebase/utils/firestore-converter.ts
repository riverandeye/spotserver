import * as admin from 'firebase-admin';
import { User } from '../../users/entities/user.entity';
import { Place, GeoPoint } from '../../places/entities/place.entity';

/**
 * Firestore 문서를 User 객체로 변환합니다.
 */
export function convertFirestoreDocToUser(
  doc: FirebaseFirestore.DocumentSnapshot,
): User {
  const data = doc.data() || {};

  return new User({
    ...data,
    created_time: convertTimestampToDate(data.created_time),
  });
}

/**
 * Firestore 문서를 Place 객체로 변환합니다.
 */
export function convertFirestoreDocToPlace(
  doc: FirebaseFirestore.DocumentSnapshot,
): Place {
  const data = doc.data() || {};

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
    create_date: convertTimestampToDate(data.create_date),
    coord: coordinates,
  });
}

/**
 * Place 객체의 좌표를 Firestore 저장용 배열로 변환합니다.
 */
export function convertGeoPointToArray(coord?: GeoPoint): number[] | null {
  if (
    !coord ||
    typeof coord !== 'object' ||
    !('latitude' in coord) ||
    !('longitude' in coord)
  ) {
    return null;
  }

  return [coord.latitude, coord.longitude];
}

/**
 * Firestore Timestamp를 JavaScript Date 객체로 변환합니다.
 */
export function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }

  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  // 타임스탬프가 숫자나 문자열인 경우
  return new Date(timestamp);
}
