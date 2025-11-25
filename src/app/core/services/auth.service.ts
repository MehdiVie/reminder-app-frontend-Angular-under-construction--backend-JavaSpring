import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LoginRequest, RegisterRequest , LoginResponse } from "../models/user.model";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { environment } from '../../../enviroments/environment';
import { ApiResponse } from "../models/apiResponse.model";
import { UserProfile } from "../models/user-profile.model";
import { ReminderPollingService } from "./reminder-polling.service";
import { Router } from "@angular/router";

@Injectable ({
    providedIn : 'root'
})
export class AuthService {
    private readonly apiUrl = environment.apiUrl+'/auth';
    private readonly token_key = 'jwt' ;

    private currentUserEmail = new BehaviorSubject<string | null>(null);

    $currentUserEmail = this.currentUserEmail.asObservable();

    constructor(private http: HttpClient,
                private polling: ReminderPollingService,
                private router : Router) {
                    console.log('%cAuthService CONSTRUCTOR','color: orange;');
                }

    login(data : LoginRequest) : Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data )
        .pipe(
            tap((res)=>{
            console.log('[AuthService] Saving token:', res.data.token);
            localStorage.setItem(this.token_key , res.data.token);
            this.currentUserEmail.next(res.data.email);
            console.log('%cLogin Success','color:red;');
            
        }));
    }

    register (data : RegisterRequest) : Observable<LoginResponse> {
        return this.http.post<LoginResponse> (`${this.apiUrl}/register`,data);
    }

    saveToken(token : string) : void {
        
        localStorage.setItem(this.token_key,token);
    }

    getToken() : string | null {
        const token = localStorage.getItem(this.token_key);
        console.log("Token read from localStorage:", token);
        return token;
    }

    hasRole(role : string) : boolean {
        const token = this.getToken();
        //console.log("Admin Token is:",token);
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            //console.log("Admin Token-2 is:",payload.roles);
            return (payload.roles || []).includes(role);
        } catch {
            return false;
        }
    }

    logout() : void {
        localStorage.removeItem(this.token_key);
        this.currentUserEmail.next(null);
        localStorage.removeItem('user');
        sessionStorage.clear();
        this.polling.stopPolling();
        this.router.navigate(['/login']);
    }

    logoutWithoutRedirect() : void {
        localStorage.removeItem(this.token_key);
        this.currentUserEmail.next(null);
        localStorage.removeItem('user');
        sessionStorage.clear();
        this.polling.stopPolling();
    }

    verifyToken(token : string) : Observable<ApiResponse<string>> {
        return this.http.get<ApiResponse<string>>(`${this.apiUrl}/verify-email` , { params : { token: token } });
    }

    sendResetPasswordLink(email: string) : Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.apiUrl}/forget-password` , { 
            email
        });
    }

    checkResetPasswordLinkToken(token: string) : Observable<ApiResponse<UserProfile>> {
        return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/reset-password-check-token` ,  { params : { token : token } });
    }

    resetPassword(token : string , newPassword : string) : Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.apiUrl}/reset-password` ,  { token , newPassword } );
    }


}