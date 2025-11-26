import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ChangeDetectorRef } from '@angular/core';
import { EventService } from '../../core/services/event.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-event-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule
],
  templateUrl: './event-dialog.html',
  styleUrls: ['./event-dialog.css']
})
export class EventDialog {
  form : FormGroup;
  backendErrors : any = {};
  isSaving = false;

  constructor (
    private fb : FormBuilder ,
    private dialogRef: MatDialogRef<EventDialog> ,
    private eventService : EventService ,
    private cdr : ChangeDetectorRef ,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
     this.form = this.fb.group ({
        title : [data.title , Validators.required] ,
        description : [data.description] , 
        eventDate : [this.normalizeDate(data.eventDate) , Validators.required] ,
        reminderTime : [this.normalizeDateTimeLocal(data.reminderTime)] ,

        recurrenceType : [data.recurrenceType ?? 'NONE'] , 
        recurrenceInterval : [data.recurrenceInterval ?? 1] , 
        recurrenceEndDate : [data.recurrenceEndDate ?? null]

     })
     if (data.readonly) {
     this.form.disable(); 
    }
  }

  // yyy-mm-dd
  private normalizeDate(val: string | null): string {
    if (!val) return '';
    return val.substring(0, 10);
  }

  // yyyy-mm-ddTHH:mm
  private normalizeDateTimeLocal(val: string | null) : string {
    if (!val) return '';

    const cleaned = val
    .replace(/\.\d+.*$/, '')   
    .replace(/:\d{2}$/, '');  

    return cleaned.substring(0, 16);
  }

  // minEventDate & minReminderTime
  get minEventDate() : string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  get minReminderTime() : string {
    return new Date().toISOString().substring(0,16); // yyyy-mm-ddTHH:mm (without second)
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.backendErrors = {};

    // make data for backend
    const payload = { ...this.form.value };

    // Normalize formats
    if (payload.eventDate) {
      payload.eventDate = payload.eventDate.substring(0, 10);
      if (payload.eventDate < this.minEventDate) {
        const temp = this.form.get("eventDate");

        if (temp) {
          temp.setErrors({ backend : true });
          temp.markAsTouched();
        }

        this.backendErrors.eventDate = `Event date must be at least 
        ${this.minEventDate}.`;
        this.isSaving = false;
        this.cdr.detectChanges();
        return;
      }
    }

    if (payload.reminderTime) {
      if (!payload.reminderTime.includes('T')) {
        payload.reminderTime = payload.reminderTime.replace(' ', 'T');
      }
      if (payload.reminderTime.length === 16) {
        payload.reminderTime += ':00';
      }
    }

    // Validation: reminder before event
    if (payload.reminderTime && payload.eventDate) {
      const eventDate = new Date(payload.eventDate);
      const reminder = new Date(payload.reminderTime);
      if (reminder >= eventDate) {
        const temp = this.form.get("reminderTime");

        if (temp) {
          temp.setErrors({ backend : true });
          temp.markAsTouched();
        }

        this.backendErrors.reminderTime = 'Reminder must be before the event date.';
        this.isSaving = false;
        this.cdr.detectChanges();
        return;
      }
    }

      const $request = this.data.id ? 
                       this.eventService.update(this.data.id,payload) :
                       this.eventService.create(payload);

      $request.subscribe({
        next: () => {
          this.isSaving=false;
          this.dialogRef.close(true); // success, close dialog! and tell it to list
        },
        error : (err) => {
          this.isSaving=false;
          // show errors from backend-validation in from
          if (err?.error?.data) {
            //console.log('Backend validation errors:', err.error.data);
            this.backendErrors = err.error.data;
            Object.keys(this.backendErrors).forEach((key) => {
              const pureKey = key.includes('.') 
                              ? key.split('.').pop()! 
                              : key;
              const control = this.form.get(pureKey);
              if (control) {
                control.setErrors({ backend: true });
                control.markAsTouched();
              }
            });
          } else {
          this.backendErrors._global = err?.error?.message || 'Save failed.';
          }
          
          this.cdr.detectChanges();
        }

      });

    
  }

  cancel() {
    this.dialogRef.close();
  }
}
