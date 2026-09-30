(() => {
  const MAX_FILE=10*1024*1024, MAX_TOTAL=50*1024*1024;
  const imageTypes={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'};
  const extensions=[...Object.keys(imageTypes),'pdf','eml','msg','doc','docx','xls','xlsx','txt'];
  let entries=[], owner=null, epoch=0, summaryEpoch=0, saving=false;
  const pending=new Map(), editorURLs=new Set(), summaryURLs=new Set();
  let database;
  const metadata=operation=>Array.isArray(operation?.attachments)?operation.attachments.map(item=>({...item})):[];
  const size=value=>`${(value/1024/1024).toLocaleString('pt-BR',{maximumFractionDigits:2})} MB`;
  function error(message){document.querySelector('#gallery-message').textContent=message;}
  function fileError(file,total){
    const ext=file.name.split('.').pop().toLowerCase();
    if(!extensions.includes(ext))return 'Formato não aceito. Use fotos JPG, PNG, WebP, GIF, PDF, e-mails EML/MSG, Word, Excel ou TXT.';
    if(!file.size)return 'O arquivo está vazio.';
    if(file.size>MAX_FILE)return 'O arquivo ultrapassa 10 MB.';
    if(total+file.size>MAX_TOTAL)return 'A agenda ultrapassaria 50 MB de anexos.';
    return '';
  }
  function db(){
    if(!database) database=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error('Armazenamento de arquivos indisponível neste navegador.'));return;}
      const request=indexedDB.open('superAgendaAttachments',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(new Error('Não foi possível acessar os arquivos locais.'));
      request.onblocked=()=>reject(new Error('Feche outras abas da agenda e tente novamente.'));
    }).catch(reason=>{database=null;throw reason;});
    return database;
  }
  async function write(records){
    if(!records.length)return;
    const database=await db();
    await new Promise((resolve,reject)=>{
      const transaction=database.transaction('files','readwrite');
      transaction.oncomplete=resolve;
      transaction.onabort=()=>reject(new Error('Não foi possível guardar os anexos. Verifique o espaço disponível no navegador.'));
      transaction.onerror=()=>{};
      try{records.forEach(record=>transaction.objectStore('files').put(record));}catch(reason){transaction.abort();}
    });
  }
  async function get(item,agendaId){
    if(owner===agendaId && pending.has(item.id))return pending.get(item.id);
    const database=await db();
    const record=await new Promise((resolve,reject)=>{
      const request=database.transaction('files','readonly').objectStore('files').get(item.id);
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('Falha ao ler o anexo.'));
    });
    if(!record || record.agendaId!==agendaId)throw new Error('Arquivo não encontrado neste navegador. Anexe-o novamente.');
    return record.blob;
  }
  function revoke(urls){urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();}
  function changed(){document.querySelector('#operation-form').dispatchEvent(new Event('input',{bubbles:true}));}
  function button(label,fn){const b=document.createElement('button');b.type='button';b.className='btn btn-outline';b.textContent=label;b.addEventListener('click',fn);return b;}
  async function preview(item,agendaId,container,urls,current){
    const label=document.createElement('p');label.className='attachment-status';
    label.textContent=item.image?'Carregando foto…':`${item.extension.toUpperCase()} · ${item.name}`;container.append(label);
    try{
      const blob=await get(item,agendaId);
      if(!current())return;
      const url=URL.createObjectURL(item.image?blob.slice(0,blob.size,imageTypes[item.extension]):blob.slice(0,blob.size,'application/octet-stream'));urls.add(url);
      if(item.image){
        const img=document.createElement('img');img.src=url;img.alt=item.title || item.name;img.loading='lazy';
        img.onerror=()=>{img.hidden=true;label.hidden=false;label.textContent='Não foi possível visualizar esta imagem. Você pode baixar o original.';};
        img.onload=()=>{label.hidden=true;};container.append(img);
        container.append(button('Ampliar foto',()=>{
          const dialog=document.querySelector('#photo-dialog');document.querySelector('#photo-large').src=url;document.querySelector('#photo-large').alt=item.title || item.name;document.querySelector('#photo-caption').textContent=item.title || item.name;dialog.showModal();
        }));
      }
      const download=document.createElement('a');download.className='btn btn-outline';download.href=url;download.download=item.name;download.textContent='Baixar original';container.append(download);
    }catch(reason){if(current())label.textContent=reason.message;}
  }
  function renderEditor(){
    const version=++epoch;revoke(editorURLs);
    const container=document.querySelector('#gallery-editor');container.replaceChildren();
    document.querySelector('#gallery-empty').hidden=entries.length>0;
    document.querySelector('#gallery-total').textContent=`${entries.length} anexo(s) · ${size(entries.reduce((total,item)=>total+item.size,0))} de 50 MB`;
    entries.forEach((item,index)=>{
      const card=document.createElement('article');card.className='attachment-card';
      const heading=document.createElement('h3');heading.textContent=`Anexo ${index+1}`;card.append(heading);
      const media=document.createElement('div');media.className='attachment-media';card.append(media);
      preview(item,owner,media,editorURLs,()=>epoch===version);
      const file=document.createElement('p');file.className='attachment-filename';file.textContent=`${item.name} · ${size(item.size)}`;card.append(file);
      for(const [key,label] of [['title','Título *'],['notes','Observação']]){
        const wrapper=document.createElement('label');wrapper.textContent=label;
        const input=document.createElement(key==='notes'?'textarea':'input');input.value=item[key] || '';input.maxLength=key==='title'?160:1000;
        input.addEventListener('input',()=>{item[key]=input.value;});wrapper.append(input);card.append(wrapper);
      }
      const actions=document.createElement('div');actions.className='repeat-actions';
      const up=button('Mover antes',()=>{[entries[index-1],entries[index]]=[entries[index],entries[index-1]];renderEditor();changed();});up.disabled=index===0;
      const down=button('Mover depois',()=>{[entries[index],entries[index+1]]=[entries[index+1],entries[index]];renderEditor();changed();});down.disabled=index===entries.length-1;
      actions.append(up,down,button('Remover anexo',()=>{
        if(!confirm(`Remover "${item.title || item.name}" da galeria? Salve para confirmar.`))return;
        entries.splice(index,1);pending.delete(item.id);renderEditor();changed();
      }));card.append(actions);container.append(card);
    });
  }
  function addFiles(files){
    if(saving)return;
    const errors=[];
    for(const file of files){
      const issue=fileError(file,entries.reduce((total,item)=>total+item.size,0));
      if(issue){errors.push(`${file.name}: ${issue}`);continue;}
      const extension=file.name.split('.').pop().toLowerCase();
      const id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
      entries.push({id,name:file.name,size:file.size,extension,image:!!imageTypes[extension],title:file.name.replace(/\.[^.]+$/,'').slice(0,160),notes:''});pending.set(id,file);
    }
    error(errors.join('\n'));renderEditor();changed();
  }
  function load(agenda){owner=agenda.id;entries=metadata(agenda.operation);pending.clear();error('');renderEditor();document.querySelector('#attachment-files').value='';}
  function read(){return entries.map(item=>({...item,title:item.title.trim(),notes:item.notes.trim()}));}
  function validate(items){const index=items.findIndex(item=>!item.title);return index<0?'':`Anexo ${index+1}: informe o título ou salve como rascunho.`;}
  async function prepare(agendaId){
    if(agendaId!==owner)throw new Error('Abra novamente esta agenda antes de salvar.');
    await write(entries.filter(item=>pending.has(item.id)).map(item=>({id:item.id,agendaId,blob:pending.get(item.id)})));
  }
  async function cleanup(agendaId,previous,current){
    const removed=previous.filter(old=>!current.some(item=>item.id===old.id));
    if(!removed.length)return;
    const database=await db();
    await new Promise((resolve,reject)=>{
      const transaction=database.transaction('files','readwrite');transaction.oncomplete=resolve;transaction.onabort=()=>reject(new Error('cleanup'));transaction.onerror=()=>{};
      const store=transaction.objectStore('files');
      removed.forEach(item=>{const request=store.get(item.id);request.onsuccess=()=>{if(request.result?.agendaId===agendaId)store.delete(item.id);};});
    });
  }
  function committed(agendaId,previous,current){pending.clear();cleanup(agendaId,previous,current).catch(()=>{});}
  function render(agenda){
    const version=++summaryEpoch;revoke(summaryURLs);const target=document.querySelector('#gallery-summary');target.replaceChildren();
    const items=metadata(agenda.operation);if(!items.length){target.textContent='Nenhuma foto ou anexo cadastrado.';return;}
    items.forEach((item,index)=>{
      const card=document.createElement('article');card.className='attachment-card';const heading=document.createElement('h3');heading.textContent=`${index+1}. ${item.title || item.name}`;card.append(heading);
      const media=document.createElement('div');media.className='attachment-media';card.append(media);preview(item,agenda.id,media,summaryURLs,()=>summaryEpoch===version);
      const notes=document.createElement('p');notes.className='attachment-notes';notes.textContent=item.notes || '';card.append(notes);target.append(card);
    });
  }
  function setBusy(value){saving=value;document.querySelector('#operation-form').querySelectorAll('button,input,textarea,select').forEach(el=>{if(value){el.dataset.galleryDisabled=String(el.disabled);el.disabled=true;}else{el.disabled=el.dataset.galleryDisabled==='true';delete el.dataset.galleryDisabled;}});}
  window.Gallery={metadata,fileError,load,read,validate,prepare,committed,render,addFiles,setBusy,isBusy:()=>saving};
  document.querySelector('#attachment-files').addEventListener('change',event=>{addFiles([...event.target.files]);event.target.value='';});
  document.querySelector('#photo-close').addEventListener('click',()=>document.querySelector('#photo-dialog').close());
  document.querySelector('#photo-dialog').addEventListener('close',()=>document.querySelector('#photo-large').removeAttribute('src'));
})();
