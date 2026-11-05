const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const node=()=>({children:[],append(...n){this.children.push(...n)},prepend(n){this.children.unshift(n)},setAttribute(){},click(){}});
const actions=node();let active=true,photo='',changed=0,redraw=0;
const card={isConnected:true,querySelector:()=>actions,dispatchEvent:()=>changed++};
const context={window:{},document:{createElement:tag=>tag==='canvas'?{getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,AAAA'}:node()},Event:function(){},createImageBitmap:async()=>({width:100,height:100,close(){}})};
vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/fotos-manuais.js'),'utf8'),context);
const api=context.window.ManualPhotos;
const update=api.attach(card,{active:()=>active,get:()=>photo,set:v=>photo=v,redraw:()=>redraw++});
const box=actions.children[0],[upload,remove,input,message]=box.children;
(async()=>{
 assert.equal(box.hidden,false);assert.equal(remove.hidden,true);
 input.files=[{type:'image/jpeg',size:100}];await input.onchange();assert(photo);assert.equal(changed,1);assert.equal(redraw,1);assert.equal(api.isBusy(),false);
 active=false;update();assert.equal(box.hidden,true);remove.onclick();assert(photo);
 active=true;update();remove.onclick();assert.equal(photo,'');assert.equal(changed,2);
 input.files=[{type:'application/pdf',size:100}];await input.onchange();assert.match(message.textContent,/JPG/);assert.equal(photo,'');
 let resolve;context.createImageBitmap=()=>new Promise(r=>resolve=r);input.files=[{type:'image/png',size:100}];const work=input.onchange();assert(api.isBusy());active=false;update();resolve({width:1,height:1,close(){}});await work;assert.equal(photo,'','changing selection must discard pending upload');assert.equal(api.isBusy(),false);
 console.log('Fotos manuais: envio, remoção, visibilidade, validação e troca durante leitura aprovados.');
})().catch(e=>{console.error(e);process.exitCode=1});
