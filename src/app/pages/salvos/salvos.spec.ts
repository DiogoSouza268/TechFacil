import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Salvos } from './salvos';

describe('Salvos', () => {
  let component: Salvos;
  let fixture: ComponentFixture<Salvos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Salvos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Salvos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
