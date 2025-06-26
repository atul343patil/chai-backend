import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import verifyJWT  from "../middlewares/auth.middleware.js"
import jwt from "jsonwebtoken"



const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; //storing refresh token in db
    user.save({ validateBeforeSave: false }); //save user data

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refersh and access token "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //1 get user details from frontend
  //2 validation  - not empty
  //3 check if user already exists: username, email
  //4 check for images,check for avatar
  //5 upload them to cloudinary , avatar
  //6 create user object- create entry in db
  //7 remove password and refresh token field from response
  //8 check for user creation
  //9 return response

  //1 get user details from frontend-------------------------------------------------------------------------------------------------------------------
  const { fullName, email, username, password } = req.body;

  //2 validation  - not empty-------------------------------------------------------------------------------------------------------------------

  //For Checking those points commonly
  if (
    [fullName, email, username, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "Allfields are required ");
  }

  //For Individual checking the conditions
  // if (fullName === "") {
  //     throw new ApiError(400,"fullName is required ")
  // }

  //3 check if user already exists: username, email-------------------------------------------------------------------------------------
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists ..!");
  }
  console.log(req.files);

  //4 check for images,check for avatar-------------------------------------------------------------------------------------
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    req.files?.avatar[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avtar file is required ");
  }

  //5 upload them to cloudinary , avatar-------------------------------------------------------------------------------------
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "Avatar upload failed or missing URL");
  }

  //6 create user object- create entry in db-------------------------------------------------------------------------------------
  const newUser = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.trim().toLowerCase(),
  });

  //7 remove password and refresh token field from response-------------------------------------------------------------------------------------
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  //8 check for user creation--------------------------------------------------------------------------------------------------------------------
  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong during registering a user..!"
    );
  }

  //9 return response--------------------------------------------------------------------------------------------------
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "User registered successfully ..!")
    );
});

const loginUser = asyncHandler(async (req, res) => {
  //1.bring data from request body
  //2.username or email
  //3.find the user already present
  //4.password check (if not correct then display msg of wrong pass)
  //5.access and refresh token generate
  //6.send this tokens using secure cookies

  //1.bring data from request body
  const { email, username, password } = req.body;

  //2.username or email
  if (!username && !email) {
    //here we are allowing user to login using both username or email
    throw new ApiError(400, "username or password is required ");
  }

  //3.find the user already present
  const user = await User.findOne({
    // here we are finding user for both username and email

    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists..!");
  }

  //4.password check (if not correct then display msg of wrong pass)
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials ");
  }

  //5.access and refresh token generate
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //this step is optional
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //6.send this tokens using secure cookies
  const options = {
    //usually cookies can be modified but we enable httpOnly as true then cookies can only be modified by server and not by frontend
    httpOnly: true,
    secure: true,
  };

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(//we are resending things to handle case where user wants to save tokens into his local storage 
    new ApiError(200,
     {
      user: loggedInUser,accessToken,refreshToken
     },
     "User LoggedIn Successfully " 
    )
  )
});


const logoutUser = asyncHandler(async (req,res) => {
  
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true

    }
  )
  const options = {
    //usually cookies can be modified but we enable httpOnly as true then cookies can only be modified by server and not by frontend
    httpOnly: true,
    secure: true,
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},"User Logged Out ")
  )
})


const refreshAccesToken = asyncHandler(async (req,res ) => {

  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshTokenn) {
      
    throw new ApiError(104,"Unauthorized request")
  }

  try {
    const decodedToken =  jwt.verify(incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
  
      )
      
      const user =  User.findById(decodedToken?._id)
  
      if (!user) {
          
        throw new ApiError(401,"Invalid refresh Token ")
      }
      
      //Checking the both token 
      if (incomingRefreshToken !== user?.refreshToken) {
        
        throw new ApiError(401,"Refresh token is expired or used ")
        
      }
  
      //As token is expired  so need to create token
      const options = 
      {
        httpOnly:true,
        secure:true
      }
  
      const {accessToken,newRefreshToken} =  await generateAccessAndRefreshTokens(user._id)
  
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
        new ApiError(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken
  
          },
          "Access token refreshed Successfully "
        )
      )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
    
  }

}) 


const changeCurrentPassword = asyncHandler( async (req,res) => {
  
  const {oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
      throw new ApiError(400,"Invalid old password ")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave:false})

  return res.status(200)
  .json(new ApiError(200,{},"Password Changed Successfully :-) "))



})

const getCurrentUser = asyncHandler(async (req,res) => {
  
  return res
  .status(200)
  .json(200,req.user,"Current User fetchd Successfully ...!")
  
})

const updateAccountDetails = asyncHandler(async (req,res) => {

  const {fullName,email} = req.body

  if (!fullName || !email) {
      throw new ApiError(400,"All fields are required   ")
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {
      new:true
    }
  ).select("-password -")

  return res
  .status(200)
  .json(new ApiError(200,user,"Account details updated successfully "))

})

const updateUserAvatar = asyncHandler(async (req,res) => {
  
  const avatarLocalPath =  req.files?.path
  if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is missing ")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
      
    throw new ApiError(400,"Error while uploading on avatar  ..!")
  }


  const user = await User.findByIdAndUpdate(req.user?._id,

    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new:true
    }

  ).select("-password -")

  return res 
  .status(200)
  .json(new ApiResponse(200, user,"Avatar updated Successfully..!"))

})


const updateUserCoverImage = asyncHandler(async (req,res) => {
  
  const CoverLocalPath =  req.files?.path
  if (!CoverLocalPath) {
      throw new ApiError(400,"CoverImage file is missing ")
  }

  const coverImage = await uploadOnCloudinary(CoverLocalPath)

  if (!coverImage.url) {
      
    throw new ApiError(400,"Error while uploading on Image  ..!")
  }


  const user = await User.findByIdAndUpdate(req.user?._id,

    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {
      new:true
    }

  ).select("-password -")


  return res 
  .status(200)
  .json(new ApiResponse(200, user,"Cover Image updated Successfully..!"))



})






export { registerUser, loginUser,logoutUser,refreshAccesToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage };
