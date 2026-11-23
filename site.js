const pitchForm = document.querySelector('#pitch-form');
const report = document.querySelector('#pitch-report');
const deck = document.querySelector('#pitch-deck');
const nav = [...document.querySelectorAll('.workspace [data-view]')];
const slidePrev = document.querySelector('#slide-prev');
const slideNext = document.querySelector('#slide-next');
let slides = [];
let slideIndex = 0;

function definitions(list, pairs) {
  list.replaceChildren();
  for (const [key, value] of pairs) {
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = key;
    detail.textContent = value;
    list.append(term, detail);
  }
}

function showPitch(view) {
  pitchForm.hidden = view !== 'brief';
  report.hidden = view !== 'report';
  deck.hidden = view !== 'deck';
  nav.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}

function renderSlide() {
  const [title, body] = slides[slideIndex];
  document.querySelector('#slide-count').textContent = `Sample pitch deck · ${slideIndex + 1} / ${slides.length}`;
  document.querySelector('#slide-heading').textContent = title;
  document.querySelector('#slide-text').textContent = body;
  deck.querySelector('.slide-stage').dataset.slide = String(slideIndex);
  const visuals = [
    ['Scattered inputs', 'Manual reconciliation', 'Coordination delays'],
    ['Target buyer', 'Day-to-day user', 'Evidence to gather'],
    ['Capture request', 'Schedule arrival', 'Share live status']
  ];
  const visual = document.querySelector('#slide-visual');
  visual.replaceChildren(...visuals[slideIndex].map((label, index) => {
    const step = document.createElement('li');
    step.dataset.step = String(index + 1).padStart(2, '0');
    step.textContent = label;
    return step;
  }));
  visual.hidden = !['Freight depots juggle inbound bookings across calls, emails and spreadsheets.', 'Freight depot operators and inbound scheduling teams.', 'RailForge gives teams a shared booking queue with live arrival updates.'].includes(body);
  slidePrev.disabled = slideIndex === 0;
  slideNext.disabled = slideIndex === slides.length - 1;
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showPitch(button.dataset.view)));
pitchForm.addEventListener('input', event => event.target.setCustomValidity(''));
pitchForm.addEventListener('submit', event => {
  event.preventDefault();
  const fields = [...pitchForm.querySelectorAll('textarea')];
  const empty = fields.find(field => !field.value.trim());
  if (empty) {
    empty.setCustomValidity('Enter an answer to continue.');
    empty.reportValidity();
    return;
  }
  slides = ['Problem', 'Target customer', 'Solution'].map((title, i) => [title, fields[i].value.trim()]);
  definitions(document.querySelector('#report-data'), slides);
  slideIndex = 0;
  renderSlide();
  nav.forEach(button => { button.disabled = false; });
  showPitch('report');
  nav.find(button => button.dataset.view === 'report').focus();
  document.querySelector('#pitch-status').textContent = 'Sample report and deck created from your brief.';
});
slidePrev.addEventListener('click', () => { slideIndex--; renderSlide(); });
slideNext.addEventListener('click', () => { slideIndex++; renderSlide(); });
showPitch('brief');

const evidence = [
  { kind: 'vitals', title: 'Heart rate', value: '88 bpm', time: 4, available: 4, source: 'Synthetic bedside monitor' },
  { kind: 'labs', title: 'Lactate', value: '1.7 mmol/L', time: 5, available: 7, source: 'Synthetic lab result' },
  { kind: 'imaging', title: 'Chest X-ray record', value: 'Imaging acquisition logged', time: 3, available: null, source: 'Synthetic imaging record' }
];
const cutoff = document.querySelector('#cutoff');
const filters = [...document.querySelectorAll('[data-filter]')];
const list = document.querySelector('#evidence-list');
const visual = document.querySelector('#modality-visual');
const sourceRecord = document.querySelector('#source-record');
const reviewLog = document.querySelector('#review-log');
let filter = 'all';

function availability(item) {
  if (item.available === null) return 'Availability unknown';
  return item.available <= Number(cutoff.value) ? 'Available for review' : 'Available after cutoff';
}

const trends = {
  vitals: { unit: 'bpm', scale: 120, samples: [[2, 96], [3, 91], [4, 88]] },
  labs: { unit: 'mmol/L', scale: 3, samples: [[1, 2.3], [3, 1.9], [5, 1.7]] }
};

function renderVisual(item, target = visual) {
  target.replaceChildren();
  if (item.kind === 'imaging') {
    const figure = document.createElement('figure');
    figure.className = 'radiograph';
    const image = document.createElement('img');
    image.src = 'assets/chest-reference.webp';
    image.alt = 'Reference chest radiograph, front view';
    image.width = 850;
    image.height = 689;
    const caption = document.createElement('figcaption');
    caption.textContent = 'Reference image from Wikimedia Commons · Separate from the synthetic encounter';
    const source = document.createElement('a');
    source.href = 'https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png';
    source.textContent = 'Image source';
    figure.append(image, caption, source);
    target.append(figure);
    return;
  }

  const trend = trends[item.kind];
  const chart = document.createElement('figure');
  chart.className = 'trend';
  const caption = document.createElement('figcaption');
  caption.textContent = `Synthetic trend · ${trend.unit}`;
  const bars = document.createElement('ol');
  for (const [hour, value] of trend.samples) {
    const row = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = `Hour ${hour}`;
    const bar = document.createElement('span');
    bar.className = 'trend-bar';
    bar.style.width = `${value / trend.scale * 100}%`;
    bar.setAttribute('aria-hidden', 'true');
    const amount = document.createElement('strong');
    const late = hour === item.time && item.available > Number(cutoff.value);
    row.classList.toggle('late', late);
    amount.textContent = late ? `${value} · after cutoff` : String(value);
    row.append(label, bar, amount);
    bars.append(row);
  }
  chart.append(caption, bars);
  target.append(chart);
}

