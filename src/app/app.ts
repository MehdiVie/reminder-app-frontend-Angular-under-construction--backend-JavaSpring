import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from './core/services/loading.service';
import { NavbarComponent } from './shared/navbar/navbar';
import { ReminderPollingService } from './core/services/reminder-polling.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule , MatProgressSpinnerModule, NavbarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  loading = inject(LoadingService);
  private polling = inject(ReminderPollingService);
  private authService = inject(AuthService);

  ngOnInit(): void {
      if(this.authService.getToken()) {
        this.polling.startPolling();
      }
  }
  
}
