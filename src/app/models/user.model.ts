export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  avatar_url?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  is_admin?: boolean;
}

export interface PasswordUpdate {
  current_password: string;
  new_password: string;
}

export interface PasswordReset {
  new_password: string;
}

export interface AvatarUpdate {
  avatar_url: string;
}
