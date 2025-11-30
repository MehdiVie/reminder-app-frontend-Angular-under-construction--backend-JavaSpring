import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventService } from '../../core/services/event.service';
import { MatDialog } from '@angular/material/dialog';
import { EventDialog } from '../event-dialog/event-dialog';
import { Event, MoveOccurrenceRequest } from '../../core/models/event.model';

@Component({
  selector: 'app-calendar',
  standalone : true ,
  imports: [CommonModule , FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class CalendarComponent {

  calendarOptions : any = {
    initialView : 'dayGridMonth',
    plugins : [dayGridPlugin, interactionPlugin],
    headerToolbar: {
      left:'today prev,next',
      center: 'title',
      right: ''
    },
    events : [],
    editable : true ,
    eventDurationEditable: false,
    datesSet: (arg: any) => this.onDatesSet(arg),
    eventDrop : (arg : any) => this.onEventDrop(arg),
  }

  constructor(
    private eventService: EventService ,
    private dialog : MatDialog
  ) {}


  onDatesSet(arg : any) {
    const start = arg.start.toISOString().substring(0, 10);
    const end   = arg.end.toISOString().substring(0, 10);

    
    this.eventService.getCalendarEvents(start,end).subscribe(
      {
        next : (res) => {
          if(res.status == 'success') {
            const events = res.data;
            
            this.calendarOptions.events = events.map(ev=>({
              id : ev.id , 
              title : ev.title , 
              start : ev.eventDate , 
              color : this.getColorForRecurrence(ev.recurrenceType),
              extendedProps : {
                recurrenceType : ev.recurrenceType,
                isException : ev.exception,
                parentEventId : ev.parentEventId,
                originalDate : ev.originalDate || ev.eventDate
              }
            }))
          }
        },
        error : (err) => console.error("Calendar load error",err),
      }
    )
  }

  onEventDrop(arg : any) {
    const ev = arg.event;
    const props = ev.extendedProps;

    const newDateIso = arg.event.startStr.substring(0, 10);

    const recurrenceType = props.recurrenceType as string | null | undefined;
    const isException = !!props.isException;
    const hasParent = !!props.parentEventId;

    const isRecurring = recurrenceType && recurrenceType !== 'NONE';

    if (!isRecurring && !isException && !hasParent) {
      this.eventService.moveEventDate(ev.id,newDateIso).subscribe(
      {
          next : (res) => {
            if (res.status != 'success') {
              arg.revert();
            } 
          },
          error : (err) => {
            arg.revert();
          }
      })
      return;
    }

    const payload: MoveOccurrenceRequest = {
      originalDate: props.originalDate,   // occurrence actual date before move
      newDate: newDateIso,                // new date selected by user
      mode: 'SINGLE'
    };

    const effectiveEventId  = isException 
      ? ev.id : (props.parentEventId || ev.id);

    this.eventService.moveOccurrence(effectiveEventId , payload).subscribe(
      {
        next : (res) => {
          if(res.status !== 'success') arg.revert();
        } ,
        error : (err) => {
          arg.revert();
        }
      })
    
  }

  getColorForRecurrence(type: string|null|undefined): string {
      switch (type) {
        case 'DAILY': return '#2563eb';    
        case 'WEEKLY': return '#16a34a';   
        case 'MONTHLY': return '#eab308';  
        case 'YEARLY': return '#f97316';   
        default: return '#6b7280';         
    }
  }

}
