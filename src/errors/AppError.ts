/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Custom error classes for the application
 */
import { StatusCodes } from 'http-status-codes';

export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  NO_TOKEN = 'NO_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
}

/**
 * Interface for error constructor options
 */
export interface IErrorOptions {
  message?: string;
  errorCode?: ErrorCode;
  errors?: any;
}

/**
 * Interface for error constructor options with custom status code
 */
export interface IErrorOptionsWithStatus extends IErrorOptions {
  statusCode?: number;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly message: string;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly errors?: any;

  constructor(options: IErrorOptionsWithStatus);
  constructor(message: string, statusCode?: number, errorCode?: ErrorCode, errors?: any);
  constructor(messageOrOptions: string | IErrorOptionsWithStatus, statusCode?: number, errorCode?: ErrorCode, errors?: any) {
    // Handle constructor overloading
    let message: string;
    let finalStatusCode: number;
    let finalErrorCode: ErrorCode;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      // Called with options object: new AppError({ message, errorCode, errors })
      message = messageOrOptions.message || 'Internal Server Error';
      finalStatusCode = messageOrOptions.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      finalErrorCode = messageOrOptions.errorCode || ErrorCode.INTERNAL_SERVER_ERROR;
      finalErrors = messageOrOptions.errors;
    } else {
      // Called with positional arguments: new AppError(message, statusCode, errorCode, errors)
      message = messageOrOptions || 'Internal Server Error';
      finalStatusCode = statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      finalErrorCode = errorCode || ErrorCode.INTERNAL_SERVER_ERROR;
      finalErrors = errors;
    }

    super(message);
    this.statusCode = finalStatusCode;
    this.message = message;
    this.errorCode = finalErrorCode;
    this.isOperational = true;
    this.errors = finalErrors;

    // Maintains proper stack trace in V8 environments (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error for validation failures (Joi, Zod, etc.)
 */
export class ValidationError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: any);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: any) {
    let message: string;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      message = messageOrOptions?.message || 'Validation failed';
      finalErrors = messageOrOptions?.errors;
    } else {
      message = messageOrOptions || 'Validation failed';
      finalErrors = errors;
    }

    super({ message, statusCode: StatusCodes.BAD_REQUEST, errorCode: ErrorCode.VALIDATION_ERROR, errors: finalErrors });
  }
}

/**
 * Error for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errorCode?: ErrorCode, errors?: any);
  constructor(messageOrOptions?: string | IErrorOptions, errorCode?: ErrorCode, errors?: any) {
    let message: string;
    let finalErrorCode: ErrorCode;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      message = messageOrOptions?.message || 'Authentication failed';
      finalErrorCode = messageOrOptions?.errorCode || ErrorCode.UNAUTHORIZED;
      finalErrors = messageOrOptions?.errors;
    } else {
      message = messageOrOptions || 'Authentication failed';
      finalErrorCode = errorCode || ErrorCode.UNAUTHORIZED;
      finalErrors = errors;
    }

    super({ message, statusCode: StatusCodes.UNAUTHORIZED, errorCode: finalErrorCode, errors: finalErrors });
  }
}

/**
 * Error for authorization/permission failures
 */
export class AuthorizationError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errorCode?: ErrorCode, errors?: any);
  constructor(messageOrOptions?: string | IErrorOptions, errorCode?: ErrorCode, errors?: any) {
    let message: string;
    let finalErrorCode: ErrorCode;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      message = messageOrOptions?.message || 'Access denied';
      finalErrorCode = messageOrOptions?.errorCode || ErrorCode.FORBIDDEN;
      finalErrors = messageOrOptions?.errors;
    } else {
      message = messageOrOptions || 'Access denied';
      finalErrorCode = errorCode || ErrorCode.FORBIDDEN;
      finalErrors = errors;
    }

    super({ message, statusCode: StatusCodes.FORBIDDEN, errorCode: finalErrorCode, errors: finalErrors });
  }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: any);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: any) {
    let message: string;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      message = messageOrOptions?.message || 'Resource not found';
      finalErrors = messageOrOptions?.errors;
    } else {
      message = messageOrOptions || 'Resource not found';
      finalErrors = errors;
    }

    super({ message, statusCode: StatusCodes.NOT_FOUND, errorCode: ErrorCode.NOT_FOUND, errors: finalErrors });
  }
}

