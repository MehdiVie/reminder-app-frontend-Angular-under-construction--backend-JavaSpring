

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' |'YEARLY';

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
}