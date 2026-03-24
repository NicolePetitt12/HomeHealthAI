export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  statusCode: number;
  message: string;
  error?: string;
};
