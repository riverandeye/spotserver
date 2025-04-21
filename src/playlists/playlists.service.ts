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

  async findAll(options?: {
    type?: string;
    owner?: string;
    limit?: number;
  }): Promise<Playlist[]> {
    return this.playlistsFirebaseService.findAllPlaylists(options);
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

  async findByUser(userId: string): Promise<Playlist[]> {
    return this.playlistsFirebaseService.findPlaylistsByUser(userId);
  }

  async findByPlace(placeId: string): Promise<Playlist[]> {
    return this.playlistsFirebaseService.findPlaylistsByPlace(placeId);
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
}
