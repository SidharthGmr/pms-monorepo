export interface ListResponseDto<T> {
  totalRecord: number;
  data: T[] | null;
}
