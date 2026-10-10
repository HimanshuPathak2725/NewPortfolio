import {architectureScenes,type ArchNode,type ArchScene,type Tone} from './architecture-scenes';
import {architectureDiagrams,type ArchitectureId} from './architecture-diagrams';
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const colors:Record<Tone,string>={blue:'#527e9c',green:'#358473',orange:'#b77751',purple:'#82719c'};
const color=(tone:Tone)=>`var(--wm-${tone},${colors[tone]})`;
const P=(d:string,stroke='currentColor',width=1.6,extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const R=(x:number,y:number,w:number,h:number,opacity=.2,fill='currentColor')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="${opacity}"/>`;
const C=(x:number,y:number,r:number,opacity=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" opacity="${opacity}"/>`;
function lines(s:string,limit:number){const out:string[]=[];let line='';for(const word of s.split(' ')){if(line&&(line+' '+word).length>limit){out.push(line);line=word;}else line=(line+' '+word).trim();}if(line)out.push(line);return out;}
function text(x:number,y:number,s:string[],cls='arch-label',anchor='middle'){return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${s.map((v,i)=>`<tspan x="${x}" dy="${i?(cls==='arch-detail'?18:23):0}">${esc(v)}</tspan>`).join('')}</text>`;}
function image(mask=false,video=false){
 let s=video?P('M-41 -33H49V28M-45 -29H45V32',color('blue'),1):'';
 s+=R(-45,-25,86,62,1,'var(--wm-scene,#dce5dc)')+`<path d="M-45 37L-13 -2H41V37Z" fill="var(--wm-scene-floor,#bfcfc2)"/>`;
 s+=P('M-13 -25V-2L-45 37M-13 -2H41',color('blue'),.8);
 s+=`<ellipse cx="12" cy="23" rx="14" ry="4" fill="${color('green')}" opacity=".3"/><circle cx="10" cy="12" r="12" fill="${color('orange')}"/><circle cx="6" cy="8" r="3" fill="#e6b394"/>`;
 if(mask)for(const [x,y]of [[-43,-23],[-15,-23],[13,5]])s+=R(x,y,26,26,.94,'var(--wm-paper,#fef9ed)')+P(`M${x} ${y}h26v26h-26Z`,color('blue'),.7);
 return s;
}
function grid(distribution=false,offset=0){let s='';for(let row=0;row<4;row++)for(let col=0;col<5;col++){const selected=(row*3+offset)%5;s+=R(-34+col*14,-27+row*14,11,11,distribution?.12+.65/(1+Math.abs(col-selected)):col===selected?.9:.13);}return s;}
function art(node:ArchNode){
 let s='';const kind=node.art;
 if(kind==='image'||kind==='video'||kind==='mask')return image(kind==='mask',kind==='video');
 if(kind==='encoder'||kind==='decoder'){
  for(let i=0;i<4;i++){const j=kind==='decoder'?3-i:i,h=66-j*11,x=-36+i*20,y=-h/2;s+=`<path d="M${x} ${y}l13 -7v${h}l-13 7Z" fill="currentColor" fill-opacity="${.12+i*.09}" stroke="currentColor"/>`;for(let k=1;k<4;k++)s+=P(`M${x} ${y+h*k/4}l13 -7`,'currentColor',.6);}
 }else if(kind==='memory'){
  for(let i=0;i<12;i++)s+=R(-42+i*7,-14,5,29,.2+(i*7%11)/14);
  s+=P('M-44 23H44','currentColor',.8);
 }else if(kind==='distribution'){
  if(node.symbol==='scalar'){
   s+=P('M-42 30H44M-42 30V-30','currentColor',.7)+P('M-38 28C-22 28 -17 -23 0 -23S19 28 39 28','currentColor',2);
  }else if(node.symbol==='pv'){
   for(let i=0;i<4;i++){const h=[12,29,43,18][i];s+=R(-40+i*13,25-h,9,h,.3+i*.15);}
   s+=`<text x="31" y="8" class="arch-symbol">v</text>`;
  }else s+=grid(true,2);
 }else if(kind==='state'){
  for(let i=0;i<12;i++)s+=R(-34+i*6,-36,4,13,.2+(i*7%11)/14,color('blue'));
  s+=node.symbol==='gaussian'?P('M-35 35C-15 35 -16 -4 0 -4S17 35 35 35','currentColor',2):`<g transform="translate(0 15)">${grid(false,1)}</g>`;
 }else if(kind==='masked-tokens'){
  for(let row=0;row<4;row++)for(let col=0;col<5;col++){const filled=(row+col)%3===0;s+=R(-34+col*14,-27+row*14,11,11,filled?.8:.08)+(!filled?P(`M${-34+col*14} ${-27+row*14}h11v11h-11Z`,'currentColor',.6):'');}
 }else if(kind==='tokens'){
  s+=grid(node.symbol==='dense',3);
 }else if(kind==='sequence'){
  for(let i=0;i<8;i++){const action=node.symbol!=='text'&&(i===3||i===7);s+=R(-48+i*12,-12,9,25,action?.8:.18+(i%3)*.15,action?color('orange'):node.symbol==='text'?color('blue'):color('green'));}
  s+=P('M-47 24H45','currentColor',.8);
 }else if(kind==='transformer'){
  const labels=node.symbol==='st'?['spatial attn','causal temporal','feed-forward']:node.symbol==='dit'?['3D self-attn','text cross-attn','MLP']:node.symbol==='vit'?['self-attention','feed-forward','residual + norm']:node.symbol==='ac'?['block-causal attn','feed-forward','residual + norm']:['causal attn','feed-forward','residual + norm'];
  for(let i=0;i<3;i++){const y=-34+i*25;s+=`<path d="M-43 ${y+6}l13 -6h72l-13 6Z" fill="currentColor" fill-opacity="${.12+i*.12}" stroke="currentColor" stroke-width=".8"/>`;s+=`<text x="0" y="${y+18}" text-anchor="middle" class="arch-mini">${labels[i]}</text>`;}
 }else if(kind==='mlp'){
  s+=`<path d="M-38 -25L36 -14V14L-38 25Z" fill="currentColor" fill-opacity=".12" stroke="currentColor"/>`;
  s+=`<text x="0" y="5" text-anchor="middle" class="arch-symbol">${esc(node.symbol??'fθ')}</text>`;
 }else if(kind==='loss'&&(node.symbol==='Rλ'||node.symbol==='J')){
  s+=`<text x="0" y="16" text-anchor="middle" fill="currentColor" font-family="Georgia,serif" font-size="49">Σ</text>`;
  s+=P('M-40 -23H-24M-40 0H-24M-40 23H-24M24 0H42','currentColor',1.2);
 }else if(kind==='loss'){
  s+=P('M-36 -22V25H36','currentColor',1);
  s+=P('M-28 -15Q-5 46 28 -16','currentColor',1.8)+C(4,13,3);
  s+=`<text x="24" y="-10" text-anchor="middle" class="arch-symbol">${esc(node.symbol??'L')}</text>`;
 }else if(kind==='policy'){
  for(let i=0;i<5;i++){const h=[12,23,43,28,9][i];s+=R(-37+i*16,25-h,11,h,i===2?.9:.3);}
  s+=P('M-42 30H40','currentColor',1);
 }else if(kind==='tree'){
  for(const [x,y,parentX,parentY]of [[-27,0,0,-27],[27,0,0,-27],[-42,28,-27,0],[-13,28,-27,0],[13,28,27,0],[42,28,27,0]])s+=P(`M${parentX} ${parentY}L${x} ${y}`,'currentColor',1.4)+C(x,y,3);
  s+=C(0,-27,5);
 }else if(kind==='trajectories'||kind==='elites'){
  s+=P('M-43 33H45M-43 33V-32','currentColor',.7);
  for(let i=0;i<7;i++){const y=-31+i*9;s+=P(`M-35 25C-17 ${15-i*8} 18 ${y-12} 40 ${y}`,'currentColor',i===2?2.8:1,`opacity="${kind==='elites'&&i!==2&&i!==3?.1:i===2?1:.38}"`);}
  s+=C(-35,25,3);
 }else if(kind==='robot'){
  s+=P('M-44 33H43M-26 29L-11 -3L14 -27L38 -10M31 -15L28 -4M38 -10L44 -3','currentColor',3);
  for(const [x,y]of [[-26,29],[-11,-3],[14,-27]])s+=C(x,y,5);
  s+=R(22,16,18,16,.3);
 }else if(kind==='noise'){
  for(let row=0;row<7;row++)for(let col=0;col<10;col++)s+=R(-40+col*8,-28+row*8,7,7,.15+((row*17+col*31)%19)/24);
 }else if(kind==='flow'){
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){const x=-39+col*15,y=-28+row*17,dy=Math.round(5*Math.sin(col+row));s+=P(`M${x} ${y}l10 ${dy}m-4 ${-3-dy}l4 ${3+dy}l-5 2`,'currentColor',1);}
 }
 return s;
}
export const architectureArtStyles=`
.wm-arch-svg {color:var(--wm-ink,#263b43);overflow:visible}
.wm-arch-svg .arch-label {font:20px 'Newsreader Variable',Georgia,serif;fill:var(--wm-ink,#263b43)}
.wm-arch-svg .arch-detail {font:14px 'Inter Variable',Arial,sans-serif;fill:var(--wm-muted,#626f70)}
.wm-arch-svg .arch-mini {font:10px 'Inter Variable',Arial,sans-serif;fill:currentColor}
.wm-arch-svg .arch-symbol {font:18px Georgia,serif;fill:currentColor}
.wm-arch-svg .arch-label,.wm-arch-svg .arch-detail {paint-order:stroke;stroke:var(--wm-paper,#fef9ed);stroke-width:4px;stroke-linejoin:round}
.wm-arch-svg [data-arch-unit] {transition:opacity .35s ease}
@media(prefers-reduced-motion:reduce){.wm-arch-svg [data-arch-unit]{transition:none}}
`;
export function sceneDimensions(scene:ArchScene,compact=false){return {width:compact?440:1040,height:Math.max(...scene.nodes.map(n=>(compact?n.mobile:n.at)[1]))+155};}
export function renderArchitectureScene(scene:ArchScene,compact=false,exported=false){
 const {width,height}=sceneDimensions(scene,compact),key=`arch-${scene.id}-${compact?'mobile':'desktop'}${exported?'-export':''}`;
 const title=`${key}-title`,desc=`${key}-desc`;
 let body='<defs>'+Object.entries(colors).map(([tone])=>`<marker id="${key}-${tone}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">${P('M0 1L7 4L0 7',color(tone as Tone),1.4)}</marker>`).join('')+'</defs>';
 for(const edge of scene.edges){
  const from=scene.nodes.find(n=>n.id===edge.from)!,to=scene.nodes.find(n=>n.id===edge.to)!;
  const [x,y]=compact?from.mobile:from.at,[tx,ty]=compact?to.mobile:to.at;
  let d=compact?edge.mobilePath:edge.path;
  if(!d){if(y===ty){const dir=tx>x?1:-1;d=`M${x+dir*50} ${y}H${tx-dir*50}`;}
   else if(ty>y){const fromNames=lines(from.title,18).length,fromDetails=lines(from.detail,compact?23:25).length;
    const bottom=y+56+fromNames*23+fromDetails*18+10,top=ty-44;
    const mid=(bottom+top)/2;
    d=`M${x} ${bottom}V${mid}H${tx}V${top}`;
   }else{const side=x<width/2?18:width-18;d=`M${x+(side<x?-50:50)} ${y}H${side}V${ty}H${tx+(side<tx?-50:50)}`;}
  }
  const tone=edge.tone??'green';
  const pattern=edge.relation==='supervision'?'2 4':edge.relation==='parameter'?'8 3 2 3':edge.dash?'8 5':'';
  body+=`<g data-arch-unit="" data-step="${edge.step}" class="arch-connection">${P(d,color(tone),1.7,`data-arch-path="" marker-end="url(#${key}-${tone})" ${pattern?`stroke-dasharray="${pattern}"`:''}`)}<circle data-arch-packet="" r="3.5" fill="${color(tone)}" opacity="0"/></g>`;
 }
 for(const node of scene.nodes){const [x,y]=compact?node.mobile:node.at,names=lines(node.title,18),details=lines(node.detail,compact?23:25);
  body+=`<g data-arch-unit="" data-step="${node.step}" data-node="${node.id}" style="color:${color(node.tone)}"><g transform="translate(${x} ${y})">${art(node)}</g>${text(x,y+62,names)}${text(x,y+62+names.length*23,details,'arch-detail')}</g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" class="wm-arch-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${title} ${desc}"><title id="${title}">${esc(scene.title)}</title><desc id="${desc}">${esc(scene.intro+' '+scene.steps.join(' ')+' '+scene.footnote)}</desc><style>${architectureArtStyles}</style>${body}</svg>`;
}
/** A complete, portable SVG export with all scenes and their explanatory labels. */
export function renderArchitectureSvg(id:ArchitectureId){
 const scenes=architectureScenes[id],meta=architectureDiagrams[id];let y=120,body='';
 for(const scene of scenes){const height=sceneDimensions(scene).height;
  body+=text(25,y,lines(scene.title,90),'arch-label','start')+text(25,y+30,lines(scene.intro,125),'arch-detail','start');
  body+=`<svg x="0" y="${y+55}" width="1040" height="${height}">${renderArchitectureScene(scene,false,true).replace(/^<svg[^>]*>/,'<g>').replace(/<\/svg>$/,'</g>')}</svg>`;
  y+=height+90;
  if(scene.equation){for(const line of lines(scene.equation,90)){body+=text(25,y,[line],'arch-label','start');y+=28;}y+=12;}
  for(const line of lines(scene.footnote,126)){body+=text(25,y,[line],'arch-detail','start');y+=20;}
  y+=60;
 }
 const sources=meta.sources.map(s=>`${s.title}: ${s.url}`).join(' | ');
 body+=text(25,y,['Primary sources'],'arch-label','start');y+=35;
 for(const source of meta.sources){body+=`<a href="${esc(source.url)}">${text(25,y,[source.title],'arch-detail','start')}</a>`;y+=26;}
 return `<svg xmlns="http://www.w3.org/2000/svg" class="wm-arch-svg" viewBox="0 0 1040 ${y+45}" role="img" aria-labelledby="export-${id}-title"><title id="export-${id}-title">${esc(meta.title)}</title><metadata>${esc(sources)}</metadata><style>${architectureArtStyles}</style><rect width="1040" height="${y+45}" fill="#fef9ed"/>${text(25,42,lines(meta.title,85),'arch-label','start')}${body}</svg>`;
}
