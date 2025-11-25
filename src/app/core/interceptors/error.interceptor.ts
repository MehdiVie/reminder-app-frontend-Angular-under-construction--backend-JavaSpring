import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from "../services/snackbar.service";

export const errorInterceptor : HttpInterceptorFn = (req,next) => {
    const router = inject(Router)
    const authService =inject(AuthService);
    const snackbar = inject(SnackbarService)

    return next(req).pipe(
        catchError( (error : HttpErrorResponse) => {
            
            /*
            error(full object http error that angular makes)
            .error(JSOn Body that returnd by backend)
            .{
            "status": "error",
            "message": "Access denied",
            "data": null
            }
            */

            const apiMessage = (error?.error?.message as string) || '';
            //const apiStatus = (error?.error?.status as string) || '';
            //const apiData = error?.error?.data;

            switch(error.status) {

                case 403: 
                    //const currentUrl = router.url;
                    snackbar.show('Access denied. You are not allowed to perform this action.', 'error');
                    setTimeout(() => router.navigate(['/events']),1500);
                    break;
                    
                case 401:
                    if (req.url.includes('/auth/login')) {
                        return throwError(() => error);
                    }
                    snackbar.show(apiMessage || 'Session expired. Please log in again.', 'error');
                    authService.logout();
                    setTimeout(() => router.navigate(["/login"]), 1500);
                    break;

                case 400:
                    if (apiMessage) {
                        snackbar.show(apiMessage,'error',2500);
                    } else {
                        snackbar.show('Validation failed', 'error',2500);
                    } 
                    break;

                case 0:
                    snackbar.show('Could not connect to server.Please check your backend.', 'error');
                    break;

                default : 
                    // 404, 409, 500, ...
                    const text = apiMessage || `Unexpected Error(${error.status})`;
                    snackbar.show(text , 'info');
                    break;
                
            }

            return throwError(() => error);

        })
    );
};