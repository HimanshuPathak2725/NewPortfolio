import {initArticleAnimations} from './animations';
import {initArchitectureMotion} from './architecture-motion';
export function initLearningHub(){
 const element=document.querySelector<HTMLElement>('[data-world-models-hub]');if(!element)return;
 const hub=element;
 initArticleAnimations();
 initArchitectureMotion();
 const chapterLinks=Array.from(hub.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]'));
 const headings=chapterLinks.map(link=>document.getElementById(link.dataset.chapterLink!)).filter((element):element is HTMLElement=>Boolean(element));
 let scheduled=false;
 function updateLocation(){scheduled=false;let current=headings[0];for(const heading of headings){if(heading.getBoundingClientRect().top<=160)current=heading;else break;}chapterLinks.forEach(link=>{if(link.dataset.chapterLink===current?.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
 window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateLocation);}},{passive:true});
 updateLocation();
 const filters=hub.querySelector<HTMLElement>('.wm-resource-filters');
 if(filters){filters.hidden=false;const buttons=Array.from(filters.querySelectorAll<HTMLButtonElement>('[data-resource-filter]'));
  buttons.forEach(button=>button.addEventListener('click',()=>{const group=button.dataset.resourceFilter;hub.querySelectorAll<HTMLElement>('[data-resource-group]').forEach(resource=>resource.hidden=group!=='all'&&resource.dataset.resourceGroup!==group);buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));}));
 }
}
