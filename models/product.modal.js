import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  folderName: {
    type: String,
  },
  uploadedAt: {
    type: Date,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  },
  updatedAt: {
    type: Date,
    default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  },
  uploadedBy: {
    type: String,
    required: false,
    ref: "User",
  },
  fileVersion: {
    type: Number,
    default: 1,
  },
});

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    images: [
        {
            type: String,
            required: true
        }
    ],
    brand: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    oldPrice: {
        type: Number,
        default: 0
    },
    catName:{
        type:String,
        default:''
    },
    catId:{
        type:String,
        default:''
    },
    subCatId:{
        type:String,
        default:''
    },
    subCat:{
        type:String,
        default:''
    },
    thirdsubCat:{
        type:String,
        default:''
    },
    thirdsubCatId:{
        type:String,
        default:''
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    countInStock: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    discount: {
        type: Number,
        required: true,
    },
    sale: {
        type: Number,
        default:0
    },
    productRam: [
        {
            type: String,
            default: null,
        }
    ],
    size: [
        {
            type: String,
            default: null,
        }
    ],
    productWeight: [
        {
            type: String,
            default: null,
        }
    ],
    bannerimages: [
        {
            type: String,
            required: true
        }
    ],
    bannerTitleName: {
        type: String,
        default: '',
    },
    isDisplayOnHomeBanner: {
        type: Boolean,  
        default: false,
    },
    files : [
        fileSchema
    ]
},{
    timestamps : true
});


const ProductModel = mongoose.model('Product',productSchema)

export default ProductModel