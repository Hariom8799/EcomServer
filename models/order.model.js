import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  fileUrl: { type: String },
  fileName: { type: String },
  folderName: { type: String },
  uploadedAt : {
    type: Date,
    default :  new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  },
  uploadedBy : {
    type : String
  },
  fileVersion:{
    type : Number,
    default : 1
  }
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    products: [
      {
        productId: {
          type: String,
        },
        productTitle: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        price: {
          type: Number,
        },
        image: {
          type: String,
        },
        subTotal: {
          type: Number,
        },
      },
    ],
    paymentId: {
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      default: "",
    },
    order_status: {
      type: String,
      default: "confirm",
    },
    delivery_address: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
    userFiles: [fileSchema],
    adminFiles: [fileSchema],
  },
  {
    timestamps: true,
  }
);

const OrderModel = mongoose.model('order', orderSchema)

export default OrderModel