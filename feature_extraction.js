import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as mobilenet from "@tensorflow-models/mobilenet";

let segmentationModel;
let featureExtractionModel;

async function loadModels() {
  segmentationModel = await cocoSsd.load();
  featureExtractionModel = await mobilenet.load();
}

async function extractFeatures(imageData) {
  // Preprocess the image data
  const tensor = tf.browser.fromPixels(imageData);
  const processedTensor = tf.expandDims(tensor, 0);
  // Resize the tensor to match the expected input shape
  const resizedTensor = tf.image.resizeBilinear(processedTensor, [
    imageData.height,
    imageData.width,
  ]);

  // Perform segmentation
  const segmentationPredictions = await segmentationModel.detect(resizedTensor);

  const features = [];

  // Extract features for each segmented object
  for (let i = 0; i < segmentationPredictions.length; i++) {
    const prediction = segmentationPredictions[i];
    const { bbox } = prediction;
    const [x, y, width, height] = bbox;

    // Crop the segmented region from the resized tensor
    const segmentedTensor = tf.slice(
      resizedTensor,
      [0, y, x, 0],
      [1, height, width, 3]
    );

    // Extract features using the pre-trained MobileNet model
    const featureTensor = featureExtractionModel.infer(segmentedTensor, {
      embedding: true,
    });
    const featureArray = await featureTensor.array();

    features.push(featureArray[0]);

    // Save the segmented image to disk
    await saveSegmentedImage(segmentedTensor, i);
  }

  // Dispose of the tensors to free up memory
  tensor.dispose();
  processedTensor.dispose();
  resizedTensor.dispose();
  return features;
}

async function saveSegmentedImage(segmentedTensor, index) {
  // Convert the segmented tensor to a canvas
  const segmentedCanvas = document.createElement("canvas");
  await tf.browser.toPixels(segmentedTensor.squeeze(), segmentedCanvas);

  // Convert the canvas to a data URL
  const dataUrl = segmentedCanvas.toDataURL("image/png");

  // Create a download link and trigger the download
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `segmented_${index}.png`;
  link.click();
}

export async function runFeatureExtraction(renderer) {
  if (!segmentationModel || !featureExtractionModel) {
    await loadModels();
  }

  // Capture the rendered image
  const snapshot = renderer.domElement.toDataURL("image/png");
  const image = new Image();
  image.src = snapshot;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Extract features from the captured image
  const features = await extractFeatures(imageData);

  return features;
}
