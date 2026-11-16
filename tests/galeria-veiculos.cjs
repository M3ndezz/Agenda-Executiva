const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const nodes = new Map();
const makeNode = () => ({value:'',textContent:'',children:[],dataset:{},listeners:{},append(...n){this.children.push(...n)},prepend(n){this.children.unshift(n)},replaceChildren(...n){this.children=n},add(n){this.children.push(n)},addEventListener(k,fn){this.listeners[k]=fn},setAttribute(){},showModal(){this.open=true},close(){this.open=false}});
let controls = [];
const document = {createElement:makeNode,querySelector(s){if(!nodes.has(s))nodes.set(s,makeNode());return nodes.get(s)},querySelectorAll(selector){return selector === "[data-vehicle-row]" ? [] : controls}};
const data = new Map();
const context = {document,console,Option:function(text,value){return {text,value}},Event:function(type){this.type=type},crypto:{randomUUID:()=> 'test-id'},confirm:()=>true,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},addEventListener(){}};
context.window=context;vm.createContext(context);
const run = name=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),context);

let serial=0;
const normalCreate=document.createElement;
document.createElement=tag=>tag==='canvas'?{getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,'+['AAAA','BBBB','CCCC','DDDD'][serial++]}:normalCreate(tag);
context.createImageBitmap=async()=>({width:800,height:600,close(){}});
run('cadastro-veiculos');
(async()=>{
 document.querySelector('#vehicle-new').onclick();
 const input=document.querySelector('#vehicle-photo'); input.click=()=>{};
 for(let i=0;i<4;i++) {
  document.querySelector('#vehicle-photo-preview').children[i].children[0].onclick();
  input.files=[{type:'image/jpeg',size:100}];
  await input.onchange({target:input});
 }
 controls=Object.entries({plate:'ABC1234',brand:'Teste',model:'Teste',color:'Preto',year:'2026',vehicleCompany:'Teste'}).map(([k,value])=>({dataset:{vehicleField:k},value}));
 document.querySelector('#vehicle-editor').onsubmit({preventDefault(){}});
 let saved=JSON.parse(data.get('apeVehicleRegistryV1'))[0];
 assert.equal(new Set(Object.values(saved.photos)).size,4);
 const snap=context.VehicleRegistry.snapshot(saved);
 assert.equal(snap.vehiclePhotos.rear,saved.photos.rear);
 saved.photos.rear='changed';assert.notEqual(snap.vehiclePhotos.rear,saved.photos.rear);
 document.querySelector('#vehicle-cards').children[0].children[1].children[0].onclick();
 assert.equal(document.querySelector('#vehicle-photo-preview').children.length,4);
 document.querySelector('#vehicle-photo-preview').children[1].children[1].onclick();
 document.querySelector('#vehicle-editor').onsubmit({preventDefault(){}});
 saved=JSON.parse(data.get('apeVehicleRegistryV1'))[0];
 assert.equal(saved.photos.right,'');assert(saved.photos.left);assert(saved.photos.rear);assert(saved.photos.front);
 assert.equal(context.VehicleRegistry.snapshot({photo:'data:image/jpeg;base64,AAAA'}).vehiclePhotos.front,'data:image/jpeg;base64,AAAA');
 console.log('Galeria: quatro uploads independentes, gravação, reabertura, remoção individual e compatibilidade aprovados.');
})().catch(e=>{console.error(e);process.exitCode=1});