function renderEvidence() {
  list.replaceChildren();
  const available = evidence.filter(item => availability(item) === 'Available for review');
  const patient = filter === 'patient';
  const sources = filter === 'sources';
  const overview = filter === 'all';
  document.querySelector('#neo-overview').hidden = !overview;
  document.querySelector('#neo-detail').hidden = overview || patient || sources;
  document.querySelector('#neo-patient').hidden = !patient;
  document.querySelector('#neo-sources').hidden = !sources;
  document.querySelector('#neo-review-footer').hidden = patient;
  document.querySelector('#neo-view-label').textContent = patient ? 'Patient view' : 'Clinician workspace';
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
  if (patient || overview) {
    const tiles = document.querySelector(patient ? '#neo-patient-tiles' : '#neo-status');
    const counts = [
      [available.length, 'Available by hour ' + cutoff.value],
      [evidence.filter(item => availability(item) === 'Available after cutoff').length, 'Available later'],
      [evidence.filter(item => item.available === null).length, 'Availability unknown']
    ];
    tiles.replaceChildren(...counts.map(([count, label]) => {
      const tile = document.createElement('div');
      const value = document.createElement('strong');
      value.textContent = count;
      tile.append(value, label);
      return tile;
    }));
  }
  if (patient) return;
  if (sources) {
    const target = document.querySelector('#neo-source-list');
    target.replaceChildren(...evidence.map(item => {
      const record = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = item.title + ' · ' + availability(item);
      const fields = document.createElement('dl');
      definitions(fields, [
        ['Source', item.source],
        ['Recorded', 'Hour ' + item.time],
        ['Result available', item.available === null ? 'Unknown' : 'Hour ' + item.available]
      ]);
      record.append(summary, fields);
      return record;
    }));
    return;
  }
  if (overview) {
    const timeline = document.querySelector('#overview-timeline');
    timeline.replaceChildren();
    for (const item of [...evidence].sort((a, b) => a.time - b.time)) {
      renderVisual(item, document.querySelector('#overview-' + item.kind));
      const event = document.createElement('li');
      event.textContent = `Hour ${item.time} · ${item.title} · ${availability(item)}`;
      timeline.append(event);
    }
    return;
  }
  const shown = evidence.filter(item => item.kind === filter);
  function select(item, selected) {
    document.querySelector('#source-title').textContent = item.title;
    renderVisual(item);
    definitions(sourceRecord, [
      ['Value', item.value], ['Recorded', `Hour ${item.time}`],
      ['Result available', item.available === null ? 'Unknown' : `Hour ${item.available}`],
      ['At this review', availability(item)], ['Source', item.source]
    ]);
    list.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
  }
  shown.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${item.title} · ${availability(item)}`;
    button.addEventListener('click', () => select(item, button));
    list.append(button);
  });
  select(shown[0], list.firstElementChild);
}

filters.forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  renderEvidence();
}));
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.open;
  renderEvidence();
  filters.find(control => control.dataset.filter === filter).focus();
}));
cutoff.addEventListener('change', renderEvidence);
document.querySelector('#save-review').addEventListener('click', () => {
  const included = evidence.filter(item => item.available !== null && item.available <= Number(cutoff.value));
  const summary = document.createElement('p');
  summary.textContent = `Hour ${cutoff.value} snapshot saved in this demo · ${included.map(item => item.title).join(', ')}.`;
  reviewLog.prepend(summary);
});
renderEvidence();

const orbitStages = {
  clock: ['Estimate the change in clock rate', 'Compare consecutive clock readings for a single satellite.', 'Clock-rate difference (ns/h)', [0.12, 0.31, 0.24, 0.38], 0.5],
  orbit: ['Track distance from Earth', 'Match each orbit position to the same satellite and epoch as the clock record.', 'Distance from Earth’s centre (km)', [26380, 26410, 26460, 26500], 27000],
  compare: ['Inspect the paired measurements', 'At each epoch, compare the clock-rate change with the matched orbital distance.', 'Clock-rate difference (ns/h) by matched epoch', [0.12, 0.31, 0.24, 0.38], 0.5]
};
const orbitButtons = [...document.querySelectorAll('[data-orbit]')];
const epoch = document.querySelector('#orbit-epoch');
let orbitStage = 'clock';

function renderOrbit() {
  const [heading, copy, caption, values, max] = orbitStages[orbitStage];
  const current = Number(epoch.value);
  const hours = ['00:00', '01:00', '02:00', '03:00'];
  orbitButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.orbit === orbitStage)));
  document.querySelector('#orbit-heading').textContent = heading;
  document.querySelector('#orbit-copy').textContent = copy;
  document.querySelector('#orbit-caption').textContent = caption;
  document.querySelector('#orbit-bars').replaceChildren(...values.map((value, index) => {
    const row = document.createElement('li');
    const bar = document.createElement('span');
    bar.style.height = (100 * value / max) + '%';
    row.classList.toggle('active', index === current);
    const label = document.createElement('small');
    label.textContent = hours[index];
    row.append(bar, label);
    return row;
  }));
  epoch.setAttribute('aria-valuetext', hours[current] + ' UTC');
  document.querySelector('#orbit_readout').textContent =
    hours[current] + ' UTC · ' + orbitStages.clock[3][current] + ' ns/h · ' + orbitStages.orbit[3][current].toLocaleString('en-GB') + ' km';
}

orbitButtons.forEach(button => button.addEventListener('click', () => {
  orbitStage = button.dataset.orbit;
  renderOrbit();
}));
epoch.addEventListener('input', renderOrbit);
renderOrbit();
