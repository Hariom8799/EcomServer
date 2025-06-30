import { Router } from "express";
import multer from "multer"
import auth from "../middlewares/auth.js";
import {  captureOrderPaypalController, createOrderController, createOrderPaypalController, deleteImageController, deleteOrder, deleteOrderFile, downloadAllOrderFiles, downloadAllOrderFilesSimple, getOrderDetailsController, getOrderFilesGrouped, getTotalOrdersCountController, getUserOrderDetailsController, totalSalesController, totalUsersController, updateOrderStatusController, uploadOrderFiles } from "../controllers/order.controller.js";

const orderRouter = Router();
const upload = multer({ dest: "uploads/" });

orderRouter.post('/create',auth,createOrderController)
orderRouter.get("/order-list",auth,getOrderDetailsController)
orderRouter.get('/create-order-paypal',auth,createOrderPaypalController)
orderRouter.post('/capture-order-paypal',auth,captureOrderPaypalController)
orderRouter.put('/order-status/:id',auth,updateOrderStatusController)
orderRouter.get('/count',auth,getTotalOrdersCountController)
orderRouter.get('/sales',auth,totalSalesController)
orderRouter.get('/users',auth,totalUsersController)
orderRouter.get('/order-list/orders',auth,getUserOrderDetailsController)
orderRouter.delete('/deleteOrder/:id',auth,deleteOrder)
orderRouter.post(
  "/upload-order-files",
  upload.array("files"),
  uploadOrderFiles
);
orderRouter.delete("/delete-file", deleteOrderFile);
orderRouter.post("/download-all-files", downloadAllOrderFiles);
orderRouter.get("/order-files/:orderId", getOrderFilesGrouped);
orderRouter.post("/download-all-files-simple", downloadAllOrderFilesSimple);
export default orderRouter;