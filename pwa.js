const appBase=new URL('./',location.href);
let promptEvent;
const installState={configuration:'Checking',icons:'Checking',offline:'Checking',browser:'Waiting for browser installation support'};
const installButton=document.querySelector('#install');
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function drawInstallState(){
 const box=document.querySelector('#installationChecks');
 box.textContent=Object.entries(installState).map(([k,v])=>({configuration:'App configuration',icons:'App icons',offline:'Offline setup',browser:'Install prompt'}[k])+': '+v).join('\n');
 box.style.whiteSpace='pre-line';
 if(standalone()){installButton.textContent='App installed';installState.browser='Running in its own app window';}
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;installState.browser='Ready — tap Install app';installButton.textContent='Install app';drawInstallState();});
installButton.onclick=async()=>{
 if(promptEvent){
  const event=promptEvent;promptEvent=null;
  await event.prompt();const choice=await event.userChoice;
  installState.browser=choice.outcome==='accepted'?'Installation accepted by browser':'Installation cancelled';
  drawInstallState();
 }else{
  document.querySelector('#openAppLink').href=appBase.href;
  document.querySelector('#installMessage').textContent=standalone()?'You are already running the installed app.':'Open this app in Microsoft Edge or Google Chrome on your computer to install it in its own app window.';
  drawInstallState();document.querySelector('#installDialog').showModal();
 }
};
document.querySelector('#closeInstall').onclick=()=>document.querySelector('#installDialog').close();
document.querySelector('#copyInstallLink').onclick=async()=>{try{await navigator.clipboard.writeText(appBase.href);document.querySelector('#copyInstallLink').textContent='Link copied';}catch{document.querySelector('#copyInstallLink').textContent='Copy the address from the browser';}};
window.addEventListener('appinstalled',()=>{installState.browser='Installed by browser — launch from your Start menu or apps screen';installButton.textContent='App installed';drawInstallState();});
(async()=>{
 try{
  const response=await fetch(new URL('manifest.webmanifest',appBase),{credentials:'include',cache:'no-store'});
  if(!response.ok||response.redirected)throw Error('Reload the app');
  const manifest=await response.json();
  if(manifest.display!=='standalone'||new URL(manifest.scope,appBase).href!==appBase.href||new URL(manifest.start_url,appBase).href!==appBase.href||new URL(manifest.id,location.origin).pathname!==appBase.pathname)throw Error('Invalid app configuration');
  installState.configuration='Ready';
  for(const icon of manifest.icons){const image=new Image();image.src=new URL(icon.src,appBase).href;await image.decode();const size=Number(icon.sizes.split('x')[0]);if(image.naturalWidth!==size||image.naturalHeight!==size)throw Error('Icon size mismatch');}
  installState.icons='Ready';
 }catch(error){installState.configuration='Could not load — reload the app';installState.icons='Not verified';}
 drawInstallState();
})();
if('serviceWorker' in navigator&&window.isSecureContext){
 navigator.serviceWorker.register(new URL('sw.js',appBase),{scope:appBase.pathname,updateViaCache:'none'}).then(async registration=>{await registration.update();await navigator.serviceWorker.ready;installState.offline='Ready';drawInstallState();}).catch(error=>{installState.offline='Unavailable — '+error.message;drawInstallState();});
}else{installState.offline='Requires a secure browser';drawInstallState();}
drawInstallState();
