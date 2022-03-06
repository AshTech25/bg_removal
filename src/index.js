let input = document.getElementById("fileInput");
let imgElement = document.getElementById("imageSrc");

input.addEventListener("change", function (e) {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
});
//nope
const printMatrix = (mat) => {
  let line = "";
  const resizedImg = resizeImg(mat,100,100);
  for (let i = 0; i < resizedImg.rows; i++) {
    for (let j = 0; j < resizedImg.cols; j++) {
      line += `${resizedImg.ucharAt(i, j)} ` ;

    }
    line += "\n";
  }
  return line;
}

const resizeImg = (src,h,w) => {
  let dst = new cv.Mat();
  let dsize = new cv.Size(h, w);
  // You can try more different parameters
  cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
  return dst;
}

const giveAverage = (src) => {
  let score = 0;
  const resizedImg = resizeImg(src,100,100);
  for (let i = 0; i <= resizedImg.rows; i++) {
    for (let j = 0; j <= resizedImg.cols; j++) {
      score += resizedImg.ucharAt(i, j)
    }
  }
  score = score/10000;
  return score
}

const flattenImage = (img) => {
  let sample= new cv.Mat(img.rows * img.cols, 3, cv.CV_32F);
  for( let y = 0; y < img.rows; y++ )
    {for( let x = 0; x < img.cols; x++ )
      for( let z = 0; z < 3; z++){
        sample.floatPtr(y + x*img.rows)[z] = img.ucharPtr(y,x)[z];}}
  return sample
}

const whiteBgRemoval = (grayImg,img) => {
  // Threshold white bg image
   let dst1 = new cv.Mat();
   cv.threshold(grayImg, dst1, 175, 255, cv.THRESH_BINARY);
  // Inv Image 
   let maskInv = new cv.Mat(); 
   cv.bitwise_not(dst1, maskInv);
   let dst4 = new cv.Mat();
  // apply and operation
   cv.bitwise_and(img,img,dst4,mask=maskInv);
   dst1.delete();
   maskInv.delete();
   return dst4;    
}

const whiteBgRemovalWithoutInv = (grayImg,img) => {
  // Threshold white bg image
  let dst1 = new cv.Mat();
  cv.threshold(grayImg, dst1, 175, 255, cv.THRESH_BINARY);
  // Inv Image 
  let dst4 = new cv.Mat();
 // apply and operation
  cv.bitwise_and(img,img,dst4,mask=dst1);
  dst1.delete();
  return dst4;
}

const blackBgRemoval = (grayImg,img) => {
  let dst2 = new cv.Mat();
  cv.threshold(grayImg, dst2, 100, 255, cv.THRESH_BINARY);
 // apply and operation
  let dst3 = new cv.Mat();
  cv.bitwise_and(img,img,dst3,mask=dst2);
  dst2.delete();
  return dst3;
}

const setParams = (k,attempts) => {
  return {k,attempts};
}

const reformImage = (img,labels,centers) => {
  var newImage= new cv.Mat(img.size(),img.type());
 for( let y = 0; y < img.rows; y++ )
    for( let x = 0; x < img.cols; x++ )
    { 
      var cluster_idx = labels.intAt(y + x*img.rows,0);
      newImage.ucharPtr(y,x)[0] = centers.floatAt(cluster_idx, 0);
      newImage.ucharPtr(y,x)[1] = centers.floatAt(cluster_idx, 1);
      newImage.ucharPtr(y,x)[2] = centers.floatAt(cluster_idx, 2);
      newImage.ucharPtr(y,x)[3] = 255;

    }
  return newImage
}

const applyKmeans = (img) => {
  // resize image
  // const resizedImg = resizeImg(img,100,100)
  // Cvt to rgb
  let rgbImg = new cv.Mat();
  cv.cvtColor(img,rgbImg,cv.COLOR_RGBA2RGB);
  // flatten image 
  let flattenedImg = flattenImage(rgbImg);
  //set parameters
  let clusters = 2;
  let attempts = 10;
  let labels= new cv.Mat();
  let centers= new cv.Mat();
  let crite= new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 10, 1.0);
  // Apply k-means
  cv.kmeans(flattenedImg, clusters, labels, crite, attempts, cv.KMEANS_PP_CENTERS, centers );
  flattenedImg.delete();
  // reform image
  let newImage= reformImage(rgbImg,labels,centers);
  rgbImg.delete();
  labels.delete();
  centers.delete();
  // cvt to Gray 
  let dst = new cv.Mat();
  cv.cvtColor(newImage, dst, cv.COLOR_RGBA2GRAY, 0);
  newImage.delete();
   // remove white bg
  let whiteBgRemoved = whiteBgRemoval(dst,img);
  let whiteBgRemoved01 = whiteBgRemovalWithoutInv(dst,img);   
  // remove black bg
  let blackBgRemoved = blackBgRemoval(dst,img);
  dst.delete();
  cv.imshow('bgRemoved1', blackBgRemoved);
  cv.imshow('bgRemoved2', whiteBgRemoved);
  cv.imshow('bgRemoved3', whiteBgRemoved01);
  blackBgRemoved.delete();
  whiteBgRemoved.delete();
}

const applyThresholding = (mat) => {
  let dst = new cv.Mat();
  cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY, 0);
  let dst01 = whiteBgRemoval(dst,mat);
  let dst02 = whiteBgRemovalWithoutInv(dst,mat);
  let dst03 = blackBgRemoval(dst,mat);
  dst.delete();
  cv.imshow('threshold1', dst03);
  cv.imshow('threshold2', dst01);
  cv.imshow('threshold3', dst02);
  dst01.delete();
  dst02.delete();
  dst03.delete();
}

imgElement.onload = function () {
  let mat = cv.imread(imgElement);
  applyKmeans(mat);
  // applyThresholding(mat);
  mat.delete();
  };
function onOpenCvReady() {
  document.getElementById("status").innerHTML = "OpenCV.js is ready.";
}

