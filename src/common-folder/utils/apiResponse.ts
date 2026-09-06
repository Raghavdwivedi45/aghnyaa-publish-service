// <T = unknown>: generic type of `data`, defaults to `unknown` when caller omits it
export class ApiResponse<T = unknown> {
    statusCode: number;
    data: T;
    message: string;

    constructor(statusCode: number, data: T, message: string = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
}