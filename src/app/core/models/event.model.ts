

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// shared Event model - used across services and components
export interface Event {
    id : number ;
    title : string ;
    description ?: string ;
    eventDate : string ; // ISO date string
    reminderTime : string  | null; // ISO date string

    recurrenceType : RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate : string | null;

    parentEventId?: number | null;
    exception?: boolean;
    originalDate?: string | null;
}

export interface MoveOccurrenceRequest {
  originalDate: string;   // ISO date (yyyy-MM-dd)
  newDate: string;        // ISO date (yyyy-MM-dd)
  mode: 'SINGLE' | 'THIS_AND_FUTURE' | 'ALL';
}