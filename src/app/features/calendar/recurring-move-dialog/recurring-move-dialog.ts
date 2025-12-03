import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-recurring-move-dialog',
  imports: [CommonModule , MatDialogModule , MatButtonModule],
  templateUrl: './recurring-move-dialog.html',
  styleUrl: './recurring-move-dialog.css',
})
export class RecurringMoveDialogComponent {

  private dialogRef = inject(MatDialogRef<RecurringMoveDialogComponent , 'SINGLE' | 'THIS_AND_FUTURE' | 'ALL' | null>);

  choose(mode: 'SINGLE' | 'THIS_AND_FUTURE' | 'ALL') {
    this.dialogRef.close(mode);
  }

  cancel() {
    this.dialogRef.close(null);
  }


}
