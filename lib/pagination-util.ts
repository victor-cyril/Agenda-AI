import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/constants";

export class PaginationDto {
  readonly order?: "ASC" | "DESC" = "DESC";
  readonly page: number = 1;
  readonly pageSize: number = 10;
  readonly isPaginated?: boolean = true;
}

export type PaginationMetaJson = {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginationResultJson<T> = {
  readonly data: T[];
  readonly meta: PaginationMetaJson;
};

export class PaginationMetadataDto {
  readonly page: number;
  readonly pageSize: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor({
    pageOptionsDto,
    itemCount,
  }: {
    pageOptionsDto: PaginationDto;
    itemCount: number;
  }) {
    this.page = pageOptionsDto.page;
    this.pageSize = pageOptionsDto.pageSize;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / (this.pageSize ?? 10));
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }

  toJSON(): PaginationMetaJson {
    return {
      page: this.page,
      pageSize: this.pageSize,
      itemCount: this.itemCount,
      pageCount: this.pageCount,
      hasPreviousPage: this.hasPreviousPage,
      hasNextPage: this.hasNextPage,
    };
  }
}

export class PaginationResultDto<T> {
  readonly data: PaginationResultJson<T>["data"];
  readonly meta: PaginationMetadataDto;

  constructor(
    data: T[],
    itemCount: number,
    options = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE }
  ) {
    this.data = data;
    this.meta = new PaginationMetadataDto({
      itemCount,
      pageOptionsDto: options as PaginationDto,
    });
  }

  toJSON(): PaginationResultJson<T> {
    return {
      data: this.data,
      meta: this.meta.toJSON(),
    };
  }
}
