import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import paypal from "@paypal/checkout-server-sdk";
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import {uploadFiles,deleteImage} from "../utils/ImageUpload.js"

// Import required modules for ZIP creation
// const archiver = require("archiver"); // npm install archiver
import archiver from "archiver";
// const path = require("path");
import path from "path"
// const fs = require("fs");
import fs from "fs";
// const https = require("https");
// const http = require("http"); http
import https from "https"
import http from "http"

// Create ZIP archive
const archive = archiver("zip", {
  zlib: { level: 9 },
});



export const createOrderController = async (request, response) => {
    try {

        let order = new OrderModel({
            userId: request.body.userId,
            products: request.body.products,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmt,
            date: request.body.date
        });

        if (!order) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        order = await order.save();

        for (let i = 0; i < request.body.products.length; i++) {

            const product = await ProductModel.findOne({ _id: request.body.products[i].productId })
            console.log(product)

            await ProductModel.findByIdAndUpdate(
                request.body.products[i].productId,
                {
                    countInStock: parseInt(request.body.products[i].countInStock - request.body.products[i].quantity),
                    sale: parseInt(product?.sale + request.body.products[i].quantity)
                },
                { new: true }
            );
        }

        const user = await UserModel.findOne({ _id: request.body.userId })

        const recipients = [];
        recipients.push(user?.email);

        // Send verification email
        await sendEmailFun({
            sendTo: recipients,
            subject: "Order Confirmation",
            text: "",
            html: OrderConfirmationEmail(user?.name, order)
        })


        return response.status(200).json({
            error: false,
            success: true,
            message: "Order Placed",
            order: order
        });


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        const orderlist = await OrderModel.find().sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));

        const total = await OrderModel.countDocuments(orderlist);

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getUserOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        const orderlist = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));

        const orderTotal = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId');

        const total = await orderTotal?.length;

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getTotalOrdersCountController(request, response) {
    try {
        const ordersCount = await OrderModel.countDocuments();
        return response.status(200).json({
            error: false,
            success: true,
            count: ordersCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



function getPayPalClient() {

    const environment =
        process.env.PAYPAL_MODE === "live"
            ? new paypal.core.LiveEnvironment(
                process.env.PAYPAL_CLIENT_ID_LIVE,
                process.env.PAYPAL_SECRET_LIVE
            )
            : new paypal.core.SandboxEnvironment(
                process.env.PAYPAL_CLIENT_ID_TEST,
                process.env.PAYPAL_SECRET_TEST
            );

    return new paypal.core.PayPalHttpClient(environment);


}


export const createOrderPaypalController = async (request, response) => {
    try {

        const req = new paypal.orders.OrdersCreateRequest();
        req.prefer("return=representation");

        req.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: request.query.totalAmount
                }
            }]
        });


        try {
            const client = getPayPalClient();
            const order = await client.execute(req);
            response.json({ id: order.result.id });
        } catch (error) {
            console.error(error);
            response.status(500).send("Error creating PayPal order");
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




export const captureOrderPaypalController = async (request, response) => {
    try {
        const { paymentId } = request.body;

        const req = new paypal.orders.OrdersCaptureRequest(paymentId);
        req.requestBody({});

        const orderInfo = {
            userId: request.body.userId,
            products: request.body.products,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmount,
            date: request.body.date
        }

        const order = new OrderModel(orderInfo);
        await order.save();

        const user = await UserModel.findOne({ _id: request.body.userId })

        const recipients = [];
        recipients.push(user?.email);

        // Send verification email
        await sendEmailFun({
            sendTo: recipients,
            subject: "Order Confirmation",
            text: "",
            html: OrderConfirmationEmail(user?.name, order)
        })


        for (let i = 0; i < request.body.products.length; i++) {

            const product = await ProductModel.findOne({ _id: request.body.products[i].productId })

            await ProductModel.findByIdAndUpdate(
                request.body.products[i].productId,
                {
                    countInStock: parseInt(request.body.products[i].countInStock - request.body.products[i].quantity),
                    sale: parseInt(product?.sale + request.body.products[i].quantity)
                },
                { new: true }
            );
        }


        return response.status(200).json(
            {
                success: true,
                error: false,
                order: order,
                message: "Order Placed"
            }
        );

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export const updateOrderStatusController = async (request, response) => {
    try {
        const { id, order_status } = request.body;

        const updateOrder = await OrderModel.updateOne(
            {
                _id: id,
            },
            {
                order_status: order_status,
            },
            { new: true }
        )

        return response.json({
            message: "Update order status",
            success: true,
            error: false,
            data: updateOrder
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}






export const totalSalesController = async (request, response) => {
    try {
        const currentYear = new Date().getFullYear();

        const ordersList = await OrderModel.find();

        let totalSales = 0;
        let monthlySales = [
            {
                name: 'JAN',
                TotalSales: 0
            },
            {
                name: 'FEB',
                TotalSales: 0
            },
            {
                name: 'MAR',
                TotalSales: 0
            },
            {
                name: 'APRIL',
                TotalSales: 0
            },
            {
                name: 'MAY',
                TotalSales: 0
            },
            {
                name: 'JUNE',
                TotalSales: 0
            },
            {
                name: 'JULY',
                TotalSales: 0
            },
            {
                name: 'AUG',
                TotalSales: 0
            },
            {
                name: 'SEP',
                TotalSales: 0
            },
            {
                name: 'OCT',
                TotalSales: 0
            },
            {
                name: 'NOV',
                TotalSales: 0
            },
            {
                name: 'DEC',
                TotalSales: 0
            },
        ]


        for (let i = 0; i < ordersList.length; i++) {
            totalSales = totalSales + parseInt(ordersList[i].totalAmt);
            const str = JSON.stringify(ordersList[i]?.createdAt);
            const year = str.substr(1, 4);
            const monthStr = str.substr(6, 8);
            const month = parseInt(monthStr.substr(0, 2));

            if (currentYear == year) {

                if (month === 1) {
                    monthlySales[0] = {
                        name: 'JAN',
                        TotalSales: monthlySales[0].TotalSales = parseInt(monthlySales[0].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 2) {

                    monthlySales[1] = {
                        name: 'FEB',
                        TotalSales: monthlySales[1].TotalSales = parseInt(monthlySales[1].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 3) {
                    monthlySales[2] = {
                        name: 'MAR',
                        TotalSales: monthlySales[2].TotalSales = parseInt(monthlySales[2].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 4) {
                    monthlySales[3] = {
                        name: 'APRIL',
                        TotalSales: monthlySales[3].TotalSales = parseInt(monthlySales[3].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 5) {
                    monthlySales[4] = {
                        name: 'MAY',
                        TotalSales: monthlySales[4].TotalSales = parseInt(monthlySales[4].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 6) {
                    monthlySales[5] = {
                        name: 'JUNE',
                        TotalSales: monthlySales[5].TotalSales = parseInt(monthlySales[5].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 7) {
                    monthlySales[6] = {
                        name: 'JULY',
                        TotalSales: monthlySales[6].TotalSales = parseInt(monthlySales[6].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 8) {
                    monthlySales[7] = {
                        name: 'AUG',
                        TotalSales: monthlySales[7].TotalSales = parseInt(monthlySales[7].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 9) {
                    monthlySales[8] = {
                        name: 'SEP',
                        TotalSales: monthlySales[8].TotalSales = parseInt(monthlySales[8].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 10) {
                    monthlySales[9] = {
                        name: 'OCT',
                        TotalSales: monthlySales[9].TotalSales = parseInt(monthlySales[9].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 11) {
                    monthlySales[10] = {
                        name: 'NOV',
                        TotalSales: monthlySales[10].TotalSales = parseInt(monthlySales[10].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 12) {
                    monthlySales[11] = {
                        name: 'DEC',
                        TotalSales: monthlySales[11].TotalSales = parseInt(monthlySales[11].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

            }


        }


        return response.status(200).json({
            totalSales: totalSales,
            monthlySales: monthlySales,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const totalUsersController = async (request, response) => {
    try {
        const users = await UserModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);



        let monthlyUsers = [
            {
                name: 'JAN',
                TotalUsers: 0
            },
            {
                name: 'FEB',
                TotalUsers: 0
            },
            {
                name: 'MAR',
                TotalUsers: 0
            },
            {
                name: 'APRIL',
                TotalUsers: 0
            },
            {
                name: 'MAY',
                TotalUsers: 0
            },
            {
                name: 'JUNE',
                TotalUsers: 0
            },
            {
                name: 'JULY',
                TotalUsers: 0
            },
            {
                name: 'AUG',
                TotalUsers: 0
            },
            {
                name: 'SEP',
                TotalUsers: 0
            },
            {
                name: 'OCT',
                TotalUsers: 0
            },
            {
                name: 'NOV',
                TotalUsers: 0
            },
            {
                name: 'DEC',
                TotalUsers: 0
            },
        ]




        for (let i = 0; i < users.length; i++) {

            if (users[i]?._id?.month === 1) {
                monthlyUsers[0] = {
                    name: 'JAN',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 2) {
                monthlyUsers[1] = {
                    name: 'FEB',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 3) {
                monthlyUsers[2] = {
                    name: 'MAR',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 4) {
                monthlyUsers[3] = {
                    name: 'APRIL',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 5) {
                monthlyUsers[4] = {
                    name: 'MAY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 6) {
                monthlyUsers[5] = {
                    name: 'JUNE',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 7) {
                monthlyUsers[6] = {
                    name: 'JULY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 8) {
                monthlyUsers[7] = {
                    name: 'AUG',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 9) {
                monthlyUsers[8] = {
                    name: 'SEP',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 10) {
                monthlyUsers[9] = {
                    name: 'OCT',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 11) {
                monthlyUsers[10] = {
                    name: 'NOV',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 12) {
                monthlyUsers[11] = {
                    name: 'DEC',
                    TotalUsers: users[i].count
                }
            }

        }



        return response.status(200).json({
            TotalUsers: monthlyUsers,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteOrder(request, response) {
    const order = await OrderModel.findById(request.params.id);

    console.log(request.params.id)

    if (!order) {
        return response.status(404).json({
            message: "Order Not found",
            error: true,
            success: false
        })
    }


    const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);

    if (!deletedOrder) {
        response.status(404).json({
            message: "Order not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Order Deleted!",
    });
}

// export const uploadOrderFiles = async (req, res) => {
//   try {
//     const { orderId, uploaderType } = req.body; // "user" or "admin"

//     if (!orderId || !["user", "admin"].includes(uploaderType)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid orderId or uploaderType" });
//     }

//     // Use your own helper function
//     const result = await uploadFiles(req);

//     if (!result.success) {
//       return res
//         .status(500)
//         .json({
//           success: false,
//           message: "File upload failed",
//           error: result.error,
//         });
//     }

//     const filesToAdd = result.images;

//     const updateField =
//       uploaderType === "user"
//         ? { $push: { userFiles: { $each: filesToAdd } } }
//         : { $push: { adminFiles: { $each: filesToAdd } } };

//     const updatedOrder = await OrderModel.findByIdAndUpdate(
//       orderId,
//       updateField,
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Files uploaded and attached to order successfully",
//       files: filesToAdd,
//       order: updatedOrder,
//     });
//   } catch (err) {
//     console.error("Upload failed:", err);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Internal server error",
//         error: err.message,
//       });
//   }
// };

// Updated uploadOrderFiles function
export const uploadOrderFiles = async (req, res) => {
    try {
      const { orderId, uploaderType, folderName } = req.body;
  
      if (!orderId || !["user", "admin"].includes(uploaderType)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid orderId or uploaderType" });
      }
  
      if (!folderName || folderName.trim() === "") {
        return res
          .status(400)
          .json({ success: false, message: "Folder name is required" });
      }
  
      // Use your existing uploadFiles helper function
      const result = await uploadFiles(req);
  
      if (!result.success) {
        return res
          .status(500)
          .json({
            success: false,
            message: "File upload failed",
            error: result.error,
          });
      }
  
      // Get existing order to check for existing files in the same folder
      const existingOrder = await OrderModel.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      // Determine the field to check for existing files
      const existingFiles = uploaderType === "user" ? existingOrder.userFiles : existingOrder.adminFiles;
      
      // Find the highest version number for files in this folder
      const filesInFolder = existingFiles.filter(file => file.folderName === folderName.trim());
      const maxVersion = filesInFolder.length > 0 
        ? Math.max(...filesInFolder.map(f => f.fileVersion || 1))
        : 0;
  
      // Prepare files with enhanced metadata
      const filesToAdd = result.images.map((file, index) => ({
        fileUrl: file.fileUrl || file,
        fileName: req.files ? req.files[index]?.originalname || `File ${index + 1}` : `File ${index + 1}`,
        folderName: folderName.trim(),
        uploadedAt: new Date(),
        uploadedBy: uploaderType,
        fileVersion: maxVersion + index + 1
      }));
  
      const updateField =
        uploaderType === "user"
          ? { $push: { userFiles: { $each: filesToAdd } } }
          : { $push: { adminFiles: { $each: filesToAdd } } };
  
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        orderId,
        updateField,
        { new: true }
      ).populate('userId', 'name email');
  
      res.status(200).json({
        success: true,
        message: "Files uploaded and attached to order successfully",
        files: filesToAdd,
        order: updatedOrder,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Internal server error",
          error: err.message,
        });
    }
  };

export const deleteImageController = async (req, res) => {
  try {
    const { fileUrl, imageUrl, orderId, fileType } = req.body;
    const urlToDelete = fileUrl || imageUrl;

    if (!urlToDelete || !orderId || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileUrl/imageUrl, orderId, and fileType are required",
      });
    }

    // Step 1: Delete image from cloud
    const result = await deleteImage(urlToDelete);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to delete file from cloud",
      });
    }

    // Step 2: Remove file reference from DB
    const updateField = fileType === "user" ? "userFiles" : "adminFiles";
    const updateResult = await OrderModel.findByIdAndUpdate(
      orderId,
      { $pull: { [updateField]: { fileUrl: urlToDelete } } },
      { new: true }
    );

    if (!updateResult) {
      return res.status(404).json({
        success: false,
        message: "Order not found or file not associated with it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "File deleted successfully from cloud and database",
      order: updateResult,
    });
  } catch (error) {
    console.error("Error in deleteImageController:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting file",
      error: error.message,
    });
  }
};

export const deleteOrderFile = async (req, res) => {
  try {
    const { fileUrl, fileType, orderId } = req.body;

    if (!fileUrl || !fileType || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: fileUrl, fileType, orderId",
      });
    }

    if (!["user", "admin"].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fileType. Must be 'user' or 'admin'",
      });
    }

    // Find and update the order by removing the specific file
    const fieldToUpdate = fileType === "user" ? "userFiles" : "adminFiles";

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        $pull: {
          [fieldToUpdate]: { fileUrl: fileUrl },
        },
      },
      { new: true }
    ).populate("userId", "name email");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Optionally, delete the file from storage (implement based on your storage solution)
    const result = await deleteImage(fileUrl);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Failed to delete file from cloud",
      });
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const downloadAllOrderFiles = async (req, res) => {
  try {
    const { orderId, fileType } = req.body;

    if (!orderId || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: orderId, fileType",
      });
    }

    if (!["user", "admin"].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fileType. Must be 'user' or 'admin'",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const files = fileType === "user" ? order.userFiles : order.adminFiles;

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${fileType} files found for this order`,
      });
    }

    // Set response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileType}_files_${orderId}.zip"`
    );

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    const downloadPromises = files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const fileUrl = file.fileUrl;
        const fileName = file.fileName || `file_${index + 1}`;
        const folderName = file.folderName || "uncategorized";
        const filePath = `${folderName}/${fileName}`;

        // Determine protocol
        const client = fileUrl.startsWith("https") ? https : http;

        client
          .get(fileUrl, (response) => {
            if (response.statusCode === 200) {
              archive.append(response, { name: filePath });
              response.on("end", resolve);
            } else {
              console.error(`Failed to download file: ${fileUrl}`);
              resolve(); // Continue with other files
            }
          })
          .on("error", (err) => {
            console.error(`Error downloading file ${fileUrl}:`, err);
            resolve(); // Continue with other files
          });
      });
    });

    // Wait for all files to be added
    Promise.all(downloadPromises)
      .then(() => {
        archive.finalize();
      })
      .catch((error) => {
        console.error("Error creating ZIP:", error);
        res.status(500).json({
          success: false,
          message: "Error creating ZIP file",
          error: error.message,
        });
      });
  } catch (error) {
    console.error("Download all files error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getOrderFilesGrouped = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findById(orderId).populate(
      "userId",
      "name email"
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Group files by folder
    const groupUserFiles = (order.userFiles || []).reduce((acc, file) => {
      const folder = file.folderName || "Uncategorized";
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(file);
      return acc;
    }, {});

    const groupAdminFiles = (order.adminFiles || []).reduce((acc, file) => {
      const folder = file.folderName || "Uncategorized";
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(file);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        userId: order.userId,
        userFiles: groupUserFiles,
        adminFiles: groupAdminFiles,
        totalUserFiles: order.userFiles?.length || 0,
        totalAdminFiles: order.adminFiles?.length || 0,
      },
    });
  } catch (error) {
    console.error("Get order files error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const downloadAllOrderFilesSimple = async (req, res) => {
  try {
    const { orderId, fileType } = req.body;

    if (!orderId || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: orderId, fileType",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const files = fileType === "user" ? order.userFiles : order.adminFiles;

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${fileType} files found for this order`,
      });
    }

    // Return file URLs for frontend to handle download
    res.status(200).json({
      success: true,
      files: files.map((file) => ({
        url: file.fileUrl,
        name: file.fileName,
        folder: file.folderName,
      })),
    });
  } catch (error) {
    console.error("Download all files error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
  