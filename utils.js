// function saveImage(renderer, scene, camera, captureWebGLPixelData, fileNames) {
//   const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
//   const fileNamePrefix = fileNames.join("_");
//   const filename = `train_${fileNamePrefix}_${timestamp}.png`;

//   renderer.render(scene, camera);
//   const snapshot = captureWebGLPixelData();

//   const canvas = document.createElement("canvas");
//   canvas.width = snapshot.width;
//   canvas.height = snapshot.height;
//   const context = canvas.getContext("2d");
//   const imageData = context.createImageData(snapshot.width, snapshot.height);
//   imageData.data.set(snapshot.data);
//   context.putImageData(imageData, 0, 0);

//   canvas.toBlob((blob) => {
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = filename;
//     link.click();
//   }, "image/png");
// }

// export { saveImage };

function saveImage(renderer, scene, camera, captureWebGLPixelData, fileNames) {
  const timestamp = new Date().toISOString().replace(/\[-:.\]/g, "");
  const fileNamePrefix = fileNames.join("_");
  const filename = `train_${fileNamePrefix}_${timestamp}.png`;

  renderer.render(scene, camera);
  const snapshot = captureWebGLPixelData();

  const canvas = document.createElement("canvas");
  canvas.width = snapshot.width;
  canvas.height = snapshot.height;

  const context = canvas.getContext("2d");

  // Create a temporary canvas to hold the WebGL image data
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = snapshot.width;
  tempCanvas.height = snapshot.height;
  const tempContext = tempCanvas.getContext("2d");
  const tempImageData = tempContext.createImageData(
    snapshot.width,
    snapshot.height
  );
  tempImageData.data.set(snapshot.data);
  tempContext.putImageData(tempImageData, 0, 0);

  // Flip the image vertically using drawImage()
  context.save();
  context.scale(1, -1);
  context.translate(0, -canvas.height);
  context.drawImage(tempCanvas, 0, 0);
  context.restore();

  canvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }, "image/png");
}

export { saveImage };