/**
 * Error for duplicate resources (e.g., email already exists)
 */
export class ConflictError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: any);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: any) {
    let message: string;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      message = messageOrOptions?.message || 'Resource already exists';
      finalErrors = messageOrOptions?.errors;
    } else {
      message = messageOrOptions || 'Resource already exists';
      finalErrors = errors;
    }

    super({ message, statusCode: StatusCodes.CONFLICT, errorCode: ErrorCode.CONFLICT, errors: finalErrors });
  }
}

/**
 * Error for bad requests (general)
 */
export class BadRequestError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: any);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: any) {
    let message: string;
    let finalErrors: any;

    if (typeof messageOrOptions === 'object') {
      message = messageOrOptions?.message || 'Bad request';
      finalErrors = messageOrOptions?.errors;
    } else {
      message = messageOrOptions || 'Bad request';
      finalErrors = errors;
    }

    super({ message, statusCode: StatusCodes.BAD_REQUEST, errorCode: ErrorCode.BAD_REQUEST, errors: finalErrors });
  }
}

/**
 * Error for invalid credentials
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(options?: IErrorOptions);
  constructor(message?: string);
  constructor(messageOrOptions?: string | IErrorOptions) {
    if (typeof messageOrOptions === 'object') {
      super({
        ...messageOrOptions,
        message: messageOrOptions?.message || 'Invalid credentials',
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      });
    } else {
      super(messageOrOptions || 'Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
    }
  }
}

/**
 * Error for expired tokens
 */
export class TokenExpiredError extends AuthenticationError {
  constructor(options?: IErrorOptions);
  constructor(message?: string);
  constructor(messageOrOptions?: string | IErrorOptions) {
    if (typeof messageOrOptions === 'object') {
      super({
        ...messageOrOptions,
        message: messageOrOptions?.message || 'Token has expired',
        errorCode: ErrorCode.TOKEN_EXPIRED,
      });
    } else {
      super(messageOrOptions || 'Token has expired', ErrorCode.TOKEN_EXPIRED);
    }
  }
}

/**
 * Error for revoked/blacklisted tokens
 */
export class TokenRevokedError extends AuthenticationError {
  constructor(options?: IErrorOptions);
  constructor(message?: string);
  constructor(messageOrOptions?: string | IErrorOptions) {
    if (typeof messageOrOptions === 'object') {
      super({
        ...messageOrOptions,
        message: messageOrOptions?.message || 'Token has been revoked',
        errorCode: ErrorCode.TOKEN_REVOKED,
      });
    } else {
      super(messageOrOptions || 'Token has been revoked', ErrorCode.TOKEN_REVOKED);
    }
  }
}

/**
 * Error for invalid tokens
 */
export class InvalidTokenError extends AuthenticationError {
  constructor(options?: IErrorOptions);
  constructor(message?: string);
  constructor(messageOrOptions?: string | IErrorOptions) {
    if (typeof messageOrOptions === 'object') {
      super({ ...messageOrOptions, message: messageOrOptions?.message || 'Invalid token', errorCode: ErrorCode.INVALID_TOKEN });
    } else {
      super(messageOrOptions || 'Invalid token', ErrorCode.INVALID_TOKEN);
    }
  }
}

/**
 * Helper function to throw operational errors
 */
export const throwError = (options: IErrorOptionsWithStatus): never => {
  throw new AppError(options);
};

/**
 * Helper to check if an error is an operational error (known error)
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};
