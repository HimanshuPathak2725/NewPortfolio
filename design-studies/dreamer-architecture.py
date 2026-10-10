"""Original static art-direction study, not a benchmark or a live simulation.
Run from the project root; writes a standalone, accessible SVG beside this file.
Model paths checked against DreamerV3 agent.py and rssm.py (2026-10-10).
"""
from pathlib import Path
from html import escape

OUT = Path(__file__).with_name('dreamer-architecture.svg')
INK, MUTED, BLUE, GREEN, RUST, PURPLE, PAPER = '#233d43', '#626f70', '#527e9c', '#358473', '#ba7150', '#82719c', '#fdfaf2'
parts = []

def text(x, y, value, size=18, color=INK, anchor='start', serif=False):
    family = 'Georgia, serif' if serif else 'Arial, sans-serif'
    parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="{family}" font-size="{size}" text-anchor="{anchor}">{escape(value)}</text>')

def path(d, color=MUTED, width=1.6, dash='', arrow=False):
    marker = f' marker-end="url(#arrow-{color[1:]})"' if arrow else ''
    parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="{dash}"{marker}/>')

def rect(x, y, w, h, color, opacity=1, stroke='none'):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}" fill-opacity="{opacity}" stroke="{stroke}"/>')

def circle(x,y,r,color,opacity=1):
    parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" fill-opacity="{opacity}"/>')

def observation(x,y,scale=1,shift=0):
    parts.append(f'<g transform="translate({x} {y}) scale({scale})">')
    rect(0,0,110,80,'#e4e8e2')
    parts.append('<path d="M0 80L38 33H110V80Z" fill="#cad6ce"/>')
    path('M38 0V33L0 80M38 33H110', '#a6bbb0', 1)
    parts.append(f'<ellipse cx="{68+shift}" cy="62" rx="16" ry="5" fill="#92a599" opacity=".3"/>')
    circle(66+shift,49,13,RUST)
    circle(62+shift,45,4,'#e4b396',.8)
    path('M13 61H33M23 51V71', BLUE, 2)
    parts.append('</g>')

def encoder(x,y,reverse=False):
    for i in range(4):
        j=3-i if reverse else i
        h=78-j*14
        xx=x+i*18
        yy=y-h/2
        parts.append(f'<path d="M{xx} {yy}l13 -8v{h}l-13 8Z" fill="{BLUE}" fill-opacity="{.12+i*.09}" stroke="{BLUE}" stroke-width="1.2"/>')
        for k in range(1,4):
            path(f'M{xx} {yy+h*k/4}l13 -8',BLUE,.6)

def categories(x,y,color=GREEN,seed=0,small=False,hard=True):
    cell=8 if small else 12
    gap=3
    for row in range(4):
        for col in range(5):
            selected=(row*3+seed)%5
            opacity=(.9 if col==selected else .13) if hard else .15+.62/(1+abs(col-selected))
            rect(x+col*(cell+gap), y+row*(cell+gap), cell, cell, color, opacity)

def memory(x,y,width=76):
    for i in range(10):
        rect(x+i*width/10,y,width/10-2,20,BLUE,.25+((i*7)%10)/16)

def latent(x,y,seed=0):
    memory(x-29,y-30,54)
    categories(x-26,y+3,GREEN,seed,True)

def module(x,y,label,color=BLUE):
    parts.append(f'<path d="M{x-30} {y-21}L{x+29} {y-12}V{y+12}L{x-30} {y+21}Z" fill="{color}" fill-opacity=".12" stroke="{color}" stroke-width="1.4"/>')
    text(x,y+5,label,14,color,'middle')

def section(y,index,title,subtitle):
    text(50,y,index,15,RUST)
    text(90,y,title,28,INK,serif=True)
    text(90,y+28,subtitle,16,MUTED)

text(50,40,'ARCHITECTURE STUDY  /  DREAMERV3',13,MUTED)
text(50,92,'Learning a world. Learning to act inside it.',40,INK,serif=True)
text(50,128,'State inference, model objectives, and imagined behavior shown as separate computations.',19,MUTED)
for x,color,label in [(50,BLUE,'Observed data / deterministic memory'),(445,GREEN,'Learned latent state / predictions'),(840,RUST,'Actions / behavior learning')]:
    circle(x+5,164,4,color)
    text(x+19,170,label,15,MUTED)
