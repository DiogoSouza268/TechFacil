import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvisoLogin } from './aviso-login';

describe('AvisoLogin', () => {
  let component: AvisoLogin;
  let fixture: ComponentFixture<AvisoLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisoLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvisoLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
