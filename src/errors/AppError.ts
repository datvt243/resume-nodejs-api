/**
 * Custom error classes for the application
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { StatusCodes } from 'http-status-codes';

export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  MALFORMED_JSON = 'MALFORMED_JSON',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  NO_TOKEN = 'NO_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_EXISTS = 'EMAIL_EXISTS',

  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
}

/**
 * The real shapes `errors` is constructed with across the codebase: a
 * single message (e.g. a Mongoose CastError's `.message`), a list of
 * per-field translated messages (Joi/Mongoose validation, one string per
 * failing field), a field-name-keyed map (`formatValidateError`'s return
 * shape), or absent entirely.
 */
export type AppErrorDetails = string | string[] | Record<string, string> | null | undefined;

export interface IErrorOptions {
  message?: string;
  errorCode?: ErrorCode;
  errors?: AppErrorDetails;
}

export interface IErrorOptionsWithStatus extends IErrorOptions {
  statusCode?: number;
  // false = an unexpected failure (a bug): its message is never shown to the client in production
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public override readonly message: string;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly errors?: AppErrorDetails;

  constructor(options: IErrorOptionsWithStatus);
  constructor(message: string, statusCode?: number, errorCode?: ErrorCode, errors?: AppErrorDetails);
  constructor(messageOrOptions: string | IErrorOptionsWithStatus, statusCode?: number, errorCode?: ErrorCode, errors?: AppErrorDetails) {
    let message: string;
    let finalStatusCode: number;
    let finalErrorCode: ErrorCode;
    let finalErrors: AppErrorDetails;
    let isOperational = true;

    if (typeof messageOrOptions === 'object') {
      // Called with options object: new AppError({ message, errorCode, errors })
      message = messageOrOptions.message || 'Internal Server Error';
      finalStatusCode = messageOrOptions.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      finalErrorCode = messageOrOptions.errorCode || ErrorCode.INTERNAL_SERVER_ERROR;
      finalErrors = messageOrOptions.errors;
      isOperational = messageOrOptions.isOperational ?? true;
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
    this.isOperational = isOperational;
    this.errors = finalErrors;

    // Maintains proper stack trace in V8 environments (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: AppErrorDetails);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: AppErrorDetails) {
    let message: string;
    let finalErrors: AppErrorDetails;

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

export class AuthenticationError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errorCode?: ErrorCode, errors?: AppErrorDetails);
  constructor(messageOrOptions?: string | IErrorOptions, errorCode?: ErrorCode, errors?: AppErrorDetails) {
    let message: string;
    let finalErrorCode: ErrorCode;
    let finalErrors: AppErrorDetails;

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

export class AuthorizationError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errorCode?: ErrorCode, errors?: AppErrorDetails);
  constructor(messageOrOptions?: string | IErrorOptions, errorCode?: ErrorCode, errors?: AppErrorDetails) {
    let message: string;
    let finalErrorCode: ErrorCode;
    let finalErrors: AppErrorDetails;

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

export class NotFoundError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: AppErrorDetails);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: AppErrorDetails) {
    let message: string;
    let finalErrors: AppErrorDetails;

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
  constructor(message?: string, errors?: AppErrorDetails);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: AppErrorDetails) {
    let message: string;
    let finalErrors: AppErrorDetails;

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

export class BadRequestError extends AppError {
  constructor(options?: IErrorOptions);
  constructor(message?: string, errors?: AppErrorDetails);
  constructor(messageOrOptions?: string | IErrorOptions, errors?: AppErrorDetails) {
    let message: string;
    let finalErrors: AppErrorDetails;

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
 * Throws an `AppError` built from `options` — always "operational"
 * (`AppError.isOperational` is always `true`), i.e. an anticipated,
 * known failure mode rather than a programming bug.
 */
export const throwError = (options: IErrorOptionsWithStatus): never => {
  throw new AppError(options);
};

/** True for a known/anticipated (`isOperational`) error, false for an unexpected one (a real bug). */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};
