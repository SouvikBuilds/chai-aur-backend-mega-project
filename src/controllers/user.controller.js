import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res, err, next) => {
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
  console.log("Email: ", email);
});

export { registerUser };
