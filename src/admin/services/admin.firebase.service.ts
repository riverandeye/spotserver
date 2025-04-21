import { Injectable } from '@nestjs/common';
import { Admin } from '../entities/admin.entity';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminServiceInterface } from './admin.service.interface';
import * as admin from 'firebase-admin';
import { convertTimestampToDate } from '../../firebase/utils/firestore-converter';

@Injectable()
export class AdminFirebaseService implements AdminServiceInterface {
  private readonly adminCollection = 'admins';
  private readonly firestore: FirebaseFirestore.Firestore;

  constructor() {
    this.firestore = admin.firestore();
  }

  /**
   * 새 관리자 계정을 생성합니다.
   */
  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    try {
      // Firebase Auth에 사용자 생성
      const userRecord = await admin.auth().createUser({
        email: createAdminDto.email,
        password: createAdminDto.password,
        displayName: createAdminDto.display_name,
      });

      // 관리자 권한 설정 (Firebase Auth 커스텀 클레임)
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: createAdminDto.role || 'admin',
        permissions: createAdminDto.permissions || [],
      });

      // 현재 시간 생성
      const now = admin.firestore.Timestamp.now();

      // 관리자 문서 생성
      const adminData = {
        uid: userRecord.uid,
        email: createAdminDto.email,
        display_name: createAdminDto.display_name,
        password: '', // 보안상 저장하지 않음
        password_verification_number: '',
        role: createAdminDto.role || 'admin',
        token: '',
        permissions: createAdminDto.permissions || [
          'manage_users',
          'manage_places',
          'manage_playlists',
          'approve_content',
        ],
        created_at: now,
        updated_at: now,
        last_login: now,
      };

      // Firestore에 관리자 문서 생성 (문서 ID = UID)
      await this.firestore
        .collection(this.adminCollection)
        .doc(userRecord.uid)
        .set(adminData);

      // 객체 변환 없이 Admin 인스턴스 직접 생성
      return new Admin({
        ...adminData,
        uid: userRecord.uid,
        created_at: new Date(now.toDate()),
        updated_at: new Date(now.toDate()),
        last_login: new Date(now.toDate()),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 모든 관리자 목록을 조회합니다.
   */
  async findAll(): Promise<Admin[]> {
    try {
      const snapshot = await this.firestore
        .collection(this.adminCollection)
        .get();

      return snapshot.docs.map((doc) => this.convertFirestoreDocToAdmin(doc));
    } catch (error) {
      throw error;
    }
  }

  /**
   * UID로 특정 관리자를 조회합니다.
   */
  async findOne(uid: string): Promise<Admin> {
    try {
      const doc = await this.firestore
        .collection(this.adminCollection)
        .doc(uid)
        .get();

      if (!doc.exists) {
        throw new Error(`Admin with uid ${uid} not found`);
      }

      return this.convertFirestoreDocToAdmin(doc);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 관리자 정보를 업데이트합니다.
   */
  async update(uid: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    try {
      const adminDoc = await this.firestore
        .collection(this.adminCollection)
        .doc(uid)
        .get();

      if (!adminDoc.exists) {
        throw new Error(`Admin with uid ${uid} not found`);
      }

      const adminData = adminDoc.data();
      if (!adminData) {
        throw new Error(`Admin data is empty for uid ${uid}`);
      }

      const updateData: any = {
        updated_at: admin.firestore.Timestamp.now(),
      };

      // 업데이트할 필드 추가
      if (updateAdminDto.display_name) {
        updateData.display_name = updateAdminDto.display_name;
      }

      if (updateAdminDto.role) {
        updateData.role = updateAdminDto.role;

        // Firebase Auth 커스텀 클레임 업데이트
        await admin.auth().setCustomUserClaims(uid, {
          role: updateAdminDto.role,
          permissions: updateAdminDto.permissions || adminData.permissions,
        });
      }

      if (updateAdminDto.permissions) {
        updateData.permissions = updateAdminDto.permissions;

        // Firebase Auth 커스텀 클레임 업데이트
        await admin.auth().setCustomUserClaims(uid, {
          role: updateAdminDto.role || adminData.role,
          permissions: updateAdminDto.permissions,
        });
      }

      // 비밀번호 변경 처리
      if (updateAdminDto.password) {
        await admin.auth().updateUser(uid, {
          password: updateAdminDto.password,
        });
        // 비밀번호는 저장하지 않음
      }

      // Firestore 문서 업데이트
      await this.firestore
        .collection(this.adminCollection)
        .doc(uid)
        .update(updateData);

      // 업데이트된 문서 조회
      return this.findOne(uid);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 관리자 권한을 설정합니다.
   */
  async setPermissions(uid: string, permissions: string[]): Promise<Admin> {
    try {
      const adminDoc = await this.firestore
        .collection(this.adminCollection)
        .doc(uid)
        .get();

      if (!adminDoc.exists) {
        throw new Error(`Admin with uid ${uid} not found`);
      }

      const adminData = adminDoc.data();
      if (!adminData) {
        throw new Error(`Admin data is empty for uid ${uid}`);
      }

      // Firestore 문서 업데이트
      await this.firestore.collection(this.adminCollection).doc(uid).update({
        permissions,
        updated_at: admin.firestore.Timestamp.now(),
      });

      // Firebase Auth 커스텀 클레임 업데이트
      await admin.auth().setCustomUserClaims(uid, {
        role: adminData.role,
        permissions,
      });

      // 업데이트된 문서 조회
      return this.findOne(uid);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 관리자 계정을 비활성화합니다.
   */
  async disable(uid: string): Promise<void> {
    try {
      const adminDoc = await this.firestore
        .collection(this.adminCollection)
        .doc(uid)
        .get();

      if (!adminDoc.exists) {
        throw new Error(`Admin with uid ${uid} not found`);
      }

      const adminData = adminDoc.data();
      if (!adminData) {
        throw new Error(`Admin data is empty for uid ${uid}`);
      }

      // Firebase Auth 사용자 비활성화
      await admin.auth().updateUser(uid, {
        disabled: true,
      });

      // Firestore 문서 업데이트
      await this.firestore.collection(this.adminCollection).doc(uid).update({
        updated_at: admin.firestore.Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 관리자 계정을 삭제합니다.
   */
  async remove(uid: string): Promise<void> {
    try {
      const adminDoc = await this.firestore
        .collection(this.adminCollection)
        .doc(uid)
        .get();

      if (!adminDoc.exists) {
        throw new Error(`Admin with uid ${uid} not found`);
      }

      const adminData = adminDoc.data();
      if (!adminData) {
        throw new Error(`Admin data is empty for uid ${uid}`);
      }

      // Firebase Auth 사용자 삭제
      await admin.auth().deleteUser(uid);

      // Firestore 문서 삭제
      await this.firestore.collection(this.adminCollection).doc(uid).delete();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 관리자 로그인 시간을 업데이트합니다.
   */
  async updateLoginTime(uid: string): Promise<void> {
    try {
      await this.firestore.collection(this.adminCollection).doc(uid).update({
        last_login: admin.firestore.Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Firestore 문서를 Admin 객체로 변환합니다.
   */
  private convertFirestoreDocToAdmin(
    doc: FirebaseFirestore.DocumentSnapshot,
  ): Admin {
    const data = doc.data() || {};

    return new Admin({
      ...data,
      uid: doc.id,
      created_at: convertTimestampToDate(data.created_at),
      updated_at: convertTimestampToDate(data.updated_at),
      last_login: convertTimestampToDate(data.last_login),
    });
  }
}
