import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlacesFirebaseService } from '../firebase/services/places.firebase.service';
import { Place, GeoPoint } from './entities/place.entity';

@Injectable()
export class PlacesService {
  constructor(private readonly placesFirebaseService: PlacesFirebaseService) {}

  async create(createPlaceDto: CreatePlaceDto): Promise<Place> {
    // DTO의 coord 배열을 GeoPoint 객체로 변환
    const { coord, ...otherData } = createPlaceDto;

    // 기본 데이터 준비
    const placeData: Partial<Place> = { ...otherData };

    // 좌표 변환
    if (coord && Array.isArray(coord) && coord.length === 2) {
      placeData.coord = {
        latitude: coord[0],
        longitude: coord[1],
      };
    }

    return this.placesFirebaseService.createPlace(placeData);
  }

  async findAll(options?: { type?: string; limit?: number }): Promise<Place[]> {
    return this.placesFirebaseService.findAllPlaces(options);
  }

  async findOne(id: string): Promise<Place> {
    const place = await this.placesFirebaseService.findPlaceById(id);

    if (!place) {
      throw new NotFoundException(`Place with id ${id} not found`);
    }

    return place;
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto): Promise<Place> {
    // DTO의 coord 배열을 GeoPoint 객체로 변환
    const { coord, ...otherData } = updatePlaceDto;

    // 기본 데이터 준비
    const placeData: Partial<Place> = { ...otherData };

    // 좌표 변환
    if (coord && Array.isArray(coord) && coord.length === 2) {
      placeData.coord = {
        latitude: coord[0],
        longitude: coord[1],
      };
    }

    const updatedPlace = await this.placesFirebaseService.updatePlace(
      id,
      placeData,
    );

    if (!updatedPlace) {
      throw new NotFoundException(`Place with id ${id} not found`);
    }

    return updatedPlace;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.placesFirebaseService.deletePlace(id);

    if (!result) {
      throw new NotFoundException(`Place with id ${id} not found`);
    }

    return {
      success: true,
      message: `Place with id ${id} has been successfully deleted`,
    };
  }

  async findByTags(tags: string[]): Promise<Place[]> {
    return this.placesFirebaseService.findPlacesByTags(tags);
  }

  async search(query: string): Promise<Place[]> {
    return this.placesFirebaseService.searchPlaces(query);
  }

  async getMainPagePlaces(limit = 10): Promise<Place[]> {
    // 모든 장소 가져온 후 필터링
    const allPlaces = await this.placesFirebaseService.findAllPlaces();
    return allPlaces
      .filter((place) => place.in_main_page === true)
      .slice(0, limit);
  }

  /**
   * 여러 ID에 해당하는 장소를 조회합니다.
   */
  async findByIds(ids: string[]): Promise<Place[]> {
    // 중복 ID 제거
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return [];
    }

    return this.placesFirebaseService.findPlacesByIds(uniqueIds);
  }
}
