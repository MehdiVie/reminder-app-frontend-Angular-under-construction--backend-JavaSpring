import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);

  showForm : boolean = false;
  resetingPassword = signal(false);
  token: string | null = null;

  form = this.fb.group(
    {
      
      newPassword : ['', [Validators.required , Validators.minLength(6)]] ,
      confirmPassword : ['', [Validators.required]]
    } ,
    {
      validators : (group : any) => {
        const np = group.get("newPassword")?.value;
        const cp = group.get("confirmPassword")?.value;
        return np && cp && np == cp ? null : { passwordMismatch : true };
      }
    }
  )

  ngOnInit(): void {

      this.token = this.route.snapshot.queryParamMap.get("token");
      
      if (this.token) {
        
        this.authService.checkResetPasswordLinkToken(this.token).subscribe(
        {
          next : (res) => {
            if(res.status == 'success') {
              this.showForm = true;
            } else {
              this.snackbar.show('invalid token.redirecting to login page.','error');
              this.router.navigate(['/login']);
            }
            
          },
          error : (err) => {
            const msg = err.error?.message || 'invalid token.redirecting to login page.'
            this.snackbar.show(msg,'error');
            this.router.navigate(['/login']);
          }
        }
        )
      }

  }

  get passwordMismatch() {
    return this.form.hasError("passwordMismatch") &&
            this.form.get("confirmPassword")?.touched;
  }

  onResetPassword() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword } = this.form.value;
    if (!this.token || !newPassword) return;

    this.resetingPassword.set(true);

    this.authService.resetPassword(this.token,newPassword).subscribe(
      {
        next : (res) => {
          if (res.status == 'success') {
            this.snackbar.show('Password reset successfully.','success');
          } else {
            this.snackbar.show(res.message || 'Failed to reset password.try again later','error');
          }
          this.resetingPassword.set(false);
          this.router.navigate(['/login']);
        },
        error : (err) => {
          const msg = err.error?.message || 'Failed to reset password.'
          this.snackbar.show(msg,'error');
          this.resetingPassword.set(false);
        }
        
      }
    )


  }

}
