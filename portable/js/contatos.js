(() => {
  const categories = { medical: 'Unidade médica', police: 'Unidade policial / similar', other: 'Outro contato' };
  const fields = ['category','title','name','phone','extension','person','address','minutes','hours','notes'];
  const list = () => document.querySelector('#contact-list');
  const text = value => String(value ?? '').trim();
  function normalize(operation = {}) {
    return Array.isArray(operation.contacts) ? operation.contacts.map(contact => Object.fromEntries(fields.map(key => [key,text(contact[key])]))) : [];
  }
  function read() {
    return [...list().querySelectorAll('.contact-card')].map(card => Object.fromEntries([...card.querySelectorAll('[data-contact]')].map(input => [input.dataset.contact,input.value.trim()])));
  }
  function validate(contacts) {
    for (const [i,contact] of contacts.entries()) {
      const prefix = `Contato ${i+1}: `;
      if (!categories[contact.category]) return prefix+'escolha uma categoria.';
      if (!contact.name) return prefix+'informe o nome da unidade ou do contato.';
      if (contact.category === 'other' && !contact.title) return prefix+'informe o título que identifica esse contato.';
      if (contact.phone && !/^\+?[\d\s().-]+$/.test(contact.phone)) return prefix+'confira o telefone; informe o ramal no campo separado.';
      if (contact.phone && !/^\d{3,15}$/.test(contact.phone.replace(/\D/g,''))) return prefix+'confira a quantidade de dígitos do telefone.';
      if (contact.minutes && (!/^\d+$/.test(contact.minutes) || +contact.minutes > 10080)) return prefix+'informe o deslocamento em minutos inteiros, de 0 a 10080.';
    }
    return '';
  }
  function notifyChange() {
    document.querySelector('#operation-form').dispatchEvent(new Event('input',{bubbles:true}));
  }
  function renumber() {
    [...list().querySelectorAll('.contact-card')].forEach((card,i) => {
      card.querySelector('legend').textContent=`Contato ${i+1}`;
      card.querySelector('button').setAttribute('aria-label',`Remover contato ${i+1}`);
    });
    document.querySelector('#contacts-empty').hidden = list().children.length > 0;
  }
  function field(key,label,type='text',placeholder='') {
    const wrapper=document.createElement('label');wrapper.textContent=label;
    const control=document.createElement(type==='textarea' ? 'textarea' : 'input');
    if(type!=='textarea') control.type=type;
    control.dataset.contact=key;control.placeholder=placeholder;
    if(key==='minutes'){control.min='0';control.max='10080';control.step='1';}
    if(type==='textarea')control.maxLength=1000;
    wrapper.append(control);return wrapper;
  }
  function add(data={},focus=false) {
    const card=document.createElement('fieldset');card.className='contact-card';
    card.append(document.createElement('legend'));
    const actions=document.createElement('div');actions.className='repeat-actions';
    const remove=document.createElement('button');remove.type='button';remove.className='btn btn-outline';remove.textContent='Remover contato';
    remove.addEventListener('click',()=>{
      const filled=[...card.querySelectorAll('[data-contact]')].some(el=>el.dataset.contact!=='category' && el.value.trim());
      if(filled && !confirm('Remover este contato do formulário? Salve depois para confirmar a alteração.'))return;
      card.remove();renumber();notifyChange();
    });actions.append(remove);card.append(actions);
    const grid=document.createElement('div');grid.className='form-grid two';
    const categoryLabel=document.createElement('label');categoryLabel.textContent='Categoria *';
    const category=document.createElement('select');category.dataset.contact='category';
    for(const [value,label] of Object.entries(categories)) category.add(new Option(label,value));
    categoryLabel.append(category);
    const title=field('title','Título do contato *','text','Ex.: Administração do evento, apoio local');
    grid.append(categoryLabel,title,
      field('name','Nome da unidade / contato *','text','Ex.: Hospital de referência, base policial'),
      field('phone','Telefone com DDD','tel','Ex.: (11) 0000-0000'),
      field('extension','Ramal'),
      field('person','Pessoa / setor de referência'),
      field('address','Endereço e referência de acesso'),
      field('minutes','Deslocamento estimado (minutos)','number'),
      field('hours','Horário de atendimento','text','Ex.: 24 horas ou segunda a sexta, das 8h às 18h'),
      field('notes','Observações','textarea','Ex.: entrada do pronto-socorro ou orientação de contato'));
    card.append(grid);
    const hint=document.createElement('p');hint.className='contact-hint';hint.textContent='Deslocamento a partir do local do evento: estimativa manual, sem consulta de trânsito.';card.append(hint);
    card.querySelectorAll('[data-contact]').forEach(el=>el.value=text(data[el.dataset.contact]));
    category.value=categories[data.category] ? data.category : 'medical';
    function updateCategory(){title.hidden=category.value!=='other';}
    category.addEventListener('change',updateCategory);updateCategory();
    list().append(card);renumber();
    if(focus){card.querySelector(`[data-contact="${category.value==='other'?'title':'name'}"]`).focus();notifyChange();}
  }
  function load(operation) {
    list().replaceChildren();normalize(operation).forEach(contact=>add(contact));renumber();
  }
  function render(operation) {
    const target=document.querySelector('#contacts-summary');target.replaceChildren();
    const contacts=normalize(operation);
    if(!contacts.length){target.textContent='Nenhum contato importante cadastrado.';return;}
    for(const [category,label] of Object.entries(categories)) {
      const group=contacts.filter(contact=>contact.category===category);
      if(!group.length)continue;
      const section=document.createElement('section');const heading=document.createElement('h3');heading.textContent=label;section.append(heading);
      group.forEach(contact=>{
        const card=document.createElement('article');card.className='contact-summary-card';
        const title=document.createElement('h4');title.textContent=[category==='other'?contact.title:'',contact.name].filter(Boolean).join(' · ') || 'Contato em rascunho';card.append(title);
        const rows=[['Telefone',contact.phone ? contact.phone+(contact.extension?' · Ramal '+contact.extension:'') : 'Não informado'],['Ramal',!contact.phone?contact.extension:''],['Referência',contact.person],['Endereço',contact.address],['Deslocamento',contact.minutes!==''?contact.minutes+' min (estimativa manual a partir do evento)':''],['Atendimento',contact.hours],['Observações',contact.notes]];
        rows.filter(([,value])=>value).forEach(([key,value])=>{
          const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=key+': ';p.append(strong,document.createTextNode(value));card.append(p);
        });section.append(card);
      });target.append(section);
    }
  }
  window.ContactBook={normalize,read,validate,add,load,render};
})();
