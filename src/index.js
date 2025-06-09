import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
})

connectDB()



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