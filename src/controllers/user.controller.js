import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //? Registering Steps
  //* get user details from frontend --> (user.model.js)
  //* validation (not empty)
  //* check if user already exists by (username/email)
  //* check for images , check for avatar
  //* upload them to cloudinary, avatar
  //* create user objects -- create entry in db
  //* remove password and refresh token field
  //* check for user creation
  //* return response

  const { username, email, fullName, password } = req.body;
  //? Validation
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all fields");
  }
  if (!email.includes("@")) {
    throw new ApiError(501, "Invalid Email");
  }
  //? Check if user already exists
  const existingUser = User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with Email or Username already exists");
  }
  //? Check for images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //? Check Avatar Image
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar image");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required");
  }

  //? DataBase entry
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went Wrong while Registering User");
  }

  //? Response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registration Successfully"));
});

export { registerUser };
