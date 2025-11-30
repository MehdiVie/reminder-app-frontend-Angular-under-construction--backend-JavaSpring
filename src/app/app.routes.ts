import { Routes } from '@angular/router';
import { EventListComponent } from './features/event-list/event-list';
import { AdminEventListComponent } from './features/admin-event-list/admin-event-list';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard';
import { LoginComponent } from './features/auth/login/login';
import { AdminGuard } from './core/guards/admin.guard';
import { RegisterComponent } from './features/auth/register/register';
import { ProfileComponent } from './features/profile/profile';
import { ReminderComponent } from './features/reminder/reminder';
import { ForgetPasswordComponent } from './features/forget-password/forget-password';
import { ResetPasswordComponent } from './features/reset-password/reset-password';
import { CalendarComponent } from './features/calendar/calendar';

export const routes: Routes = [
  { path: '' , redirectTo : 'events' , pathMatch : 'full'},

  //Auth
  { path: 'login', component: LoginComponent } ,
  { path: 'register', component: RegisterComponent } ,
  { path: 'forget-password', component: ForgetPasswordComponent } ,
  { path: 'reset-password', component: ResetPasswordComponent } ,

  //User Pages
  { path: 'profile', component: ProfileComponent },
  { path: 'events', component: EventListComponent },
  { path: 'events/:id', component: EventListComponent },  
  { path: 'reminders', component: ReminderComponent },
  { path: 'calendar', component: CalendarComponent },
  
  //Admin
  {
    path : 'admin',
    canActivate : [AdminGuard],
    children: [
          { path: 'events' , component: AdminEventListComponent } ,
          { path: 'stats' , component: AdminDashboardComponent} 
    ]
  },

  { path: '**', redirectTo : 'login' } 
];
