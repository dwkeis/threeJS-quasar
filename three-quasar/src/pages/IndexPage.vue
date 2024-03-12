<template>
  <q-page class="overflow:hidden!">
    <q-btn
      label="gold"
      class="absolute w:80!"
      @click="changeMedal('gold')"
    ></q-btn>
    <q-btn
      label="silver"
      class="absolute w:80! top:40"
      @click="changeMedal('silver')"
    ></q-btn>
    <q-btn
      label="bronze"
      class="absolute w:80! top:80"
      @click="changeMedal('bronze')"
    ></q-btn>
    <div class="fixed right:0 w:1000 h:full bg:#92908D overflow:auto!">
      <div class="h:98">arrow</div>
      <div class="float:left h:54 ml:78 f:36">ToonTara</div>
      <canvas class="webgl overflow:hidden! h:600! w:1000!"></canvas>
      <div class="h:1120">datasssss</div>
    </div>
  </q-page>
</template>

<script setup>
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { ref, onMounted } from "vue";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const scene = new THREE.Scene();
scene.background = null; //new THREE.Color("#F6F2EC");
const canvas = ref(null);
const renderer = ref(null);
const mixer = ref(null);

const rgbeLoader = new RGBELoader();

const adjustHDRIntensity = (texture, factor) => {
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  texture.anisotropy = renderer.value.capabilities.getMaxAnisotropy();
  texture.mapping = THREE.EquirectangularReflectionMapping;

  // Adjust intensity by multiplying the texture with a factor
  texture.image.data.forEach((val, index, array) => {
    array[index] = val * factor;
  });

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
};

/**
 * Models
 */
const medal = ref(null);
const gltfLoader = new GLTFLoader();

/** for id card */ // hdr: abandoned, 0.88
rgbeLoader.load("HDR_029_Sky_Cloudy_Env.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  // adjustHDRIntensity(environmentMap, 0.92);
  scene.environment = environmentMap;
});
gltfLoader.load("GLB_CARD_004.glb", (gltf) => {
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);
  if (gltf.animations.length > 0) {
    mixer.value = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.value.clipAction(gltf.animations[0]);
    action.play();
  }

  /** Lights on left side */
  const spotLightLeft = new THREE.DirectionalLight("#F6F2EC", 3);
  spotLightLeft.position.set(-0.5, -0.5, 0.9);
  spotLightLeft.intensity = 1;
  scene.add(spotLightLeft);
  spotLightLeft.target.position.set(0, 0.8, -0.2);
  scene.add(spotLightLeft.target);

  /** Picture */
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("image (2).png");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // rotate if upside down
  texture.offset.set(0, 1);
  texture.repeat.set(1, -1);
  gltf.scene.traverse((child) => {
    if (child.name === "photo") {
      child.material.map = texture;
      child.material.ior = 1.0;
      child.material.reflectivity = 0;
      child.material.roughness = 1;
    }
    if (child.name === "card001") {
      child.material.ior = 1.0;
      child.material.reflectivity = 0;
      child.material.roughness = 1;
    }
  });
  medal.value = gltf.scene;
  gltf.scene.rotation.set(0, 1.5, 0);
  scene.add(gltf.scene);
});
/**
 * Sizes
 */
const sizes = {
  width: 1000,
  height: 600,
};

/**
 * Camera
 */
// Base camera
const camera = ref(
  new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100)
);
// camera.value.position.set(0, 0.05, 0.9);
camera.value.position.set(-0.7, 0.05, 1.3);
scene.add(camera.value);

/**
 * Animate
 */
const clock = new THREE.Clock();

let lastMousePosition = { x: 0, y: 0 };
let intro = true;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Call tick again on the next frame
  requestAnimationFrame(tick);
  if (mixer.value) {
    if (medal.value.rotation.y >= 0 && intro) {
      if (camera.value.position.x <= 0) {
        camera.value.position.x += easeInOutQuad(0.08);
      }
      if (camera.value.position.z >= 0.9) {
        camera.value.position.z -= easeInOutQuad(0.06);
      }
      // Update medal rotation
      medal.value.rotation.y -= easeInOutQuad(0.11);
      medal.value.rotation.x -= easeInOutQuad(0.032);
    } else {
      intro = false;
      // Rotate the medal based on mouse movement
      medal.value.rotation.x = lastMousePosition.x * 0.025;
      medal.value.rotation.y = lastMousePosition.y * 0.1;
      let easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
      let xRotation = easeInOut(Math.sin(elapsedTime * 0.4)) * 0.1 - 0.2; // -0.2 to float more up
      let yRotation = easeInOut(Math.cos(elapsedTime * 0.4)) * 0.1;
      medal.value.rotation.x += xRotation; // disable with drawbox or reduce
      medal.value.rotation.y += yRotation;
    }
  }

  // Render
  renderer.value.render(scene, camera.value);
};

const coinAnimation = () => {
  const delta = clock.getDelta();
  if (mixer.value) {
    mixer.value.update(delta * 20);
  }
  renderer.value.render(scene, camera.value);
  requestAnimationFrame(coinAnimation);
};

const changeMedal = (val) => {
  const newTexture = new THREE.TextureLoader().load(`${val}_001.png`); // change between bronze or silver
  newTexture.wrapS = newTexture.wrapT = THREE.RepeatWrapping; // must rotate otherwise it will fail to located
  newTexture.offset.set(0, 1);
  newTexture.repeat.set(1, -1);
  medal.value.traverse((child) => {
    if (child.name === "icon") {
      child.material.map = newTexture;
    }
  });
};

onMounted(() => {
  canvas.value = document.querySelector("canvas.webgl");
  renderer.value = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
  });
  renderer.value.setClearColor(0x000000, 0);
  renderer.value.shadowMap.enabled = true;
  renderer.value.setSize(sizes.width, sizes.height);
  renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = 1000;
    sizes.height = 600 - 57;

    // Update camera
    camera.value.aspect = sizes.width / sizes.height;
    camera.value.updateProjectionMatrix();

    // Update renderer
    renderer.value.setSize(sizes.width, sizes.height);
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  let tracking = document.querySelector("div.fixed");
  tracking.addEventListener("mousemove", (event) => {
    setTimeout(() => {
      lastMousePosition.y = event.clientX / sizes.width - 1.3;
      lastMousePosition.x = event.clientY / sizes.height - 0.5;
    }, 150);
  });

  tick();
  coinAnimation();
});
</script>
