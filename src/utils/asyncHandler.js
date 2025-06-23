//1. This is a wrapper function using try catch block 

const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((error) => next(error)
        )
    }
}






// 2. This is a wrapper function using try catch block 
// const asyncHandler = (fn) => async(req,res,next) => {
    
    //     try {
        //         await fn(req,res,next);
        
//     } catch (error) {
//         res.status(err.code|| 500).json({
    //             success: false,
    //             message: err.message
    //         })
    //     }
    
// }

export {asyncHandler}



// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => {async() => {}}
// const asyncHandler = (func) => async() => {}