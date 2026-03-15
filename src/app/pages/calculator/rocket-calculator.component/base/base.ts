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

  selectedRange = signal(10000);
  selectedEngine = signal('Steam');
  selectedOxidizer = signal('Oxylite');
  solidThruster = signal(0);
  fuelTanks = signal(1);
  fuelAmount = signal(0);
  oxiTanks = signal(0);
  oxiAmount = signal(0);
  sCargoBays = signal(0);
  lCargoBays = signal(0);
  gCargoBays = signal(0);
  bCargoBays = signal(0);
  resModule = signal(0);
  ssModule = signal(0);

  rangeOptions = [
    { label: '10 000 km', value: 10000 },
    { label: '20 000 km', value: 20000 }
  ];
  engineOptions = [
    { label: 'Steam', efficiency: 20, mass: 2000 },
    { label: 'Petroleum', efficiency: 40, mass: 200 },
    { label: 'Biodiesel', efficiency: 40, mass: 200 },
    { label: 'Hydrogen', efficiency: 60, mass: 500 }
  ];
  oxidizerOptions = [
    { label: 'Oxylite', efficiency: 1.0, capacity: 2700, dryMass: 100 },
    { label: 'Liquid oxygen', efficiency: 1.33, capacity: 2700, dryMass: 100 }
  ];
  moduleOptions = [
    { label: 'Cargo Bay', mass: 1000 },
    { label: 'Liquid Cargo Tank', mass: 1000 },
    { label: 'Gas Cargo Tank', mass: 1000 },
    { label: 'Biological Cargo Bay', mass: 1000 },
    { label: 'Research Module', mass: 200 },
    { label: 'Sightseeing Module', mass: 200 },
  ]


  constructor() {
  }

  test(){
    console.log(this.getModuleMass());
    // console.log("Range pre penalty: ", this.getRangePrePenalty());
    console.log("Final range: ", this.calc());
  }

  selectRange(range: number){
    this.selectedRange.set(range);
    console.log(this.selectedRange());
  }

  selectEngine(engineOption: string){
    this.selectedEngine.set(engineOption);
    console.log(engineOption);
}

  setSolidThrusters(st: number){
    this.solidThruster.set(st);
    console.log(this.solidThruster());
  }

  setFuelAmount(f: number){
    this.fuelAmount.set(f);
    this.fuelTanks.set(Math.ceil(f/900));
    if(this.selectedEngine() === 'Steam'){
      this.oxiAmount.set(0);
      this.oxiTanks.set(0);
    }else {
      this.oxiAmount.set(f);
      this.oxiTanks.set(Math.ceil(f / 2700));
    }
  }

  setOxidizerAmount(o: number){
    this.oxiAmount.set(o);
    this.oxiTanks.set(Math.ceil(o/2700));
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

  calc(){
    const totalWetMass = this.getModuleMass() + this.getFuelWetMass() + this.getWetOxidizerMass();

    // Select if linear or exponential penalty is greater
    const massPenalty = Math.max(totalWetMass, Math.pow(totalWetMass / 300, 3.2));

    return this.getRangePrePenalty() - massPenalty;
  }

  private getRangePrePenalty(){
    const fuelEff = this.engineOptions.filter(e =>
      e.label === this.selectedEngine())[0].efficiency;
    const oxiEff = this.oxidizerOptions.filter(o =>
      o.label === this.selectedOxidizer())[0].efficiency;
    console.log("Fuel eff: ", fuelEff);
    console.log("Oxi eff: ", oxiEff);
    return this.fuelAmount() * fuelEff * oxiEff;
  }

  calculate() {
    const goalRange = 40000;
    const fuelEff = this.engineOptions.filter(e =>
      e.label === this.selectedEngine())[0].efficiency;
    const oxiEff = this.oxidizerOptions.filter(o =>
      o.label === this.selectedOxidizer())[0].efficiency;
    let fuelTemp = this.fuelAmount();

    const totalWetMass = this.getModuleMass() + this.getFuelWetMass() + this.getWetOxidizerMass();

    const massPenalty = Math.max(totalWetMass, Math.pow(totalWetMass / 300, 3.2));

    let finalRange = fuelTemp * oxiEff * fuelEff - massPenalty;

    do{
      fuelTemp += 1;
      finalRange = fuelTemp * oxiEff * fuelEff - massPenalty;
    }while(finalRange < goalRange)
  }

  protected readonly Number = Number;

  private getModuleMass(){
    return (this.sCargoBays()
        + this.lCargoBays()
        + this.gCargoBays()
        + this.bCargoBays()) * 1000 //cargo bays mass
      + (this.resModule() + this.ssModule()) * 200 // modules mass
      + 200; // command module mass
  }

  private getFuelWetMass(){
    return this.fuelTanks() * 100 //dry mass
      + this.fuelAmount(); //wet mass
  }

  private getWetOxidizerMass(){
    return this.oxiTanks() * 100 //dry mass
      + this.oxiAmount(); //wet mass
  }
}
