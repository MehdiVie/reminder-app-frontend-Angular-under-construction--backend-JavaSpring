export interface LoginRequest {
    email : string ;
    password : string 
}

export interface RegisterRequest {
    email : string ;
    password : string
}

export interface LoginResponse {
    status : string ;
    message : string ;
    data : {
        id : number , 
        email : string ,
        roles : string[] , 
        token : string
    };
}