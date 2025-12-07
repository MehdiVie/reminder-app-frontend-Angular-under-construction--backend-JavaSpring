import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { EventService } from '../../core/services/event.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
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
  form: FormGroup;
  backendErrors: any = {};
  isSaving = false;
  eventService = inject(EventService);
  snakbar = inject(SnackbarService);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EventDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router : Router
  ) {
    this.form = this.fb.group({
      id : [data.id],
      title: [data.title, Validators.required],
      description: [data.description],
      eventDate: [this.normalizeDate(data.eventDate), Validators.required],
      reminderTime: [this.normalizeDateTimeLocal(data.reminderTime)],

      recurrenceType: [data.recurrenceType ?? 'NONE'],
      recurrenceInterval: [data.recurrenceInterval ?? 1],
      recurrenceEndDate: [data.recurrenceEndDate ?? null]
    });

    if (data.readonly) {
      this.form.disable();
    }
  }

  // yyyy-MM-dd
  private normalizeDate(val: string | null): string {
    if (!val) return '';
    return val.substring(0, 10);
  }

  // yyyy-MM-ddTHH:mm
  private normalizeDateTimeLocal(val: string | null): string {
    if (!val) return "";
    const cleaned = val
      .replace(/\.\d+.*$/, '')
      .replace(/:\d{2}$/, '');
    return cleaned.substring(0, 16);
  }

  get minEventDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  get minReminderTime(): string {
    return new Date().toISOString().substring(0, 16);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.backendErrors = {};
    this.isSaving = true;

    const payload = { ...this.form.value };

    // Normalize eventDate
    if (payload.eventDate) {
      payload.eventDate = payload.eventDate.substring(0, 10);

      if (payload.eventDate < this.minEventDate) {
        const ctrl = this.form.get("eventDate");
        if (ctrl) {
          ctrl.setErrors({ backend: true });
          ctrl.markAsTouched();
        }
        this.backendErrors.eventDate = `Event date must be at least ${this.minEventDate}.`;
        this.isSaving = false;
        return;
      }
    }

    // Normalize reminderTime
    if (payload.reminderTime) {
      if (!payload.reminderTime.includes("T")) {
        payload.reminderTime = payload.reminderTime.replace(" ", "T");
      }
      if (payload.reminderTime.length === 16) {
        payload.reminderTime += ":00";
      }
    }

    // Reminder before eventDate
    if (payload.reminderTime && payload.eventDate) {
      const eventDate = new Date(payload.eventDate);
      const reminder = new Date(payload.reminderTime);
      if (reminder >= eventDate) {
        const ctrl = this.form.get("reminderTime");
        if (ctrl) {
          ctrl.setErrors({ backend: true });
          ctrl.markAsTouched();
        }
        this.backendErrors.reminderTime = "Reminder must be before the event date.";
        this.isSaving = false;
        return;
      }
    }

    if (!this.data.id) {

      this.eventService.create(payload).subscribe({
        next : (res) => {
          if (res.status == 'success') {
            this.snakbar.show('Event created successfully.','success');
            this.isSaving=false;
            this.dialogRef.close('created');
          }
          else {
            this.isSaving = false;
            this.snakbar.show("Create failed!", "error");
          }
        } ,
        error: (err) => {
          this.isSaving = false;
          console.error(err);
          this.snakbar.show("Create failed!", "error");
        }
      });

      return;
    }

    
    this.isSaving = false;
    this.dialogRef.close(payload);
  }

  cancel() {
    this.dialogRef.close();
  }
  deleteEvent(id: number) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.delete(id).subscribe({
        next: () => {
          this.snakbar.show("Event deleted successfully.","info");
          this.dialogRef.close('deleted');
        },
        error: (err) => console.error('Delete failed:', err)
      });
    }
  }
  
}
