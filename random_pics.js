function randomlyPlaceObjects(objects, render) {
  console.log("I randomly moving objects..");
  objects.forEach((object) => {
    object.position.set(Math.random() * 2 - 1, -0.5, Math.random());
    object.rotation.y = Math.random() * Math.PI * 2;
  });
  render();
}

function saveImage(renderer, scene, camera, captureWebGLPixelData, fileNames) {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  const fileNamePrefix = fileNames.join("_");
  const filename = `train_${fileNamePrefix}_${timestamp}.png`;

  renderer.render(scene, camera);
  const snapshot = captureWebGLPixelData();

  const canvas = document.createElement("canvas");
  canvas.width = snapshot.width;
  canvas.height = snapshot.height;
  const context = canvas.getContext("2d");
  const imageData = context.createImageData(snapshot.width, snapshot.height);
  imageData.data.set(snapshot.data);
  context.putImageData(imageData, 0, 0);

  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }, "image/png");
}

export { randomlyPlaceObjects, saveImage };
