import { TestBed } from '@angular/core/testing';

import { PapeisService } from './papeis.service';

describe('PapeisService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PapeisService = TestBed.get(PapeisService);
    expect(service).toBeTruthy();
  });
});
