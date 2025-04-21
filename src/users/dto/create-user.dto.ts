import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
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
    required: false,
  })
  photo_url?: string;

  @ApiProperty({
    description: 'User role in the system',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
    required: false,
  })
  role?: string;
}
