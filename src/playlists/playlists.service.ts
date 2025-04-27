import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistsFirebaseService } from '../firebase/services/playlists.firebase.service';
import { PlacesFirebaseService } from '../firebase/services/places.firebase.service';
import { Playlist } from './entities/playlist.entity';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly playlistsFirebaseService: PlaylistsFirebaseService,
    private readonly placesFirebaseService: PlacesFirebaseService,
  ) {}

  async create(createPlaylistDto: CreatePlaylistDto): Promise<Playlist> {
    return this.playlistsFirebaseService.createPlaylist(createPlaylistDto);
  }

  async findOne(id: string): Promise<Playlist> {
    const playlist = await this.playlistsFirebaseService.findPlaylistById(id);

    if (!playlist) {
      throw new NotFoundException(`Playlist with id ${id} not found`);
    }

    return playlist;
  }

  async update(
    id: string,
    updatePlaylistDto: UpdatePlaylistDto,
  ): Promise<Playlist> {
    const updatedPlaylist = await this.playlistsFirebaseService.updatePlaylist(
      id,
      updatePlaylistDto,
    );

    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with id ${id} not found`);
    }

    return updatedPlaylist;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.playlistsFirebaseService.deletePlaylist(id);

    if (!result) {
      throw new NotFoundException(`Playlist with id ${id} not found`);
    }

    return {
      success: true,
      message: `Playlist with id ${id} has been successfully deleted`,
    };
  }

  async addPlace(playlistId: string, placeId: string): Promise<Playlist> {
    // 먼저 장소가 존재하는지 확인합니다.
    const place = await this.placesFirebaseService.findPlaceById(placeId);

    if (!place) {
      throw new NotFoundException(`Place with id ${placeId} not found`);
    }

    const result = await this.playlistsFirebaseService.addPlaceToPlaylist(
      playlistId,
      placeId,
    );

    if (!result) {
      throw new NotFoundException(`Playlist with id ${playlistId} not found`);
    }

    return result;
  }

  async removePlace(playlistId: string, placeId: string): Promise<Playlist> {
    const result = await this.playlistsFirebaseService.removePlaceFromPlaylist(
      playlistId,
      placeId,
    );

    if (!result) {
      throw new NotFoundException(`Playlist with id ${playlistId} not found`);
    }

    return result;
  }

  /**
   * 플레이리스트에 장소를 추가하고 썸네일도 함께 추가합니다.
   */
  async addPlaceWithThumbnail(
    playlistId: string,
    placeId: string,
  ): Promise<Playlist> {
    // 먼저 장소가 존재하는지 확인합니다.
    const place = await this.placesFirebaseService.findPlaceById(placeId);

    if (!place) {
      throw new NotFoundException(`Place with id ${placeId} not found`);
    }

    // 현재 플레이리스트 정보를 가져옵니다.
    const playlist =
      await this.playlistsFirebaseService.findPlaylistById(playlistId);
    if (!playlist) {
      throw new NotFoundException(`Playlist with id ${playlistId} not found`);
    }

    // 장소 이미지를 썸네일로 사용합니다.
    let thumbnailUrl: string | undefined = undefined;

    // 플레이리스트에 썸네일이 4개 이하인 경우에만 추가합니다.
    if (!playlist.thumbnails || playlist.thumbnails.length < 5) {
      // 장소의 첫 번째 이미지를 썸네일로 사용
      thumbnailUrl =
        place.first_image ||
        (place.images && place.images.length > 0 ? place.images[0] : undefined);
    }

    // 장소와 썸네일을 플레이리스트에 추가합니다.
    const result = await this.playlistsFirebaseService.addPlaceToPlaylist(
      playlistId,
      placeId,
      thumbnailUrl,
    );

    if (!result) {
      throw new NotFoundException(
        `Failed to add place to playlist with id ${playlistId}`,
      );
    }

    return result;
  }

  /**
   * 여러 ID에 해당하는 플레이리스트를 조회합니다.
   */
  async findByIds(ids: string[]): Promise<Playlist[]> {
    // 중복 ID 제거
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return [];
    }

    return this.playlistsFirebaseService.findPlaylistsByIds(uniqueIds);
  }
}
