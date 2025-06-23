import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))


//3 major and important configurations used in industry  
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())//to do crud operations on user's browser 



//routes import
import userRouter from './routes/user.routes.js'
 


// routes declaration

app.use("/api/v1/users",userRouter)

// http://localhost:8000/api/v1/users/register



export {app}