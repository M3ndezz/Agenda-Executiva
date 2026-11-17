const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const nodes = new Map();
const makeNode = () => ({value:'',textContent:'',children:[],dataset:{},listeners:{},classList:{toggle(){}},insertBefore(n,b){this.children.splice(this.children.indexOf(b),0,n)},append(...n){this.children.push(...n)},prepend(n){this.children.unshift(n)},replaceChildren(...n){this.children=n},add(n){this.children.push(n)},addEventListener(k,fn){this.listeners[k]=fn},setAttribute(){},showModal(){this.open=true},close(){this.open=false}});
let controls = [];
const document = {createElement:makeNode,querySelector(s){if(!nodes.has(s))nodes.set(s,makeNode());return nodes.get(s)},querySelectorAll(){return controls}};
const data = new Map();
const context = {document,console,structuredClone,Option:function(text,value){return {text,value}},Event:function(type){this.type=type},crypto:{randomUUID:()=> 'test-id'},confirm:()=>true,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},addEventListener(){}};
context.window=context;vm.createContext(context);
const run = name=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),context);
run('cadastro-veiculos'); run('equipe-transporte');
const R=context.VehicleRegistry;
R.render();assert.match(document.querySelector('#vehicle-count').textContent,/^0 /);
const vehicle={plate:'ABC-1234',brand:'Marca',model:'Modelo',color:'Preto',year:'2026',vehicleCompany:'Empresa'};
const submit=()=>document.querySelector('#vehicle-editor').onsubmit({preventDefault(){}});
function setControls(v){controls=Object.entries(v).map(([k,value])=>({dataset:{vehicleField:k},value}));}
setControls(vehicle);submit();
assert.equal(JSON.parse(data.get('apeVehicleRegistryV1'))[0].plate,'ABC1234');
assert.match(R.validate({...vehicle,id:'another'}),/Já existe/);
assert.match(R.validate({...vehicle,plate:'bad'}),/placa/);
assert.match(R.validate({...vehicle,year:'1800'}),/ano/);
const saved=JSON.parse(data.get('apeVehicleRegistryV1'))[0];
const snapshot=R.snapshot({...saved,photo:'https://external/photo'});
assert.equal(snapshot.vehiclePhoto,'');
saved.color='Azul';assert.equal(snapshot.color,'Preto');
document.querySelector('#vehicle-search').value='inexistente';R.render();assert.match(document.querySelector('#vehicle-count').textContent,/^0 /);
document.querySelector('#vehicle-search').value='';R.render();
// Picker fills only this leg and preserves route fields; historical data gets its own option.
const inputs=Object.fromEntries(Object.keys(vehicle).map(k=>[k,{value:''}]));
inputs.type={value:'car'};
const group=makeNode();const card={vehicleSnapshot:{},querySelector(s){if(s==='[data-kind="car"]')return group;return inputs[/data-field="([^"]+)"/.exec(s)[1]]},dispatchEvent(){this.changed=true}};
R.attachPicker(card,{...snapshot,color:'Branco'});
const select=group.children[0].children[0].children[0];
assert.equal(select.value,'__saved__');
select.value='vehicle-test-id';select.onchange();assert.equal(inputs.plate.value,'ABC1234');assert.equal(inputs.color.value,'Preto');assert(card.changed);
select.value='__saved__';select.onchange();assert.equal(inputs.color.value,'Branco');
select.value='';select.onchange();assert.equal(inputs.plate.value,'');assert.equal(card.vehicleSnapshot.vehicleId,'');
// Operation serialization copies metadata for cars only; legacy legs still normalize.
card.querySelectorAll=()=>[{dataset:{field:'type'},value:'car'},...Object.entries(inputs).map(([k,n])=>({dataset:{field:k},value:n.value}))];
card.vehicleSnapshot={vehicleId:'test-id',vehiclePhoto:''};
document.querySelectorAll=s=>s==='.leg-card'?[card]:s==='.staff-card'?[]:controls;
assert.equal(context.OperationRepeater.read().legs[0].vehicleId,'test-id');
const originalRead=card.querySelectorAll;card.querySelectorAll=()=>originalRead().map(n=>n.dataset.field==='type'?{...n,value:'plane'}:n);
assert.equal(context.OperationRepeater.read().legs[0].vehicleId,undefined);
assert.equal(context.OperationRepeater.normalize({fields:{transport:'car',plate:'OLD1234'}}).legs[0].plate,'OLD1234');
// Cancellation and failed deletion must not mutate registry or agenda data.
data.set('superAgendaPrototypeV2','historical agenda');
const remove=document.querySelector('#vehicle-cards').children[0].children[1].children[1];
const before=data.get('apeVehicleRegistryV1');context.confirm=()=>false;remove.onclick();assert.equal(data.get('apeVehicleRegistryV1'),before);
context.confirm=()=>true;context.localStorage.setItem=()=>{throw Error('Sem espaço')};remove.onclick();assert.equal(data.get('apeVehicleRegistryV1'),before);
context.localStorage.setItem=(k,v)=>data.set(k,v);remove.onclick();assert.equal(JSON.parse(data.get('apeVehicleRegistryV1')).length,0);assert.equal(data.get('superAgendaPrototypeV2'),'historical agenda');
// A escolta permanece independente da seleção do carro principal.
const escortData={plate:'DEF4G56',brand:'Teste',model:'Escolta',vehicleId:'escort-id',vehiclePhotos:{front:'data:image/jpeg;base64,AAAA'}};
const group2=makeNode();
const card2={querySelector(s){if(s==='[data-kind="car"]')return group2;return inputs[/data-field="([^"]+)"/.exec(s)[1]]},dispatchEvent(){}};
R.attachPicker(card2,{...snapshot,escort:escortData});
assert.equal(card2.escortSnapshot.plate,'DEF4G56');
escortData.plate='CHANGED';assert.equal(card2.escortSnapshot.plate,'DEF4G56');
const pick2=group2.children[0].children[0].children[0];pick2.value='';pick2.onchange();assert.equal(card2.escortSnapshot.plate,'DEF4G56');
const escortPicker=group2.children[3].children[0].children[0];escortPicker.value='';escortPicker.onchange();assert.equal(card2.escortSnapshot,null);
// Aeronaves exigem apenas fabricante, modelo e ano; não usam placa.
for(const vehicleType of ['helicopter','plane']) {
 assert.equal(R.validate({vehicleType,brand:'Fabricante teste',model:'Modelo teste',year:'2024'}),'');
 assert.match(R.validate({vehicleType,brand:'',model:'Modelo',year:'2024'}),/campos/);
 assert.match(R.validate({vehicleType,brand:'Teste',model:'Modelo',year:'1800'}),/ano/);
 const aircraft=R.snapshot({id:'air-test',vehicleType,brand:'Teste',model:'Modelo',year:'2024',photos:{rear:'data:image/jpeg;base64,AAAA'}});
 assert.equal(aircraft.vehicleType,vehicleType);assert.equal(aircraft.vehiclePhotos.rear,'data:image/jpeg;base64,AAAA');
}
assert.equal(R.snapshot(saved).vehicleType,'car');
// Manual escort and aircraft survive serialization and reopening independently.
const walk=n=>[n,...(n.children||[]).flatMap(walk)];
escortPicker.value='__manual__';escortPicker.onchange();
assert.equal(walk(group2).filter(n=>n.className==='vehicle-gallery-tile').length,8);
const escortFields=group2.children[3].children[2].children[0].children.map(n=>n.children[0]);
['DEF4567','Marca escolta','Modelo escolta','Azul','2024','Empresa escolta'].forEach((v,i)=>{escortFields[i].value=v;escortFields[i].oninput()});
assert.equal(card2.escortSnapshot.plate,'DEF4567');
const aircraftGroups={helicopter:makeNode(),plane:makeNode()};
const aircraftInputs=Object.fromEntries(['type','flight','airline','heliCompany','departure','arrival','boarding','landing'].map(k=>[k,{value:k==='type'?'plane':'',parentElement:makeNode()}]));
const aircraftCard={isConnected:true,querySelector(s){const g=/data-kind="([^"]+)"/.exec(s);return g?aircraftGroups[g[1]]:aircraftInputs[/data-field="([^"]+)"/.exec(s)[1]]},dispatchEvent(){}};
R.attachAircraft(aircraftCard,{type:'plane',aircraftMode:'manual',aircraft:{vehicleType:'plane',brand:'Embraer',model:'Phenom',year:'2024',vehicleCompany:'Operadora'}});
const planeSelect=aircraftGroups.plane.children[0].children[0].children[0];
assert.equal(planeSelect.value,'manual');assert.equal(aircraftCard.aircraftSnapshots.plane.brand,'Embraer');
assert.equal(aircraftInputs.flight.parentElement.hidden,true);
assert.equal(walk(aircraftGroups.plane).filter(n=>n.className==='vehicle-gallery-tile').length,4);
const manualAircraft=structuredClone(aircraftCard.aircraftSnapshots.plane);
planeSelect.value='commercial';planeSelect.onchange();assert.equal(aircraftCard.aircraftSnapshots.plane,null);assert.equal(aircraftInputs.flight.parentElement.hidden,false);
planeSelect.value='manual';planeSelect.onchange();assert.equal(aircraftCard.aircraftModes.plane,'manual');
context.AgendaRules={validCPF:()=>true};const staff=[{name:'Teste',cpf:'00000000000',gender:'Masculino'}];
const leg={type:'plane',aircraftMode:'manual',aircraft:manualAircraft,departure:'2026-11-17T12:00',arrival:'2026-11-17T13:00'};
assert.equal(context.OperationRepeater.validate(staff,[leg]),'');
assert.match(context.OperationRepeater.validate(staff,[{...leg,aircraft:{...manualAircraft,vehicleCompany:''}}]),/empresa/);
assert.match(context.OperationRepeater.validate(staff,[{...leg,aircraftMode:'commercial'}]),/campos/);
assert.doesNotMatch(context.OperationRepeater.description(leg),/Voo a definir/);
assert.match(context.OperationRepeater.description(leg),/Operadora/);
console.log('Operação: escolta manual, quatro vistas, modos de aeronave, reabertura e validação aprovados.');
// A damaged registry cannot be overwritten.
data.set('apeVehicleRegistryV1','invalid');run('cadastro-veiculos');setControls(vehicle);submit();assert.equal(data.get('apeVehicleRegistryV1'),'invalid');
console.log('Veículos: cadastro, validação, busca, seleção/manual, histórico, exclusão e falhas de armazenamento aprovados.');
