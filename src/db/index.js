import mongoose from "mongoose";
const connectDb = async () => {
  try {
    console.log(process.env.MONGODB_URI);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(
      "Mongo db Connection Success",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("Mongo db Connection Error", error);
    process.exit(1);
  }
};

export default connectDb;
