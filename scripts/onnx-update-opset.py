import onnx
from onnx import version_converter

model = onnx.load("../app/public/models/yolov8n.onnx")
converted_model = version_converter.convert_version(model, 15)
onnx.save(converted_model, "./converted_model.onnx")