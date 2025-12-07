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
import { RecurringMoveDialogComponent } from './recurring-move-dialog/recurring-move-dialog';
import { EventDialog } from '../event-dialog/event-dialog';
import { EventSourceFuncArg, EventClickArg, EventDropArg , EventInput, } from '@fullcalendar/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, MatButtonModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css'],
})
export class CalendarComponent {

  @ViewChild(FullCalendarComponent)
  calendarComponent!: FullCalendarComponent;

  constructor(
    private eventService: EventService,
    private dialog: MatDialog
  ) {}


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

    events: (
      info: EventSourceFuncArg, 
      success: (events: EventInput[]) => void, 
      failure: (error: any) => void) => {
      const start = info.startStr.substring(0, 10);
      const end = info.endStr.substring(0, 10);

      this.eventService.getCalendarEvents(start, end).subscribe({
        next: (res) => {
          if (res.status !== 'success') {
            success([]);
            return;
          }

          const mapped = res.data.map(ev => ({
            id: ev.id.toString(),
            title: ev.title,
            start: ev.eventDate,
            color: this.getColorForRecurrence(ev.recurrenceType),
            extendedProps: {
              description: ev.description ?? null,
              reminderTime: ev.reminderTime ?? null,
              recurrenceType: ev.recurrenceType,
              recurrenceInterval: ev.recurrenceInterval,
              recurrenceEndDate: ev.recurrenceEndDate,
              isException: ev.exception,
              parentEventId: ev.parentEventId,
              originalDate: ev.originalDate ?? null
            }
          }));

          success(mapped);
        },
        error: failure
      });
    },

