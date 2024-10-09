class ApiError extends Error {
    constructor(
        statusCode,
        message = "An unknown error occurred!",
        error =[],
        statck = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data=null;
        this.success = false;
        this.stack = stack;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }

    }

}

export { ApiError };