
# Get image path argument
import argparse
parser = argparse.ArgumentParser(description='Upscale an image using Remacri')
parser.add_argument('image', type=str, help='Path to the image')
args = parser.parse_args()


import onnx
import onnxruntime

# Upscale an image using Remacri

# Load the model
model_path = './RemacriMod.onnx'
model = onnx.load(model_path)
# onnx.checker.check_model(model)

# Create a session
sess = onnxruntime.InferenceSession(model_path)

# Load an image
import cv2
import numpy as np
image: cv2.Mat = cv2.imread(args.image)
# Remove alpha channel

# IMAGE IS IN BGR FORMAT
image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
print("Pretranspose image: ", image)
inputWidth = image.shape[0]
inputHeight = image.shape[1]
channels = image.shape[2]
# 4x upscale
outputWidth = inputWidth * 4
outputHeight = inputHeight * 4

# Normalize the image
image = image / 255.0
# Print each axis values
inputBandSize = inputWidth * inputHeight
rBand = []
gBand = []
bBand = []
for i in range(0, inputHeight):
    for j in range(0, inputWidth):
        rBand.append(image[i][j][0])
        gBand.append(image[i][j][1])
        bBand.append(image[i][j][2])
    
# Print 10 last values of each band
print("Red band (input): ")
for i in range( (inputBandSize - 10), inputBandSize):
    print(rBand[i])
    
print("Green band (input): ")
for i in range( (inputBandSize - 10), inputBandSize):
    print(gBand[i])

print("Blue band (input): ")
for i in range( (inputBandSize - 10), inputBandSize):
    print(bBand[i])


image = np.transpose(image, (2, 0, 1))
print("Transposed image: ", image)
image = np.expand_dims(image, axis=0).astype(np.float32)

print(image.shape)

print("Input: ", image)

# Run the model
output = sess.run(None, {'input': image})[0][0]

print(output.shape)
print("Output: ", output)

# Post-process the output
# The output is a 3D tensor with shape (1, 3, H, W)
# output = np.squeeze(output)
# print("Output squeezed: ", output.shape)

# Print each axis values
outputBandSize = outputWidth * outputHeight
bBand = []
gBand = []
rBand = []
for i in range(0, outputHeight):
    for j in range(0, outputWidth):
        bBand.append(output[0][i][j])
        gBand.append(output[1][i][j])
        rBand.append(output[2][i][j])
        
# Print 10 last values of each band
print("Red band (output): ")
for i in range( (outputBandSize - 10), outputBandSize):
    print(rBand[i])
    
print("Green band (output): ")
for i in range( (outputBandSize - 10), outputBandSize):
    print(gBand[i])
    
print("Blue band (output): ")
for i in range( (outputBandSize - 10), outputBandSize):
    print(bBand[i])

# Transpose the output from (3, H, W) to (H, W, 3)
output = np.transpose(output, (1, 2, 0))
print("Output transposed: ", output)

# output = np.clip(output, 0, 1)
output = (output * 255).astype(np.uint8)

print("Output postprocessed: ", output)

# Save the output
cv2.imwrite('./upscaled.png', output)

