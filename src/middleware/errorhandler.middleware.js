// middlewares/errorHandler.js
import { ApiErrors } from "../utils/apiErrors.js";

const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiErrors) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.error,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }

    // For unknown errors
    return res.status(500).json({
        success: false,
        message: "Something went wrong!",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

export default errorHandler; 
