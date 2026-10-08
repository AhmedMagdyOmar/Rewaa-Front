export interface UserProfile {
  id: number | string;
  email: string;
  full_name?: string;
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  role?: string;
  roleAr?: string;
  avatar_url?: string | null;
  flag?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  emailVerified?: boolean;
  phone?: string | null;
  phone_code?: string | null;
  status?: string;
  student_code?: string;
  courses_count?: number;
  user_type?: string | null;
  provider_id?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  data?: UserProfile;
  user?: UserProfile;
  student?: UserProfile;
  status?: number;
  message?: string;
}
