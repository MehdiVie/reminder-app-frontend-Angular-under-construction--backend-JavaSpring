import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterRequest } from '../../../core/models/user.model';
import { firstValueFrom } from 'rxjs';

function passwordMatchValidator(group : AbstractControl) : ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch : true };
}

@Component({
  selector: 'app-register',
  imports: [CommonModule , ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {

  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);

  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isSubmitting = signal(false);

  form = this.fb.group(
    {
      email : ['' , [Validators.required , Validators.email]],
      password : ['' , [Validators.required , Validators.minLength(6)]],
      confirmPassword : ['' , [Validators.required]]
    },
    {
      validators : passwordMatchValidator, 
    }
  )

  async onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.errorMessage.set('Please fix the errors in the form.');
      this.form.markAllAsTouched;
      return;
    }

    this.isSubmitting.set(true);

    const data : RegisterRequest = {
      email : this.form.value.email!,
      password : this.form.value.password!
    }

    try {
      const res = await firstValueFrom(this.authService.register(data));
      this.successMessage.set('Registration successful. You can now login.');
      setTimeout(()=> this.router.navigate(['/login']),2000)
    } catch(err) {
      console.error(err);
      this.errorMessage.set('Registration failed.Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }

  }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  get passwordMismatch() {
      return this.form.hasError('passwordMismatch') && this.confirmPassword?.touched;
    }



}
