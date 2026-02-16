import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'home', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'build', loadComponent: () => import('./pages/build/build').then(m => m.Build) },
  { path: 'build/:id', loadComponent: () => import('./pages/build/build-detail/build-detail').then(m => m.BuildDetail) },
  {
    path: 'calculator/rocket',
    loadComponent: () =>
      import('./pages/calculator/rocket-calculator.component/rocket-calculator.component')
        .then(m => m.RocketCalculatorComponent)
  },
  {
    path: 'calculator/ranch',
    loadComponent: () =>
      import('./pages/calculator/ranch-calculator.component/ranch-calculator.component')
        .then(m => m.RanchCalculatorComponent)
  }

  // { path: 'blueprint', loadComponent: () => import('./pages/blueprint/blueprint.component').then(m => m.BlueprintComponent) },
  // { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
  // { path: 'auth', loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent) },
];
