import mongoose from "mongoose";

const ProductFileSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    fileUrls: [
      {
        type: String,
        required: true,
      },
    ],
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User"
      },
    ],
  },
  {
    timestamps: true,
  }
);


const ProductFileModel = mongoose.model("productFile", ProductFileSchema);

export default ProductFileModel;