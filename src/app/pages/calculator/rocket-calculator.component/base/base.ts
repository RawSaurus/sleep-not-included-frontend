import {Component, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {max} from 'rxjs';

type EngineStats = {
  readonly fuelEff: number;
  readonly dryMass: number;
};

@Component({
  selector: 'app-base',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base {

  /**
   * Display Distances
   * Display Engine Types
   * Display Solid Thrusters
   * Display Fuel tanks and fuel amount
   * Display Oxidizer Types
   * Display Oxidizer Tanks and amount
   * Display Modules
   * Create Constants -
   *  - Engine Options: label, efficiency
   *  - Oxidizer Options: label, efficiency
   *  - Module Options: label, mass
   *
   *  Calculate
   *  - Based on formula iteratively add fuel until calculated distance
   *  exceeds set distance
   *  - Exceptions
   *    - Steam engine has set maximal range
   *    - Display unreachable if calculation doesn't enable rocket to reach set distance
   */

  readonly ENGINE_STATS: Record<string, EngineStats> = {
    'Steam': {fuelEff: 20, dryMass: 200},
    'Petroleum': {fuelEff: 40, dryMass: 200},
    'Biomass': {fuelEff: 40, dryMass: 200},
    'Hydrogen': {fuelEff: 60, dryMass: 200}
  }

  engineMass = 2000;
  commandCapsuleMass = 200;
  fuelTankDryMass = 333;
  oxidizerTankDryMass = 333;
  thrusterMass = 200;

  selectedEngine = signal('Steam');

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
    { label: 'Steam', efficiency: 20 },
    { label: 'Petroleum', efficiency: 40 },
    { label: 'Biodiesel', efficiency: 40 },
    { label: 'Hydrogen', efficiency: 60 }
  ];
  oxidizerOptions = [
    { label: 'Oxylite', efficiency: 1.0 },
    { label: 'Liquid oxygen', efficiency: 1.33 }
  ];
  moduleOptions = [
    { label: 'Cargo Bay', mass: 2000 },
    { label: 'Liquid Cargo Tank', mass: 2000 },
    { label: 'Gas Cargo Tank', mass: 2000 },
    { label: 'Biological Cargo Bay', mass: 2000 },
    { label: 'Research Module', mass: 200 },
    { label: 'Sightseeing Module', mass: 200 },
  ]


  constructor() {
  }

//   FORMULA
//   nominalRange = fuelMass × fuelEfficiency × oxidizerEfficiency
// + (solidFuelThrusters × 12,000 km)
//
//   totalWetMass = dryMass(all modules) + fuelMass + oxidizerMass
//
//   massPenalty = max(totalWetMass × 1 km/kg,  (totalWetMass / 300)^3.2)
// ↑ use whichever is GREATER
//
//   finalRange = nominalRange - massPenalty

  calculate() {
    const test = this.ENGINE_STATS;
    const nominalRange = 543 * this.engineOptions[1].efficiency * this.oxidizerOptions[0].efficiency;
    const dryMass = 2000 //engine
    + 200 //command module
    + 333 // fuel tank
    + 333; // oxidizer tan
    const totalWetMass = 600 + 1086 + 5000;
    const linearPenalty = totalWetMass * 1;
    const exponentialPenalty = Math.pow(totalWetMass / 300, 3.2);
    const massPenalty = Math.max(linearPenalty, exponentialPenalty);
    const finalRange = nominalRange - massPenalty;
    const formValue = this.rocketForm.value;

    console.log('Dry mass: ', dryMass);
    console.log('Total wet mass: ', totalWetMass);
    console.log('Mass Penalty: ', massPenalty);
    console.log('Rocket calculation: ', finalRange/1000);

  }

}
