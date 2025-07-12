import ProductModel from '../models/product.modal.js';
import ProductRAMSModel from '../models/productRAMS.js';
import ProductWEIGHTModel from '../models/productWEIGHT.js';
import ProductSIZEModel from '../models/productSIZE.js';
import { uploadFiles, deleteImage } from "../utils/ImageUpload.js";
import archiver from "archiver";
import http from "http";
import https from "https";

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});


//image upload
var imagesArr = [];
export async function uploadImages(request, response) {
    try {
        imagesArr = [];

        const image = request.files;

        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {

            const img = await cloudinary.uploader.upload(
                image[i].path,
                options,
                function (error, result) {
                    imagesArr.push(result.secure_url);
                    fs.unlinkSync(`uploads/${request.files[i].filename}`);
                }
            );
        }

        return response.status(200).json({
            images: imagesArr
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

var bannerImage = [];
export async function uploadBannerImages(request, response) {
    try {
        bannerImage = [];

        const image = request.files;

        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {

            const img = await cloudinary.uploader.upload(
                image[i].path,
                options,
                function (error, result) {
                    bannerImage.push(result.secure_url);
                    fs.unlinkSync(`uploads/${request.files[i].filename}`);
                }
            );
        }

        return response.status(200).json({
            images: bannerImage
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function createProduct(request, response) {
  try {
    // Upload images using your existing helper (e.g., multer + Cloudinary/S3)
    const uploadResult = await uploadFiles(request);

    console.log("request ", request.body);

    if (!uploadResult.success) {
      return response.status(500).json({
        message: uploadResult.error,
        success: false,
        error: true,
      });
    }

    // Build the files array for the model
    const filesArr = uploadResult.images.map((file) => ({
      ...file,
      uploadedBy: request.body.uploadedBy[0] || null, // If you have user in request
      uploadedAt: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
      updatedAt: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    }));

    const product = new ProductModel({
      name: request.body.name,
      description: request.body.description,
      images: request.body.images || [],
      bannerimages: request.body.bannerimages || [],
      bannerTitleName: request.body.bannerTitleName,
      isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
      brand: request.body.brand,
      price: request.body.price,
      oldPrice: request.body.oldPrice,
      catName: request.body.catName,
      category: request.body.category,
      catId: request.body.catId,
      subCatId: request.body.subCatId,
      subCat: request.body.subCat,
      thirdsubCat: request.body.thirdsubCat,
      thirdsubCatId: request.body.thirdsubCatId,
      countInStock: request.body.countInStock,
      rating: request.body.rating,
      isFeatured: request.body.isFeatured,
      discount: request.body.discount,
      productRam: request.body.productRam || [],
      size: request.body.size || [],
      productWeight: request.body.productWeight || [],
      files: filesArr.length > 0 ? filesArr : undefined,
    });

    const savedProduct = await product.save();

    if (!savedProduct) {
      return response.status(500).json({
        error: true,
        success: false,
        message: "Product not created",
      });
    }

    return response.status(200).json({
      message: "Product created successfully",
      error: false,
      success: true,
      product: savedProduct,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateProduct(request, response) {
  try {
    const productId = request.params.id;

    console.log("hhhh", request.body);
    // Get existing files to keep (if any)
    const existingFiles = request.body.existingFiles
      ? JSON.parse(request.body.existingFiles)
      : [];

    // Get list of files to delete by URL
    const deletedFiles = request.body.deletedFiles
      ? JSON.parse(request.body.deletedFiles)
      : [];

    // Delete files from Cloudinary
    for (const fileUrl of deletedFiles) {
      await deleteImage(fileUrl);
    }

    // Upload new files (if any)
    let uploadedFiles = [];
    if (request.files && request.files.length > 0) {
      const uploadResult = await uploadFiles(request);
      if (!uploadResult.success) {
        return response.status(500).json({
          message: uploadResult.error,
          success: false,
          error: true,
        });
      }
      uploadedFiles = uploadResult.images.map((file) => ({
        ...file,
        uploadedBy: request.body.uploadedBy || "User",
        uploadedAt: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
        updatedAt: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      }));
    }
    
    const updatedExistingFiles = existingFiles.map((file) => ({
      ...file,
      updatedAt: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    }));

    // Final file list: keep existing + newly uploaded
    const finalFiles = [...updatedExistingFiles, ...uploadedFiles];

    // Update the product
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        name: request.body.name,
        subCat: request.body.subCat,
        description: request.body.description,
        bannerimages: request.body.bannerimages,
        bannerTitleName: request.body.bannerTitleName,
        isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
        images: request.body.images,
        brand: request.body.brand,
        price: request.body.price,
        oldPrice: request.body.oldPrice,
        catId: request.body.catId,
        catName: request.body.catName,
        subCatId: request.body.subCatId,
        category: request.body.category,
        thirdsubCat: request.body.thirdsubCat,
        thirdsubCatId: request.body.thirdsubCatId,
        countInStock: request.body.countInStock,
        rating: request.body.rating,
        isFeatured: request.body.isFeatured,
        productRam: request.body.productRam,
        size: request.body.size,
        productWeight: request.body.productWeight,
        files: finalFiles,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return response.status(404).json({
        message: "The product could not be updated!",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      message: "The product has been updated.",
      product: updatedProduct,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log("error", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products
export async function getAllProducts(request, response) {
    try {

        const { page, limit } = request.query;
        const totalProducts = await ProductModel.find();

        const products = await ProductModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));

        const total = await ProductModel.countDocuments(products);

        if (!products) {
            return response.status(400).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalCount: totalProducts?.length,
            totalProducts: totalProducts
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by category id
export async function getAllProductsByCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            catId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by category name
export async function getAllProductsByCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            catName: request.query.catName
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by sub category id
export async function getAllProductsBySubCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            subCatId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by sub category name
export async function getAllProductsBySubCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            subCat: request.query.subCat
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by sub category id
export async function getAllProductsByThirdLavelCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            thirdsubCatId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by sub category name
export async function getAllProductsByThirdLavelCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            thirdsubCat: request.query.thirdsubCat
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products by price
export async function getAllProductsByPrice(request, response) {
    let productList = [];

    if (request.query.catId !== "" && request.query.catId !== undefined) {
        const productListArr = await ProductModel.find({
            catId: request.query.catId,
        }).populate("category");

        productList = productListArr;
    }

    if (request.query.subCatId !== "" && request.query.subCatId !== undefined) {
        const productListArr = await ProductModel.find({
            subCatId: request.query.subCatId,
        }).populate("category");

        productList = productListArr;
    }


    if (request.query.thirdsubCatId !== "" && request.query.thirdsubCatId !== undefined) {
        const productListArr = await ProductModel.find({
            thirdsubCatId: request.query.thirdsubCatId,
        }).populate("category");

        productList = productListArr;
    }



    const filteredProducts = productList.filter((product) => {
        if (request.query.minPrice && product.price < parseInt(+request.query.minPrice)) {
            return false;
        }
        if (request.query.maxPrice && product.price > parseInt(+request.query.maxPrice)) {
            return false;
        }
        return true;
    });

    return response.status(200).json({
        error: false,
        success: true,
        products: filteredProducts,
        totalPages: 0,
        page: 0,
    });

}

//get all products by rating
export async function getAllProductsByRating(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        console.log(request.query.subCatId)

        let products = [];

        if (request.query.catId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                catId: request.query.catId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }

        if (request.query.subCatId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                subCatId: request.query.subCatId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }


        if (request.query.thirdsubCatId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                thirdsubCatId: request.query.thirdsubCatId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }


        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all products count
export async function getProductsCount(request, response) {
    try {
        const productsCount = await ProductModel.countDocuments();

        if (!productsCount) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            productCount: productsCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all features products
export async function getAllFeaturedProducts(request, response) {
    try {

        const products = await ProductModel.find({
            isFeatured: true
        }).populate("category");

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//get all features products have banners
export async function getAllProductsBanners(request, response) {
    try {

        const products = await ProductModel.find({
            isDisplayOnHomeBanner: true
        }).populate("category");

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function deleteProduct(request, response) {
  try {
    const product = await ProductModel.findById(request.params.id).populate(
      "category"
    );

    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    // Delete images
    const imageUrls = [
      ...(product.images || []),
      ...(product.bannerimages || []),
    ];
    for (const imgUrl of imageUrls) {
      if (imgUrl) {
        await deleteImage(imgUrl);
      }
    }

    // Delete product files
    if (product.files && product.files.length > 0) {
      for (const file of product.files) {
        if (file.fileUrl) {
          await deleteImage(file.fileUrl);
        }
      }
    }

    // Delete product from database
    const deletedProduct = await ProductModel.findByIdAndDelete(
      request.params.id
    );

    if (!deletedProduct) {
      return response.status(500).json({
        message: "Product not deleted!",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

export async function deleteMultipleProduct(request, response) {
  const { ids } = request.body;

  if (!ids || !Array.isArray(ids)) {
    return response.status(400).json({
      error: true,
      success: false,
      message: "Invalid input. 'ids' must be an array.",
    });
  }

  try {
    for (const id of ids) {
      const product = await ProductModel.findById(id);

      if (!product) continue;

      // Delete product images (images + bannerimages)
      const imageUrls = [
        ...(product.images || []),
        ...(product.bannerimages || []),
      ];
      for (const imgUrl of imageUrls) {
        if (imgUrl) {
          await deleteImage(imgUrl);
        }
      }

      // Delete product files
      if (product.files && product.files.length > 0) {
        for (const file of product.files) {
          if (file.fileUrl) {
            await deleteImage(file.fileUrl);
          }
        }
      }
    }

    // Delete all products from DB
    await ProductModel.deleteMany({ _id: { $in: ids } });

    return response.status(200).json({
      message: "Products deleted successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get single product 
export async function getProduct(request, response) {
    try {
        const product = await ProductModel.findById(request.params.id).populate("category");

        if (!product) {
            return response.status(404).json({
                message: "The product is not found",
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            product: product
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//delete images
export async function removeImageFromCloudinary(request, response) {

    const imgUrl = request.query.img;


    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];


    if (imageName) {
        const res = await cloudinary.uploader.destroy(
            imageName,
            (error, result) => {
                // console.log(error, res)
            }
        );

        if (res) {
            response.status(200).send(res);
        }
    }
}

export async function createProductRAMS(request, response) {
    try {
        let productRAMS = new ProductRAMSModel({
            name: request.body.name
        })

        productRAMS = await productRAMS.save();

        if (!productRAMS) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product RAMS Not created"
            });
        }

        return response.status(200).json({
            message: "Product RAMS Created successfully",
            error: false,
            success: true,
            product: productRAMS
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function deleteProductRAMS(request, response) {
    const productRams = await ProductRAMSModel.findById(request.params.id);

    if (!productRams) {
        return response.status(404).json({
            message: "Item Not found",
            error: true,
            success: false
        })
    }

    const deletedProductRams = await ProductRAMSModel.findByIdAndDelete(request.params.id);

    if (!deletedProductRams) {
        response.status(404).json({
            message: "Item not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product Ram Deleted!",
    });
}

export async function updateProductRam(request, response) {

    try {

        const productRam = await ProductRAMSModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
            },
            { new: true }
        );


        if (!productRam) {
            return response.status(404).json({
                message: "the product Ram can not be updated!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "The product Ram is updated",
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


export async function getProductRams(request, response) {

    try {

        const productRam = await ProductRAMSModel.find();

        if (!productRam) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productRam
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductRamsById(request, response) {

    try {

        const productRam = await ProductRAMSModel.findById(request.params.id);

        if (!productRam) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productRam
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function createProductWEIGHT(request, response) {
    try {
        let productWeight = new ProductWEIGHTModel({
            name: request.body.name
        })

        productWeight = await productWeight.save();

        if (!productWeight) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product WEIGHT Not created"
            });
        }

        return response.status(200).json({
            message: "Product WEIGHT Created successfully",
            error: false,
            success: true,
            product: productWeight
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteProductWEIGHT(request, response) {
    const productWeight = await ProductWEIGHTModel.findById(request.params.id);

    if (!productWeight) {
        return response.status(404).json({
            message: "Item Not found",
            error: true,
            success: false
        })
    }

    const deletedProductWeight = await ProductWEIGHTModel.findByIdAndDelete(request.params.id);

    if (!deletedProductWeight) {
        response.status(404).json({
            message: "Item not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product Weight Deleted!",
    });
}


export async function updateProductWeight(request, response) {

    try {

        const productWeight = await ProductWEIGHTModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
            },
            { new: true }
        );


        if (!productWeight) {
            return response.status(404).json({
                message: "the product weight can not be updated!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "The product weight is updated",
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


export async function getProductWeight(request, response) {

    try {

        const productWeight = await ProductWEIGHTModel.find();

        if (!productWeight) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productWeight
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductWeightById(request, response) {

    try {

        const productWeight = await ProductWEIGHTModel.findById(request.params.id);

        if (!productWeight) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productWeight
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function createProductSize(request, response) {
    try {
        let productSize = new ProductSIZEModel({
            name: request.body.name
        })

        productSize = await productSize.save();

        if (!productSize) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product size Not created"
            });
        }

        return response.status(200).json({
            message: "Product size Created successfully",
            error: false,
            success: true,
            product: productSize
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteProductSize(request, response) {
    const productSize = await ProductSIZEModel.findById(request.params.id);

    if (!productSize) {
        return response.status(404).json({
            message: "Item Not found",
            error: true,
            success: false
        })
    }

    const deletedProductSize = await ProductSIZEModel.findByIdAndDelete(request.params.id);

    if (!deletedProductSize) {
        response.status(404).json({
            message: "Item not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product size Deleted!",
    });
}


export async function updateProductSize(request, response) {

    try {

        const productSize = await ProductSIZEModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
            },
            { new: true }
        );


        if (!productSize) {
            return response.status(404).json({
                message: "the product size can not be updated!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "The product size is updated",
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


export async function getProductSize(request, response) {

    try {

        const productSize = await ProductSIZEModel.find();

        if (!productSize) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productSize
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductSizeById(request, response) {

    try {

        const productSize = await ProductSIZEModel.findById(request.params.id);

        if (!productSize) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productSize
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function filters(request, response) {
    const {
      catId,
      subCatId,
      thirdsubCatId,
      minPrice,
      maxPrice,
      rating,
      page,
      limit,
      startDate,
      endDate,
    } = request.body;

    const filters = {}

    if (catId?.length) {
        filters.catId = { $in: catId }
    }

    if (subCatId?.length) {
        filters.subCatId = { $in: subCatId }
    }

    if (thirdsubCatId?.length) {
        filters.thirdsubCatId = { $in: thirdsubCatId }
    }

    if (minPrice || maxPrice) {
        filters.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
    }

    if (rating?.length) {
        filters.rating = { $in: rating }
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    } else if (startDate) {
      dateQuery.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateQuery.createdAt = {
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const filterQuery = {
      ...filters,
      ...dateQuery,
    };

    try {

        const products = await ProductModel.find(filterQuery)
          .populate("category")
          .skip((page - 1) * limit)
          .limit(parseInt(limit));

        const total = await ProductModel.countDocuments(filterQuery);

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
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


// Sort function
const sortItems = (products, sortBy, order) => {
    return products.sort((a, b) => {
        if (sortBy === 'name') {
            return order === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        }
        if (sortBy === 'price') {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
        }
        return 0; // Default
    });
};


export async function sortBy(request, response) {
    const { products, sortBy, order } = request.body;
    const sortedItems = sortItems([...products?.products], sortBy, order);
    return response.status(200).json({
        error: false,
        success: true,
        products: sortedItems,
        totalPages: 0,
        page: 0,
    });
}




export async function searchProductController(request, response) {
    try {

        const {query, page, limit } = request.body;

        if (!query) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Query is required"
            });
        }


        const products = await ProductModel.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { brand: { $regex: query, $options: "i" } },
                { catName: { $regex: query, $options: "i" } },
                { subCat: { $regex: query, $options: "i" } },
                { thirdsubCat: { $regex: query, $options: "i" } },
            ],
        }).populate("category")

        const total = await products?.length

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: 1,
            page: parseInt(page),
            totalPages: 1
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


// export async function addFilesToProduct(request, response) {
//   try {
//     const productId = request.params.id;

//     // Check if product exists
//     const product = await ProductModel.findById(productId);
//     if (!product) {
//       return response.status(404).json({
//         message: "Product not found",
//         success: false,
//         error: true,
//       });
//     }

//     // Upload new files (from form-data)
//     let uploadedFiles = [];
//     if (request.files && request.files.length > 0) {
//       const uploadResult = await uploadFiles(request);
//       if (!uploadResult.success) {
//         return response.status(500).json({
//           message: uploadResult.error,
//           success: false,
//           error: true,
//         });
//       }
//       uploadedFiles = uploadResult.images;
//     }

//     // Append to existing files
//     product.files.push(...uploadedFiles);

//     const updatedProduct = await product.save();

//     return response.status(200).json({
//       message: "Files added to product successfully",
//       product: updatedProduct,
//       success: true,
//       error: false,
//     });
//   } catch (error) {
//     return response.status(500).json({
//       message: error.message || error,
//       success: false,
//       error: true,
//     });
//   }
// }

export async function addFilesToProduct(request, response) {
  try {
    const productId = request.params.id;

    // Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    // Upload new files (from form-data)
    let uploadedFiles = [];
    if (request.files && request.files.length > 0) {
      const uploadResult = await uploadFiles(request);
      if (!uploadResult.success) {
        return response.status(500).json({
          message: uploadResult.error,
          success: false,
          error: true,
        });
      }
      uploadedFiles = uploadResult.images;
    }

    // Append to existing files
    product.files.push(...uploadedFiles);

    const updatedProduct = await product.save();

    return response.status(200).json({
      message: "Files added to product successfully",
      product: updatedProduct,
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}


export const downloadAllProductFiles = async (req, res) => {
  try {
    const { ProductId } = req.body;

    if (!ProductId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: ProductId",
      });
    }

    const product = await ProductModel.findById(ProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }

    const files = product.files;

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No files found for this product",
      });
    }

    // Create archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    // Set response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="product_files_${ProductId}.zip"`
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

export async function deleteFileFromProduct(request, response) {
  try {
    const { productId, fileId } = request.params;

    // Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    // Find the file to delete
    const fileToDelete = product.files.find(
      (file) => file._id.toString() === fileId
    );
    if (!fileToDelete) {
      return response.status(404).json({
        message: "File not found",
        success: false,
        error: true,
      });
    }

    // Delete file from cloud storage (Cloudinary)
    if (fileToDelete.fileUrl) {
      const deleteResult = await deleteImage(fileToDelete.fileUrl);
      if (!deleteResult.success) {
        console.warn(
          "Failed to delete file from cloud storage:",
          deleteResult.error
        );
        // Continue with database deletion even if cloud deletion fails
      }
    }

    // Remove file from product's files array
    product.files = product.files.filter(
      (file) => file._id.toString() !== fileId
    );

    // Save the updated product
    const updatedProduct = await product.save();

    return response.status(200).json({
      message: "File deleted successfully",
      product: updatedProduct,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error deleting file from product:", error);
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

// Backend - Add this function to handle multiple file deletion
export async function deleteMultipleFilesFromProduct(request, response) {
  try {
    const { productId } = request.params;
    const { fileIds } = request.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return response.status(400).json({
        message: "File IDs are required",
        success: false,
        error: true,
      });
    }

    // Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return response.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    // Find files to delete
    const filesToDelete = product.files.filter((file) =>
      fileIds.includes(file._id.toString())
    );

    if (filesToDelete.length === 0) {
      return response.status(404).json({
        message: "No files found to delete",
        success: false,
        error: true,
      });
    }

    // Delete files from cloud storage
    const deletePromises = filesToDelete.map(async (file) => {
      if (file.fileUrl) {
        try {
          const deleteResult = await deleteImage(file.fileUrl);
          if (!deleteResult.success) {
            console.warn(
              `Failed to delete file from cloud storage: ${file.fileName}`,
              deleteResult.error
            );
          }
        } catch (error) {
          console.warn(
            `Error deleting file from cloud: ${file.fileName}`,
            error
          );
        }
      }
    });

    // Wait for all cloud deletions to complete (but don't fail if some fail)
    await Promise.allSettled(deletePromises);

    // Remove files from product's files array
    product.files = product.files.filter(
      (file) => !fileIds.includes(file._id.toString())
    );

    // Save the updated product
    const updatedProduct = await product.save();

    return response.status(200).json({
      message: `${filesToDelete.length} files deleted successfully`,
      product: updatedProduct,
      deletedCount: filesToDelete.length,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error deleting multiple files from product:", error);
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}