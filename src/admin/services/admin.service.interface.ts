import { Admin } from '../entities/admin.entity';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';

export interface AdminServiceInterface {
  /**
   * 새 관리자를 생성합니다
   */
  create(createAdminDto: CreateAdminDto): Promise<Admin>;

  /**
   * 모든 관리자 목록을 조회합니다
   */
  findAll(): Promise<Admin[]>;

  /**
   * UID로 특정 관리자를 조회합니다
   */
  findOne(uid: string): Promise<Admin>;

  /**
   * 관리자 정보를 업데이트합니다
   */
  update(uid: string, updateAdminDto: UpdateAdminDto): Promise<Admin>;

  /**
   * 관리자 권한을 특정 권한으로 설정합니다
   */
  setPermissions(uid: string, permissions: string[]): Promise<Admin>;

  /**
   * 관리자 계정을 비활성화합니다
   */
  disable(uid: string): Promise<void>;

  /**
   * 관리자 계정을 삭제합니다
   */
  remove(uid: string): Promise<void>;
}
