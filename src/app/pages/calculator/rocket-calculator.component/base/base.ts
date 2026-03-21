import {Component, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {max} from 'rxjs';
import {SpacedOut} from '../spaced-out/spaced-out';

type EngineStats = {
  readonly fuelEff: number;
  readonly dryMass: number;
};

@Component({
  selector: 'app-base',
  imports: [
    ReactiveFormsModule,
    SpacedOut
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

  engineMass = 2000;
  commandCapsuleMass = 200;
  fuelTankDryMass = 333;
  oxidizerTankDryMass = 333;
  thrusterMass = 200;

  toggleCalc = signal(true);
  maxRange = signal(0);

  selectedRange = signal(10000);
  selectedEngine = signal('Steam');
  solidBoosters = signal(0);
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

  readonly rangeOptions = [
    { label: '10 000 km', value: 10000 },
    { label: '20 000 km', value: 20000 },
    { label: '30 000 km', value: 30000 },
    { label: '40 000 km', value: 40000 },
    { label: '50 000 km', value: 50000 },
    { label: '60 000 km', value: 60000 },
    { label: '70 000 km', value: 70000 },
    { label: '80 000 km', value: 80000 },
    { label: '90 000 km', value: 90000 },
    { label: '100 000 km', value: 100000 },
    { label: '110 000 km', value: 110000 },
    { label: '120 000 km', value: 120000 },
  ];
  readonly engineOptions = [
    { label: 'Steam', efficiency: 20, mass: 2000 },
    { label: 'Petroleum', efficiency: 40, mass: 200 },
    { label: 'Biodiesel', efficiency: 40, mass: 200 },
    { label: 'Hydrogen', efficiency: 60, mass: 500 }
  ];
  readonly oxidizerOptions = [
    { label: 'Oxylite', efficiency: 1.0, capacity: 2700, dryMass: 100 },
    { label: 'Liquid oxygen', efficiency: 1.33, capacity: 2700, dryMass: 100 }
  ];
  readonly moduleOptions = [
    { label: 'Cargo Bay', mass: 1000 },
    { label: 'Liquid Cargo Tank', mass: 1000 },
    { label: 'Gas Cargo Tank', mass: 1000 },
    { label: 'Biological Cargo Bay', mass: 1000 },
    { label: 'Research Module', mass: 200 },
    { label: 'Sightseeing Module', mass: 200 },
  ]
  //solid booster
  // capacity: 400 iron + 400 oxy, weight: 200, + 12 000 km before weight
  readonly solidBoosterOptions = {
    capacity: 800, dryMass: 200
  };


  constructor() {
  }

  test(){
    console.log(this.getModuleMass());
    // console.log("Range pre penalty: ", this.getRangePrePenalty());
    // console.log("Final range: ", this.calc());
    // this.calculate();
    // this.estimateFuel();
  }

  displayRange(){
    let stringRange = this.maxRange().toFixed(0);
    if(this.maxRange() < 0){
      stringRange = `Unreachable (${this.maxRange()})`;
    }else{
      const stringRangeStart = stringRange.substring(0, stringRange.length - 3);
      const stringRangeEnd = stringRange.substring(stringRange.length - 3);
      stringRange = `${stringRangeStart} ${stringRangeEnd} km`
    }
    return stringRange;
  }

  toggleCalculation(){
    if(this.toggleCalc()){
      this.calc();
    }else{
      this.calculate();
    }
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

    const finalRange = this.getRangePrePenalty() - massPenalty;
    this.maxRange.set(finalRange);
  }

  estimateFuel(){
    const fuelEff = this.engineOptions.filter(e =>
      e.label === this.selectedEngine())[0].efficiency;
    const totalWetMass = this.getModuleMass() + this.getFuelWetMass() + this.getWetOxidizerMass();

    const massPenalty = Math.max(totalWetMass, Math.pow(totalWetMass / 300, 3.2));

    const fuelMass = Math.ceil(
      (this.selectedRange() + massPenalty - this.solidBoosters()*12000)
      / (fuelEff - 1 - (this.selectedEngine()==="Steam" ? 0:1))
    )

    console.log('Estimated fuel mass: ', fuelMass);
  }


  calculate() {
    const goalRange = this.selectedRange();
    const fuelEff = this.engineOptions.filter(e =>
      e.label === this.selectedEngine())[0].efficiency;
    const oxiEff = this.oxidizerOptions.filter(o =>
      o.label === this.selectedOxidizer())[0].efficiency;
    let fuelTemp = 0;

    let totalWetMass = this.getModuleMass() + this.getFuelWetMass() + this.getWetOxidizerMass();

    let massPenalty = Math.max(totalWetMass, Math.pow(totalWetMass / 300, 3.2));

    this.setFuelAmount(1);
    let finalRange = 0;

  while(finalRange < goalRange) {
    this.setFuelAmount(this.fuelAmount() + 1);
    totalWetMass = this.getModuleMass() + this.getFuelWetMass() + this.getWetOxidizerMass();
    console.log('While fuel amount: ', this.fuelAmount());
    console.log('While total wet mass: ', totalWetMass);

    massPenalty = Math.max(totalWetMass, Math.pow(totalWetMass / 300, 3.2));
    finalRange = this.fuelAmount() * oxiEff * fuelEff - massPenalty;
    console.log('While mass penalty: ', massPenalty);
    console.log('While final range: ', finalRange);
    if(finalRange < 0){
      console.log('Unreachable');
      break;
    }
  }
    console.log("Final range: ", finalRange);
    console.log("Fuel amount: ", this.fuelAmount());
  }

  protected readonly Number = Number;

  private getModuleMass(){
    const engineMass = this.engineOptions.filter(e => e.label === this.selectedEngine())[0].mass;
    console.log('S Cargo Bays: ', this.sCargoBays());
    console.log('L Cargo Bays: ', this.lCargoBays());
    console.log('G Cargo Bays: ', this.gCargoBays());
    console.log('B Cargo Bays: ', this.bCargoBays());
    console.log('Res module: ', this.resModule());
    console.log('SS module: ', this.ssModule());
    console.log('Engine mass: ', engineMass);
    console.log('Solid boosters: ', this.solidBoosters());
    return (this.sCargoBays()
        + this.lCargoBays()
        + this.gCargoBays()
        + this.bCargoBays()) * 1000 //cargo bays mass
      + (this.resModule() + this.ssModule()) * 200 // modules mass
      + engineMass //engine mass, duh
      + (this.solidBoosters() * (this.solidBoosterOptions.capacity + this.solidBoosterOptions.dryMass)) // solid boosters
      + 200; // command module mass
  }

  private getFuelWetMass(){
    console.log('Fuel tanks: ', this.fuelTanks() * 100);
    console.log('Fuel amount: ', this.fuelAmount());
    return this.fuelTanks() * 100 //dry mass
      + this.fuelAmount(); //wet mass
  }

  private getWetOxidizerMass(){
    console.log('Oxi tanks: ', this.oxiTanks() * 100);
    console.log('Oxi amount: ', this.oxiAmount());
    return this.oxiTanks() * 100 //dry mass
      + this.oxiAmount(); //wet mass
  }

  private getRangePrePenalty(){
    const fuelEff = this.engineOptions.filter(e =>
      e.label === this.selectedEngine())[0].efficiency;
    const oxiEff = this.oxidizerOptions.filter(o =>
      o.label === this.selectedOxidizer())[0].efficiency;
    console.log("Fuel eff: ", fuelEff);
    console.log("Oxi eff: ", oxiEff);
    console.log('Solid boosters: ', this.solidBoosters());
    return this.fuelAmount() * fuelEff * oxiEff + (this.solidBoosters() * 12000);
  }
}
