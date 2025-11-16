import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AdminEvent } from '../../core/models/adminEvent.model';
import { MatFormField } from "@angular/material/form-field";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../enviroments/environment';
import { debounceTime, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-event-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule , MatProgressSpinnerModule, RouterModule , MatDialogModule, MatFormFieldModule,MatSelectModule,MatTooltipModule,MatOptionModule,FormsModule],
  templateUrl: './admin-event-list.html',
  styleUrls: ['./admin-event-list.css']
})
export class AdminEventListComponent implements OnInit {

  displayedColumns: string[] = [];
  events: AdminEvent[] = [];
  searchTerm: string='';
  afterDate?: string;
  searchSubject = new Subject<string>(); 

  currentPage = 0;
  pageSize = environment.pageSize;
  totalItems = 0;
  totalPages = 0;
  sortBy = 'id';
  direction : 'asc' | 'desc' = 'asc'
  
  constructor(private adminService: AdminService ) {}


  ngOnInit() {

    this.searchSubject.pipe(
      debounceTime(400)
    ).subscribe(term => {
          this.searchTerm = term;
          this.onSortAndSearchChange();
    })


    this.displayedColumns = ['id', 'title', 'description', 'eventDate', 'reminderTime', 'reminderSent', 'reminderSentTime', 'userEmail', 'sendReminder']
    this.loadEvents();


  }

  loadEvents() {
      this.adminService
      .getPage(this.currentPage,this.pageSize,this.sortBy,this.direction,this.afterDate,this.searchTerm)
        .subscribe({
            next: (res) => {
              console.log('Events received from backend:', res.data);
              const page = res.data;
              this.events = page.content;
              this.totalItems = page.totalItems;
              this.pageSize = page.size;
              this.currentPage = page.currentPage;
              this.totalPages = page.totalPages;
            },
      error: (err) => {
        console.error('Error fetching events:', err);
      },
    });
    
    }

    nextPage() {
      if (this.currentPage + 1 < this.totalPages) {
        this.currentPage++;
        this.loadEvents();
      }
    }

    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.loadEvents();
      }
    }

    onSortChange() {
      this.currentPage = 0; 
      this.loadEvents();
    }

    onSortAndSearchChange() {
    this.currentPage = 0; 
    this.loadEvents();
    }

    onSearchChange(term : string) {
    this.searchSubject.next(term);
    }

    toggleDirection() {
      this.direction = this.direction === 'asc' ? 'desc' : 'asc';
      this.loadEvents();
    }

    sendReminder(id : number) {
      if (confirm("Send Reminder for this Event?")) {
        this.adminService.sendReminder(id).subscribe({
          next : () => {
            alert("Reminder sent successfully.");
            this.loadEvents()
          } ,
          error : (err) => {
            console.error('Send reminder failed:', err)
          }
        })
      }
    }

  }

