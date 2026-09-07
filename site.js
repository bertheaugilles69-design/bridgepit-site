(() => {
  const menu=document.querySelector('.mobile-menu');
  if(!menu)return;
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.open=false;}));
  document.addEventListener('click',e=>{if(!menu.contains(e.target))menu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
  matchMedia('(min-width: 901px)').addEventListener('change',e=>{if(e.matches)menu.open=false;});
})();
