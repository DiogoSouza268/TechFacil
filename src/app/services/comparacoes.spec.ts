import { TestBed } from '@angular/core/testing';

import { Comparacoes } from './comparacoes';

describe('Comparacoes', () => {
  let service: Comparacoes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Comparacoes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
