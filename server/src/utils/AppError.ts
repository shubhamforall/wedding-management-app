export class AppError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }

  static badRequest(message: string) {
    return new AppError(400, message);
  }
  static unauthorized(message = 'Not authenticated.') {
    return new AppError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action.') {
    return new AppError(403, message);
  }
  static notFound(message = 'Not found.') {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
}
