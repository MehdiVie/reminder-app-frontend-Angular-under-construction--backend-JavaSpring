import { HttpClient } from "@angular/common/http";
import { environment } from "../../../enviroments/environment"
import { Observable } from "rxjs";
import { ApiResponse } from "../models/apiResponse.model";
import { UserProfile } from "../models/user-profile.model";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn : 'root'
})

export class UserProfileService {
    private baseUrl = environment.apiUrl+'/user';

    constructor (private http : HttpClient) {}

    getProfile() : Observable<ApiResponse<UserProfile>> {
        return this.http.get<ApiResponse<UserProfile>>(`${this.baseUrl}/me`);
    }

    changePassword(oldPassword: string , newPassword: string) : Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.baseUrl}/change-password` , {
            oldPassword , 
            newPassword
        });
    }

    changeEmail(oldEmail: string , newEmail: string) : Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.baseUrl}/change-email` , {
            oldEmail , 
            newEmail
        });
    }


}