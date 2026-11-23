import {mountAccounts} from './accounts.mjs';
import {mountCombinedLogin} from './custom-login/window.mjs';
import {mountRegistration} from './custom-login/register.mjs';

export function authenticate(mode){
 const destination=location.pathname==='/account'?'/account':'/pricing?interval='+(new URLSearchParams(location.search).get('interval')==='yearly'?'yearly':'monthly');
 try{sessionStorage.setItem('bt-plan-return',destination);}catch{}
 const onClose=()=>{try{sessionStorage.removeItem('bt-plan-return');}catch{}};
 if(mode==='signin')return mountCombinedLogin({onClose,onCreateAccount:()=>authenticate('register'),onVerifyEmail:()=>authenticate('recover')});
 return mountRegistration({initialMode:mode==='recover'?'recover':'entry',onClose,onSignIn:()=>authenticate('signin')});
}
mountAccounts({root:document.getElementById('account-controls'),openLibrary:()=>location.assign('/?open=library'),
 openSignIn:()=>authenticate('signin'),openRegistration:()=>authenticate('register'),afterLogout:()=>location.reload()});
