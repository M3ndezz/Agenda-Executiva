/* Fotos da operação: não alteram os cadastros de profissionais ou veículos. */
(() => {
  let pending = 0;
  function attach(card, { active, get, set, redraw }) {
    const actions = card.querySelector('.repeat-actions');
    const box = document.createElement('div'); box.className = 'manual-photo-actions';
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.hidden = true;
    const upload = document.createElement('button'); upload.type = 'button'; upload.className = 'btn btn-outline'; upload.textContent = 'Adicionar foto';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-outline'; remove.textContent = 'Remover foto';
    const message = document.createElement('span'); message.className = 'manual-photo-message'; message.setAttribute('role','status');
    box.append(upload,remove,input,message); actions.prepend(box);
    let version = 0, busy = false;
    function update() {
      version++;
      box.hidden = !active();
      upload.textContent = busy ? 'Preparando foto…' : get() ? 'Trocar foto' : 'Adicionar foto';
      upload.disabled = busy; remove.disabled = busy; remove.hidden = !get();
      if (!active()) message.textContent = '';
    }
    function notify() { card.dispatchEvent(new Event('input',{bubbles:true})); }
    upload.onclick = () => { input.value=''; input.click(); };
    remove.onclick = () => { if (!active() || busy) return; set(''); redraw(); update(); notify(); };
    input.onchange = async () => {
      const file=input.files[0]; if (!file || !active() || busy) return;
      busy=true; pending++; message.textContent=''; update(); const token=version;
      try {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size>5*1024*1024) throw Error('Escolha JPG, PNG ou WebP de até 5 MB.');
        const bitmap=await createImageBitmap(file), scale=Math.min(1,480/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
        const src=canvas.toDataURL('image/jpeg',.8);
        if (src.length>=400000) throw Error('Escolha uma imagem menor.');
        if (token!==version || !active() || !card.isConnected) return;
        set(src);redraw();notify();
      } catch(e) { if(token===version && card.isConnected)message.textContent=e.message || 'Não foi possível ler a foto.'; }
      finally {busy=false;pending--;update();}
    };
    update();return update;
  }
  window.ManualPhotos={attach,isBusy:()=>pending>0};
})();
