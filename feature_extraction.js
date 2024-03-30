import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

let featureExtractionModel;

async function loadModel() {
  featureExtractionModel = await mobilenet.load();
}

async function pyythonProcessImageData(imageData, objectPositions) {
  try {
    console.log("Processing image data...");
    const response = await fetch("http://localhost:5000/process-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: imageData,
        objectPositions: objectPositions,
      }),
    });

    const data = await response.json();
    console.log("Processed data:", data.processedData);
    // Update your application with the processed data
  } catch (error) {
    console.error("Error processing image data:", error);
  }
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

  // python processing
  await pyythonProcessImageData(imageData, [
    position.x,
    position.y,
    position.z,
  ]);

  // Return the object data
  return {
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z],
    features: featureArray[0],
  };
}
