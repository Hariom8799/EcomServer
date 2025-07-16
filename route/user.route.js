import { Router } from 'express'
import {addReview, authWithGoogle, deleteMultiple, deleteUser, forgotPasswordController, getAllReviews, getAllUsers, getReviews, loginUserController, logoutController, refreshToken, registerUserController, removeImageFromCloudinary, resetpassword, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp, createUserByAdmin, updateUserByAdmin, sendOtp, getAdminUsers, getOnlyUsers} from '../controllers/user.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';

const userRouter = Router()
userRouter.post("/admin/users", createUserByAdmin);
userRouter.put("/admin/users/:id", updateUserByAdmin);
userRouter.post('/register',registerUserController)
userRouter.post('/verifyEmail',verifyEmailController)
userRouter.post('/login',loginUserController)
userRouter.post('/authWithGoogle',authWithGoogle)
userRouter.get('/logout',auth,logoutController);
userRouter.put('/user-avatar',auth,upload.array('avatar'),userAvatarController);
userRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
userRouter.put('/:id',auth,updateUserDetails);
userRouter.post('/forgot-password',forgotPasswordController)
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp)
userRouter.post('/reset-password',resetpassword)
userRouter.post('/refresh-token',refreshToken)
userRouter.get("/user-details/:userId", auth, userDetails);
userRouter.post('/addReview',auth,addReview);
userRouter.get('/getReviews',getReviews);
userRouter.get('/getAllReviews',getAllReviews);
userRouter.get('/getAllUsers',getAllUsers);
userRouter.get('/getAdminUsers',getAdminUsers);
userRouter.get('/getOnlyUsers',getOnlyUsers);
userRouter.delete('/deleteMultiple',deleteMultiple);
userRouter.delete('/deleteUser/:id',deleteUser);
userRouter.post("/send-otp", sendOtp);


export default userRouter