import { inject, Injectable } from "@angular/core";
import { interval, Subscription } from "rxjs";
import { ReminderService } from "./reminder.service";
import { SnackbarService } from "./snackbar.service";

@Injectable ({ 
    providedIn : 'root' 
})

export class ReminderPollingService {

    private pollingSub : Subscription | undefined;
    private showIds = new Set<number>();

    private reminderService = inject(ReminderService);
    private snackbar = inject(SnackbarService);

    constructor() {
        console.log('%cReminderPollingService CONSTRUCTOR','color:red;');
    }

    startPolling() {
        console.log('startPolling CALLED');
        if (this.pollingSub) return;

        this.pollingSub = interval(30000).subscribe(()=>{
            this.checkReminders();
        })

        console.log('%cReminder Polling started.', 'color: green;');
    }

    stopPolling() {
        if (this.pollingSub) {
            this.pollingSub.unsubscribe();
            this.pollingSub = undefined;
            console.log('%cReminder Polling stopped.', 'color: red;');
        }
    }

    checkReminders() {
        console.log('%cComes in checkReminders().', 'color: green;');
        this.reminderService.getUpcomingRemiders(1).subscribe(
            {
                next : (res) => {
                    if (res.status == 'success' && res.data.length >0) {
                        for(const ev of res.data) {
                            if (this.showIds.has(ev.id)) continue;
                            this.showIds.add(ev.id);
                            this.snackbar.show(
                                `Reminder "${ev.title}" starts at ${new Date(ev.reminderTime).toLocaleTimeString()}`,'info'
                            )
                        }
                    }
                },
                error : (err) => {
                    console.error('Reminder polling error.',err);
                }
            }
        )
    }



}