class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    statck = ""
  ) {
    super(message); // Call the parent class constructor (Error) with the message
    this.statusCode = statusCode; // HTTP status code (e.g., 404, 500)
    this.data = null; // Reserved if you want to return any data
    this.message = message; // Error message
    this.success = false; // Indicates failure (used in API responses)
    this.errors = errors; // Optional array of detailed error messages

    // Set the stack trace
    if (stack) {
      this.stack = statck;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
