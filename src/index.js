import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
// import express from "express"
dotenv.config({
  path: "./env",
});




connectDB()
  .then(() => {
    app.on("Error", (error) => {
      console.log("ERROR:", error);
      throw error;
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running at port ,${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDb connection  failed !!!", error);
  });

/*
( async(e) => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("Error",(error) => {
            console.log("ERROR:" ,error);
            throw error
        })

        app.listen(process.env.PORT,() => {
            console.log(`App listening to port:${process.env.PORT}`);
        })

    } catch (error) {
        console.error(error);
    }
})()*/
