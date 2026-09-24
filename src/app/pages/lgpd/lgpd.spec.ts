import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lgpd } from './lgpd';

describe('Lgpd', () => {
  let component: Lgpd;
  let fixture: ComponentFixture<Lgpd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lgpd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lgpd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
