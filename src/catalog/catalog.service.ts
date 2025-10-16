import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  getCatalog() {
    return ['item'];
  }
}
