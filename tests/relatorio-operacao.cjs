const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},OperationRepeater:{normalize:o=>({staff:o.staff||[],legs:o.legs||[]}),description:()=> 'Voo de teste'},ContactBook:{normalize:o=>o.contacts||[]},Gallery:{metadata:o=>o.attachments||[]},AgendaRules:{address:f=>f.street||''}};
vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/relatorio-operacao.js'),'utf8'),c);
const agenda={id:'APE-TEST',title:'<script>alert(1)</script>',vips:['Pessoa teste'],start:'2026-10-27',startTime:'10:00',operation:{status:'draft',fields:{street:'Rua teste'},staff:[{name:'VSPP teste',cpf:'CPF-SEGREDO',rg:'RG-SEGREDO',photo:'https://externo/foto'}],legs:[{type:'car',plate:'ABC1D23',model:'Teste'}],attachments:[{name:'foto.png',extension:'png',title:'<img onerror=x>',notes:'Teste'}]},conclusion:{total:'CUSTO-SEGREDO'}};
const before=JSON.stringify(agenda), html=c.window.OperationReport.build(agenda);
assert.equal(JSON.stringify(agenda),before);
for(const id of ['resumo','equipe','transporte','apoio','referencias']){assert(html.includes(`id="${id}"`));}
assert(!html.includes('sumario'));assert(html.includes('--brand:#bd0a35'));assert(html.includes('class="letterhead"'));
assert(html.includes('Rascunho'));assert(html.includes('ABC1D23'));assert(html.includes('&lt;script&gt;'));
for(const secret of ['CPF-SEGREDO','RG-SEGREDO','CUSTO-SEGREDO','https://externo/foto','<script>alert'])assert(!html.includes(secret));
assert(!html.includes('class="reference excluded"'));agenda.operation.status='complete';assert(!c.window.OperationReport.build(agenda).includes('Rascunho —'));
assert(c.window.OperationReport.build({id:'empty',operation:{}}).includes('Equipe ainda não informada'));
console.log('Relatório: identidade visual, ausência de sumário, privacidade, escape de conteúdo, rascunho, referências e dados ausentes aprovados.');

assert(!html.includes('border-top:2px solid var(--brand)'));assert(html.includes('alt="Bradesco"'));

const four={front:'data:image/jpeg;base64,AAAA',right:'data:image/jpeg;base64,BBBB',left:'data:image/jpeg;base64,CCCC',rear:'data:image/jpeg;base64,DDDD'};
agenda.operation.legs=[{type:'car',plate:'ABC1D23',vehiclePhotos:four,escort:{plate:'DEF4G56',model:'Escolta teste',vehiclePhotos:four}}];
agenda.operation.staff[0].cnv='CNV-SEGREDO';agenda.operation.staff[0].cnvExpiry='2030-01-01';
const linked=c.window.OperationReport.build(agenda);
assert(linked.includes('Escolta vinculada: ABC1D23 → DEF4G56'));
assert(linked.includes('Veículo do protegido'));assert(linked.includes('Veículo de escolta'));
for(const src of Object.values(four))assert.equal(linked.split(`src="${src}"`).length-1,2);
assert(!linked.includes('CNV-SEGREDO'));assert(!linked.includes('2030-01-01'));
console.log('Relatório: quatro vistas dos dois veículos, vínculo de escolta e omissão de CNV aprovados.');

for(const type of ['plane','helicopter']) {
 agenda.operation.legs=[{type,aircraft:{vehicleType:type,brand:'Fabricante fictício',model:'Modelo teste',year:'2025',vehiclePhotos:four}}];
 const rendered=c.window.OperationReport.build(agenda);
 assert(rendered.includes('Fabricante fictício'));assert(rendered.includes('Ano de fabricação'));assert(rendered.includes('2025'));
 assert(rendered.includes(type==='plane'?'Avião do protegido':'Helicóptero do protegido'));
 for(const src of Object.values(four))assert(rendered.includes(`src="${src}"`));
}
console.log('Relatório de aeronaves: identificação e quatro vistas aprovadas.');

for (const type of ['plane','helicopter']) {
 agenda.operation.legs=[{type,aircraftMode:'manual',aircraft:{vehicleType:type,brand:'Teste manual',model:'Modelo manual',year:'2026',vehicleCompany:'Empresa manual',vehiclePhotos:four}}];
 const manual=c.window.OperationReport.build(agenda);
 assert(manual.includes('Aeronave informada manualmente'));assert(manual.includes('Empresa manual'));assert(manual.includes('Traseira'));
}
agenda.operation.legs=[{type:'plane',aircraftMode:'commercial'}];
assert(c.window.OperationReport.build(agenda).includes('Voo comercial'));
console.log('Relatório: aeronaves manuais, empresa e identificação de voo comercial aprovados.');
