import mongoose, {Schema} from "mongoose";
 
const videoSchema = new Schema(
    {
       videoFile : {
           type : String, //cloudinary url
           required : true
       },
       videoPublicId:{
           type : String,  
           required : true
       },
       thumbnail : {
           type : String, //cloudinary url
           required : true
       },
       thumbnailPublicId:{
           type : String,  
       },
       title : {
           type : String,  
           required : true
       },
       description : {
           type : String,           
            
       },
       duration : {
        type : Number,
        required : true
    },
    views : {
        type : Number,
        required : true,
        default : 0
       },
       isPublish : {
         type : Boolean,
         default : true
       },
       owner : {
        type : Schema.Types.ObjectId,
        ref : "User"

       }
    },
    {
       timestamps: true
    }
)

 
export const Video = mongoose.model("Video", videoSchema) 