import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res ) => {
   
    //1 get user details from frontend 
    //2 validation  - not empty
    //3 check if user already exists: username, email
    //4 check for images,check for avatar
    //5 upload them to cloudinary , avatar 
    //6 create user object- create entry in db
    //7 remove password and refresh token field from response 
    //8 check for user creation 
    //9 return response 


    //1 get user details from frontend
    const {fullName, email, username, password} = req.body
    console.log("email:", email); 


    //2 validation  - not empty

             //For Checking those points commonly 
    if (
        [fullName,email,username,password].some((field) => 
        field?.trim === "")
    ) {
        throw new ApiError(400,"Allfields are required ")
    }

            //For Individual checking the conditions 
    // if (fullName === "") {
    //     throw new ApiError(400,"fullName is required ")
    // }
    

    //3 check if user already exists: username, email
    const existedUser = User.findOne({
        $or: [{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"User with email or username already exists ..!")
    }


     //4 check for images,check for avatar
     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avtar file is required ")
    }

    //5 upload them to cloudinary , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }


    
    //6 create user object- create entry in db
     User.create({

        fullName,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowercase()
     })

     //7 remove password and refresh token field from response 
     const createdUser = await User.findById(User._id).select(
        "-password -refreshToken"
     )


    //8 check for user creation
     if (!createdUser) {
         throw new ApiError(500,"Something went wrong during registering a user..!")
     }

    //9 return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully ..!")
    )     











})


export {registerUser}