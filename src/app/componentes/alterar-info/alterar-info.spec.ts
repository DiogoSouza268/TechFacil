import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlterarInfo } from './alterar-info';

describe('AlterarInfo', () => {
  let component: AlterarInfo;
  let fixture: ComponentFixture<AlterarInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlterarInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlterarInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
