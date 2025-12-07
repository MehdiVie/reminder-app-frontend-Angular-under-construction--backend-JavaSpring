import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EventDialog } from '../event-dialog/event-dialog';
import { EventService } from '../../core/services/event.service';
import { Event } from '../../core/models/event.model';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../enviroments/environment';
import { ReminderPollingService } from '../../core/services/reminder-polling.service';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule , MatProgressSpinnerModule, RouterModule , MatDialogModule, MatFormFieldModule,MatSelectModule,MatTooltipModule,MatOptionModule,FormsModule, MatSnackBarModule],
  templateUrl: './event-list.html',
  styleUrls: ['./event-list.css']
})
export class EventListComponent implements OnInit {
  displayedColumns: string[] = [];
  events: Event[] = [];
  searchTerm: string='';
  afterDate?: string;
  searchSubject = new Subject<string>(); 
  showReminderIds = new Set<number>(); // store eventId that has Toast before
  private polling = inject(ReminderPollingService);

  currentPage = 0;
  pageSize = environment.pageSize;
  totalItems = 0;
  totalPages = 0;
  sortBy = 'id';
  direction : 'asc' | 'desc' = 'asc'

  constructor(private eventService: EventService , 
              private dialog: MatDialog,
              private route : ActivatedRoute,
              private snakbar : SnackbarService) {}


  ngOnInit() {
    console.log('%cEventListComponent INIT','color: purple;');
    this.polling.startPolling();

    this.searchSubject.pipe(
      debounceTime(400)
    ).subscribe(term => {
      this.searchTerm = term;
      this.onSortAndSearchChange();
    })

    const idParam = this.route.snapshot.paramMap.get('id');
    
    this.displayedColumns = ['id', 'title', 'description', 'eventDate', 'reminderTime', 'actions'];
    if (idParam) {
      const id = Number(idParam);
      console.log("Detected id from the route : ", id);
      this.getEvent(id);
    }
    else {
      this.loadEvents();
    }
    
  }

  loadEvents() {

      this.eventService
        .getPage(this.currentPage,this.pageSize,this.sortBy,this.direction,this.afterDate,this.searchTerm)
        .subscribe({
            next: (res) => {
              console.log('Events received from backend:', res.data);
              const page = res.data;
              if (page.totalPages > 0 && this.currentPage >= page.totalPages) {
                this.currentPage = page.totalPages - 1;
                return this.loadEvents();
              }
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

  onSortAndSearchChange() {
    this.currentPage = 0; 
    this.loadEvents();
  }

  toggleDirection() {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
    this.loadEvents();
  }

  onSearchChange(term : string) {
    this.searchSubject.next(term);
  }

  getEvent(id : number) {
    this.eventService.getById(id).subscribe({
      next: (res) => {
        console.log('Event data:', res.data);
        this.events = [res.data];
      },
      error: (err) => console.error('Error fetching single event:', err)
    });
  }


  deleteEvent(id: number) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.delete(id).subscribe({
        next: () => {
          this.snakbar.show("Event deleted successfully.","info");
          this.loadEvents();
        },
        error: (err) => console.error('Delete failed:', err)
      });
    }
  }
  editEvent(event: Event) {
    const dialogRef = this.dialog.open(EventDialog, {
      width : '600px' ,
      data : { ...event }
    });
    dialogRef.afterClosed().subscribe((changed) => {
    if (changed) {
      this.loadEvents(); // only in success get the list
    }
    });

  }

  showEvent(event: Event) {
    const dialogRef = this.dialog.open(EventDialog, {
      width : '600px' ,
      data : { ...event , readonly: true}
    });
  }
  
  addEvent() {
    const dialogRef= this.dialog.open(EventDialog , {
      width : '600px' ,
      data : {} // no data , we want to make a new data
    });
    dialogRef.afterClosed().subscribe(changed => {
      if (changed) {
        this.loadEvents(); // only in success get the list
      }
    })
  }

}
