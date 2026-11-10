import * as THREE from 'three';
import { OrbitControls } from './vendor/three/addons/controls/OrbitControls.js';
import boxes from './residence-preview.json' with { type: 'json' };

const byId = id => document.getElementById(id);
const on = (id, event, handler) => byId(id).addEventListener(event, handler);
const viewport = byId('viewport');
const dialog = byId('moduleDialog');
const modules = {
  modeling: '建模工作台用于管理工程模型和网格。答辩版可通过首页浏览三层住宅的可视几何。',
  refined: '这里介绍原工作台的精细化分析模块。答辩版提供三维浏览与镜头回放。',
  pressure: '固定建筑压力分析包含建筑预览、工程设置与结果查看。答辩版提供建筑外观与屋面切换。',
  assessment: '评估模块用于浏览工程结果与图表。答辩版可切换损伤图例，图例颜色仅用于说明界面。',
  catalog: '当前开放的静态展项为三层阳台住宅。使用左侧视角菜单切换全景、正面阳台和屋面总览。',
};

for (const button of document.querySelectorAll('[data-module]')) {
  button.addEventListener('click', () => {
    byId('moduleTitle').textContent = button.textContent.trim();
    byId('moduleDescription').textContent = modules[button.dataset.module];
    dialog.showModal();
  });
}
on('closeDialog', 'click', () => dialog.close());

function saveLink(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
}

on('downloadModel', 'click', () => saveLink('./residence-preview.json', 'residence-preview.json'));
on('fullscreenDemo', 'click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewport.requestFullscreen();
  } catch {
    byId('stageStatus').textContent = '当前浏览器无法进入全屏';
  }
});

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
} catch {
  viewport.dataset.fallback = '';
  byId('viewHint').textContent = '当前浏览器使用静态图片预览';
  byId('stageStatus').textContent = '静态预览';
  for (const id of ['showRoof', 'viewChoice', 'applyView', 'frontView', 'topView', 'fitDemo',
    'appearance', 'damage', 'playDemo', 'timeline', 'speed', 'resetDemo']) byId(id).disabled = true;
  on('captureDemo', 'click', () => saveLink('./residence-preview.png', 'residence-preview.png'));
}

if (renderer) startViewer(renderer);

function startViewer(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9eeee');
  scene.fog = new THREE.Fog('#e9eeee', 65, 145);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.setAttribute('aria-label', '三层阳台住宅三维外观');
  viewport.prepend(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(38, 1, .1, 220);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * .49;
  controls.minDistance = 9;
  controls.maxDistance = 100;

  const light = new THREE.DirectionalLight('#fff4df', 3.2);
  light.position.set(-20, -25, 40);
  light.castShadow = true;
  Object.assign(light.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 150 });
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -.0002;
  scene.add(light, new THREE.HemisphereLight('#eaf3ff', '#9a9686', 2.1));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({ color: '#cbd2d0', roughness: 1 }));
  ground.position.z = -.23;
  ground.receiveShadow = true;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(30, 25, .22),
    new THREE.MeshStandardMaterial({ color: '#c8c9bc', roughness: .95 }));
  pad.position.set(0, -1, -.12);
  pad.receiveShadow = true;
  const grid = new THREE.GridHelper(150, 75, '#b7c5c5', '#c5cecd');
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -.22;
  grid.material.transparent = true;
  grid.material.opacity = .4;
  scene.add(ground, pad, grid);

  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: .86 }), boxes.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);

  const duration = 6;
  const views = { orbit: [23, -36, 24], front: [0, -38, 15], top: [9, -15, 38] };
  const appearance = byId('appearance');
  const damage = byId('damage');
  const play = byId('playDemo');
  const timeline = byId('timeline');
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let time = 0;
  let animation = null;
  let lastFrame = 0;
  let legend = false;

  function render() {
    renderer.render(scene, camera);
  }

  function drawBuilding() {
    boxes.forEach(([center, size, paint, isRoof], index) => {
      dummy.position.fromArray(center);
      dummy.scale.fromArray(size);
      if (isRoof && !byId('showRoof').checked) dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      const band = Math.min(2, Math.max(0, Math.floor(center[2] / 3.4)));
      mesh.setColorAt(index, color.set(legend ? ['#bb8061', '#dac779', '#7ba9aa'][band] : paint));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    render();
  }

  function setMode(showLegend) {
    legend = showLegend;
    for (const [button, active] of [[appearance, !legend], [damage, legend]]) {
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    }
    byId('viewLabel').textContent = legend ? '三层阳台住宅 / 损伤配色图例（示意）' : '三层阳台住宅 / 初始模型';
    drawBuilding();
  }

  function view(name, angle = 0) {
    controls.target.set(0, -1, 4.3);
    camera.position.fromArray(views[name]).sub(controls.target);
    camera.position.applyAxisAngle(camera.up, angle);
    if (camera.aspect < 1.2) camera.position.multiplyScalar(1.2 / camera.aspect);
    camera.position.add(controls.target);
    controls.update();
    render();
  }

  function resize() {
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    render();
  }

  function setTime(value) {
    time = value;
    timeline.value = String(value);
    byId('timeDisplay').textContent = value.toFixed(2) + ' / 6.00 s';
    view('orbit', value / duration * Math.PI * 2);
  }

  function pause() {
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    play.textContent = '▶';
    play.setAttribute('aria-label', '播放镜头');
  }

  function tick(now) {
    if (lastFrame) setTime(Math.min(duration, time + (now - lastFrame) / 1000 * Number(byId('speed').value)));
    lastFrame = now;
    if (time >= duration) pause();
    else animation = requestAnimationFrame(tick);
  }

  function chooseView(name) {
    pause();
    byId('viewChoice').value = name;
    setTime(0);
    view(name);
  }

  controls.addEventListener('start', pause);
  controls.addEventListener('change', render);
  on('showRoof', 'change', drawBuilding);
  on('appearance', 'click', () => setMode(false));
  on('damage', 'click', () => setMode(true));
  on('fitDemo', 'click', () => chooseView('orbit'));
  on('applyView', 'click', () => chooseView(byId('viewChoice').value));
  on('frontView', 'click', () => chooseView('front'));
  on('topView', 'click', () => chooseView('top'));
  on('captureDemo', 'click', () => saveLink(renderer.domElement.toDataURL('image/png'), 'residence-preview.png'));
  on('timeline', 'input', () => {
    pause();
    byId('viewChoice').value = 'orbit';
    setTime(Number(timeline.value));
  });
  on('resetDemo', 'click', () => {
    byId('showRoof').checked = true;
    byId('speed').value = '1';
    setMode(false);
    chooseView('orbit');
  });
  on('playDemo', 'click', () => {
    if (animation !== null) return pause();
    byId('viewChoice').value = 'orbit';
    setTime(time >= duration ? 0 : time);
    lastFrame = 0;
    play.textContent = '⏸';
    play.setAttribute('aria-label', '暂停镜头');
    animation = requestAnimationFrame(tick);
  });

  resize();
  view('orbit');
  drawBuilding();
  new ResizeObserver(resize).observe(viewport);
  byId('stageStatus').textContent = '模型就绪';
  document.body.dataset.previewReady = 'true';
}
