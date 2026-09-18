import { Routes } from '@angular/router';
import { Perfil } from './pages/perfil/perfil';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Cadastrar } from './pages/cadastrar/cadastrar';

export const routes: Routes = [
    {path: " ", redirectTo: "dashboard", pathMatch: "full"},
    {path: "cadastrar", component: Cadastrar},
    {path: "dashboard", component: Dashboard},
    {path: "login", component: Login},
    {path: "perfil", component: Perfil}
];
