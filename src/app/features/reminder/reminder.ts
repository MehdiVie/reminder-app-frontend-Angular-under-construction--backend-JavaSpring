import { Component, OnInit, signal } from '@angular/core';
import { ReminderService } from '../../core/services/reminder.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reminder',
  imports: [CommonModule],
  templateUrl: './reminder.html',
  styleUrl: './reminder.css',
})
export class ReminderComponent implements OnInit {

  
  constructor (private reminderService: ReminderService,
               private router : Router) {}
  
  loading = signal(true);

  upcoming : any[] = [];
  sent : any [] = [];

  ngOnInit(): void {
      this.reminderService.getUpcomingRemiders24Hours().subscribe(
        {
          next : (res) => this.upcoming = res.data || [], 
        }
      );

      this.reminderService.getSentRemiders24Hours().subscribe(
        {
          next : (res) => this.sent = res.data || [],
          complete : () => this.loading.set(false)
        }
      )
  }

  
  viewEvent(id: number) {
    this.router.navigate(['/events', id]);
  }

}
