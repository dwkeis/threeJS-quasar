<template>
  <q-page class="overflow:hidden!">
    <div class="fixed right:0 w:1000 h:full bg:#F6F2EC overflow:auto!">
      <div class="h:98">arrow</div>
      <div class="float:left h:54 ml:78 f:36">ToonTara</div>
      <canvas class="webgl overflow:hidden! h:500! w:1000!"></canvas>
      <div class="h:1120">datasssss</div>
    </div>
  </q-page>
</template>

<script setup>
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ref, onMounted } from "vue";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Tween, Easing } from "@tweenjs/tween.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#F6F2EC");
const canvas = ref(null);
const renderer = ref(null);
const mixer_box = ref(null);

const rgbeLoader = new RGBELoader();

/**
 * Models
 */
const box = ref(null);
const gltfLoader = new GLTFLoader();

/**  for draw box */
rgbeLoader.load("HDR_029_Sky_Cloudy_Env.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  // adjustHDRIntensity(environmentMap, 0.96);
  scene.environment = environmentMap;
});
gltfLoader.load("box_0218824.glb", (gltf) => {
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);
  if (gltf.animations.length > 0) {
    mixer_box.value = new THREE.AnimationMixer(gltf.scene);
    const action = mixer_box.value.clipAction(gltf.animations[0]);
    action.play();
  }
  gltf.scene.scale.set(0.013, 0.013, 0.013);
  gltf.scene.traverse((child) => {
    if (child.name === "Cube_5") {
      child.material.iridescence = 1;
      child.material.iridescenceIOR = 1;
      child.material.iridescenceThicknessRange = [100, 800];
      child.material.opacity = 0.5;
      child.material.transparent = true;
    }
  });
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(3, 5, 5);
  scene.add(dirLight);
  box.value = gltf.scene;
  // gltf.scene.position.set(1.5, 0, -1);
  gltf.scene.rotation.set(0.2, 0.8, 0.3);
  scene.add(gltf.scene);
});

/**
 * Sizes
 */
const sizes = {
  width: 1000,
  height: 500,
};

/**
 * Camera
 */
// Base camera
const camera = ref(
  new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
);
camera.value.position.set(0, 0, 1);
scene.add(camera.value);

/**
 * Animate
 */
const clock = new THREE.Clock();

let lastMousePosition = { x: 0, y: 0 };
let intro = true;
const scaleUp = { scale: 0.008 };
const tween = new Tween(scaleUp)
  .to({ scale: 0.013 }, 500) // 放大到 1.5 倍，持續時間 500 毫秒
  .easing(Easing.Elastic.Out) // 使用彈簧效果
  .onUpdate(() => {
    box.value.scale.set(scaleUp.scale, scaleUp.scale, scaleUp.scale);
  })
  .yoyo(true) // 啟用回彈效果
  .repeat(1) // 重複一次，實際上是放大後回到原大小
  .start();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Call tick again on the next frame
  requestAnimationFrame(tick);
  if (mixer_box.value) {
    tween.update();

    box.value.rotation.x = lastMousePosition.x * 0.1 + 0.1;
    box.value.rotation.y = lastMousePosition.y * 0.5 + 0.6;
    let easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    let yRotation = easeInOut(Math.cos(elapsedTime * 0.4)) * 0.1;
    box.value.rotation.y += yRotation;
  }

  // Render
  renderer.value.render(scene, camera.value);
};

onMounted(() => {
  canvas.value = document.querySelector("canvas.webgl");
  renderer.value = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  });
  renderer.value.shadowMap.enabled = true;
  renderer.value.setSize(sizes.width, sizes.height);
  renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight - 57;

    // Update camera
    camera.value.aspect = sizes.width / sizes.height;
    camera.value.updateProjectionMatrix();

    // Update renderer
    renderer.value.setSize(sizes.width, sizes.height);
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  canvas.value.addEventListener("mousemove", (event) => {
    setTimeout(() => {
      lastMousePosition.y = event.clientX / sizes.width - 1.3;
      lastMousePosition.x = event.clientY / sizes.height - 0.5;
    }, 250);
  });
  tick();
});
</script>
