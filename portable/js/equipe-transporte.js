(() => {
  const types = { car: 'Carro', helicopter: 'Helicóptero', plane: 'Avião' };
  const specs = {
    car: [['plate','Placa','text'],['brand','Marca','text'],['model','Modelo','text'],['color','Cor','text'],['year','Ano','number']],
    helicopter: [['heliCompany','Empresa responsável','text'],['boarding','Embarque combinado','datetime-local'],['landing','Desembarque combinado','datetime-local']],
    plane: [['airline','Companhia aérea','text'],['flight','Código do voo','text'],['departure','Partida prevista','datetime-local'],['arrival','Chegada prevista','datetime-local']]
  };
  function normalize(operation = {}) {
    const f = operation.fields || {};
    return {
      staff: Array.isArray(operation.staff) ? operation.staff : [{ name:f.vspp || '', cpf:f.cpf || '', gender:f.gender || '' }],
      legs: Array.isArray(operation.legs) ? operation.legs : [{ type:f.transport || '', ...Object.fromEntries(Object.values(specs).flat().map(([key]) => [key, f[key] || ''])) }]
    };
  }
  function mode(legs) {
    const unique = new Set(legs.map(x => x.type).filter(Boolean));
    return unique.size > 1 ? 'Híbrido' : unique.size ? types[[...unique][0]] : 'Transporte a definir';
  }
  function validate(staff, legs) {
    if (!staff.length) return 'Adicione pelo menos um VSPP.';
    const cpfs = new Set();
    for (const [i,p] of staff.entries()) {
      if (!p.name || !p.cpf || !p.gender) return `VSPP ${i+1}: preencha nome, CPF e gênero.`;
      if (!AgendaRules.validCPF(p.cpf)) return `VSPP ${i+1}: confira o CPF informado.`;
      const cpf=p.cpf.replace(/\D/g,'');
      if (cpfs.has(cpf)) return `VSPP ${i+1}: esse CPF já foi cadastrado nesta equipe.`;
      cpfs.add(cpf);
    }
    if (!legs.length) return 'Adicione pelo menos um trecho de transporte.';
    for (const [i,t] of legs.entries()) {
      const prefix=`Trecho ${i+1}: `;
      if (!specs[t.type]) return prefix+'selecione o tipo de transporte.';
      if (specs[t.type].some(([k]) => !t[k])) return prefix+'preencha os campos com *.';
      if (t.type==='car') {
        if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(t.plate.toUpperCase().replace(/[-\s]/g,''))) return prefix+'confira a placa (ABC-1234 ou ABC1D23).';
        if (!/^\d{4}$/.test(t.year) || +t.year<1900 || +t.year>2100) return prefix+'informe um ano válido.';
      } else {
        const start=new Date(t.type==='plane'?t.departure:t.boarding).getTime();
        const end=new Date(t.type==='plane'?t.arrival:t.landing).getTime();
        if (!Number.isFinite(start)||!Number.isFinite(end)||end<start) return prefix+'confira as datas: chegada não pode ser anterior à partida.';
      }
    }
    return '';
  }
  function description(t) {
    const when = v => v ? new Date(v).toLocaleString('pt-BR') : 'a definir';
    const route=[t.origin,t.destination].filter(Boolean).join(' → ');
    const detail = t.type==='car' ? [t.brand,t.model,t.plate,t.color,t.year].filter(Boolean).join(' · ') : t.type==='helicopter' ? `${t.heliCompany || ''} · ${when(t.boarding)} → ${when(t.landing)}` : t.type==='plane' ? `${t.airline || ''} · Voo ${t.flight || 'a definir'} · ${when(t.departure)} → ${when(t.arrival)}` : '';
    return [types[t.type] || 'A definir',route,detail].filter(Boolean).join(' · ');
  }
  const readCard = card => Object.fromEntries([...card.querySelectorAll('[data-field]')].map(el=>[el.dataset.field,el.value.trim()]));
  function read() {
    return { staff:[...document.querySelectorAll('.staff-card')].map(readCard), legs:[...document.querySelectorAll('.leg-card')].map(card=>{
      const all=readCard(card);
      return Object.fromEntries(['type','origin','destination',...(specs[all.type] || []).map(([key])=>key)].map(key=>[key,all[key] || '']));
    }) };
  }
  function input(key,label,type='text') {
    const wrapper=document.createElement('label');
    wrapper.textContent=label;
    const control=document.createElement('input'); control.type=type;control.dataset.field=key;
    if (key==='cpf') {control.inputMode='numeric';control.maxLength=14;control.placeholder='000.000.000-00';}
    if (key==='plate') {control.maxLength=8;control.placeholder='ABC1D23 ou ABC-1234';}
    if (key==='year') {control.min='1900';control.max='2100';}
    wrapper.append(control);return wrapper;
  }
  function select(key,label,options) {
    const wrapper=document.createElement('label');wrapper.textContent=label;
    const control=document.createElement('select');control.dataset.field=key;
    control.add(new Option('Selecione',''));
    Object.entries(options).forEach(([value,text])=>control.add(new Option(text,value)));
    wrapper.append(control);return wrapper;
  }
  function renumber() {
    for (const [selector,label] of [['.staff-card','VSPP'],['.leg-card','Trecho']]) {
      const cards=[...document.querySelectorAll(selector)];
      cards.forEach((card,i)=>{
        card.querySelector('legend').textContent=`${label} ${i+1}`;
        card.querySelector('[data-action="remove"]').disabled=cards.length===1;
        const up=card.querySelector('[data-action="up"]'); const down=card.querySelector('[data-action="down"]');
        if(up){up.disabled=i===0;down.disabled=i===cards.length-1;}
      });
    }
    document.querySelector('#transport-mode').textContent=`${mode(read().legs)} · ${document.querySelectorAll('.leg-card').length} trecho(s)`;
  }
  function cardBase(kind) {
    const card=document.createElement('fieldset');card.className=`${kind}-card`;
    const legend=document.createElement('legend');card.append(legend);
    const controls=document.createElement('div');controls.className='repeat-actions';
    const actions=kind==='leg' ? [['up','↑ Subir trecho'],['down','↓ Descer trecho'],['remove','Remover trecho']] : [['remove','Remover VSPP']];
    actions.forEach(([action,label])=>{
      const button=document.createElement('button');button.type='button';button.className='btn btn-outline';button.dataset.action=action;button.textContent=label;
      button.addEventListener('click',()=>{
        if(action==='remove') {
          if(Object.values(readCard(card)).some(Boolean) && !confirm(`Remover ${legend.textContent.toLowerCase()} e seus dados deste formulário?`)) return;
          card.remove();
        } else if(action==='up' && card.previousElementSibling) card.parentNode.insertBefore(card,card.previousElementSibling);
        else if(action==='down' && card.nextElementSibling) card.parentNode.insertBefore(card.nextElementSibling,card);
        renumber();document.querySelector('#operation-form').dispatchEvent(new Event('input',{bubbles:true}));
      });controls.append(button);
    });card.append(controls);return card;
  }
  function fill(card,data){card.querySelectorAll('[data-field]').forEach(el=>el.value=data[el.dataset.field] || '');}
  function addStaff(data={},focus=false){
    const card=cardBase('staff');const grid=document.createElement('div');grid.className='form-grid two';
    grid.append(input('name','Nome do VSPP *'),input('cpf','CPF *'),select('gender','Gênero *',Object.fromEntries(['Masculino','Feminino','Outro','Prefere não informar'].map(x=>[x,x]))));
    card.append(grid);document.querySelector('#staff-list').append(card);fill(card,data);renumber();if(focus)grid.querySelector('input').focus();
  }
  function updateLeg(card) {
    const type=card.querySelector('[data-field="type"]').value;
    card.querySelectorAll('[data-kind]').forEach(group=>{group.hidden=group.dataset.kind!==type;group.querySelectorAll('input').forEach(el=>el.disabled=group.hidden);});
    renumber();
  }
  function addLeg(data={},focus=false){
    const card=cardBase('leg');const grid=document.createElement('div');grid.className='form-grid two';
    grid.append(select('type','Tipo de transporte *',types),input('origin','Origem / ponto de embarque'),input('destination','Destino / ponto de desembarque'));
    card.append(grid);
    Object.entries(specs).forEach(([type,list])=>{
      const group=document.createElement('div');group.className='form-grid two leg-fields';group.dataset.kind=type;
      list.forEach(([key,label,kind])=>group.append(input(key,label+' *',kind)));card.append(group);
    });
    document.querySelector('#leg-list').append(card);fill(card,data);updateLeg(card);
    card.querySelector('select').addEventListener('change',()=>updateLeg(card));
    if(focus)card.querySelector('select').focus();
  }
  function load(operation){
    document.querySelector('#staff-list').replaceChildren();document.querySelector('#leg-list').replaceChildren();
    const data=normalize(operation);
    (data.staff.length?data.staff:[{}]).forEach(x=>addStaff(x));
    (data.legs.length?data.legs:[{}]).forEach(x=>addLeg(x));renumber();
  }
  window.OperationRepeater={normalize,mode,validate,description,read,load,addStaff,addLeg};
})();
