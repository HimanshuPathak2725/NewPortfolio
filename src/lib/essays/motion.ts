import { figures, renderFigure, stageDescription, type FigureId } from './figures';
export function initEssayFigures() {
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('[data-essay-figure]').forEach(root=>{
    if(root.dataset.ready) return;
    root.dataset.ready='true';
    const id=root.dataset.essayFigure as FigureId;
    const meta=figures[id];
    const comparison='comparison' in meta && meta.comparison;
    const timeline='timeline' in meta ? meta.timeline : {steps:300,stride:1,label:'Episode',next:100};
    const initial='initialProgress' in meta ? meta.initialProgress : 1;
    const duration='duration' in meta ? meta.duration : 12000;
    const wide=root.querySelector<HTMLElement>('.essay-drawing-wide')!;
    const small=root.querySelector<HTMLElement>('.essay-drawing-small')!;
    const play=root.querySelector<HTMLButtonElement>('[data-play]')!;
    const next=root.querySelector<HTMLButtonElement>('[data-next]')!;
    const reset=root.querySelector<HTMLButtonElement>('[data-reset]')!;
    const stage=root.querySelector<HTMLElement>('[data-stage]')!;
    const position=root.querySelector<HTMLElement>('[data-position]')!;
    const choices=root.querySelector<HTMLElement>('.essay-choices');
    const presets=root.querySelectorAll<HTMLButtonElement>('[data-frame]');
    if(choices)choices.hidden=false;
    root.querySelector<HTMLElement>('.essay-playback')!.hidden=false;stage.hidden=false;
    let condition=initial,progress=comparison?1:initial,running=false,seen=false,raf=0,last=0,painted=0;
    play.hidden=preference.matches;
    if(comparison){next.textContent=`Next ${timeline.next} ${timeline.label.toLowerCase()}s`;next.setAttribute('aria-label',`${next.textContent}: ${meta.title}`);position.textContent=`${timeline.label} ${timeline.steps} / ${timeline.steps}`;}
    function draw(value:number,manual=false) {
      progress=Math.max(0,Math.min(1,value));
      wide.innerHTML=renderFigure(id,comparison?condition:progress,false,false,comparison?progress:1);
      small.innerHTML=renderFigure(id,comparison?condition:progress,true,false,comparison?progress:1);
      const index=Math.min(4,Math.floor(progress*4+1e-8));
      stage.setAttribute('aria-live',manual?'polite':'off');
      stage.textContent=stageDescription(id,comparison?condition:progress,comparison?progress:1);position.textContent=comparison?` ${timeline.label} ${Math.floor(progress*timeline.steps/timeline.stride)*timeline.stride} / ${timeline.steps}`.trim():`${index+1} / 5`;
      presets.forEach(button=>button.setAttribute('aria-pressed',String(Math.abs(Number(button.dataset.frame)-(comparison?condition:progress))<.001)));
    }
    function stop() {
      running=false;cancelAnimationFrame(raf);
      play.textContent=progress>=1?'Replay':'Continue';
      play.setAttribute('aria-label',`${play.textContent} animation: ${figures[id].title}`);
    }
    function tick(now:number) {
      if(!running)return;
      const elapsed=Math.min(80,now-last);last=now;
      progress=Math.min(1,progress+elapsed/duration);
      if(now-painted>45||progress===1){draw(progress);painted=now;}
      if(progress===1)stop();else raf=requestAnimationFrame(tick);
    }
    function start() {
      seen=true;
      if(preference.matches){stop();draw(progress>=1?0:Math.min(1,progress+.25),true);return;}
      if(progress>=1)draw(0);
      running=true;last=performance.now();play.textContent='Pause';
      play.setAttribute('aria-label',`Pause animation: ${figures[id].title}`);
      raf=requestAnimationFrame(tick);
    }
    play.addEventListener('click',()=>{seen=true;if(running)stop();else start();});
    next.addEventListener('click',()=>{seen=true;stop();const steps=comparison?timeline.steps/timeline.next:4;draw(progress>=1?0:Math.min(1,(Math.floor(progress*steps+1e-8)+1)/steps),true);stop();});
    reset.addEventListener('click',()=>{seen=true;stop();draw(1,true);stop();});
    presets.forEach(button=>button.addEventListener('click',()=>{seen=true;stop();if(comparison){condition=Number(button.dataset.frame);draw(1,true);}else draw(Number(button.dataset.frame),true);stop();}));
    let observer:IntersectionObserver|undefined;
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{
        const inView=entries[0].isIntersecting;
        if(!inView)stop();
        else if(!seen&&!preference.matches&&!document.hidden)start();
      },{threshold:.35});
      observer.observe(root);
    }
    const changed=()=>{stop();play.hidden=preference.matches;if(preference.matches)draw(1);};
    const visibility=()=>{if(document.hidden)stop();};
    const print=()=>{stop();draw(1);stop();};
    preference.addEventListener('change',changed);
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('beforeprint',print);
    window.addEventListener('pagehide',event=>{
      stop();if(!event.persisted){observer?.disconnect();preference.removeEventListener('change',changed);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('beforeprint',print);}
    });
  });
}
