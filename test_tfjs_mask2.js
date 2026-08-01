import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

async function test() {
  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
  const segmenterConfig = {
    runtime: 'tfjs',
    modelType: 'general',
  };
  const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
  // create dummy tensor
  const dummyImg = tf.zeros([100, 100, 3], 'int32');
  const segmentation = await segmenter.segmentPeople(dummyImg);
  console.log(segmentation);
  const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
  const backgroundColor = {r: 0, g: 0, b: 0, a: 0};
  const mask = await bodySegmentation.toBinaryMask(segmentation, foregroundColor, backgroundColor);
  console.log(mask);
}
test().catch(console.error);
