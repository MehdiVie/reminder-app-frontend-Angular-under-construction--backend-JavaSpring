import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SnackbarService } from '../../core/services/snackbar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forget-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css',
})
export class ForgetPasswordComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);

  sendingResetPasswordLink = signal(false);


  form = this.fb.group (
    {
      email : ['',[Validators.required , Validators.email]]
    } 
  )

  onSendResetPasswordLink() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.value;
    if (!email) return;

    this.sendingResetPasswordLink.set(true);

    this.authService.sendResetPasswordLink(email.trim()).subscribe(
      {
        next : (res) => {
          if (res.status == 'success') {
            this.snackbar.show('Reset password link sent successfully','success')
          } else {
            this.snackbar.show(res.message || 'Failed to send reset password link.try again later','error');
          }
          this.sendingResetPasswordLink.set(false);
        } ,
        error : (err) => {
          const msg = err.error?.message || 'Failed to send reset password email.'
          this.snackbar.show(msg,'error');
          this.sendingResetPasswordLink.set(false);
        }
      }
    )

  }
}
