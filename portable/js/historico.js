(() => {
  const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  function entries(agenda) {
    if (Array.isArray(agenda.history)) return agenda.history.slice();
    return agenda.createdAt && Number.isFinite(Date.parse(agenda.createdAt))
      ? [{at:agenda.createdAt,title:'Agenda aberta',changes:['Informações iniciais registradas.']}] : [];
  }
  function append(agenda, previous, title, changes, at) {
    agenda.history = [...entries(previous || {}), {at,title,changes:changes.length ? changes : ['Salvo sem alterações nas informações.']}];
    agenda.historyLegacy = previous ? (previous.historyLegacy ?? !Array.isArray(previous.history)) : false;
  }
  function opening(agenda, previous) {
    const changes = [];
    if (previous) {
      Object.entries({receivedDate:'Data de recebimento da solicitação',title:'Título',start:'Data de início',startTime:'Horário de início',end:'Data final',vips:'Protegidos',notes:'Observações da abertura'}).forEach(([key,label]) => {
        if (!equal(previous[key],agenda[key])) changes.push(label + ': alterado(a).');
      });
    } else changes.push('Informações iniciais registradas. Etapa operacional desbloqueada.');
    append(agenda,previous,previous ? 'Abertura salva' : 'Agenda aberta',changes,previous ? new Date().toISOString() : agenda.createdAt);
  }
  function operation(agenda, previous, previousHistory) {
    const current = agenda.operation;
    const before = previous || {};
    const changes = [];
    const oldFields=before.fields || {}, fields=current.fields || {};
    const labels={venue:'Nome do local',cep:'CEP',street:'Endereço',number:'Número',complement:'Complemento',district:'Bairro',city:'Cidade',state:'Estado',reference:'Referências',company:'Empresa de segurança'};
    Object.entries(labels).forEach(([key,label])=>{
      if ((oldFields[key] || '') !== (fields[key] || '')) changes.push(label + ': atualizado(a).');
    });
    const oldMulti=OperationRepeater.normalize(before), multi=OperationRepeater.normalize(current);
    [['staff','Equipe VSPP'],['legs','Trechos de transporte']].forEach(([key,label])=>{
      if (!equal(oldMulti[key],multi[key])) changes.push(`${label}: atualizado(s) (${multi[key].length} registro(s)).`);
    });
    if (!equal(before.contacts || [],current.contacts || [])) changes.push(`Contatos importantes: atualizados (${(current.contacts || []).length} registro(s)).`);
    const oldFiles=before.attachments || [], files=current.attachments || [];
    files.forEach(file=>{
      const old=oldFiles.find(item=>item.id===file.id);
      if (!old) changes.push('Anexo adicionado: ' + (file.title || file.name));
      else if (!equal(old,file)) changes.push('Anexo atualizado: ' + (file.title || file.name));
    });
    oldFiles.filter(old=>!files.some(file=>file.id===old.id)).forEach(file=>changes.push('Anexo removido: '+(file.title || file.name)));
    if (equal(oldFiles.map(f=>f.id).slice().sort(),files.map(f=>f.id).slice().sort()) && !equal(oldFiles.map(f=>f.id),files.map(f=>f.id))) changes.push('Ordem dos anexos alterada.');
    if (before.status !== current.status) changes.push(current.status==='draft' ? 'Registros operacionais em rascunho.' : 'Registros operacionais marcados como preenchidos.');
    append(agenda,{...agenda,history:previousHistory},current.status==='draft' ? 'Rascunho operacional salvo' : 'Registros operacionais salvos',changes,current.updatedAt);
  }
  function render(agenda) {
    const records=entries(agenda);
    document.querySelector('#history-count').textContent=`${records.length} ${records.length===1?'registro':'registros'}`;
    const host=document.querySelector('#history-list');host.replaceChildren();
    if (agenda.historyLegacy || !Array.isArray(agenda.history)) {
      const note=document.createElement('p');note.className='history-note';note.textContent='Agenda anterior à atualização do histórico. Alterações antigas não registradas não podem ser recuperadas; os próximos salvamentos aparecerão aqui.';host.append(note);
    }
    records.slice().reverse().forEach(record=>{
      const row=document.createElement('div');row.className='timeline-item';
      const marker=document.createElement('span');marker.className='timeline-marker';marker.textContent='✓';
      const copy=document.createElement('div');copy.className='timeline-copy';
      const title=document.createElement('strong');title.textContent=record.title;
      const time=document.createElement('small');time.textContent=new Date(record.at).toLocaleString('pt-BR');
      copy.append(title,time);
      (record.changes || []).forEach(change=>{const line=document.createElement('p');line.textContent=change;copy.append(line);});
      row.append(marker,copy);host.append(row);
    });
  }
  window.AgendaHistory={entries,opening,operation,render};
})();
