export class User {
  uid: string;
  email: string;
  display_name: string;
  full_name: string;
  photo_url: string;
  role: string;
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
