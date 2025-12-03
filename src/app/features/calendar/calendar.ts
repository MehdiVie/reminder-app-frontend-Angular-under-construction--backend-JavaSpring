import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
  FullCalendarModule,
  FullCalendarComponent
} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MatDialog } from '@angular/material/dialog';

import { EventService } from '../../core/services/event.service';
import { Event, MoveOccurrenceRequest } from '../../core/models/event.model';
import { RecurringMoveDialogComponent } from './recurring-move-dialog/recurring-move-dialog';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css'],
})
export class CalendarComponent {

  @ViewChild(FullCalendarComponent)
  calendarComponent!: FullCalendarComponent;

  calendarOptions: any = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'today prev,next',
      center: 'title',
      right: ''
    },
    editable: true,
    eventDurationEditable: false,
    eventSources: [],
    datesSet: (arg: any) => this.onDatesSet(arg),
    eventDrop: (arg: any) => this.onEventDrop(arg),
  };


  constructor(
    private eventService: EventService,
    private dialog: MatDialog
  ) {}

private loadRange(start: string, end: string) {
  const api = this.calendarComponent.getApi();

  api.removeAllEventSources();

  api.addEventSource({
    events: (info, successCallback, failureCallback) => {
      this.eventService.getCalendarEvents(start, end).subscribe({
        next: (res) => {
          if (res.status !== 'success') return successCallback([]);

          const fcEvents = res.data.map(ev => ({
            id: ev.id.toString(),
            title: ev.title,
            start: ev.eventDate,
            color: this.getColorForRecurrence(ev.recurrenceType),
            extendedProps: {
              recurrenceType: ev.recurrenceType,
              recurrenceInterval: ev.recurrenceInterval,
              recurrenceEndDate: ev.recurrenceEndDate,
              isException: ev.exception,
              parentEventId: ev.parentEventId,
              originalDate: ev.originalDate ?? null
            }
          }));

          successCallback(fcEvents);
        },
        error: failureCallback
      });
    }
  });
}

  onDatesSet(arg: any) {
    const start = arg.start.toISOString().substring(0, 10);
    const end   = arg.end.toISOString().substring(0, 10);
    this.loadRange(start, end);
  }

  async onEventDrop(arg: any) {
    
  const ev = arg.event;
  const props = ev.extendedProps;

  const newDateIso = ev.startStr.substring(0, 10);
  const oldDateIso = arg.oldEvent.startStr.substring(0, 10);

  const isRecurring = props.recurrenceType && props.recurrenceType !== 'NONE';
  const isException = !!props.isException;
  const parentEventId = props.parentEventId ?? null;

  if (!isRecurring && !isException && !parentEventId) {
    this.eventService.moveEventDate(ev.id, newDateIso).subscribe({
      next: (res) => {
        if (res.status !== 'success') return arg.revert();
        this.calendarComponent.getApi().refetchEvents();
      },
      error: () => arg.revert()
    });
    return;
  }

  const masterId: number = parentEventId ?? Number(ev.id);
  const originalDate = oldDateIso;

  const mode = await this.openRecurringDialog();
  if (!mode) return arg.revert();

  const payload: MoveOccurrenceRequest = {
    originalDate,
    newDate: newDateIso,
    mode
  };

  this.eventService.moveOccurrence(masterId, payload).subscribe({
    next: (res) => {
      if (res.status !== 'success') return arg.revert();
      this.calendarComponent.getApi().refetchEvents();
    },
    error: () => arg.revert()
  });
}


 
  private openRecurringDialog():
    Promise<'SINGLE' | 'THIS_AND_FUTURE' | 'ALL' | null> {
    const dialogRef = this.dialog.open(RecurringMoveDialogComponent, {
      width: '360px',
    });
    return dialogRef.afterClosed().toPromise();
  }

  
  getColorForRecurrence(type: string | null | undefined): string {
    switch (type) {
      case 'DAILY': return '#2563eb';
      case 'WEEKLY': return '#16a34a';
      case 'MONTHLY': return '#eab308';
      case 'YEARLY': return '#f97316';
      default: return '#6b7280'; // NONE یا null
    }
  }

}
