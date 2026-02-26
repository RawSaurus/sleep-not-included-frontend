import { Component } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-base',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base {

  rocketForm: FormGroup = new FormGroup({
    range: new FormGroup({
      desiredRange: new FormControl(10000),
    }),
    engine: new FormGroup({
      type: new FormControl<String>('Steam'),
      solidFuelThrusters: new FormControl(0)
    }),
    fuel: new FormGroup({
      fuelTanks: new FormControl(0),
      fuelAmount: new FormControl(0)
    }),
    modules: new FormGroup({
      commandCapsule: new FormControl(1),
      cargoBay: new FormControl(0),
      liquidCargoTank: new FormControl(0),
      researchModule: new FormControl(0),
      gasCargoTank: new FormControl(0),
      biologicalCargoBay: new FormControl(0),
      sightSeeingModule: new FormControl(0),
    }),
    oxidizer: new FormGroup({
      oxidizerType: new FormControl('Liquid Oxygen'),
      oxidizerTanks: new FormControl(0),
      oxidizerAmount: new FormControl(0)
    }),
  });

  rangeOptions = [
    { label: '10 000 km', value: 10000 },
    { label: '20 000 km', value: 20000 }
  ];
  engineOptions = [
    { label: 'Steam', value: 10000 },
    { label: 'Petroleum', value: 20000 },
    { label: 'Biodiesel', value: 30000 },
    { label: 'Hydrogen', value: 40000 }
  ];
  oxidizerOptions = [
    { label: 'Oxylite', value: 10000 },
    { label: 'Liquid oxygen', value: 20000 }
  ];


  constructor() {
  }

  calculate() {
    const formValue = this.rocketForm.value;
    console.log('Rocket calculation input:', formValue);

    // Dummy logic for now
    alert(`Range: ${formValue.desiredRange} km\nFuel: ${formValue.fuelAmount}`);
  }

}
