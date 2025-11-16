import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterModule  } from '@angular/router';
import { CommonModule } from '@angular/common';  
import { EventDialog } from '../../features/event-dialog/event-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent  {
  

  constructor(private authService: AuthService , 
              private router : Router,
              private dialog: MatDialog
              ) {}

  openAddEventDialog() {
    const dialogRef = this.dialog.open(EventDialog , {
      width : '600px',
      data : {}
    });

    dialogRef.afterClosed().subscribe(changed => {
      if(changed) {
        this.router.navigate(['events']).then(()=> {
          window.location.reload();
        })
      }
    })
  }

  logout() {
    this.authService.logout();
  }

  isLoggedIn() {
    return this.authService.getToken() !== null;
  }

  isAdmin() {
    console.log(this.authService.hasRole("ADMIN"));
    return this.authService.hasRole("ADMIN");
  
  }

}
