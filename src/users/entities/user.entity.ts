import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    description: 'The unique identifier of the user (Firebase UID)',
    example: '0AWIzKnEtzOJh3SG0nJVD1RMvZo2',
  })
  uid: string;

  @ApiProperty({
    description: 'User email address',
    example: 'anazarovaviktoria@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'Vika',
  })
  display_name: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Viktoriia',
  })
  full_name: string;

  @ApiProperty({
    description: 'URL to user profile photo',
    example: 'https://example.com/photos/user.jpg',
  })
  photo_url: string;

  @ApiProperty({
    description: 'User role in the system',
    example: 'user',
    enum: ['user', 'admin'],
  })
  role: string;

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2025-04-09T03:38:53.000Z',
  })
  created_time: Date;

  constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);

      // Convert timestamp to Date if needed
      if (data.created_time && !(data.created_time instanceof Date)) {
        this.created_time = new Date(data.created_time);
      }
    }
  }
}
