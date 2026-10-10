/** A finite, interruptible walkthrough. The complete SVG is the no-JS default. */
export function initArchitectureMotion(){
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll<HTMLElement>('[data-architecture-scene]').forEach(root=>{
  if(root.dataset.archInitialized)return;root.dataset.archInitialized='true';
  const steps:string[]=JSON.parse(root.dataset.steps??'[]');
  const play=root.querySelector<HTMLButtonElement>('[data-arch-play]')!,next=root.querySelector<HTMLButtonElement>('[data-arch-next]')!,all=root.querySelector<HTMLButtonElement>('[data-arch-all]')!;
  const explanation=root.querySelector<HTMLElement>('[data-arch-explanation]')!,count=root.querySelector<HTMLElement>('[data-arch-count]')!;
  const units=Array.from(root.querySelectorAll<SVGGElement>('[data-arch-unit]'));
  const routes=Array.from(root.querySelectorAll<SVGPathElement>('[data-arch-path]')).map(path=>({path,packet:path.parentElement!.querySelector<SVGCircleElement>('[data-arch-packet]')!,step:Number(path.parentElement!.dataset.step)}));
  let step=-1,running=false,frame=0,last=0,elapsed=0,started=false,visible=false;
  const duration=6500;
  root.querySelector<HTMLElement>('.wm-architecture-controls')!.hidden=false;
  function paint(){
   units.forEach(unit=>{unit.style.opacity=step<0||Number(unit.dataset.step)<=step?'1':'.24';});
   explanation.textContent=step<0?root.dataset.intro!:steps[step];
   count.textContent=step<0?'Complete figure':`${step+1} / ${steps.length}`;
   play.textContent=running?'Pause Ⅱ':step<0?'Trace computation ▶':'Continue ▶';
   play.setAttribute('aria-label',running?'Pause architecture walkthrough':'Play architecture walkthrough');
   routes.forEach(({packet})=>packet.setAttribute('opacity','0'));
  }
  function pause(){running=false;cancelAnimationFrame(frame);frame=0;last=0;paint();}
  function complete(){pause();step=-1;elapsed=0;paint();}
  function tick(now:number){
   if(!running)return;
   if(last)elapsed+=Math.min(now-last,100);last=now;
   if(elapsed>=duration){elapsed=0;step++;if(step>=steps.length){complete();return;}paint();}
   if(!preference.matches){
    const p=(elapsed%1800)/1800;
    for(const route of routes){
     // CSS hides one composition. Read only visible paths, once per active frame.
     if(route.step!==step||!route.path.getClientRects().length){route.packet.setAttribute('opacity','0');continue;}
     const point=route.path.getPointAtLength(route.path.getTotalLength()*p);
     route.packet.setAttribute('cx',String(point.x));route.packet.setAttribute('cy',String(point.y));route.packet.setAttribute('opacity',String(Math.sin(Math.PI*p)));
    }
   }
   frame=requestAnimationFrame(tick);
  }
  function start(){if(document.hidden)return;started=true;if(step<0){step=0;elapsed=0;}running=true;last=0;paint();frame=requestAnimationFrame(tick);}
  const onPlay=()=>{explanation.setAttribute('aria-live','off');running?pause():start();};
  const onNext=()=>{pause();explanation.setAttribute('aria-live','polite');started=true;step=(step+1)%steps.length;elapsed=0;paint();};
  const onAll=()=>{explanation.setAttribute('aria-live','polite');started=true;complete();};
  const onPreference=()=>{if(preference.matches)complete();};
  const onVisibility=()=>{if(document.hidden)pause();};
  play.addEventListener('click',onPlay);next.addEventListener('click',onNext);all.addEventListener('click',onAll);
  preference.addEventListener('change',onPreference);document.addEventListener('visibilitychange',onVisibility);
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(!visible&&running)pause();
   else if(visible&&!started&&!preference.matches)start();
  },{threshold:.2}):null;
  observer?.observe(root);
  function cleanup(){pause();observer?.disconnect();preference.removeEventListener('change',onPreference);document.removeEventListener('visibilitychange',onVisibility);play.removeEventListener('click',onPlay);next.removeEventListener('click',onNext);all.removeEventListener('click',onAll);delete root.dataset.archInitialized;}
  window.addEventListener('pagehide',event=>{if(event.persisted)pause();else cleanup();});
 });
}
