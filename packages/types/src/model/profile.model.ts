/**
 * Client-side form/payload model for editing the admin profile.
 * `dateOfBirth` is a `Date | string` because the HTML date input yields
 * a `yyyy-MM-dd` string that is converted to a `Date` before dispatch.
 */
export interface UpdateProfileModel {
  name?: string;
  userName?: string;
  phone?: string;
  profileImageUrl?: string;
  dateOfBirth?: Date | string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  bio?: string;
}
