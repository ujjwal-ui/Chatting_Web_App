
class ApiError extends Error {
    constructor(message = "Something went wronge", statusCode, errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.success = false;

        if(stack)
            this.stack = stack;
        else
            Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = ApiError;