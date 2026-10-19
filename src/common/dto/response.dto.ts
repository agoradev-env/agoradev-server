export class ResponseDto<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  message?: string;
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  statusCode: number;
  timestamp: string;
}
