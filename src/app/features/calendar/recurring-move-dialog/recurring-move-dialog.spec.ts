import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringMoveDialog } from './recurring-move-dialog';

describe('RecurringMoveDialog', () => {
  let component: RecurringMoveDialog;
  let fixture: ComponentFixture<RecurringMoveDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringMoveDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecurringMoveDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
