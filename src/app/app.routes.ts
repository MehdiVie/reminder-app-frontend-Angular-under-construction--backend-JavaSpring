import { Routes } from '@angular/router';
import { EventListComponent } from './features/event-list/event-list';
import { AdminEventListComponent } from './features/admin-event-list/admin-event-list';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard';
import { LoginComponent } from './features/auth/login/login';
import { AdminGuard } from './core/guards/admin.guard';
import { RegisterComponent } from './features/auth/register/register';

export const routes: Routes = [
  { path: '' , redirectTo : 'events' , pathMatch : 'full'},

  //Auth
  { path: 'login', component: LoginComponent } ,
  { path: 'register', component: RegisterComponent } ,

  //User Pages
  { path: 'events', component: EventListComponent },
  { path: 'events/:id', component: EventListComponent },
  
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
