export interface IUser {
  _id: string;
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  university?: string;
  major?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}