    eventDrop: (arg: EventDropArg) => this.onEventDrop(arg),
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    dateClick: (arg: any) => this.onDateClick(arg)
  };

  private openRecurringDialog():
  Promise<'SINGLE' | 'THIS_AND_FUTURE' | 'ALL' | null> {

    const dialogRef = this.dialog.open(RecurringMoveDialogComponent, {
      width: '360px',
    });

    return dialogRef.afterClosed().toPromise();
  }

  onEventClick(arg: EventClickArg) {
    const ev = arg.event;
    const props = ev.extendedProps;

    const oldDateIso = ev.startStr.substring(0, 10);

    const dialogRef = this.dialog.open(EventDialog, {
      width: '600px',
      data: {
        id: ev.id,
        title: ev.title,
        description: props['description'] ?? '',
        eventDate: ev.startStr,
        reminderTime: props['reminderTime'] ?? null,
        recurrenceType: props['recurrenceType'],
        recurrenceInterval: props['recurrenceInterval'],
        recurrenceEndDate: props['recurrenceEndDate'],
        readonly: false
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {

      if (result === "deleted") {
        this.refetchCalendar();
        return;
      }

      if (!result) return;

      const newDateIso = result.eventDate.substring(0, 10);

      if (oldDateIso === newDateIso) {
        this.simpleUpdate(ev, result);
        return;
      }

      await this.applyMoveLogic(ev, oldDateIso, newDateIso, null , null);
    });
  }


  // -----------------------------
  //  SIMPLE UPDATE (NO DATE CHANGE)
  // -----------------------------
  simpleUpdate(ev : any, payload: any) {
    const id = Number(ev.id);
    this.eventService.update(id, payload).subscribe({
      next: () => {
        if (payload.title) {
          ev.setProp('title', payload.title);
        }
        if (payload.description) {
          ev.setExtendedProp('description', payload.description);
        }
        if (payload.reminderTime) {
          ev.setExtendedProp('reminderTime', payload.reminderTime);
        }

        this.refetchCalendar();
      },
      error: err => console.error(err)
    });
  }
  
 private refetchCalendar() {
  const api = this.calendarComponent.getApi();
  api.refetchEvents();
 }

 openAddDialog(clickedDate : string | null= null) {
    const dialogRef = this.dialog.open(EventDialog , {
      width : '600px' ,
      data : {
        id : null ,
        title : '',
        description : '',
        eventDate : clickedDate ,
        reminderTime : '',
        recurrenceType : 'NONE',
        recurrenceInterval: 1,
        recurrenceEndDate: null,
        readonly: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'created') {
        this.refetchCalendar();
        return;
      }
    });
    
  }

  onDateClick(arg : any) {
    const clickedEvent : string | null = arg.dateStr;
    
    this.openAddDialog(clickedEvent);
    
  }


  async onEventDrop(arg: EventDropArg) {
    const ev = arg.event;

    const newDateIso = ev.startStr.substring(0, 10);
    const oldDateIso = arg.oldEvent.startStr.substring(0, 10);

    await this.applyMoveLogic(
      ev,
      oldDateIso,
      newDateIso,
      arg.view,
      () => arg.revert()
    );
  }

  // -----------------------------
  //  COLOR PICKING
  // -----------------------------
  getColorForRecurrence(type: string | null | undefined): string {
    switch (type) {
      case 'DAILY': return '#2563eb';
      case 'WEEKLY': return '#16a34a';
      case 'MONTHLY': return '#eab308';
      case 'YEARLY': return '#f97316';
      default: return '#6b7280';
    }
  }


  // -----------------------------
  //  MASTER MOVE LOGIC (EDIT/DRAG)
  // -----------------------------
  async applyMoveLogic(
    ev: any,
    oldDateIso: string,
    newDateIso: string,
    view: any | null = null,
    revertFn: (() => void) | null = null
  ) {
    const props = ev.extendedProps;

    const recurrenceType = props.recurrenceType;
    const parentEventId = props.parentEventId ?? null;
    const isException = !!props.isException;
    const originalDateBackend = props.originalDate ?? null;

    const isRecurring = recurrenceType && recurrenceType !== 'NONE';


    if (!isRecurring && !isException && !parentEventId) {
      return this.moveSingleEventDate(ev,newDateIso,view,revertFn)
    }

    return this.moveRecurringEvent(
      ev,
      oldDateIso,
      newDateIso,
      props,
      view,
      revertFn
    );

  }

  private moveSingleEventDate(
    ev: any,
    newDateIso: string,
    view: any | null,
    revertFn: (() => void) | null
  ): Promise<void> {

  return new Promise<void>((resolve) => {
    this.eventService.moveEventDate(ev.id, newDateIso).subscribe({
      next: (res) => {
        if (res.status !== 'success') {

          if (revertFn) revertFn(); 
          return resolve();
        }

        ev.remove();              
        this.refetchCalendar();  

        resolve();
      },
      error: () => {
        if (revertFn) revertFn();
        resolve();
      }
    });
  });
 }

 private async moveRecurringEvent(
  ev: any,
  oldDateIso: string,
  newDateIso: string,
  props: any,
  view: any | null,
  revertFn: (() => void) | null
): Promise<void> {

  const recurrenceType = props.recurrenceType;
  const parentEventId = props.parentEventId ?? null;
  const isException = !!props.isException;
  const originalDateBackend = props.originalDate ?? null;

  const masterId = parentEventId ?? Number(ev.id);

  const originalDate =
    (isException && originalDateBackend)
      ? originalDateBackend
      : (originalDateBackend || oldDateIso);

  
  const mode = await this.openRecurringDialog();
  if (!mode) {
    if (revertFn) revertFn();
    return;
  }

  const payload = {
    originalDate,
    newDate: newDateIso,
    mode
  };

  return new Promise<void>((resolve) => {
    this.eventService.moveOccurrence(masterId, payload).subscribe({
      next: (res) => {
        if (res.status !== 'success') {
          if (revertFn) revertFn();
          return resolve();
        }

        ev.remove();
        this.refetchCalendar();
        resolve();
      },
      error: () => {
        if (revertFn) revertFn();
        resolve();
      }
    });
  });
 }



}
