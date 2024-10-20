import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload file in cloudnary
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
        //file has been uploaded successful
        console.log("file has uploaded on cloudinary",response.url)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)    //remove file which is save temporary on server
        return null;
    }
}

export {uploadOnCloudinary}