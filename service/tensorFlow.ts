import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

import { decodeJpeg } from '@tensorflow/tfjs-react-native';

// load COCO-SSD model
export const loadModel = async () => {
    await tf.ready();
    try {
        const model = await cocoSsd.load();
        console.log('COCO-SSD model loaded successfully');
        return model;
    } catch (error) {
        console.error('Error loading COCO-SSD model:', error);
        return null;
    }
  };

  export const imageToTensor = async (uri: string) => {
    const response = await fetch(uri);
    const imageData = await response.arrayBuffer();
    return decodeJpeg(new Uint8Array(imageData));  // decode jpeg pic
  };


  export const detectObjects = async (model: any, imageTensor: any) => {
    try {
      const prediction = await model.detect(imageTensor); // model predict
  
      console.log('prediction result:', prediction[0]);
      return prediction[0];
    } catch (error) {
      console.error('Error making predictions:', error);
      return null;
    }
  };