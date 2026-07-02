import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const viewer = document.getElementById("viewerCanvas");
const fitViewButton = document.getElementById("fitViewButton");
const isoViewButton = document.getElementById("isoViewButton");
const topViewButton = document.getElementById("topViewButton");
const frontViewButton = document.getElementById("frontViewButton");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2a30);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.8, 0);
controls.minDistance = 4;
controls.maxDistance = 24;

const modelGroup = new THREE.Group();
scene.add(modelGroup);

function createTextSprite(text, color = "#76f2cd", size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = `700 ${size * 0.45}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 0.6, 1);
  return sprite;
}

function createSupport(x) {
  const support = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.55, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x96a5b2,
      roughness: 0.78,
      metalness: 0.08
    })
  );
  support.position.set(x, -0.32, 0);
  support.castShadow = true;
  support.receiveShadow = true;
  modelGroup.add(support);

  const stripeMaterial = new THREE.MeshBasicMaterial({
    color: 0x60707c,
    transparent: true,
    opacity: 0.65
  });
  for (let i = -2; i <= 2; i += 1) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 1.0), stripeMaterial);
    stripe.position.set(x + i * 0.16, -0.31, 0.01);
    stripe.rotation.z = -Math.PI / 4;
    modelGroup.add(stripe);
  }
}

function buildScene() {
  const ambient = new THREE.HemisphereLight(0xffffff, 0x22313a, 1.25);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x75f2cc, 1.3);
  rimLight.position.set(-4, 4, -5);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(14, 28, 0x396b61, 0x31444c);
  grid.position.y = -0.62;
  modelGroup.add(grid);

  const axes = new THREE.AxesHelper(1.4);
  axes.position.set(-3.8, -0.58, 2.9);
  modelGroup.add(axes);

  const xLabel = createTextSprite("X", "#ff675d");
  xLabel.position.set(-2.15, -0.55, 2.9);
  modelGroup.add(xLabel);

  const yLabel = createTextSprite("Y", "#67d985");
  yLabel.position.set(-3.8, 0.95, 2.9);
  modelGroup.add(yLabel);

  const zLabel = createTextSprite("Z", "#74a7ff");
  zLabel.position.set(-3.8, -0.55, 1.25);
  modelGroup.add(zLabel);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.28, 1.65),
    new THREE.MeshStandardMaterial({
      color: 0x9aa7b2,
      roughness: 0.5,
      metalness: 0.42
    })
  );
  plate.position.set(0, 0, 0);
  plate.castShadow = true;
  plate.receiveShadow = true;
  modelGroup.add(plate);

  createSupport(-2.05);
  createSupport(2.05);

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 2.25, 64),
    new THREE.MeshStandardMaterial({
      color: 0xbac4cc,
      roughness: 0.34,
      metalness: 0.55
    })
  );
  rod.position.set(0, 2.0, 0);
  rod.castShadow = true;
  rod.receiveShadow = true;
  modelGroup.add(rod);

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 1.05, 0),
    0.95,
    0x76f2cd,
    0.22,
    0.12
  );
  modelGroup.add(arrow);

  const vLabel = createTextSprite("v0", "#76f2cd");
  vLabel.position.set(0.95, 1.55, 0);
  modelGroup.add(vLabel);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.64;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
}

function resizeViewer() {
  const rect = viewer.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(420, Math.floor(rect.height));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function setCamera(position, target = new THREE.Vector3(0, 0.75, 0)) {
  camera.position.copy(position);
  controls.target.copy(target);
  controls.update();
}

function fitView() {
  setCamera(new THREE.Vector3(5.3, 4.2, 6.2));
}

function setIsoView() {
  setCamera(new THREE.Vector3(5.3, 4.2, 6.2));
}

function setTopView() {
  setCamera(new THREE.Vector3(0, 8.5, 0.01), new THREE.Vector3(0, 0, 0));
}

function setFrontView() {
  setCamera(new THREE.Vector3(0, 2.1, 8.2));
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildScene();
resizeViewer();
fitView();
animate();

fitViewButton?.addEventListener("click", fitView);
isoViewButton?.addEventListener("click", setIsoView);
topViewButton?.addEventListener("click", setTopView);
frontViewButton?.addEventListener("click", setFrontView);
window.addEventListener("resize", resizeViewer);
