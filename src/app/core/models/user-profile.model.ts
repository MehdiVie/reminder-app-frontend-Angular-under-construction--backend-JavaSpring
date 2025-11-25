export interface UserProfile {
  id: number;
  email: string;
  roles: string[];
}

export interface ResetPasswordRequest {
    token : string ,
    newPassword : string
}

export interface ForgetPasswordRequest {
    email : string 
}