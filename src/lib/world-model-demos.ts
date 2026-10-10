import { discountedReturn, routeRewards, routes, simulatePrediction } from './world-models';

function button(label: string) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'world-button';
  element.textContent = label;
  return element;
}

function output() {
  const element = document.createElement('output');
  element.className = 'world-live';
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'true');
  return element;
}

function playback(
  figure: HTMLElement,
  controls: HTMLElement,
  last: () => number,
  render: (step: number) => void,
  initial = 0,
) {
  let step = initial;
  let timer: number | undefined;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const actions = document.createElement('div');
  actions.className = 'world-actions';
  const play = button('Play');
  play.setAttribute('aria-pressed', 'false');
  const next = button('Step');
  const reset = button('Reset');
  const note = document.createElement('p');
  note.className = 'world-motion-note';
  note.textContent = 'Reduced motion is enabled. Use Step to explore each state.';
  actions.append(play, next, reset);
  controls.append(actions, note);

  function paint() {
    render(step);
    next.disabled = step >= last();
  }

  function pause() {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    play.textContent = 'Play';
    play.setAttribute('aria-pressed', 'false');
  }

  function updatePreference() {
    pause();
    play.disabled = reduced.matches;
    note.hidden = !reduced.matches;
  }

  play.addEventListener('click', () => {
    if (timer !== undefined) { pause(); return; }
    if (reduced.matches) return;
    if (step >= last()) step = 0;
    paint();
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    timer = window.setInterval(() => {
      step = Math.min(step + 1, last());
      paint();
      if (step >= last()) pause();
    }, 800);
  });
  next.addEventListener('click', () => { pause(); step = Math.min(step + 1, last()); paint(); });
  reset.addEventListener('click', () => { pause(); step = 0; paint(); });
  reduced.addEventListener('change', updatePreference);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => !entry.isIntersecting)) pause();
    });
    observer.observe(figure);
    window.addEventListener('pagehide', () => observer.disconnect());
    window.addEventListener('pageshow', (event) => { if (event.persisted) observer.observe(figure); });
  }
  updatePreference();
  paint();
  return {
    setStep(value: number) { pause(); step = Math.max(0, Math.min(value, last())); paint(); },
  };
}

function loop(figure: HTMLElement, svg: SVGSVGElement, controls: HTMLElement) {
  const stages = [
    ['Observe', 'Read the real environment. A camera image is evidence, and it may show only part of the state.'],
    ['Encode', 'Build a representation from the observation and available history. Retain information needed to predict outcomes.'],
    ['Predict', 'Condition on a proposed action and imagine a next state. No real-world action has been taken yet.'],
    ['Score', 'Use a reward, goal, or value estimate to evaluate the imagined outcome. Prediction alone does not define the objective.'],
    ['Act and check', 'Execute a real action, observe its outcome, and compare it with the prediction. New evidence can correct the state estimate.'],
  ];
  const status = output();
  controls.append(status);
  playback(figure, controls, () => stages.length - 1, (step) => {
    stages.forEach((_, index) => svg.querySelector(`#wm-loop-node-${index}`)?.classList.toggle('is-current', index === step));
    status.textContent = `${step + 1} / ${stages.length} · ${stages[step][0]}. ${stages[step][1]}`;
  });
}

function planning(figure: HTMLElement, svg: SVGSVGElement, controls: HTMLElement) {
  let routeKey = 'safe';
  const label = document.createElement('label');
  label.className = 'world-field';
  label.textContent = 'Choose an imagined route';
  const select = document.createElement('select');
  select.className = 'world-select';
  for (const [key, route] of Object.entries(routes)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = route.label;
    select.append(option);
  }
  select.value = routeKey;
  label.append(select);
  const scores = document.createElement('ul');
  scores.className = 'world-scores';
  for (const [key, route] of Object.entries(routes)) {
    const item = document.createElement('li');
    item.dataset.route = key;
    item.textContent = `${route.label}: ${discountedReturn(routeRewards(route.cells)).toFixed(2)}`;
    scores.append(item);
  }
  const status = output();
  controls.append(label, scores, status);
  const player = playback(figure, controls, () => routes[routeKey].cells.length - 1, (step) => {
    const route = routes[routeKey];
    const [x, y] = route.cells[step];
    svg.querySelector('#wm-plan-agent')?.setAttribute('transform', `translate(${140 + x * 88} ${70 + y * 80})`);
    const path = route.cells.slice(0, step + 1).map(([column, row], index) => `${index === 0 ? 'M' : 'L'}${140 + column * 88} ${70 + row * 80}`).join(' ');
    svg.querySelector('#wm-plan-path')?.setAttribute('d', path);
    scores.querySelectorAll<HTMLElement>('[data-route]').forEach((item) => {
      item.dataset.selected = String(item.dataset.route === routeKey);
    });
    const rewards = routeRewards(route.cells);
    const current = discountedReturn(rewards.slice(0, step)).toFixed(2);
    const total = discountedReturn(rewards).toFixed(2);
    status.textContent = `Imagined step ${step} / ${route.cells.length - 1}. Position (${x}, ${y}). Discounted reward so far: ${current}. Full-route predicted return: ${total}.`;
  });
  select.addEventListener('change', () => { routeKey = select.value; player.setStep(0); });
}