path('M50 193H1350','#d9ded6',1)

section(235,'01','Learn the dynamics from experience','One observed step. The posterior sees the image; the prior must predict without it.')

# Data flow is drawn first so module artwork and labels remain legible.
path('M185 326H262',BLUE,arrow=True)
path('M335 326H452',BLUE,arrow=True)
path('M536 326H680',GREEN,arrow=True)
path('M490 345V468',BLUE,arrow=True)
path('M542 326H603Q618 326 618 341V432Q618 448 634 448H729V470',BLUE,arrow=True)
path('M170 505H248',BLUE,arrow=True)
path('M325 505H445',BLUE,arrow=True)
path('M525 505H690',GREEN,arrow=True)
path('M770 505H888V412H1026',GREEN,arrow=True)
path('M888 505V512H1026',GREEN,arrow=True)
path('M888 512V609H1026',GREEN,arrow=True)
path('M1110 412H1210',GREEN,arrow=True)
path('M1110 512H1210',GREEN,arrow=True)
path('M1110 609H1210',GREEN,arrow=True)

text(60,296,'Previous step',17,INK,serif=True)
text(60,332,'hₜ₋₁, zₜ₋₁, aₜ₋₁',19,INK,serif=True)
module(300,326,'fθ')
text(300,376,'Recurrent transition',17,INK,'middle',True)
memory(452,315)
text(490,295,'hₜ',24,BLUE,'middle',True)
text(510,382,'memory',15,MUTED)
categories(685,300,GREEN,2,hard=False)
text(720,286,'Prior pθ(zₜ | hₜ)',20,GREEN,'middle',True)
text(802,315,'Predicts the latent',15,MUTED)
text(802,337,'before seeing oₜ.',15,MUTED)

observation(60,464)
text(115,574,'Observation oₜ',21,INK,'middle',True)
text(115,599,'from replay',15,MUTED,'middle')
encoder(250,505)
text(290,574,'Visual encoder',21,INK,'middle',True)
text(290,599,'pixels → features eₜ',15,MUTED,'middle')
categories(454,478,GREEN,4,hard=False)
text(490,574,'Posterior qθ',21,INK,'middle',True)
text(490,599,'zₜ ∼ qθ(zₜ | hₜ, eₜ)',17,GREEN,'middle',True)
latent(729,504,4)
text(729,574,'Model state sₜ',21,INK,'middle',True)
text(729,599,'[hₜ, zₜ]',18,GREEN,'middle',True)
text(628,632,'z is a collection of categorical variables.',14,MUTED)
text(628,653,'The small grid is illustrative, not its tensor size.',14,MUTED)

encoder(1030,412,True)
text(1070,353,'Observation decoder',18,INK,'middle',True)
observation(1220,375,.85)
text(1267,466,'reconstruction ôₜ',14,MUTED,'middle')
module(1070,512,'r̂',GREEN)
text(1070,479,'Reward head',18,INK,'middle',True)
path('M1225 532H1320M1225 532V492','#bdc8bf',1)
path('M1229 530C1244 530 1250 499 1267 499S1295 530 1317 530',GREEN,2)
text(1267,556,'reward prediction',14,MUTED,'middle')
module(1070,609,'ĉ',GREEN)
text(1070,578,'Continue head',18,INK,'middle',True)
rect(1225,599,94,15,GREEN,.14)
rect(1225,599,70,15,GREEN,.8)
text(1267,648,'continuation probability',14,MUTED,'middle')

path('M50 692H1350','#d9ded6',1)
text(50,725,'TRAINING SIGNALS',12,MUTED)
text(240,725,'Reconstruction + reward + continuation losses',20,INK,serif=True)
text(240,759,'Dynamics: KL[sg(q) ‖ p]',20,PURPLE,serif=True)
text(650,759,'Representation: KL[q ‖ sg(p)]',20,PURPLE,serif=True)
text(240,786,'sg stops the gradient. KL balancing uses opposite stop-gradient directions; free-nats clipping is omitted here.',14,MUTED)

