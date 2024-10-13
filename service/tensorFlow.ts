import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';

// load model
export const loadModel = async () => {
    await tf.ready();
    try {
        const modelJson = require('../assets/model/model.json');
        const modelWeights = [
          require('../assets/model/shard1of10.bin'),
          require('../assets/model/shard2of10.bin'),
          require('../assets/model/shard3of10.bin'),
          require('../assets/model/shard4of10.bin'),
          require('../assets/model/shard5of10.bin'),
          require('../assets/model/shard6of10.bin'),
          require('../assets/model/shard7of10.bin'),
          require('../assets/model/shard8of10.bin'),
          require('../assets/model/shard9of10.bin'),
          require('../assets/model/shard10of10.bin'),
        ]

        const model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
        return model;
    } catch (error) {
        console.error('Error loading model:', error);
        return null;
    }
  };

  export const imageToTensor = async (uri: string) => {
    const response = await fetch(uri);
    const imageData = await response.arrayBuffer();
 
    const image = decodeJpeg(new Uint8Array(imageData));

    let tensor = tf.image.resizeBilinear(image, [640, 640]);
    tensor = tensor.expandDims(0).toFloat().div(tf.scalar(255));

    return tensor;  // decode jpeg pic
  };


  export const detectObjects = async (model: any, imageTensor: any, imageData: any) => {
    try {
      const predictions = await model.execute(imageTensor); // model predict
      const result = await handlePrediction(predictions, imageData);
  
      return result;
    } catch (error) {
      console.error('Error making predictions:', error);
      return null;
    }
  };

  async function handlePrediction(predictions: any, imageData: any) {

    const { width, height } = imageData; 

    const reshapedPredictions = predictions.reshape([5, 8400]);
    const boxesTensor = reshapedPredictions.slice([0, 0], [4, 8400]);
    const scoresTensor = reshapedPredictions.slice([4, 0], [1, 8400]).squeeze();

    // Convert tensors to arrays for readable output
    const boxes = await boxesTensor.array();
    const scores = await scoresTensor.array();
    const maxScoreIndex = scores.indexOf(Math.max(...scores)); 
  
    const topBox = boxes.map((row: any) => row[maxScoreIndex]);
  
    const x_c = topBox[0] / 640 * width;
    const y_c = topBox[1] / 640 * height;
    const w = topBox[2] / 640 * width;
    const h = topBox[3] / 640 * height;

    const x = x_c - w / 2; // Top-left x-coordinate
    const y = y_c - h / 2; // Top-left y-coordinate
  
    return [x, y, w, h];
  }
