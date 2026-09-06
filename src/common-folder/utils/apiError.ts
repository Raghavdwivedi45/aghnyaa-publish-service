// Standard API error thrown across the app; extends native Error with HTTP status and details
// Use ApiError for expected, operational errors
export class ApiError extends Error {
    statusCode: number;
    data: null;
    errors: unknown[]; // list of granular error details (e.g. field validation errors)

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: unknown[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.errors = errors;

        // use provided stack if given, otherwise capture the current call site
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
