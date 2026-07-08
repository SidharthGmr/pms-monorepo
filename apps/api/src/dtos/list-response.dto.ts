export interface ListResponseDto<T> {
  totalRecord: number;
  data: T[] | null;
}


export interface BasicDto {
  id: number;
  name: string;
}