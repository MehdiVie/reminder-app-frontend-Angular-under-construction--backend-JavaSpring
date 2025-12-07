import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../../../app/core/services/auth.service"
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { LoginRequest } from "../../../core/models/user.model";
import { firstValueFrom } from "rxjs";
import { SnackbarService } from "../../../core/services/snackbar.service";

@Component ({
    selector : "app-login" , 
    standalone : true ,
    imports : [CommonModule , ReactiveFormsModule, RouterModule] , 
    templateUrl : "./login.html" ,
    styleUrls : ["./login.css"] 
})

export class LoginComponent implements OnInit {

    constructor() {
        console.log('%cLoginComponent CONSTRUCTOR', 'color: blue;');
    }
    
    private authService = inject(AuthService);
    private snackBar = inject(SnackbarService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    verifying=signal(false);
    errorMessage = signal<string>('');
    emailVerify : string | null = null;
    verifiedEmail : string | null = null;
    emailVerifyExpiredToken : string | null = null;

    form = this.fb.group({
        email : ['', [Validators.required, Validators.email]] ,
        password : ['', [Validators.required]]
    })

    isSubmitting = signal(false);
    
    ngOnInit() : void {

        this.emailVerify = this.route.snapshot.queryParamMap.get("emailVerify");

        const token = this.route.snapshot.queryParamMap.get("verify");

        if (token) {
            this.verifying.set(true);

            this.authService.verifyToken(token).subscribe(
                {
                    next : (res) => {
                        if (res.status ==  'success') {
                            const verifiedEmail = res.data;
                            this.snackBar.show("Email successfully verified! Login now!", "success");
                            this.form.get("email")?.setValue(verifiedEmail);
                            this.verifiedEmail=verifiedEmail;
                        } else if (res.status == 'error' && res.message == 'expired') {
                            this.snackBar.show("verification expired.", "error");
                            this.emailVerifyExpiredToken = res.data;
                        } else {
                            this.snackBar.show("verification failed.", "error");
                        }
                        this.verifying.set(false);
                    },
                    error : () => {
                        this.snackBar.show("verification failed or expired.", "error");
                        this.verifying.set(false);
                    }
                }
            )
        }
    }

    


    async onSubmit() {
        if (this.form.invalid) {
            this.errorMessage.set("Please enter valid email and password.");
            return;
        }
        this.isSubmitting.set(true);

        const data : LoginRequest = this.form.value as LoginRequest;

        try {
            const res = await firstValueFrom(this.authService.login(data));
            const token = res.data.token;
            this.authService.saveToken(token);

            const payload = JSON.parse(atob(token.split('.')[1]));
            const roles: string[] = payload.roles || [];

            if (roles.includes("ADMIN")) {
                this.router.navigate(['/admin/events']);
            } else {
                this.router.navigate(['/calendar']);
            }
     
        } catch(err) {
            console.error(err);
            this.errorMessage.set("Invalid email or password.");
        } finally {
            this.isSubmitting.set(false);
        }
    }

}