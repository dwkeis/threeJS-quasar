<template>
  <q-page class="overflow:hidden">
    <canvas class="webgl"></canvas>
  </q-page>
</template>

<script setup>
import * as THREE from "three";
import { ref, onMounted } from "vue";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const canvas = ref(null);
const renderer = ref(null);

/**
 * Objects
 */
// MeshBasicMaterial
const material = new THREE.MeshStandardMaterial();
material.roughness = 0.4;
material.color = new THREE.Color("#ff0000");

const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
cube.position.x = -1.5;
const torus2 = new THREE.Mesh(
  new THREE.TorusGeometry(0.3, 0.2, 16, 32),
  material
);
torus2.position.x = 2;

scene.add(torus2, cube);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight - 55.5,
};

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 1;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = ref();

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 30);
pointLight.position.x = 2;
pointLight.position.y = 3;
pointLight.position.z = 4;
scene.add(pointLight);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update objects
  torus2.rotation.y = 0.1 * elapsedTime;
  torus2.rotation.x = 3;
  // torus2.rotation.x = -0.15 * elapsedTime;

  // Update controls
  controls.value.update();

  // Render
  renderer.value.render(scene, camera);

  // Call tick again on the next frame
  requestAnimationFrame(tick);
};

let startTime = Date.now();
let duration = 1000;
let pauseTime = 5000;
let transitionTime = 500;
let isShaking = true;

// Function to smoothly transition the box position
const transitionBoxPosition = (targetPosition, callback) => {
  const start = Date.now();
  const animateTransition = () => {
    const now = Date.now();
    const t = Math.min(1, (now - start) / transitionTime);
    cube.position.x = Math.sin(t * Math.PI) * targetPosition;
    if (t < 1) {
      requestAnimationFrame(animateTransition);
    } else {
      if (callback) callback();
    }
  };
  animateTransition();
};

const animate = () => {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;

  if (isShaking) {
    if (elapsedTime < duration) {
      // Update position to make the box shake faster
      cube.position.x = Math.sin(currentTime * 0.025) * 0.5;
    } else {
      // Transition back to center after shaking for 2 seconds
      transitionBoxPosition(0, () => {
        // Pause after the transition
        isShaking = false;
        startTime = currentTime;
      });
    }
  } else {
    // Pause for 2 seconds
    if (elapsedTime >= pauseTime) {
      // Check if the box is not at 0 position, then smoothly transition to 0
      if (cube.position.x !== 0) {
        transitionBoxPosition(0, () => {
          // Box is already at 0 position, pause
          isShaking = true;
          startTime = currentTime;
        });
      } else {
        // Box is already at 0 position, pause
        isShaking = true;
        startTime = currentTime;
      }
    }
  }

  // Render the scene
  renderer.value.render(scene, camera);

  // Call animate again for the next frame

  requestAnimationFrame(animate);
};

onMounted(() => {
  canvas.value = document.querySelector("canvas.webgl");
  renderer.value = new THREE.WebGLRenderer({ canvas: canvas.value });
  renderer.value.setSize(sizes.width, sizes.height);
  renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.value.setSize(sizes.width, sizes.height);
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  controls.value = new OrbitControls(camera, canvas.value);
  controls.value.enableDamping = true;
  tick();
  animate();
});
</script>
