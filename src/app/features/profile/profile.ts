import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfileService } from '../../core/services/user-profile.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { CommonModule } from '@angular/common';
import { MatIcon } from "@angular/material/icon";
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {

  private fb = inject(FormBuilder);
  private fb2 = inject(FormBuilder);
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private snackBar = inject(SnackbarService);
  private router = inject(Router);

  profile : UserProfile | null = null; 
  loading = signal(true);
  changingPassword = signal(false);
  changingEmail = signal(false);

  emailMode : boolean = false;
  disableEmailBtn: boolean = false;
  passwordMode : boolean = false;
  disablePasswordBtn: boolean = false;

  form = this.fb.group (
    {
      oldPassword : ['', [Validators.required]],
      newPassword : ['', [Validators.required , Validators.minLength(6)]],
      confirmPassword : ['', [Validators.required ]]
    } ,
    {
      validators : (group : any) => {
        const np = group.get("newPassword")?.value;
        const cp = group.get("confirmPassword")?.value;
        return np && cp && np === cp ? null : { passwordMismatch : true }
      }
    }
  );

  form2 = this.fb2.group (
    {
      oldEmail : ['', [Validators.required, Validators.email]],
      newEmail : ['', [Validators.required , Validators.email , Validators.minLength(6)]],
      confirmEmail : ['', [Validators.required ]]
    } ,
    {
      validators : (group : any) => {
        const ne = group.get("newEmail")?.value;
        const ce = group.get("confirmEmail")?.value;
        return ne && ce && ne === ce ? null : { EmailMismatch : true }
      }
    }
  );

  ngOnInit(): void {
      this.userProfileService.getProfile().subscribe(
        {
          next : (res) => {
              if(res.status === "success") {
                this.profile = res.data;
              }
              this.loading.set(false);
          },
          error : () => {
              this.loading.set(false);
          }
        }

      )
  }

  changeEmailMode() {
    this.emailMode = !this.emailMode;
    if (this.emailMode) {
      this.passwordMode=false;
      this.form.reset();
    }
  }
  changePasswordMode() {
    this.passwordMode = !this.passwordMode;
    if (this.passwordMode) {
      this.emailMode=false;
      this.form2.reset();
    }
  }

  get passwordMismatch() {
    return this.form.hasError('passwordMismatch') &&
           this.form.get('confirmPassword')?.touched;
  }

  get emailMismatch() {
    return this.form.hasError('emailMismatch') &&
           this.form.get('confirmEmail')?.touched;
  }

  onChangePassword() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { oldPassword , newPassword } = this.form.value;
    if (!oldPassword || !newPassword) return;

    this.changingPassword.set(true);

    this.userProfileService.changePassword(oldPassword,newPassword).subscribe(
      {
        next : (res) => {
          if (res.status === 'success') {
            this.snackBar.show('Password changed successfully', 'success');
            this.form.reset();
            this.authService.logout();
            //this.router.navigate(['/login']);
          }
          else {
            this.snackBar.show(res.message || 'Failed to change password', 'error');
          }
          this.changingPassword.set(false);
        } ,
        error : (err) => {
          const backendMsg = err.error?.message || 'Failed to change password';
          this.snackBar.show(backendMsg, 'error');
          this.changingPassword.set(false);
        }
      }
    )

  }

  onChangeEmail() {
    if (this.form2.invalid) {
      this.form2.markAllAsTouched();
      return;
    }

    const { oldEmail , newEmail } = this.form2.value;
    if (!oldEmail || !newEmail) return;

    this.changingEmail.set(true);

    this.userProfileService
    .changeEmail(oldEmail.trim(),newEmail.trim())
    .subscribe(
      {
        next : (res) => {
          if (res.status === 'success') {
            this.snackBar.show('Email changed successfully', 'success');
            this.form.reset();
            this.authService.logout();
            //this.router.navigate(['/login']);
          }
          else {
            this.snackBar.show(res.message || 'Failed to change Email', 'error');
          }
          this.changingEmail.set(false);
        } ,
        error : (err) => {
          const backendMsg = err.error?.message || 'Failed to change email';
          this.snackBar.show(backendMsg, 'error');
          this.changingEmail.set(false);
        }
      }
    )
  }


}