section(852,'02','Imagine trajectories, then improve the actor and critic','Start from an inferred state. Future steps use the prior and actions sampled from the policy.')

for i,x in enumerate([150,460,770,1080]):
    latent(x,995,i+1)
    text(x,1072,['sₜ','sₜ₊₁','sₜ₊₂','… sₜ₊H'][i],23,GREEN,'middle',True)
    if i<3:
        path(f'M{x+37} 995H{x+112}',GREEN,arrow=True)
        module(x+153,995,'fθ + pθ',GREEN)
        path(f'M{x+188} 995H{x+270}',GREEN,arrow=True)
        path(f'M{x} 960V938',RUST,arrow=True)
        text(x,927,'π(a | s)',20,RUST,'middle',True)
        path(f'M{x+38} 924H{x+153}V967',RUST,arrow=True)
        text(x+126,913,['aₜ','aₜ₊₁','aₜ₊₂'][i],19,RUST,'middle',True)
    path(f'M{x} 1088V1105',GREEN,arrow=True)
    text(x,1133,'r̂, ĉ, Vψ(s)',19,INK,'middle',True)
    path(f'M{x} 1147V1170',GREEN)
path('M150 1170H1080',GREEN)
path('M615 1170V1195',GREEN,arrow=True)
text(615,1225,'λ-return targets',25,INK,'middle',True)
path('M505 1216H395',RUST,arrow=True)
path('M725 1216H835',PURPLE,arrow=True)
text(290,1223,'Actor objective',23,RUST,'middle',True)
text(290,1252,'advantage-weighted log π + entropy',15,MUTED,'middle')
text(970,1223,'Critic objective',23,PURPLE,'middle',True)
text(970,1252,'fit return targets; slow-value regularization',15,MUTED,'middle')
text(1245,967,'Shared model',17,INK,'middle',True)
text(1245,993,'parameters across',14,MUTED,'middle')
text(1245,1014,'imagined steps.',14,MUTED,'middle')
text(1245,1047,'No new camera',14,MUTED,'middle')
text(1245,1068,'frames enter here.',14,MUTED,'middle')

path('M50 1293H1350','#d9ded6',1)
text(50,1330,'03',15,RUST)
text(90,1330,'Act in the environment',25,INK,serif=True)
text(90,1360,'new observation → update posterior state → sample actor action → environment → next observation',18,INK)
text(90,1388,'The observation decoder supports learning; the deployed actor chooses actions from the inferred state.',15,MUTED)
path('M50 1420H1350','#d9ded6',1)
text(50,1452,'Original explanatory artwork • Feature grids and scenes are schematic • Loss weights, normalizers and layer widths omitted.',14,MUTED)
text(50,1476,'Sources: DreamerV3 project; official agent.py (loss, imag_loss, policy); rssm.py (observe, imagine, loss). Checked 10 Oct 2026.',13,MUTED)

defs=''.join(f'<marker id="arrow-{c[1:]}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 1L7 4L0 7" fill="none" stroke="{c}" stroke-width="1.2"/></marker>' for c in [MUTED,BLUE,GREEN,RUST,PURPLE])
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1510" role="img" aria-labelledby="title description">
<title id="title">DreamerV3: state learning, imagined behavior, and deployment</title>
<desc id="description">Detailed art-direction study. Recurrent memory feeds both the categorical prior and observation-conditioned posterior. The posterior sample and memory form the state used by observation, reward, and continuation heads. Balanced KL terms train prior and posterior with separate stop-gradient directions. Imagined trajectories use the prior and actor, and predicted rewards, continuation, and critic values supply lambda-return targets. The deployed actor uses the inferred state. Illustrative dimensions and scenes, not a model output or measurement.</desc>
<metadata>Sources: https://danijar.com/project/dreamerv3/ https://github.com/danijar/dreamerv3/blob/main/dreamerv3/agent.py https://github.com/danijar/dreamerv3/blob/main/dreamerv3/rssm.py</metadata>
<defs>{defs}</defs><rect width="1400" height="1510" fill="{PAPER}"/>{''.join(parts)}</svg>'''
OUT.write_text(svg)
print(OUT)
