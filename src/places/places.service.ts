import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { Place, GeoPoint } from './entities/place.entity';

@Injectable()
export class PlacesService {
  constructor(private readonly firebaseService: FirebaseService) {}

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

    return this.firebaseService.createPlace(placeData);
  }

  async findAll(options?: { type?: string; limit?: number }): Promise<Place[]> {
    return this.firebaseService.findAllPlaces(options);
  }

  async findOne(id: string): Promise<Place> {
    const place = await this.firebaseService.findPlaceById(id);

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

    const updatedPlace = await this.firebaseService.updatePlace(id, placeData);

    if (!updatedPlace) {
      throw new NotFoundException(`Place with id ${id} not found`);
    }

    return updatedPlace;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.firebaseService.deletePlace(id);

    if (!result) {
      throw new NotFoundException(`Place with id ${id} not found`);
    }

    return {
      success: true,
      message: `Place with id ${id} has been successfully deleted`,
    };
  }

  async findByTags(tags: string[]): Promise<Place[]> {
    return this.firebaseService.findPlacesByTags(tags);
  }

  async search(query: string): Promise<Place[]> {
    return this.firebaseService.searchPlaces(query);
  }

  async getMainPagePlaces(limit = 10): Promise<Place[]> {
    // 여기서는 클라이언트 사이드에서 필터링합니다. 실제로는 Firestore 인덱스를 설정하고
    // where 쿼리를 사용하는 것이 더 효율적입니다.
    const allPlaces = await this.firebaseService.findAllPlaces();
    return allPlaces
      .filter((place) => place.in_main_page === true)
      .slice(0, limit);
  }
}
