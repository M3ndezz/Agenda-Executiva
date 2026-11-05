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
