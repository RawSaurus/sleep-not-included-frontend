import { Component } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-spaced-out',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './spaced-out.html',
  styleUrl: './spaced-out.css',
})
export class SpacedOut {

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
    { label: 'Carbon Dioxide', power: 23, burden: 3, height: 2, maxHeight: 10, wattage: 0, fuelPerHex: 16.7, fuelTanks: 0, fuelCapacity: [100], range:[6]},
    { label: 'Large Carbon Dioxide', power: 23, burden: 3, height: 2, maxHeight: 10, wattage: 0, fuelPerHex:16.7, fuelTanks: 0, fuelCapacity: [500], range:[30]},
    { label: 'Sugar', power: 16, burden: 1, height: 3, maxHeight: 16, wattage: 60, fuelPerHex: 75, fuelTanks: 0, fuelCapacity: [450], range:[6]},
    { label: 'Steam', power: 27, burden: 15, height: 5, maxHeight: 25, wattage: 600, fuelPerHex: 15, fuelTanks: 0, fuelCapacity: [150], range:[10]},
    { label: 'Small Petroleum', power: 31, burden: 5, height: 4, maxHeight: 20, wattage: 240, fuelPerHex: 45, fuelTanks: 2, fuelCapacity: [450, 1350, 1800], range:[10, 30, 40]},
    { label: 'Petroleum', power: 48, burden: 6, height: 5, maxHeight: 35, wattage: 480, fuelPerHex: 90, fuelTanks: 4, fuelCapacity: [900, 1800, 2700, 3600], range:[10, 20, 30, 40]},
    { label: 'Radbolt', power: 34, burden: 5, height: 5, maxHeight: 20, wattage: 0, fuelPerHex: 200, fuelTanks: 0, fuelCapacity: [4000], range:[20]},
    { label: 'Hydrogen', power: 55, burden: 7, height: 5, maxHeight: 35, wattage: 600, fuelPerHex: 56.3, fuelTanks: 4, fuelCapacity: [900, 1800, 2700, 3600], range:[16, 32, 48, 64]}
  ];
  fuelTankOptions =[
    { label: 'Large Liquid Fuel Tank', burden: 5, height: 5, capacity: 900 },
    { label: 'Small Solid Oxidizer Tank', burden: 2, height: 2, capacity: 450 },
    { label: 'Large Solid Oxidizer Tank', burden: 5, height: 5, capacity: 900 },
    { label: 'Liquid Oxidizer Tank', burden: 5, height: 2, capacity: 450 },
  ];
  cargoModuleOptions = [
    { label: 'Cargo Bay', burden: 4, height: 3, capacity: 12000 },
    { label: 'Large Cargo Bay', burden: 6, height: 5, capacity: 27000 },
    { label: 'Liquid Cargo Tank', burden: 3, height: 3, capacity: 9000 },
    { label: 'Large Liquid Cargo Tank', burden: 5, height: 5, capacity: 27000 },
    { label: 'Gas Cargo Canister', burden: 2, height: 3, capacity: 3600 },
    { label: 'Large Gas Cargo Canister', burden: 4, height: 5, capacity: 11000 }
  ];
  utilityModuleOptions = [
    { label: 'Orbital Cargo Module', burden: 4, height: 2 },
    { label: 'Rover Module', burden: 4, height: 3 },
    { label: 'Trailblazer Module', burden: 4, height: 3 },
    { label: 'Cartographic Module', burden: 3, height: 5 },
    { label: 'Battery Module', burden: 2, height: 2 },
    { label: 'Solar Panel Module', burden: 1, height: 1 },
    { label: 'Artifact Transport Module', burden: 6, height: 1 },
  ];

  rocket: string[] = [];

  oxidizerOptions = [
    { label: 'Oxylite', value: 10000 },
    { label: 'Liquid oxygen', value: 20000 }
  ];



  constructor() {
  }

  addModule(moduleLabel: string){
    this.rocket.push(moduleLabel);
  }

  calculate() {
    const formValue = this.rocketForm.value;
    console.log('Rocket calculation input:', formValue);

    // Dummy logic for now
    alert(`Range: ${formValue.desiredRange} km\nFuel: ${formValue.fuelAmount}`);
  }
}
