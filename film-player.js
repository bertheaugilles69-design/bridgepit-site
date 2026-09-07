/* The same reviewed film player on the homepage and product page. */
(() => {
  'use strict';
  const dialog=document.getElementById('film-dialog');
  if(!dialog)return;
  let opener=null;
  const film=document.createElement('iframe');
  film.src='/film/index.html?at=0';film.title='BridgePit overview film';film.allow='autoplay; fullscreen';
  film.addEventListener('load',()=>film.contentDocument.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&dialog.open&&!film.contentDocument.fullscreenElement){e.preventDefault();dialog.close();}
  }));
  document.getElementById('film-container').append(film);
  document.querySelectorAll('[data-film]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;
    document.dispatchEvent(new Event('bridgepit:film-open'));
    dialog.showModal();document.body.style.overflow='hidden';
    film.contentWindow.filmPreview?.seek(0);
    film.contentDocument?.getElementById('play')?.click();
  }));
  document.getElementById('film-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{
    film.contentWindow.filmPreview?.pause();document.body.style.overflow='';
    document.dispatchEvent(new Event('bridgepit:film-close'));opener?.focus({preventScroll:true});
  });
})();
