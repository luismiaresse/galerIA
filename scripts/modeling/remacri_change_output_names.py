import onnx

# Load the ONNX model
model = onnx.load("./Remacri.onnx")

# Change output shape names
print(model.graph.output[0].type.tensor_type.shape.dim)
model.graph.output[0].type.tensor_type.shape.dim[2].dim_param = "output_w"
model.graph.output[0].type.tensor_type.shape.dim[3].dim_param = "output_h"

onnx.save(model, "./RemacriMod.onnx")

# Check that the IR is well formed
onnx.checker.check_model(model)

# Print a human readable representation of the graph
print(onnx.helper.printable_graph(model.graph))
