import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

let featureExtractionModel;

async function loadModel() {
  featureExtractionModel = await mobilenet.load();
}

export async function processObject(object, snapshot) {
  if (!featureExtractionModel) {
    await loadModel();
  }

  // Preprocess the snapshot
  const pixelData = new Uint8ClampedArray(snapshot.data);
  const imageData = new ImageData(pixelData, snapshot.width, snapshot.height);
  const tensor = tf.browser.fromPixels(imageData, 3);
  const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]); // Resize to match MobileNet input size

  // Extract features using the pre-trained MobileNet model
  const featureTensor = featureExtractionModel.infer(
    resizedTensor.expandDims(),
    {
      embedding: true,
    }
  );
  const featureArray = await featureTensor.array();

  // Dispose of the tensors to free up memory
  tensor.dispose();
  resizedTensor.dispose();
  featureTensor.dispose();

  // Extract position and rotation from the object
  const position = object.position;
  const rotation = object.rotation;

  // Return the object data
  return {
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z],
    features: featureArray[0],
  };
}
