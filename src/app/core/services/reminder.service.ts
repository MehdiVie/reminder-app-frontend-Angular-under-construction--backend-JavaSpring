import { Injectable } from "@angular/core";
import { environment } from "../../../enviroments/environment";
import { HttpClient } from "@angular/common/http";
import { ApiResponse } from "../models/apiResponse.model";
import { Observable } from "rxjs";
import { Reminder } from "../models/reminder.model";

@Injectable({
  providedIn: 'root'
})

export class ReminderService {
   private apiUrl = environment.apiUrl+"/reminders";
   
   constructor(private http : HttpClient) {}

   getUpcomingRemiders(minutes:number=1) :Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.apiUrl}/upcoming`, { params : { minute: minutes } });
    }

    getUpcomingRemiders24Hours() :Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.apiUrl}/upcoming/24-hours`);
    }

    getSentRemiders24Hours() :Observable<ApiResponse<Reminder[]>> {
    return this.http.get<ApiResponse<Reminder[]>>(`${this.apiUrl}/sent/24-hours`);
    }

}