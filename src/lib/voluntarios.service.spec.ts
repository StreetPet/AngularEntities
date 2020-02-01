import { TestBed } from '@angular/core/testing';

import { VoluntariosService } from './voluntarios.service';

describe('VoluntariosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VoluntariosService = TestBed.get(VoluntariosService);
    expect(service).toBeTruthy();
  });
});