function range(labelText: string, min: number, max: number, value: number) {
  const label = document.createElement('label');
  label.className = 'world-field';
  const text = document.createElement('span');
  text.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = String(value);
  input.setAttribute('aria-label', labelText);
  label.append(text, input);
  return { label, text, input };
}

function error(figure: HTMLElement, svg: SVGSVGElement, controls: HTMLElement) {
  const bias = range('Model bias', 0, 5, 3);
  const horizon = range('Prediction horizon', 1, 20, 20);
  const fields = document.createElement('div');
  fields.className = 'world-fields';
  fields.append(bias.label, horizon.label);
  const status = output();
  controls.append(fields, status);
  const player = playback(figure, controls, () => Number(horizon.input.value), (step) => {
    const biasValue = Number(bias.input.value) / 100;
    bias.text.textContent = `Model bias: ${bias.input.value}%`;
    bias.input.setAttribute('aria-valuetext', `${bias.input.value} percent`);
    horizon.text.textContent = `Prediction horizon: ${horizon.input.value} steps`;
    horizon.input.setAttribute('aria-valuetext', `${horizon.input.value} steps`);
    const points = simulatePrediction(step, biasValue);
    const x = (value: number) => 64 + value * 29;
    const y = (value: number) => 324 - value * 8.2;
    const last = points[points.length - 1];
    for (const kind of ['actual', 'predicted'] as const) {
      svg.querySelector(`#wm-error-${kind}`)?.setAttribute('points', points.map((point) => `${x(point.step)},${y(point[kind])}`).join(' '));
      const dot = svg.querySelector(`#wm-error-${kind}-dot`);
      dot?.setAttribute('cx', String(x(last.step)));
      dot?.setAttribute('cy', String(y(last[kind])));
    }
    status.textContent = `Step ${step} / ${horizon.input.value}. True position: ${last.actual.toFixed(2)}. Predicted position: ${last.predicted.toFixed(2)}. Absolute error: ${Math.abs(last.predicted - last.actual).toFixed(2)} toy units.`;
  }, 20);
  bias.input.addEventListener('input', () => player.setStep(Number(horizon.input.value)));
  horizon.input.addEventListener('input', () => player.setStep(Number(horizon.input.value)));
}

export async function initWorldModelDemos() {
  const figures = document.querySelectorAll<HTMLElement>('[data-world-demo]');
  await Promise.all(Array.from(figures, async (figure) => {
    const image = figure.querySelector<HTMLImageElement>('img');
    if (!image || figure.dataset.upgraded) return;
    try {
      const response = await fetch(image.src);
      if (!response.ok) return;
      const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      if (source.querySelector('parsererror') || source.documentElement.localName !== 'svg') return;
      const svg = document.importNode(source.documentElement, true) as unknown as SVGSVGElement;
      svg.setAttribute('class', 'world-interactive-svg');
      const controls = document.createElement('div');
      controls.className = 'world-controls';
      const kind = figure.dataset.worldDemo;
      if (kind === 'loop') loop(figure, svg, controls);
      else if (kind === 'planning') planning(figure, svg, controls);
      else if (kind === 'error') error(figure, svg, controls);
      else return;
      image.replaceWith(svg);
      figure.insertBefore(controls, figure.querySelector('figcaption'));
      figure.dataset.upgraded = 'true';
    } catch {
      // The original picture and explanation remain usable if enhancement fails.
    }
  }));
}
