import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as mobilenet from "@tensorflow-models/mobilenet";

let segmentationModel;
let featureExtractionModel;

async function loadModels() {
  segmentationModel = await cocoSsd.load();
  featureExtractionModel = await mobilenet.load();
}

async function extractFeatures(renderer) {
  // Capture the rendered image from the Three.js renderer
  const snapshot = captureWebGLPixelData(renderer);

  // Preprocess the image data
  const pixelData = new Uint8ClampedArray(snapshot.data);
  const imageData = new ImageData(pixelData, snapshot.width, snapshot.height);
  const tensor = tf.browser.fromPixels(imageData, 3);
  console.log("Tensor shape after fromPixels:", tensor.shape);

  // Resize the tensor to match the expected input shape
  const resizedTensor = tf.image.resizeBilinear(tensor, [
    snapshot.height,
    snapshot.width,
  ]);
  console.log("Tensor shape after resizing:", resizedTensor.shape);

  // Cast the tensor to int32
  const castTensor = resizedTensor.cast("int32");

  // Perform segmentation
  const segmentationPredictions = await segmentationModel.detect(castTensor);
  console.log(
    "Number of segmentation predictions:",
    segmentationPredictions.length
  );

  const features = [];

  // Extract features for each segmented object
  for (let i = 0; i < segmentationPredictions.length; i++) {
    const prediction = segmentationPredictions[i];
    const { bbox, class: className, score } = prediction;
    console.log(`Prediction ${i + 1}: Class: ${className}, Score: ${score}`);

    const [x, y, width, height] = bbox;

    // Crop the segmented region from the resized tensor
    const segmentedTensor = tf.slice(
      resizedTensor,
      [y, x, 0],
      [height, width, 3]
    );
    console.log("Segmented tensor shape:", segmentedTensor.shape);

    // Extract features using the pre-trained MobileNet model
    const featureTensor = featureExtractionModel.infer(
      segmentedTensor.expandDims(),
      {
        embedding: true,
      }
    );
    const featureArray = await featureTensor.array();
    features.push(featureArray[0]);
  }

  // Dispose of the tensors to free up memory
  tensor.dispose();
  resizedTensor.dispose();
  castTensor.dispose();

  return features;
}

function captureWebGLPixelData(renderer) {
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

export async function runFeatureExtraction(renderer) {
  if (!segmentationModel || !featureExtractionModel) {
    await loadModels();
  }

  // Extract features from the captured image
  const features = await extractFeatures(renderer);

  return features;
}
