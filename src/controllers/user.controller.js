import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { user as User } from "../models/user.model.js"; // Rename to avoid conflict
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; // Check your export name

const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, username, email, password } = req.body;
  // console.log(req.body);

  if (
    [fullName, username, email, password].some((item) => item?.trim() === "")
  ) {
    throw new ApiErrors(400, "All fields are compulsory");
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email.match(emailRegex)) {
    throw new ApiErrors(400, "Invalid Email Address");
  }

  // FIX: Added await
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiErrors(409, "User with email or username already exists");
  }

  // console.log(req.files);

  // FIX: Added optional chaining safety
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar File is Required");
  }

  // FIX: Removed duplicate 'const user' - using User model
  const newUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // FIX: Changed user._id to newUser._id and User.findById
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiErrors(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully"));
});

export { registerUser };
