import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { processObject } from "./feature_extraction.js";
import { randomlyPlaceObjects } from "./random_pics.js";
import { saveImage } from "./utils.js";

// ... (rest of the code remains the same)
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffffff");

const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const aspectRatio = 297 / 210; // A4 landscape
camera.aspect = aspectRatio;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer();
const width = 400;
const height = width / aspectRatio;
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const stageGeometry = new THREE.BoxGeometry(6, 0.2, 3);
const stageMaterial = new THREE.MeshLambertMaterial({ color: "#ffffff" });
const stage = new THREE.Mesh(stageGeometry, stageMaterial);
stage.position.y = -0.5;
stage.receiveShadow = true;
scene.add(stage);

camera.position.z = 5;
camera.position.y = 0.2;

const objects = [];
let selectedObject = null;
const fileNames = [];

function loadModel(url, fileName) {
  const loader = new OBJLoader();
  loader.load(url, function (object) {
    const material = new THREE.MeshPhongMaterial({ color: "#f0efe6" });
    object.traverse(function (child) {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    object.position.set(0, -0.5, 1);
    scene.add(object);
    objects.push(object);
    fileNames.push(fileName);
    render();
  });
}

document
  .getElementById("fileInput")
  .addEventListener("change", function (event) {
    const files = event.target.files;
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const fileName = file.name.split(".")[0]; // Extract the file name without the extension
      loadModel(url, fileName);
    }
  });

document
  .getElementById("optimizeBtn")
  .addEventListener("click", startOptimization);

const canvasContainer = document.querySelector(".canvas-container");
canvasContainer.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2;

// Add click event listener to select objects
renderer.domElement.addEventListener("click", onMouseClick, false);

function onMouseClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    if (clickedObject !== selectedObject) {
      if (selectedObject) {
        selectedObject.material.emissive.setHex(selectedObject.currentHex);
      }
      selectedObject = clickedObject;
      selectedObject.currentHex = selectedObject.material.emissive.getHex();
      selectedObject.material.emissive.setHex(0xff0000);
    }
  } else {
    if (selectedObject) {
      selectedObject.material.emissive.setHex(selectedObject.currentHex);
    }
    selectedObject = null;
  }
}

// Add keyboard event listener to move and rotate selected object
document.addEventListener("keydown", onKeyDown, false);

function onKeyDown(event) {
  if (selectedObject) {
    switch (event.key) {
      case "ArrowLeft":
        selectedObject.position.x -= 0.05;
        break;
      case "ArrowRight":
        selectedObject.position.x += 0.05;
        break;
      case "ArrowUp":
        selectedObject.position.z -= 0.05;
        break;
      case "ArrowDown":
        selectedObject.position.z += 0.05;
        break;
      case "q":
        selectedObject.rotation.y -= 0.1;
        break;
      case "e":
        selectedObject.rotation.y += 0.1;
        break;
    }
  }
}

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(-3, 2, 3);
light.castShadow = true;
light.shadow.mapSize.width = 512;
light.shadow.mapSize.height = 512;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.shadow.darkness = 0.5;
scene.add(light);

const ambientLight = new THREE.AmbientLight("#dedcce", 0.5); // Soft light with background color
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, "#838572", 0.5);
scene.add(hemiLight);

// Add keyboard letter k and l event listener to move the light x position left and right
document.addEventListener("keydown", (event) => {
  if (event.key === "k") {
    // console.log("light.position.x", light.position.x);
    light.position.x -= 0.1;
  } else if (event.key === "l") {
    light.position.x += 0.1;
  }
});

function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}

animate();

const scoreContainer = document.createElement("div");
scoreContainer.classList.add("score-container");
document.body.appendChild(scoreContainer);

const scores = [1, 2, 3, 4, 5];
scores.forEach((score) => {
  const scoreButton = document.createElement("button");
  scoreButton.textContent = score;
  scoreButton.addEventListener("click", () => {
    const snapshot = captureWebGLPixelData();
    saveSnapshot(snapshot, score);
  });
  scoreContainer.appendChild(scoreButton);
});

function captureWebGLPixelData() {
  const width = renderer.domElement.width;
  const height = renderer.domElement.height;
  const pixels = new Uint8Array(width * height * 4); // 4 components per pixel
  renderer
    .getContext()
    .readPixels(
      0,
      0,
      width,
      height,
      renderer.getContext().RGBA,
      renderer.getContext().UNSIGNED_BYTE,
      pixels
    );
  return { data: pixels, width, height };
}

function saveSnapshot(snapshot, score) {
  const canvas = document.createElement("canvas");
  canvas.width = snapshot.width;
  canvas.height = snapshot.height;
  const context = canvas.getContext("2d");
  const imageData = context.createImageData(snapshot.width, snapshot.height);
  imageData.data.set(snapshot.data);
  context.putImageData(imageData, 0, 0);

  canvas.toBlob((blob) => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    const fileNamePrefix = fileNames.join("_");
    const filename = `${score}_${fileNamePrefix}_${timestamp}.png`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }, "image/png");
}

document.getElementById("randomPlaceBtn").addEventListener("click", () => {
  randomlyPlaceObjects(objects, render);
  saveImage(renderer, scene, camera, captureWebGLPixelData, fileNames);
});

document.getElementById("randomBtn").addEventListener("click", () => {
  randomlyPlaceObjects(objects, render);
});

async function startOptimization() {
  try {
    const sceneData = [];

    for (const object of objects) {
      objects.forEach((obj) => {
        obj.visible = obj === object;
      });

      render();

      const snapshot = captureWebGLPixelData();

      const objectData = await processObject(object, snapshot);

      sceneData.push(objectData);

      objects.forEach((obj) => {
        obj.visible = true;
      });
    }

    console.log("Scene data:", sceneData);
    // Perform further processing or optimization using the scene data
  } catch (error) {
    console.error("Error during optimization:", error);
  }
}
