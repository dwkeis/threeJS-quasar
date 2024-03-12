<template>
  <q-page class="overflow:hidden!">
    <canvas class="webgl overflow:hidden!"></canvas>
  </q-page>
</template>

<script setup>
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ref, onMounted } from "vue";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#454444");
const canvas = ref(null);
const renderer = ref(null);
const mixer_coin = ref(null);

const rgbeLoader = new RGBELoader();

/**
 * Models
 */
const coin_bottom_left = ref(null); // icon
const coin_bottom_right = ref(null); // icon2
const coin_top = ref(null); // icon1
const coin_left = ref(null); // icon3
const coin_right = ref(null); // icon1
const card = ref(null);
const card_only = ref(null);
const photo_only = ref(null);
let card_y, photo_y;
let card_rotation_y, photo_rotation_y;

const gltfLoader = new GLTFLoader();

/** for id card + coins */ // hdr: abandoned, 0.96
rgbeLoader.load("HDR_029_Sky_Cloudy_Env.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  // adjustHDRIntensity(environmentMap, 0.95);
  scene.environment = environmentMap;
});
gltfLoader.load("GLB_CARD_icon_all.glb", (gltf) => {
  console.log(gltf.scene);
  if (gltf.animations.length > 0) {
    mixer_coin.value = new THREE.AnimationMixer(gltf.scene);
    mixer_coin.value = new THREE.AnimationMixer(gltf.scene);
    const action = mixer_coin.value.clipAction(gltf.animations[0]);
    action.play();
  }
  gltf.scene.scale.set(0.01, 0.01, 0.01);
  gltf.scene.traverse((child) => {
    if (child.name === "card") {
      child.material.roughness = 1;
    }
  });
  scene.add(gltf.scene);
  card.value = gltf.scene.children.filter(
    (el) => el.name === "card" || el.name === "photo" || el.name === "icon007"
  );

  coin_top.value = gltf.scene.children.filter((el) => el.name === "icon1");
  coin_left.value = gltf.scene.children.filter((el) => el.name === "icon3");
  coin_right.value = gltf.scene.children.filter((el) => el.name === "icon5");
  coin_bottom_left.value = gltf.scene.children.filter(
    (el) => el.name === "icon"
  );
  coin_bottom_right.value = gltf.scene.children.filter(
    (el) => el.name === "icon2"
  );
  card_only.value = gltf.scene.children.filter((el) => el.name === "card");
  photo_only.value = gltf.scene.children.filter((el) => el.name === "photo");
  card_y = card_only.value[0].position.y;
  photo_y = photo_only.value[0].position.y;
  card_rotation_y = card_only.value[0].rotation.y;
  photo_rotation_y = photo_only.value[0].rotation.y;
  card_only.value[0].position.y = -100 + card_y;
  photo_only.value[0].position.y = -100 + photo_y;
  photo_only.value[0].rotation.y = 1;
  card_only.value[0].rotation.y = 1;
  // camera.value.position.set(0, 2, 1.5);
  camera.value.lookAt(0, 0, 0);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight - 50,
};

/**
 * Camera
 */
// Base camera
const camera = ref(
  new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100)
);
camera.value.position.set(0, 0, 1.5);
scene.add(camera.value);

/**
 * Animate
 */
const clock = new THREE.Clock();

let intro = true;
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Call tick again on the next frame
  requestAnimationFrame(tick);
  if (mixer_coin.value) {
    if (intro) {
      const easedProgress = easeInOutQuad(Math.min(1, elapsedTime / 0.5));
      if (card_only.value[0].position.y <= card_y) {
        card_only.value[0].position.y += 1 * easedProgress;
        photo_only.value[0].position.y += 1 * easedProgress;
        photo_only.value[0].rotation.y -= 0.01 * easedProgress;
        card_only.value[0].rotation.y -= 0.01 * easedProgress;
        // if (camera.value.position.y >= 0) {
        //   camera.value.position.y -= 0.02;
        // }
      } else {
        if (card_only.value[0].rotation.y % card_rotation_y > 0) {
          photo_only.value[0].rotation.y = photo_rotation_y;
          card_only.value[0].rotation.y = card_rotation_y;
        }
        intro = false;
      }
    } else {
      coin_bottom_left.value[0].position.y +=
        Math.sin(elapsedTime * 0.2) * 0.05;
      coin_bottom_right.value[0].position.y +=
        Math.cos(elapsedTime * 0.2) * 0.02;
      coin_top.value[0].position.y += Math.cos(elapsedTime) * 0.05;
      coin_left.value[0].position.y += Math.sin(elapsedTime * 0.4) * 0.025;
      coin_right.value[0].position.y += Math.cos(elapsedTime * 0.8) * 0.03;
      card.value.forEach((el) => {
        if (el.name === "icon007") {
          el.position.y += Math.sin(elapsedTime) * 0.03 + 0.2;
        }
        el.position.y += Math.sin(elapsedTime) * 0.03;
      });
    }
  }

  // Render
  renderer.value.render(scene, camera.value);
};

const coinAnimation = () => {
  const delta = clock.getDelta();
  if (mixer_coin.value) {
    mixer_coin.value.update(delta * 12);
  }
  renderer.value.render(scene, camera.value);
  requestAnimationFrame(coinAnimation);
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

  tick();
  coinAnimation();
});
</script>
