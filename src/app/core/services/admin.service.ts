import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/apiResponse.model";
import { AdminEvent } from "../models/adminEvent.model";
import { PageResponse } from "../models/pageResponse.model";
import { environment } from '../../../enviroments/environment';


@Injectable({
    providedIn : "root"
})

export class AdminService {
    private readonly baseUrl = environment.apiUrl+'/admin';

    constructor(private http: HttpClient) {}

    getPage(
      currentPage = 0 ,
      pageSize = 10 ,
      sortBy = 'id',
      direction : 'asc' | 'desc' = 'asc',
      afterDate?: string,
      search?: string
    ) :  Observable<ApiResponse<PageResponse<AdminEvent>>> {
          currentPage = isNaN(currentPage) ? 0 : currentPage;
          pageSize = isNaN(pageSize) ? 1 : pageSize;
          let params = new HttpParams()
                .set('page',currentPage)
                .set('size',pageSize)
                .set('sortBy',sortBy)
                .set('direction',direction);
          if (afterDate) params= params.set('afterDate',afterDate);
          if (search) params= params.set('search',search);
    
      return this.http.get<ApiResponse<PageResponse<AdminEvent>>>(`${this.baseUrl}/events/paged`, { params, });
    
    }

    getAll() : Observable<ApiResponse<AdminEvent[]>> {
        return this.http.get<ApiResponse<AdminEvent[]>>(`${this.baseUrl}/events`);
    }

    getPendingReminders() : Observable<ApiResponse<AdminEvent[]>> {
        return this.http.get<ApiResponse<AdminEvent[]>>(`${this.baseUrl}/events/pending`);
    }

    sendReminder(id : number): Observable<ApiResponse<void>>  {
       return this.http.post<ApiResponse<void>>(`${this.baseUrl}/events/${id}/send-reminder`, {});
    }

    getStats() : Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.baseUrl}/stats`);
    }
}