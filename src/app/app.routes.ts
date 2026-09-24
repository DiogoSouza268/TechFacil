import { Routes } from '@angular/router';
import { Perfil } from './pages/perfil/perfil';
import { Login } from './pages/login/login';
import { Cadastrar } from './pages/cadastrar/cadastrar';
import { Salvos } from './pages/salvos/salvos';
import { Home } from './pages/home/home';
import { authGuard } from './guards/auth-guard';
import { Lgpd } from './pages/lgpd/lgpd';

export const routes: Routes = [
    {path: "", redirectTo: "home", pathMatch: "full"},
    {path: "cadastrar", component: Cadastrar},
    {path: "home", component: Home},
    {path: "login", component: Login},
    {path: "perfil", component: Perfil, canActivate: [authGuard] },
    {path: "salvos", component: Salvos, canActivate: [authGuard]},
    {path: "lgpd", component: Lgpd},
    {path: '**', redirectTo: 'home' }
    
];
