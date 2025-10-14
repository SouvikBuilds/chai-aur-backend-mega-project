import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { user } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res, next) => {
  // get user details from frontend
  // validation of user details(not empty)
  // check if user already exists: username and email
  // check for images
  // check for avatar
  // upload them to cloudinary,avatar check
  // create user object entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullName, username, email, password } = req.body;
  console.log(req.body);
  if (
    [fullName, username, email, password].some((item) => item?.trim() === "")
  ) {
    throw new ApiErrors(400, "All fields are compulsory");
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!email.match(emailRegex)) {
    throw new ApiErrors(400, "Invalid Email Address");
  }
  const existeduser = user.findOne({
    $or: [{ email }, { username }],
  });
  if (existeduser) {
    throw new ApiErrors(409, "User with email or username already exists");
  }

  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar File is Required");
  }

  const user = await user.create({
    fullName: fullName,
    username: username.toLowerCase(),
    email: email,
    password: password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await user
    .findById(user._id)
    .select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiErrors(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
